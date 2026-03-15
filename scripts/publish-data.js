#!/usr/bin/env node

/**
 * publish-data.js — Sync sheet → data/latest.json → commit → push to GitHub.
 *
 * This is what Max runs (via npm run publish-data) when a post is approved
 * and ready. The plugin fetches this file live from GitHub every open.
 *
 * Usage:
 *   npm run publish-data                  # JOCK (default)
 *   npm run publish-data -- --client=jock
 */

const { execSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
const clientArg = (args.find(a => a.startsWith('--client=')) || '').replace('--client=', '') || 'jock';

const ROOT = path.resolve(__dirname, '..');

// 1. Sync from sheet
console.log('Step 1/3 — Syncing from Google Sheet...');
execSync(`node scripts/sync-sheet.js --client=${clientArg}`, { cwd: ROOT, stdio: 'inherit' });

// 2. Commit
console.log('\nStep 2/3 — Committing data...');
try {
  execSync('git add data/latest.json', { cwd: ROOT, stdio: 'inherit' });
  execSync(`git commit -m "data: sync approved posts (${new Date().toISOString().slice(0, 10)})"`, {
    cwd: ROOT,
    stdio: 'inherit',
  });
} catch (e) {
  // If nothing changed, git commit exits non-zero
  if (e.message && e.message.includes('nothing to commit')) {
    console.log('No data changes — already up to date.');
    process.exit(0);
  }
  throw e;
}

// 3. Push
console.log('\nStep 3/3 — Pushing to GitHub...');
execSync('git push', { cwd: ROOT, stdio: 'inherit' });

console.log('\n✅ Data published. The plugin will fetch it fresh on next open.');
