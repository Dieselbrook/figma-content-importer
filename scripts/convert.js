#!/usr/bin/env node

/**
 * CSV to JSON converter for Figma Content Importer
 *
 * Usage:
 *   node scripts/convert.js input.csv > output.json
 *   cat input.csv | node scripts/convert.js > output.json
 *
 * Handles quoted fields with newlines (e.g., multi-line captions from Google Sheets)
 */

const fs = require('fs');

function parseCSV(text) {
  const rows = [];
  let current = '';
  let inQuotes = false;
  let row = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        current += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(current.trim());
        current = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        row.push(current.trim());
        current = '';
        if (row.length > 1 || row[0] !== '') rows.push(row);
        row = [];
        if (ch === '\r') i++; // skip \n in \r\n
      } else {
        current += ch;
      }
    }
  }

  // Last field/row
  if (current || row.length > 0) {
    row.push(current.trim());
    if (row.length > 1 || row[0] !== '') rows.push(row);
  }

  return rows;
}

function csvToJson(text) {
  const rows = parseCSV(text);
  if (rows.length < 2) {
    console.error('Error: CSV must have a header row and at least one data row');
    process.exit(1);
  }

  const headers = rows[0];
  const data = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row.every(cell => !cell)) continue; // skip empty rows

    const obj = {};
    for (let j = 0; j < headers.length; j++) {
      obj[headers[j]] = row[j] || '';
    }
    data.push(obj);
  }

  return data;
}

// ─── Main ────────────────────────────────────────────────────

let input = '';

if (process.argv[2]) {
  // File argument
  try {
    input = fs.readFileSync(process.argv[2], 'utf-8');
  } catch (err) {
    console.error(`Error reading file: ${err.message}`);
    process.exit(1);
  }
  console.log(JSON.stringify(csvToJson(input), null, 2));
} else if (!process.stdin.isTTY) {
  // Pipe/stdin
  const chunks = [];
  process.stdin.setEncoding('utf-8');
  process.stdin.on('data', chunk => chunks.push(chunk));
  process.stdin.on('end', () => {
    input = chunks.join('');
    console.log(JSON.stringify(csvToJson(input), null, 2));
  });
} else {
  console.error('Usage: node scripts/convert.js <input.csv>');
  console.error('       cat input.csv | node scripts/convert.js');
  process.exit(1);
}
