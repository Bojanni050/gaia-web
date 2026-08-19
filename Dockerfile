# Build context is this repo's root. Builds Gaia's web frontend (a plain
# React app — no client-side identity, memory, or system-prompt assembly
# anymore, see docs/web-migration-plan.md's Phase C cutover) and serves it
# as static files. No backend service runs in this image — gaia-api is
# reached same-origin, proxied by the nginx template baked in below.

FROM node:22-slim AS build
WORKDIR /app

# CRA exposes only REACT_APP_* variables and embeds them at build time.
# Deliberately non-secret: nginx injects gaia-api's auth token
# server-side (Phase A) — the browser never holds one. Relative and
# same-origin because gaia-api sends no CORS headers, so a browser
# calling it cross-origin is always blocked (see nginx.conf.template).
ARG REACT_APP_GAIA_API_URL=/api/gaia
ENV REACT_APP_GAIA_API_URL=$REACT_APP_GAIA_API_URL

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

COPY packages ./packages
COPY public ./public
COPY src ./src
COPY craco.config.js jsconfig.json postcss.config.js tailwind.config.js components.json ./
COPY plugins ./plugins

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
