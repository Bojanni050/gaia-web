# Build context is this repo's root. Builds Gaia's web frontend (foundation
# artifact + React app) and serves it as static files. No backend service
# runs in this image — Hermes, Hindsight, and the cognition service are all
# reached same-origin, proxied by the nginx.conf baked in below.

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

# docs/ and identity/soul.md are vendored snapshots of Gaia-Cloud's
# constitution (see README.md) — not the source of truth, but this build
# has no filesystem access to the Gaia-Cloud repo, so this is what
# foundation/ resolves against.
COPY foundation ./foundation
COPY packages ./packages
COPY docs ./docs
COPY identity ./identity

COPY public ./public
COPY src ./src
COPY craco.config.js jsconfig.json postcss.config.js tailwind.config.js components.json ./
COPY plugins ./plugins

RUN npm run build:web

FROM nginx:1.27-alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
