# Content Importer — Figma Plugin

A Figma plugin that imports social media content plans into Figma with one click, automatically creating frames and placing copy/briefs for designers.

Built by [Dieselbrook](https://dieselbrook.co.za).

## The Problem

Moving content plans from a Google Sheet into Figma is tedious — manually creating frames at the right sizes, copying captions and briefs, organizing everything. For 16–20 posts per plan, that's a lot of clicking.

## The Solution

An automated pipeline: the OpenClaw bot fetches your Google Sheet, converts it to JSON, and commits it to this repo. The designer opens the Figma plugin, sees a preview, and clicks **one button** to import everything.

## Workflow

```
Google Sheet → OpenClaw bot fetches CSV → Converts to JSON → Commits to repo
                                                                    ↓
                              Designer clicks "Import Latest Content" in Figma
```

### How it works

1. **Bot prepares data** — The OpenClaw bot fetches the content calendar CSV from Google Sheets, converts it to JSON, and commits it to `data/latest.json` in this repo.
2. **Designer imports** — Open Figma → Plugins → Content Importer → click **Import Latest Content**. That's it.

The plugin creates:

- **Text blocks** (left) with Post ID, platform, format, caption, and visual brief
- **Empty frames** (right) at the correct dimensions, ready for design

## Supported Formats

The plugin handles all common dimension formats from content calendars:

| Format | Example | Result |
|--------|---------|--------|
| Single | `1080x1080px` | 1 frame |
| Multiple | `FB: 1200x630px \| IG Story: 1080x1920px` | 2 frames side by side |
| With backup | `1080x1920px (vertical Reel) or 1080x1080px (carousel backup)` | 2 frames |
| Carousel | Content_Format: "Carousel" + slides in Visual_Brief | N frames per slide |

## JSON Format

The `data/latest.json` file can be either:

- A plain array of post objects: `[{ "Post_ID": "MAR-001", ... }, ...]`
- An object with metadata: `{ "metadata": { "updated": "2026-02-16" }, "posts": [...] }`

### Post fields

| Field | Required | Description |
|-------|----------|-------------|
| Post_ID | Yes | Unique identifier (e.g., MAR-001) |
| Platform | — | Facebook, Instagram, etc. |
| Content_Format | — | Photo, Carousel, Reel, Story, etc. |
| Caption | — | Post copy |
| Visual_Brief | — | Art direction for the designer |
| Dimensions | — | Frame size(s) to create |

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Load in Figma
# Plugins → Development → Import plugin from manifest
# Select manifest.json from this repo
```

## Bot Workflow

See [.github/BOT_WORKFLOW.md](.github/BOT_WORKFLOW.md) for details on how the OpenClaw bot keeps `data/latest.json` up to date.

## License

Private — Dieselbrook internal tool.
