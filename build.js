#!/usr/bin/env node
// Regenerates the site's HTML pages from templates/ + content/content.json.
//
//   node build.js
//
// The Cloudflare Worker behind /editor runs this exact same renderer when one
// of the site's editors publishes a change, so running it locally after a
// hand-edit to templates or content keeps everything in sync.

import { readFileSync, writeFileSync } from 'node:fs';
import { renderSite, PAGE_TEMPLATES } from './worker/src/render.js';

const content = JSON.parse(readFileSync('content/content.json', 'utf8'));

const templates = {};
for (const [page, path] of Object.entries(PAGE_TEMPLATES)) {
  templates[page] = readFileSync(path, 'utf8');
}

const files = renderSite(templates, content);
for (const [page, html] of Object.entries(files)) {
  writeFileSync(page, html);
  console.log(`built ${page}`);
}
