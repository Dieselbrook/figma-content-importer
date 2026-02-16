#!/usr/bin/env node

/**
 * CSV to JSON Converter for Content Importer
 * 
 * Usage:
 *   node scripts/convert.js input.csv output.json
 *   node scripts/convert.js input.csv (outputs to stdout)
 */

const fs = require('fs');
const path = require('path');

function parseCSV(csvText) {
  const lines = csvText.split('\n');
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }
  
  // Parse header
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const data = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    const values = parseCSVLine(line);
    if (values.length === 0) continue;
    
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    data.push(row);
  }
  
  return data;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  values.push(current.trim());
  
  return values;
}

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('Usage: node convert.js <input.csv> [output.json]');
    console.error('');
    console.error('Examples:');
    console.error('  node scripts/convert.js content-plan.csv content-plan.json');
    console.error('  node scripts/convert.js content-plan.csv > output.json');
    process.exit(1);
  }
  
  const inputFile = args[0];
  const outputFile = args[1];
  
  if (!fs.existsSync(inputFile)) {
    console.error(`Error: Input file not found: ${inputFile}`);
    process.exit(1);
  }
  
  try {
    // Read CSV
    const csvText = fs.readFileSync(inputFile, 'utf-8');
    
    // Parse to JSON
    const jsonData = parseCSV(csvText);
    
    // Output
    const jsonOutput = JSON.stringify(jsonData, null, 2);
    
    if (outputFile) {
      fs.writeFileSync(outputFile, jsonOutput, 'utf-8');
      console.log(`✅ Converted ${jsonData.length} rows`);
      console.log(`📄 Output: ${outputFile}`);
    } else {
      console.log(jsonOutput);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
