#!/usr/bin/env node
'use strict';

/**
 * Pulls foundation-artifact.json from Gaia-Cloud's published release
 * instead of building it locally from vendored docs/ + identity/soul.md
 * copies (docs/split-plan.md's stated direction — Cloud owns identity and
 * publishes it; Web pulls, it doesn't fork its own copy). See Gaia-Cloud's
 * scripts/build-foundation-artifact.js and
 * .github/workflows/publish-foundation.yml for the publishing side.
 *
 * Override with FOUNDATION_ARTIFACT_URL for a different tag/fork while
 * testing changes to docs/ that haven't been published yet.
 */
const fs = require('fs');
const path = require('path');

const DEFAULT_URL =
  'https://github.com/Bojanni050/Gaia-Cloud/releases/download/foundation-latest/foundation-artifact.json';
const URL = process.env.FOUNDATION_ARTIFACT_URL || DEFAULT_URL;
const OUTPUT_PATH = path.join(__dirname, '..', 'src', 'gaia', 'foundation', 'artifact.json');

async function main() {
  console.log(`Fetching foundation artifact from ${URL}`);
  const res = await fetch(URL);
  if (!res.ok) {
    throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
  }
  const body = await res.text();
  const parsed = JSON.parse(body); // fail fast on a malformed/HTML (e.g. rate-limit) response
  if (!parsed.documents || !parsed.documents['soul.md']) {
    throw new Error('Fetched artifact is missing documents.soul.md — refusing to write a broken artifact.');
  }
  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, body, 'utf-8');
  console.log(`Wrote ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error('Foundation artifact fetch failed:', err.message);
  process.exit(1);
});
