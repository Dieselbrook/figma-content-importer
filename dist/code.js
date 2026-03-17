"use strict";
// Content Importer — Figma Plugin
// Imports social media content plans from JSON into Figma frames
// ─── Dimension Parsing ───────────────────────────────────────
function parseDimensions(post) {
    // Use Size first, fallback to Dimensions
    const dimStr = (post.Size && post.Size.trim()) ? post.Size : post.Dimensions;
    if (!dimStr)
        return [{ label: 'Frame', width: 1080, height: 1080 }];
    // Normalise: add "px" if raw numbers like "1080x1350"
    const normalised = dimStr.replace(/(\d+)\s*x\s*(\d+)(?!px)/gi, '$1x$2px');
    const results = [];
    // Handle "or" splits
    const orParts = normalised.split(/\s+or\s+/i);
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
    const parts = normalised.split('|');
    for (const part of parts) {
        const m = part.match(/(\d+)\s*x\s*(\d+)\s*px/i);
        if (m) {
            const label = part.replace(/\d+\s*x\s*\d+\s*px/i, '').replace(/:/g, '').trim() || 'Frame';
            results.push({ label, width: parseInt(m[1]), height: parseInt(m[2]) });
        }
    }
    return results.length ? results : [{ label: 'Frame', width: 1080, height: 1080 }];
}
function countCarouselSlides(visualBrief) {
    if (!visualBrief)
        return 0;
    const matches = visualBrief.match(/Slide\s+\d+/gi);
    if (!matches)
        return 0;
    return Math.max(...matches.map(m => parseInt(m.match(/\d+/)[0])));
}
// ─── Layout Constants ────────────────────────────────────────
const CARD_WIDTH = 280;
const CARD_GAP = 20;
const FRAME_GAP = 30;
const POST_GAP = 100;
const SCALE_FACTOR = 0.25;
// Card 1 starts at x=0, Card 2 follows, then frames
const CARD2_X = CARD_WIDTH + CARD_GAP;
const FRAMES_START_X = CARD2_X + CARD_WIDTH + CARD_GAP;
// ─── Card 1: Post Info (ID, Date, Caption, Hashtags) ─────────
function createInfoCard(post, y, minHeight) {
    const card = figma.createFrame();
    card.name = `${post.Post_ID} — Post Info`;
    card.x = 0;
    card.y = y;
    card.resize(CARD_WIDTH, minHeight);
    card.fills = [{ type: 'SOLID', color: { r: 0.96, g: 0.97, b: 1.0 } }]; // light blue-grey
    card.cornerRadius = 8;
    card.strokeWeight = 1;
    card.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.85, b: 0.95 } }];
    card.layoutMode = 'VERTICAL';
    card.paddingTop = 16;
    card.paddingBottom = 16;
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.itemSpacing = 10;
    card.primaryAxisSizingMode = 'AUTO';
    function addLabel(text, size, bold, color) {
        const node = figma.createText();
        node.characters = text;
        node.fontSize = size;
        node.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
        node.fills = [{ type: 'SOLID', color }];
        node.layoutAlign = 'STRETCH';
        node.textAutoResize = 'HEIGHT';
        card.appendChild(node);
        return node;
    }
    function addSection(title, content) {
        if (!content || !content.trim())
            return;
        addLabel(title, 9, true, { r: 0.4, g: 0.5, b: 0.7 });
        addLabel(content, 12, false, { r: 0.1, g: 0.1, b: 0.1 });
    }
    // Post ID
    addLabel(post.Post_ID || 'Unknown', 15, true, { r: 0.1, g: 0.1, b: 0.5 });
    // Meta: platform · format · date
    const meta = [post.Platform, post.Content_Format, post.Scheduled_Date].filter(Boolean).join(' · ');
    if (meta)
        addLabel(meta, 10, false, { r: 0.45, g: 0.5, b: 0.6 });
    // Divider
    const div = figma.createRectangle();
    div.resize(CARD_WIDTH - 32, 1);
    div.fills = [{ type: 'SOLID', color: { r: 0.75, g: 0.82, b: 0.95 } }];
    div.layoutAlign = 'STRETCH';
    card.appendChild(div);
    addSection('CAPTION', post.Caption || '');
    addSection('HASHTAGS', post.Hashtags || '');
    return card;
}
// ─── Card 2: Creative Brief (Visual Brief + Other Copy) ───────
function createCreativeCard(post, y, minHeight) {
    const card = figma.createFrame();
    card.name = `${post.Post_ID} — Creative Brief`;
    card.x = CARD2_X;
    card.y = y;
    card.resize(CARD_WIDTH, minHeight);
    card.fills = [{ type: 'SOLID', color: { r: 0.97, g: 0.96, b: 1.0 } }]; // light lavender
    card.cornerRadius = 8;
    card.strokeWeight = 1;
    card.strokes = [{ type: 'SOLID', color: { r: 0.85, g: 0.8, b: 0.95 } }];
    card.layoutMode = 'VERTICAL';
    card.paddingTop = 16;
    card.paddingBottom = 16;
    card.paddingLeft = 16;
    card.paddingRight = 16;
    card.itemSpacing = 10;
    card.primaryAxisSizingMode = 'AUTO';
    function addLabel(text, size, bold, color) {
        const node = figma.createText();
        node.characters = text;
        node.fontSize = size;
        node.fontName = { family: 'Inter', style: bold ? 'Bold' : 'Regular' };
        node.fills = [{ type: 'SOLID', color }];
        node.layoutAlign = 'STRETCH';
        node.textAutoResize = 'HEIGHT';
        card.appendChild(node);
        return node;
    }
    function addSection(title, content) {
        if (!content || !content.trim())
            return;
        addLabel(title, 9, true, { r: 0.5, g: 0.3, b: 0.7 });
        addLabel(content, 12, false, { r: 0.1, g: 0.1, b: 0.1 });
    }
    // Header
    addLabel('Creative Brief', 13, true, { r: 0.3, g: 0.1, b: 0.5 });
    // Divider
    const div = figma.createRectangle();
    div.resize(CARD_WIDTH - 32, 1);
    div.fills = [{ type: 'SOLID', color: { r: 0.8, g: 0.75, b: 0.95 } }];
    div.layoutAlign = 'STRETCH';
    card.appendChild(div);
    addSection('VISUAL BRIEF', post.Visual_Brief || '');
    addSection('COPY ON IMAGE', post.Other_Copy || '');
    return card;
}
// ─── Content Frame ───────────────────────────────────────────
function createContentFrame(def, x, y, postId, index, imageBytes) {
    const scaledW = Math.round(def.width * SCALE_FACTOR);
    const scaledH = Math.round(def.height * SCALE_FACTOR);
    const frame = figma.createFrame();
    frame.name = `${postId} — ${def.label}${index > 0 ? ` (${index + 1})` : ''}`;
    frame.resize(scaledW, scaledH);
    frame.x = x;
    frame.y = y;
    frame.cornerRadius = 4;
    frame.strokeWeight = 1;
    frame.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
    frame.clipsContent = true;
    if (imageBytes && imageBytes.length > 0) {
        const imageHash = figma.createImage(imageBytes);
        frame.fills = [{
                type: 'IMAGE',
                imageHash: imageHash.hash,
                scaleMode: 'FILL',
            }];
    }
    else {
        frame.fills = [{ type: 'SOLID', color: { r: 0.93, g: 0.93, b: 0.93 } }];
        const sizeLabel = figma.createText();
        sizeLabel.characters = `${def.width}×${def.height}`;
        sizeLabel.fontSize = 10;
        sizeLabel.fontName = { family: 'Inter', style: 'Regular' };
        sizeLabel.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
        sizeLabel.x = 8;
        sizeLabel.y = 8;
        frame.appendChild(sizeLabel);
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
    }
    return frame;
}
// ─── Main Import Logic ───────────────────────────────────────
async function importPosts(posts) {
    await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
    await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });
    const page = figma.currentPage;
    let currentY = 0;
    let totalFrames = 0;
    for (const post of posts) {
        const dims = parseDimensions(post);
        const isCarousel = (post.Content_Format || '').toLowerCase().includes('carousel');
        const slideCount = isCarousel ? Math.max(countCarouselSlides(post.Visual_Brief), 1) : 1;
        // Calculate content frames layout
        let framesX = FRAMES_START_X;
        let maxFrameHeight = 0;
        const framesToCreate = [];
        for (const dim of dims) {
            for (let s = 0; s < slideCount; s++) {
                const scaledW = Math.round(dim.width * SCALE_FACTOR);
                const scaledH = Math.round(dim.height * SCALE_FACTOR);
                framesToCreate.push({ def: dim, x: framesX, y: currentY, index: isCarousel ? s : 0 });
                framesX += scaledW + FRAME_GAP;
                maxFrameHeight = Math.max(maxFrameHeight, scaledH);
            }
        }
        // Create the two info cards (height will auto-size)
        const infoCard = createInfoCard(post, currentY, maxFrameHeight);
        page.appendChild(infoCard);
        const creativeCard = createCreativeCard(post, currentY, maxFrameHeight);
        page.appendChild(creativeCard);
        // Parse image bytes
        const allImageBytes = [];
        if (post._imageBytes && Array.isArray(post._imageBytes)) {
            for (const arr of post._imageBytes) {
                allImageBytes.push(arr ? new Uint8Array(arr) : undefined);
            }
        }
        // Create content frames
        for (let i = 0; i < framesToCreate.length; i++) {
            const fc = framesToCreate[i];
            const imgBytes = allImageBytes[i];
            const frame = createContentFrame(fc.def, fc.x, fc.y, post.Post_ID || 'Unknown', fc.index, imgBytes);
            page.appendChild(frame);
            totalFrames++;
        }
        // Advance Y
        const tallestCard = Math.max(infoCard.height, creativeCard.height, maxFrameHeight);
        currentY += tallestCard + POST_GAP;
    }
    return totalFrames;
}
// ─── Plugin Entry ────────────────────────────────────────────
figma.showUI(__html__, { width: 340, height: 320 });
figma.ui.onmessage = async (msg) => {
    if (msg.type === 'import' && msg.data) {
        try {
            const count = await importPosts(msg.data);
            figma.ui.postMessage({
                type: 'success',
                message: `Imported ${msg.data.length} posts with ${count} frames`
            });
            figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
        }
        catch (err) {
            figma.ui.postMessage({
                type: 'error',
                message: err.message || 'Import failed'
            });
        }
    }
};
