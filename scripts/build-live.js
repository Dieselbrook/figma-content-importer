#!/usr/bin/env node

/**
 * build-live.js — Build the distributable "live fetch" plugin.
 *
 * Unlike build.js (which inlines data for offline use), this version
 * keeps the GitHub fetch URL intact. Designers install it ONCE.
 * Data updates are pushed to GitHub and the plugin picks them up fresh.
 *
 * Output: dist/ (ready for zip packaging)
 * Usage: npm run build:live
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// 1. Compile TypeScript
console.log('Compiling TypeScript...');
execSync('npx tsc', { cwd: ROOT, stdio: 'inherit' });

// 2. Read ui.html (live fetch version — DATA_URL stays intact)
const uiPath = path.join(ROOT, 'src', 'ui.html');
const uiHtml = fs.readFileSync(uiPath, 'utf-8');

// Ensure INLINE_DATA fallback is properly cleared (DATA_URL stays in place)
const liveHtml = uiHtml
  .replace(
    "const INLINE_DATA = typeof window.INLINE_DATA !== 'undefined' ? window.INLINE_DATA : null;",
    "const INLINE_DATA = null; // live fetch mode"
  );

// 3. Write to dist/
const distDir = path.join(ROOT, 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });

const distUiPath = path.join(distDir, 'ui.html');
fs.writeFileSync(distUiPath, liveHtml, 'utf-8');
console.log('Built dist/ui.html (live fetch mode — no inlined data)');
console.log('Done!');
