// Content Importer — Figma Plugin
// Imports social media content plans from JSON into Figma frames

interface PostData {
  Post_ID: string;
  Month?: string;
  Week?: string;
  Scheduled_Date?: string;
  Platform?: string;
  Content_Format?: string;
  Theme?: string;
  Product_Focus?: string;
  Caption?: string;
  Hashtags?: string;
  Visual_Brief?: string;
  Dimensions?: string;
  Figma_Frame?: string;
  Status?: string;
  Approved_By?: string;
  Published_URL?: string;
}

interface FrameDef {
  label: string;
  width: number;
  height: number;
}

// ─── Dimension Parsing ───────────────────────────────────────

function parseDimensions(dimStr: string | undefined): FrameDef[] {
  if (!dimStr) return [{ label: 'Frame', width: 1080, height: 1080 }];

  const results: FrameDef[] = [];

  // Handle "or" splits: "1080x1920px (vertical Reel) or 1080x1080px (carousel backup)"
  const orParts = dimStr.split(/\s+or\s+/i);
  if (orParts.length > 1) {
    for (const part of orParts) {
      const m = part.match(/(\d+)\s*x\s*(\d+)\s*px/i);
      if (m) {
        const label = part.replace(/\d+\s*x\s*\d+\s*px/i, '').replace(/[()]/g, '').trim() || 'Frame';
        results.push({ label, width: parseInt(m[1]), height: parseInt(m[2]) });
      }
    }
    return results.length ? results : [{ label: 'Frame', width: 1080, height: 1080 }];
  }

  // Handle pipe splits: "FB: 1200x630px | IG Story: 1080x1920px"
  const parts = dimStr.split('|');
  for (const part of parts) {
    const m = part.match(/(\d+)\s*x\s*(\d+)\s*px/i);
    if (m) {
      const label = part.replace(/\d+\s*x\s*\d+\s*px/i, '').replace(/:/g, '').trim() || 'Frame';
      results.push({ label, width: parseInt(m[1]), height: parseInt(m[2]) });
    }
  }

  return results.length ? results : [{ label: 'Frame', width: 1080, height: 1080 }];
}

function countCarouselSlides(visualBrief: string | undefined): number {
  if (!visualBrief) return 0;
  const matches = visualBrief.match(/Slide\s+\d+/gi);
  if (!matches) return 0;
  return Math.max(...matches.map(m => parseInt(m.match(/\d+/)![0])));
}

// ─── Text & Frame Creation ───────────────────────────────────

const TEXT_BLOCK_WIDTH = 380;
const FRAME_START_X = 430;
const FRAME_GAP = 40;
const POST_GAP = 120;
const SCALE_FACTOR = 0.25; // Scale frames down to 25% for readability on canvas

function createTextBlock(post: PostData, x: number, y: number, height: number): FrameNode {
  const container = figma.createFrame();
  container.name = `${post.Post_ID} — Info`;
  container.resize(TEXT_BLOCK_WIDTH, Math.max(height, 400));
  container.x = x;
  container.y = y;
  container.fills = [{ type: 'SOLID', color: { r: 0.97, g: 0.97, b: 0.97 } }];
  container.cornerRadius = 8;
  container.layoutMode = 'VERTICAL';
  container.paddingTop = 16;
  container.paddingBottom = 16;
  container.paddingLeft = 16;
  container.paddingRight = 16;
  container.itemSpacing = 12;
  container.primaryAxisSizingMode = 'AUTO';

  // Helper to add a section
  function addSection(title: string, content: string) {
    if (!content || !content.trim()) return;

    const titleNode = figma.createText();
    titleNode.characters = title;
    titleNode.fontSize = 11;
    titleNode.fontName = { family: 'Inter', style: 'Bold' };
    titleNode.fills = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.4 } }];
    titleNode.layoutAlign = 'STRETCH';
    container.appendChild(titleNode);

    const contentNode = figma.createText();
    contentNode.characters = content;
    contentNode.fontSize = 12;
    contentNode.fontName = { family: 'Inter', style: 'Regular' };
    contentNode.fills = [{ type: 'SOLID', color: { r: 0.13, g: 0.13, b: 0.13 } }];
    contentNode.layoutAlign = 'STRETCH';
    contentNode.textAutoResize = 'HEIGHT';
    container.appendChild(contentNode);
  }

  // Post ID header
  const header = figma.createText();
  header.characters = post.Post_ID || 'Unknown';
  header.fontSize = 16;
  header.fontName = { family: 'Inter', style: 'Bold' };
  header.fills = [{ type: 'SOLID', color: { r: 0.1, g: 0.1, b: 0.1 } }];
  header.layoutAlign = 'STRETCH';
  container.appendChild(header);

  // Metadata line
  const meta = [post.Platform, post.Content_Format, post.Scheduled_Date].filter(Boolean).join(' · ');
  if (meta) {
    const metaNode = figma.createText();
    metaNode.characters = meta;
    metaNode.fontSize = 11;
    metaNode.fontName = { family: 'Inter', style: 'Regular' };
    metaNode.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
    metaNode.layoutAlign = 'STRETCH';
    container.appendChild(metaNode);
  }

  // Divider
  const divider = figma.createRectangle();
  divider.resize(TEXT_BLOCK_WIDTH - 32, 1);
  divider.fills = [{ type: 'SOLID', color: { r: 0.85, g: 0.85, b: 0.85 } }];
  divider.layoutAlign = 'STRETCH';
  container.appendChild(divider);

  addSection('CAPTION', post.Caption || '');
  addSection('VISUAL BRIEF', post.Visual_Brief || '');
  addSection('DIMENSIONS', post.Dimensions || '');

  return container;
}

