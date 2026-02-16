# Figma Content Importer

A Figma plugin that imports social media content plans from Google Sheets into Figma, automatically creating text blocks and frames for each post.

## Features

- **Import from JSON**: Load content plans exported from Google Sheets
- **Smart dimension parsing**: Handles single dimensions, multiple platforms, carousel posts, and backup formats
- **Carousel support**: Automatically creates multiple frames for carousel posts by detecting slide counts
- **Organized layout**: Text blocks on the left, frames on the right, with clear spacing
- **CSV converter included**: Easy conversion from Google Sheets CSV exports to JSON

## Installation

### Development Setup

1. Clone this repository:
   ```bash
   git clone https://github.com/Dieselbrook/figma-content-importer.git
   cd figma-content-importer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the plugin:
   ```bash
   npm run build
   ```

4. In Figma:
   - Go to **Plugins** → **Development** → **Import plugin from manifest**
   - Select the `manifest.json` file from this repository

## Usage

### 1. Export from Google Sheets

Export your content plan as CSV from Google Sheets.

### 2. Convert CSV to JSON

Use the included converter script:

```bash
npm run convert input.csv output.json
```

Or directly with Node:

```bash
node scripts/convert.js content-plan.csv content-plan.json
```

### 3. Import into Figma

1. Open your Figma file
2. Run the **Content Importer** plugin
3. Select your JSON file
4. Click **Import to Figma**

The plugin will create organized layouts with:
- **Text blocks** (left side, 400px wide) containing:
  - Post ID
  - Platform
  - Content Format
  - Caption
  - Visual Brief
- **Frames** (right side) at the correct dimensions for each platform

## JSON Structure

Expected fields from Google Sheets:

```json
[
  {
    "Post_ID": "001",
    "Month": "January",
    "Week": "1",
    "Scheduled_Date": "2024-01-05",
    "Platform": "Instagram",
    "Content_Format": "Carousel",
    "Theme": "Product Launch",
    "Product_Focus": "New Collection",
    "Caption": "Your caption text here",
    "Hashtags": "#brand #product",
    "Visual_Brief": "Slide 1: Hero shot\nSlide 2: Detail view\nSlide 3: CTA",
    "Dimensions": "1080x1080px",
    "Figma_Frame": "",
    "Status": "Draft",
    "Approved_By": "",
    "Published_URL": ""
  }
]
```

## Dimension Parsing

The plugin intelligently handles various dimension formats:

### Single Dimension
```
1080x1080px
```
Creates one frame at 1080×1080px

### Multiple Platforms
```
FB: 1200x630px | IG Story: 1080x1920px
```
Creates two frames side by side with labels

### Carousel Posts
```
Content_Format: "Carousel"
Visual_Brief: "Slide 1: ...\nSlide 2: ...\nSlide 3: ..."
```
Detects slide count from Visual_Brief and creates multiple frames

### Reel with Backup
```
1080x1920px (vertical Reel) or 1080x1080px (carousel backup)
```
Creates both frame sizes

## Development

### Build Commands

- **Build once**: `npm run build`
- **Watch mode**: `npm run watch` (rebuilds on file changes)
- **Convert CSV**: `npm run convert <input.csv> <output.json>`

### Project Structure

```
figma-content-importer/
├── README.md
├── manifest.json          # Figma plugin manifest
├── tsconfig.json          # TypeScript configuration
├── package.json
├── src/
│   ├── code.ts            # Main plugin logic
│   └── ui.html            # Plugin UI (file picker)
├── scripts/
│   └── convert.js         # CSV to JSON converter
└── dist/                  # Compiled output (generated)
    └── code.js
```

### How It Works

1. **UI Layer** (`ui.html`): File picker interface that loads JSON and sends it to the plugin
2. **Plugin Core** (`code.ts`): 
   - Receives JSON data
   - Parses each post
   - Creates text blocks with post details
   - Parses dimension strings
   - Creates frames at correct sizes
   - Handles carousels by detecting slide counts
   - Positions everything with proper spacing
3. **CSV Converter** (`convert.js`): Node.js script that parses CSV and outputs JSON

## Tips

- **Naming**: Frames are automatically named with Post_ID and platform/format labels
- **Spacing**: Posts are separated vertically with 100px spacing
- **Carousels**: The plugin detects "Slide 1", "Slide 2" etc. in Visual_Brief to determine frame count
- **Frame styling**: Frames have light gray fill and border for easy visibility

## License

MIT

---

**Built for Dieselbrook** 🚀
