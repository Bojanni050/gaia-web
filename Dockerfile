# Build context is this repo's root. Builds Gaia's web frontend (foundation
# artifact + React app) and serves it as static files. No backend service
# runs in this image — Hermes, Hindsight, cognition, and gaia-api are all
# reached same-origin, proxied by the nginx template baked in below.

FROM node:22-slim AS build
WORKDIR /app

# CRA exposes only REACT_APP_* variables and embeds them at build time.
# These are deliberately non-secret: nginx/Plesk injects the Hermes key, and
# Hindsight/cognition currently have no auth at all (Tailscale is the only
# access control — see docs/evolution.md). All three default to relative,
# same-origin paths because none of the three send CORS headers, so a
# browser calling them cross-origin is always blocked (see nginx.conf).
ARG REACT_APP_REASON_ENGINE_URL=/api/hermes/v1
ARG REACT_APP_REASON_ENGINE_MODEL=hermes-agent
ARG REACT_APP_HINDSIGHT_URL=/api/hindsight
ARG REACT_APP_COGNITION_URL=/api/cognition
ENV REACT_APP_REASON_ENGINE_URL=$REACT_APP_REASON_ENGINE_URL
ENV REACT_APP_REASON_ENGINE_MODEL=$REACT_APP_REASON_ENGINE_MODEL
ENV REACT_APP_HINDSIGHT_URL=$REACT_APP_HINDSIGHT_URL
ENV REACT_APP_COGNITION_URL=$REACT_APP_COGNITION_URL

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY packages ./packages
COPY scripts ./scripts
COPY public ./public
COPY src ./src
COPY craco.config.js jsconfig.json postcss.config.js tailwind.config.js components.json ./
COPY plugins ./plugins

# build:web fetches foundation-artifact.json from Gaia-Cloud's published
# release (scripts/fetch-foundation-artifact.js) instead of vendoring
# docs/ and identity/soul.md copies — requires network access at build
# time. CACHEBUST forces this layer to always re-run rather than serving
# a Docker-cached fetch from a previous build: the "foundation-latest"
# release is a moving target Docker's cache key can't see change on its
# own, since nothing else in this layer's inputs changed.
ARG CACHEBUST=1
RUN npm run build:web

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
# A template, not a static file: the official nginx image's entrypoint
# envsubst's ${VAR}-style placeholders here from the container's actual
# environment at startup (GAIA_API_TOKEN_WEB) — nginx's own bare $-prefixed
# runtime variables (no curly braces) are left untouched. See
# nginx.conf.template's /api/gaia/ block and deploy.yml for where the
# token comes from at deploy time.
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
EXPOSE 80
