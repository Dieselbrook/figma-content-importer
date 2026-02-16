# Bot Workflow — OpenClaw Content Pipeline

The OpenClaw bot automates the process of getting content plan data from Google Sheets into this repository so the Figma plugin can fetch it.

## Pipeline

```
Google Sheet (content calendar)
        ↓
OpenClaw bot fetches as CSV
        ↓
Converts CSV → JSON using scripts/convert.js
        ↓
Commits to data/latest.json on main branch
        ↓
Figma plugin fetches from raw.githubusercontent.com
```

## How it works

1. The bot is triggered (on schedule or manually) to fetch the latest content calendar from Google Sheets as CSV.
2. It runs `node scripts/convert.js` to convert the CSV into the JSON format the plugin expects.
3. It commits the result to `data/latest.json` in this repository.
4. The Figma plugin fetches from `https://raw.githubusercontent.com/Dieselbrook/figma-content-importer/main/data/latest.json` each time the designer opens it.

## JSON format

The bot can output either:

- A plain array: `[{ "Post_ID": "MAR-001", ... }]`
- An object with metadata: `{ "metadata": { "updated": "2026-02-16" }, "posts": [...] }`

The `metadata.updated` field is displayed in the Figma plugin UI so the designer knows how fresh the data is.
