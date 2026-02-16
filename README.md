# Content Importer — Figma Plugin

A Figma plugin that imports social media content plans from Google Sheets into Figma, automatically creating frames and placing copy/briefs for designers.

Built by [Dieselbrook](https://dieselbrook.co.za).

## The Problem

Moving content plans from a Google Sheet into Figma is tedious — manually creating frames at the right sizes, copying captions and briefs, organizing everything. For 16–20 posts per plan, that's a lot of clicking.

## The Solution

Export your content calendar as CSV → convert to JSON → import into Figma. The plugin creates:

- **Text blocks** (left) with Post ID, platform, format, caption, and visual brief
- **Empty frames** (right) at the correct dimensions, ready for design

## Workflow

```
Google Sheet → Export as CSV → Convert to JSON → Import in Figma
```

### 1. Export CSV from Google Sheets

`File → Download → Comma Separated Values (.csv)`

### 2. Convert CSV to JSON

```bash
node scripts/convert.js your-export.csv > content.json
```

Or pipe it:
```bash
cat your-export.csv | node scripts/convert.js > content.json
```

### 3. Import in Figma

1. Open Figma → Plugins → Content Importer
2. Drop or select your `content.json` file
3. Preview the post count and frame count
4. Click **Import into Figma**

## Supported Formats

The plugin handles all common dimension formats from content calendars:

| Format | Example | Result |
|--------|---------|--------|
| Single | `1080x1080px` | 1 frame |
| Multiple | `FB: 1200x630px \| IG Story: 1080x1920px` | 2 frames side by side |
| With backup | `1080x1920px (vertical Reel) or 1080x1080px (carousel backup)` | 2 frames |
| Carousel | Content_Format: "Carousel" + slides in Visual_Brief | N frames per slide |

## Expected CSV Columns

| Column | Required | Description |
|--------|----------|-------------|
| Post_ID | ✅ | Unique identifier (e.g., MAR-001) |
| Platform | — | Facebook, Instagram, etc. |
| Content_Format | — | Photo, Carousel, Reel, Story, etc. |
| Caption | — | Post copy (FB + IG versions) |
| Visual_Brief | — | Art direction for the designer |
| Dimensions | — | Frame size(s) to create |

Other columns (Month, Week, Scheduled_Date, Theme, Product_Focus, Hashtags, Status, etc.) are preserved in the JSON but not displayed in Figma.

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

## Reuse for Other Clients

This plugin is client-agnostic. To use for a different client:

1. Export their content calendar as CSV (same column structure)
2. Run the converter
3. Import into a new Figma file

No code changes needed.

## License

Private — Dieselbrook internal tool.
