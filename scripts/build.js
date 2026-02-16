#!/usr/bin/env node

/**
 * Build script: compiles TypeScript and inlines latest.json into ui.html
 * This way the plugin works without any network access.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');

// 1. Compile TypeScript
console.log('Compiling TypeScript...');
execSync('npx tsc', { cwd: ROOT, stdio: 'inherit' });

// 2. Read latest.json
const dataPath = path.join(ROOT, 'data', 'latest.json');
let jsonData = '[]';
if (fs.existsSync(dataPath)) {
  jsonData = fs.readFileSync(dataPath, 'utf-8').trim();
  const posts = JSON.parse(jsonData);
  console.log(`Inlining ${Array.isArray(posts) ? posts.length : '?'} posts into UI...`);
} else {
  console.log('No data/latest.json found — using empty array');
}

// 3. Read ui.html and inject data
const uiPath = path.join(ROOT, 'src', 'ui.html');
const uiHtml = fs.readFileSync(uiPath, 'utf-8');

// Replace the fetch-based approach with inlined data
const injectedHtml = uiHtml.replace(
  "const DATA_URL = 'https://raw.githubusercontent.com/Dieselbrook/figma-content-importer/main/data/latest.json';",
  `const INLINE_DATA = ${jsonData};`
).replace(
  'let jsonData = null;',
  'let jsonData = null;\n    const DATA_URL = null; // Disabled — using inline data'
);

// 4. Write built ui.html to dist/
const distUiPath = path.join(ROOT, 'dist', 'ui.html');
fs.writeFileSync(distUiPath, injectedHtml, 'utf-8');
console.log('Built dist/ui.html with inlined data');
console.log('Done!');