function createContentFrame(def: FrameDef, x: number, y: number, postId: string, index: number): FrameNode {
  const scaledW = Math.round(def.width * SCALE_FACTOR);
  const scaledH = Math.round(def.height * SCALE_FACTOR);

  const frame = figma.createFrame();
  frame.name = `${postId} — ${def.label}${index > 0 ? ` (${index + 1})` : ''}`;
  frame.resize(scaledW, scaledH);
  frame.x = x;
  frame.y = y;
  frame.fills = [{ type: 'SOLID', color: { r: 0.93, g: 0.93, b: 0.93 } }];
  frame.cornerRadius = 4;
  frame.strokeWeight = 1;
  frame.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];

  // Size label inside frame
  const label = figma.createText();
  label.characters = `${def.width}×${def.height}`;
  label.fontSize = 10;
  label.fontName = { family: 'Inter', style: 'Regular' };
  label.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
  label.x = 8;
  label.y = 8;
  frame.appendChild(label);

  // Label name above or inside
  if (def.label && def.label !== 'Frame') {
    const nameLabel = figma.createText();
    nameLabel.characters = def.label;
    nameLabel.fontSize = 10;
    nameLabel.fontName = { family: 'Inter', style: 'Bold' };
    nameLabel.fills = [{ type: 'SOLID', color: { r: 0.5, g: 0.5, b: 0.5 } }];
    nameLabel.x = 8;
    nameLabel.y = 22;
    frame.appendChild(nameLabel);
  }

  return frame;
}

// ─── Main Import Logic ───────────────────────────────────────

async function importPosts(posts: PostData[]) {
  // Load fonts
  await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
  await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

  const page = figma.currentPage;
  let currentY = 0;
  let totalFrames = 0;

  for (const post of posts) {
    const dims = parseDimensions(post.Dimensions);
    const isCarousel = (post.Content_Format || '').toLowerCase().includes('carousel');
    const slideCount = isCarousel ? Math.max(countCarouselSlides(post.Visual_Brief), 1) : 1;

    // Calculate total frames width for this post
    let framesX = FRAME_START_X;
    let maxFrameHeight = 0;
    const framesToCreate: { def: FrameDef; x: number; y: number; index: number }[] = [];

    for (const dim of dims) {
      for (let s = 0; s < slideCount; s++) {
        const scaledW = Math.round(dim.width * SCALE_FACTOR);
        const scaledH = Math.round(dim.height * SCALE_FACTOR);
        framesToCreate.push({ def: dim, x: framesX, y: currentY, index: isCarousel ? s : 0 });
        framesX += scaledW + FRAME_GAP;
        maxFrameHeight = Math.max(maxFrameHeight, scaledH);
      }
    }

    // Create text block
    const textBlock = createTextBlock(post, 0, currentY, maxFrameHeight);
    page.appendChild(textBlock);

    // Create frames
    for (const fc of framesToCreate) {
      const frame = createContentFrame(
        fc.def,
        fc.x,
        fc.y,
        post.Post_ID || 'Unknown',
        fc.index
      );
      page.appendChild(frame);
      totalFrames++;
    }

    // Move Y down
    const textHeight = textBlock.height;
    currentY += Math.max(maxFrameHeight, textHeight) + POST_GAP;
  }

  return totalFrames;
}

// ─── Plugin Entry ────────────────────────────────────────────

figma.showUI(__html__, { width: 340, height: 320 });

figma.ui.onmessage = async (msg: { type: string; data?: PostData[] }) => {
  if (msg.type === 'import' && msg.data) {
    try {
      const count = await importPosts(msg.data);
      figma.ui.postMessage({
        type: 'success',
        message: `Imported ${msg.data.length} posts with ${count} frames`
      });
      figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
    } catch (err: any) {
      figma.ui.postMessage({
        type: 'error',
        message: err.message || 'Import failed'
      });
    }
  }
};
