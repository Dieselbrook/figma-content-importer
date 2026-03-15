#!/usr/bin/env node

/**
 * sync-sheet.js — Pull approved JOCK posts from Google Sheet into data/latest.json
 *
 * Usage:
 *   node scripts/sync-sheet.js              # JOCK (default)
 *   node scripts/sync-sheet.js --client=jock
 *   node scripts/sync-sheet.js --all        # all statuses (not just ready)
 *
 * Reads Google Sheets via Service Account JWT.
 * SA key: projects/social-media-engine/config/google-service-account.json
 *
 * Sheet headers expected:
 *   Post_ID, Month, Week, Scheduled_Date, Platform, Content_Format, Theme,
 *   Product_Focus, Caption, Hashtags, Visual_Brief, Dimensions,
 *   Figma_Frame, Status, Approved_By, Published_URL, Figma_Status, Image_URLs
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

// ─── Config ──────────────────────────────────────────────────

const CLIENTS = {
  jock: {
    sheetId: '1eLuoDG9TYi693hNaCzKvcB9d4PuPPibyu5mLs1vYerI',
    tab: 'Calendar',
    label: 'JOCK',
  },
  troygold: {
    sheetId: '1nQS5LJ-aLTtcC6TxEOfseWjPl3hb74TX8qrvUJELT1Q',
    tab: 'Calendar',
    label: 'Troygold',
  },
};

const SA_KEY_PATH = path.resolve(
  __dirname,
  '../../social-media-engine/config/google-service-account.json'
);

const DATA_PATH = path.resolve(__dirname, '../data/latest.json');

// ─── JWT for Service Account ──────────────────────────────────

function base64urlEncode(buf) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function makeJwt(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64urlEncode(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const payload = base64urlEncode(
    Buffer.from(
      JSON.stringify({
        iss: sa.client_email,
        scope: 'https://www.googleapis.com/auth/spreadsheets.readonly',
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
      })
    )
  );
  const unsigned = `${header}.${payload}`;
  const key = sa.private_key;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const sig = base64urlEncode(sign.sign(key));
  return `${unsigned}.${sig}`;
}

function getAccessToken(sa) {
  return new Promise((resolve, reject) => {
    const jwt = makeJwt(sa);
    const body = `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`;
    const req = https.request(
      {
        hostname: 'oauth2.googleapis.com',
        path: '/token',
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.access_token) resolve(parsed.access_token);
            else reject(new Error('No access_token: ' + data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ─── Sheets API ───────────────────────────────────────────────

function fetchSheet(token, sheetId, tab) {
  return new Promise((resolve, reject) => {
    const range = encodeURIComponent(`${tab}!A1:Z500`);
    const path = `/v4/spreadsheets/${sheetId}/values/${range}`;
    const req = https.request(
      {
        hostname: 'sheets.googleapis.com',
        path,
        headers: { Authorization: `Bearer ${token}` },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

function sheetToJson(data) {
  const rows = data.values || [];
  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || '';
    });
    return obj;
  });
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const clientArg = (args.find((a) => a.startsWith('--client=')) || '').replace('--client=', '') || 'jock';
  const allStatuses = args.includes('--all');

  const client = CLIENTS[clientArg];
  if (!client) {
    console.error(`Unknown client: ${clientArg}. Available: ${Object.keys(CLIENTS).join(', ')}`);
    process.exit(1);
  }

  console.log(`Syncing ${client.label} — sheet ${client.sheetId} tab "${client.tab}"...`);

  if (!fs.existsSync(SA_KEY_PATH)) {
    console.error(`Service account key not found: ${SA_KEY_PATH}`);
    process.exit(1);
  }

  const sa = JSON.parse(fs.readFileSync(SA_KEY_PATH, 'utf-8'));

  const token = await getAccessToken(sa);
  const raw = await fetchSheet(token, client.sheetId, client.tab);
  const all = sheetToJson(raw);

  console.log(`  Total rows: ${all.length}`);

  // Filter: Status = approved (or "Approved"), Figma_Status = ready (unless --all)
  const posts = allStatuses
    ? all.filter((p) => p.Post_ID)
    : all.filter((p) => {
        const status = (p.Status || '').toLowerCase();
        const figmaStatus = (p.Figma_Status || '').toLowerCase();
        return p.Post_ID && status === 'approved' && figmaStatus === 'ready';
      });

  console.log(`  Posts to import (${allStatuses ? 'all' : 'approved + ready'}): ${posts.length}`);

  // Ensure data dir exists
  const dataDir = path.dirname(DATA_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  fs.writeFileSync(DATA_PATH, JSON.stringify(posts, null, 2));
  console.log(`  Saved → ${DATA_PATH}`);

  if (posts.length > 0) {
    const withImages = posts.filter((p) => p.Image_URLs);
    console.log(`  Posts with images: ${withImages.length}/${posts.length}`);
    posts.slice(0, 3).forEach((p) => {
      console.log(`    • ${p.Post_ID} | ${p.Platform} | ${p.Theme || p.Product_Focus} | images: ${p.Image_URLs ? '✓' : '—'}`);
    });
  }

  console.log('\nDone. Now run: npm run build');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
