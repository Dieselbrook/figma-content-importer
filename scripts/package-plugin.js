#!/usr/bin/env node

/**
 * package-plugin.js — Build the live-fetch plugin and zip it for distribution.
 *
 * Designers install the zip once. Data updates are pushed to GitHub
 * and the plugin fetches fresh data every time it's opened.
 *
 * Output: releases/content-importer-vX.X.X.zip
 * Usage: npm run package
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const VERSION = pkg.version;

// 1. Build live-fetch version
console.log('Building live-fetch plugin...');
execSync('node scripts/build-live.js', { cwd: ROOT, stdio: 'inherit' });

// 2. Verify dist files
const requiredFiles = ['dist/code.js', 'dist/ui.html', 'manifest.json'];
for (const f of requiredFiles) {
  if (!fs.existsSync(path.join(ROOT, f))) {
    console.error(`Missing required file: ${f}`);
    process.exit(1);
  }
}

// 3. Create releases dir
const releasesDir = path.join(ROOT, 'releases');
if (!fs.existsSync(releasesDir)) fs.mkdirSync(releasesDir, { recursive: true });

const zipName = `content-importer-v${VERSION}.zip`;
const zipPath = path.join(releasesDir, zipName);

// Remove existing zip if present
if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

// 4. Zip — include only what Figma needs
console.log(`\nPackaging ${zipName}...`);
execSync(
  `zip -r "${zipPath}" manifest.json dist/code.js dist/ui.html`,
  { cwd: ROOT, stdio: 'inherit' }
);

const stats = fs.statSync(zipPath);
console.log(`\n✅ Package ready: releases/${zipName} (${(stats.size / 1024).toFixed(1)} KB)`);
console.log('\nHow to share with designers:');
console.log('  1. Share this zip file');
console.log('  2. Designer opens Figma → Plugins → Development → Import plugin from manifest...');
console.log('     → Unzip first, then select manifest.json inside the unzipped folder');
console.log('\nData updates: run npm run publish-data to push latest approved posts to GitHub.');
console.log('The plugin fetches fresh data from GitHub every time it opens — no reinstall needed.');
