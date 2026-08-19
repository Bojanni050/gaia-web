# Gaia Web

A lifelong personal intelligence — the web client. Extracted from the
`Gaia-Cloud` monorepo (Phase 1 of `docs/split-plan.md`, 2026-08-19).

Gaia Web talks to Hermes, Hindsight, and the cognition service directly,
same-origin, proxied by `nginx.conf` — see `Gaia-Cloud`'s
`docs/architecture.md`. Logos (`intentIQ`/`reasonIQ`) still runs
client-side here, an explicitly-flagged interim state (see `Gaia-Cloud`'s
`docs/evolution.md`, Milestone 9's "known interim placement" note) —
moving it server-side into Gaia Cloud is later work.

## Structure

- `src/` — the React app (CRA/craco).
- `scripts/fetch-foundation-artifact.js` — pulls
  `src/gaia/foundation/artifact.json` (the system prompt dictionary) from
  `Gaia-Cloud`'s published `foundation-latest` GitHub Release, rather than
  building it locally from a vendored copy of `docs/`/`soul.md`. Cloud
  owns identity and publishes it (`Gaia-Cloud/.github/workflows/
  publish-foundation.yml`); this repo pulls, it doesn't fork its own copy
  — the `docs/split-plan.md` direction landed 2026-08-19. Override the
  source with `FOUNDATION_ARTIFACT_URL` to test against an unpublished
  `docs/` change.
- `packages/gaia-contracts/` — Gaia's system contracts (SOUL, Hindsight,
  Hermes, Chronicles, MCP), aliased in via `craco.config.js` — see that
  package's own README for why it's an alias and not an installed
  dependency yet.
- `Dockerfile` / `nginx.conf` — builds the `gaia-web` image; nginx doubles
  as the same-origin API gateway toward Hermes/Hindsight/cognition.

## Scripts

```bash
npm run fetch:foundation   # writes src/gaia/foundation/artifact.json
npm run dev:web            # fetch + craco start
npm run build:web          # fetch + craco build
```

Building requires network access to `github.com` (the artifact fetch).
`Dockerfile` forces this step to always re-fetch on every image build
(`--build-arg CACHEBUST=$(date +%s)`, see `.github/workflows/deploy.yml`)
rather than risk Docker's layer cache serving a stale pull of Cloud's
moving `foundation-latest` release.

**Known gap:** a `docs/`/`soul.md` change in `Gaia-Cloud` publishes a new
artifact immediately, but nothing currently triggers a `Gaia-Web` rebuild
in response — this repo only picks it up on its own next deploy, for
whatever reason that happens. Wiring a cross-repo trigger (e.g. Cloud's
publish job dispatching a workflow run here) is deliberately not done yet.
