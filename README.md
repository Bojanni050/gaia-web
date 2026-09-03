# Gaia Web

A lifelong personal intelligence — the web client. Extracted from the
`Gaia-Cloud` monorepo (Phase 1 of `docs/split-plan.md`, 2026-08-19).

Gaia Web is a thin client: it talks only to its own same-origin
`gaia-api` route (`/api/gaia/`, proxied by `nginx.conf.template` — see
`Gaia-Cloud`'s `docs/architecture.md`). Logos (`intentIQ`/`reasonIQ`),
Hindsight, Chronicle and Hermes all run server-side in Gaia Cloud; this
client executes no Logos itself. The direct `/api/hermes/`,
`/api/hindsight/` and `/api/cognition/` routes were retired once the
cutover was live-verified — every turn goes through `gaia-api`.

## Structure

- `src/` — the React app (CRA/craco). `src/gaia/server/api.js` is the
  only bridge to Gaia Cloud (fixed same-origin `/api/gaia`, Bearer token
  injected server-side by nginx); `src/gaia/state/useConversation.js`
  owns no cognition — it sends user text and appends the server's reply.
- `packages/gaia-contracts/` — Gaia's system contracts (SOUL, Hindsight,
  Hermes, Chronicles, MCP), aliased in via `craco.config.js` — see that
  package's own README for why it's an alias and not an installed
  dependency yet.
- `Dockerfile` / `nginx.conf.template` — builds the `gaia-web` image;
  nginx doubles as the same-origin API gateway toward `gaia-api` (which
  owns Logos, memory, retrieval and execution server-side).

## Scripts

```bash
npm run dev:web            # craco start
npm run build:web          # craco build
```

No artifact fetch: identity (SOUL/foundation) is owned and published by
Gaia Cloud; this client builds no system prompt itself.
