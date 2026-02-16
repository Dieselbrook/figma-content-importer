figma.showUI(__html__, { width: 320, height: 240 });

interface ContentPost {
  Post_ID: string;
  Month?: string;
  Week?: string;
  Scheduled_Date?: string;
  Platform: string;
  Content_Format: string;
  Theme?: string;
  Product_Focus?: string;
  Caption: string;
  Hashtags?: string;
  Visual_Brief: string;
  Dimensions: string;
  Figma_Frame?: string;
  Status?: string;
  Approved_By?: string;
  Published_URL?: string;
}

interface ParsedDimension {
  label: string;
  width: number;
  height: number;
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'import') {
    try {
      const posts: ContentPost[] = msg.data;
      let yOffset = 0;
      const VERTICAL_SPACING = 100;
      const TEXT_BLOCK_WIDTH = 400;
      const FRAME_START_X = 450;
      const HORIZONTAL_SPACING = 50;

      for (const post of posts) {
        // Create text block with post details
        const textContent = createTextContent(post);
        const textNode = figma.createText();
        
        await figma.loadFontAsync({ family: "Inter", style: "Regular" });
        
        textNode.characters = textContent;
        textNode.fontSize = 12;
        textNode.resize(TEXT_BLOCK_WIDTH, textNode.height);
        textNode.x = 0;
        textNode.y = yOffset;

        // Parse dimensions and create frames
        const dimensions = parseDimensions(post.Dimensions);
        const frames = await createFrames(post, dimensions, FRAME_START_X, yOffset);

        // Calculate height for next post
        const maxHeight = Math.max(
          textNode.height,
          ...frames.map(f => f.height)
        );
        
        yOffset += maxHeight + VERTICAL_SPACING;
      }

      figma.ui.postMessage({
        type: 'import-complete',
        count: posts.length
      });

      figma.viewport.scrollAndZoomIntoView(figma.currentPage.children);
    } catch (error) {
      figma.ui.postMessage({
        type: 'import-error',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
};

function createTextContent(post: ContentPost): string {
  return `Post ID: ${post.Post_ID}
Platform: ${post.Platform}
Content Format: ${post.Content_Format}

Caption:
${post.Caption}

Visual Brief:
${post.Visual_Brief}`;
}

function parseDimensions(dimensionStr: string): ParsedDimension[] {
  const dimensions: ParsedDimension[] = [];
  
  // Handle multiple dimensions separated by |
  const parts = dimensionStr.split('|').map(s => s.trim());
  
  for (const part of parts) {
    // Extract label (e.g., "FB:", "IG Story:")
    const labelMatch = part.match(/^([^:]+):\s*/);
    const label = labelMatch ? labelMatch[1].trim() : 'Frame';
    const dimString = labelMatch ? part.substring(labelMatch[0].length) : part;
    
    // Extract dimension values (e.g., "1080x1920px")
    const dimMatches = dimString.matchAll(/(\d+)\s*x\s*(\d+)\s*px/g);
    
    for (const match of dimMatches) {
      dimensions.push({
        label,
        width: parseInt(match[1]),
        height: parseInt(match[2])
      });
    }
  }
  
  return dimensions;
}

async function createFrames(
  post: ContentPost,
  dimensions: ParsedDimension[],
  startX: number,
  startY: number
): Promise<FrameNode[]> {
  const frames: FrameNode[] = [];
  let xOffset = startX;
  const FRAME_SPACING = 30;
  
  // Check if carousel - need to parse Visual_Brief for slide count
  const isCarousel = post.Content_Format.toLowerCase().includes('carousel');
  let slideCount = 1;
  
  if (isCarousel) {
    // Count slides in Visual_Brief (look for "Slide 1", "Slide 2", etc.)
    const slideMatches = post.Visual_Brief.match(/Slide\s+\d+/gi);
    if (slideMatches) {
      slideCount = slideMatches.length;
    }
  }
  
  for (const dim of dimensions) {
    const framesToCreate = isCarousel ? slideCount : 1;
    
    for (let i = 0; i < framesToCreate; i++) {
      const frame = figma.createFrame();
      frame.resize(dim.width, dim.height);
      frame.x = xOffset;
      frame.y = startY;
      
      // Set frame name
      const frameName = framesToCreate > 1 
        ? `${dim.label} - Slide ${i + 1}`
        : dim.label;
      frame.name = `${post.Post_ID} - ${frameName}`;
      
      // Style the frame
      frame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.95, b: 0.95 } }];
      frame.strokes = [{ type: 'SOLID', color: { r: 0.8, g: 0.8, b: 0.8 } }];
      frame.strokeWeight = 1;
      
      frames.push(frame);
      xOffset += dim.width + FRAME_SPACING;
    }
  }
  
  return frames;
}
