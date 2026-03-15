# Content Importer — Figma Plugin

A Figma plugin that imports approved social media posts from Google Sheets into Figma — creating frames and placing actual generated images for designers to polish.

Built by [Dieselbrook](https://dieselbrook.co.za).

## Workflow

```
#jock-social: "describe a shot" 
    → Max generates 2 images via Mission Control ImageGen
    → Images posted to Discord
    → Reply "v1" or "v2"
    → Max writes Image_URL + Figma_Status = ready to Google Sheet
    → Run: npm run sync:build
    → Open Figma → Content Importer → Import to Figma
    → Frames created with images placed, captions/briefs alongside
    → Designer polishes → publish
```

### Filtering

The plugin only imports rows where:
- `Status = approved`
- `Figma_Status = ready`

This means only posts that have been approved and have images are imported. Run `npm run sync -- --all` to import everything regardless of status.

## Setup & Usage

```bash
# Install dependencies
npm install

# Sync approved+ready posts from Google Sheet → data/latest.json, then build
npm run sync:build

# Or separately:
npm run sync          # pull from sheet
npm run build         # compile + inline data into dist/

# Load in Figma: Plugins → Development → Import plugin from manifest
# Select manifest.json from this repo
```

### Clients

By default syncs JOCK. To sync a different client:

```bash
node scripts/sync-sheet.js --client=troygold
```

## Google Sheet Columns Used

| Column | Purpose |
|--------|---------|
| Post_ID | Unique ID (e.g., JOCK-APR-W1-01) |
| Status | Must be `approved` to import |
| Figma_Status | Must be `ready` to import |
| Platform | Facebook, Instagram, etc. |
| Content_Format | Photo, Carousel, Reel, etc. |
| Caption | Post copy |
| Visual_Brief | Art direction |
| Dimensions | Frame size(s) — e.g. `1080x1440px` |
| Image_URLs | Comma-separated Discord CDN URLs (written by Max) |

## What the Plugin Creates

For each imported post:
- **Text block** (left) — Post ID, platform, format, caption, visual brief
- **Frame(s)** (right) — correct dimensions, scaled to 25% for canvas readability
  - If `Image_URLs` present: image placed as fill
  - If no image: grey placeholder with dimension label

## Supported Dimension Formats

| Format | Example | Result |
|--------|---------|--------|
| Single | `1080x1080px` | 1 frame |
| Multiple | `FB: 1200x630px \| IG Story: 1080x1920px` | 2 frames |
| With backup | `1080x1920px (vertical Reel) or 1080x1080px (carousel backup)` | 2 frames |
| Carousel | Content_Format: "Carousel" + Slide N in Visual_Brief | N frames |

## Service Account

Reads Google Sheets via the `max-agent@max-dieselbrook.iam.gserviceaccount.com` service account.  
Key path: `../social-media-engine/config/google-service-account.json` (relative to plugin root).

## License

Private — Dieselbrook internal tool.
