# Gaia Web

A lifelong personal intelligence — the web client. Extracted from the
`Gaia-Cloud` monorepo (Phase 1 of `docs/split-plan.md`, 2026-08-19).

Gaia Web talks to Hermes, Hindsight, and the cognition service directly,
same-origin, proxied by `nginx.conf` — see `docs/architecture.md`. Logos
(`intentIQ`/`reasonIQ`) still runs client-side here, an explicitly-flagged
interim state (see `docs/evolution.md`, Milestone 9's "known interim
placement" note) — moving it server-side into Gaia Cloud is later work.

## Structure

- `src/` — the React app (CRA/craco).
- `foundation/` — build-time tool that reads `docs/` + `identity/soul.md`
  and writes `src/gaia/foundation/artifact.json`, the system prompt
  dictionary. Made path-independent in `Gaia-Cloud`'s Phase 0; this repo
  points it at its own vendored copies via `--soul=identity/soul.md`.
- `packages/gaia-contracts/` — Gaia's system contracts (SOUL, Hindsight,
  Hermes, Chronicles, MCP), aliased in via `craco.config.js` — see that
  package's own README for why it's an alias and not an installed
  dependency yet.
- `docs/` and `identity/soul.md` — **vendored snapshots**, not the source
  of truth. Gaia's constitution and foundation documents are owned by
  `Gaia-Cloud` (`docs/`, `services/gaia-api/identity/soul.md` there).
  This copy is `identity/soul.md` as of `Gaia-Cloud@e200903`. Until Cloud
  publishes a `foundation-artifact.json` clients pull from in CI
  (`docs/split-plan.md`'s stated direction), re-sync these manually
  whenever Cloud's `docs/` or `soul.md` changes — don't let them drift
  silently.
- `Dockerfile` / `nginx.conf` — builds the `gaia-web` image; nginx doubles
  as the same-origin API gateway toward Hermes/Hindsight/cognition.

## Scripts

```bash
npm run build:foundation   # writes src/gaia/foundation/artifact.json
npm run dev:web            # foundation --watch + craco start
npm run build:web          # foundation build + craco build
```
