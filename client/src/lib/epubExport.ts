import JSZip from "jszip";
import type { StoryWithPages } from "@shared/schema";

export interface EPUBExportProgress {
  stage:
    | "initializing"
    | "processing-images"
    | "generating-content"
    | "finalizing"
    | "complete";
  current?: number;
  total?: number;
  message: string;
  progress: number;
}

export interface TextBlock {
  id?: string;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor?: string;
  backgroundOpacity?: number;
  x: number;
  y: number;
  width: number;
  height: number;
  textAlign: "left" | "center" | "right";
}

export interface TextOverlay {
  blocks?: TextBlock[];
  isVisible: boolean;
  // Legacy support
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  textAlign?: "left" | "center" | "right";
}

async function processImageWithOverlay(
  imageUrl: string,
  overlay: TextOverlay | null
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          throw new Error("Failed to get canvas context");
        }
        ctx.drawImage(img, 0, 0);
        if (overlay && overlay.isVisible) {
          const blocks: TextBlock[] = overlay.blocks || [
            {
              text: overlay.text || "",
              fontSize: overlay.fontSize || 48,
              fontFamily: overlay.fontFamily || "Arial",
              color: overlay.color || "#ffffff",
              backgroundColor: "#000000",
              backgroundOpacity: 0.2,
              x: overlay.x || 50,
              y: overlay.y || 50,
              width: overlay.width || 80,
              height: overlay.height || 20,
              textAlign: overlay.textAlign || "center",
            }
          ];

          for (const block of blocks) {
            if (!block.text) continue;

            const fontSize = (block.fontSize * img.width) / 1260;
            const padding = (1.9 * img.width) / 100;
            
            // Render background
            if (block.backgroundColor && block.backgroundOpacity && block.backgroundOpacity > 0) {
              const rb = parseInt(block.backgroundColor.slice(1, 3), 16) || 0;
              const gb = parseInt(block.backgroundColor.slice(3, 5), 16) || 0;
              const bb = parseInt(block.backgroundColor.slice(5, 7), 16) || 0;
              
              const rectW = (block.width / 100) * img.width;
              const rectH = (block.height / 100) * img.height;
              const rectX = (block.x / 100) * img.width - rectW / 2;
              const rectY = (block.y / 100) * img.height - rectH / 2;
              
              ctx.save();
              ctx.globalAlpha = block.backgroundOpacity;
              ctx.fillStyle = `rgb(${rb},${gb},${bb})`;
              ctx.fillRect(rectX, rectY, rectW, rectH);
              ctx.restore();
            }

            // Robust font string with standard fallbacks
            const fontMap: Record<string, string> = {
              "Inter": "Inter, system-ui, sans-serif",
              "Geist": "Geist, system-ui, sans-serif",
              "Lora": "Lora, Georgia, serif",
              "Open Sans": "'Open Sans', sans-serif",
              "Space Grotesk": "'Space Grotesk', sans-serif",
              "Arial": "Arial, Helvetica, sans-serif",
              "Georgia": "Georgia, serif",
              "Verdana": "Verdana, Geneva, sans-serif",
              "Times New Roman": "'Times New Roman', Times, serif",
              "Courier New": "'Courier New', Courier, monospace",
              "Comic Sans MS": "'Comic Sans MS', cursive",
              "Trebuchet MS": "'Trebuchet MS', Helvetica, sans-serif",
              "Impact": "Impact, Charcoal, sans-serif",
              "Tahoma": "Tahoma, Geneva, sans-serif",
              "Palatino": "'Palatino Linotype', 'Book Antiqua', Palatino, serif",
              "Garamond": "Garamond, Baskerville, 'Baskerville Old Face', 'Hoefler Text', 'Times New Roman', serif",
            };
            const fontStack = fontMap[block.fontFamily] || `"${block.fontFamily}", Arial, sans-serif`;
            ctx.font = `bold ${fontSize}px ${fontStack}`;
            ctx.fillStyle = block.color;
            ctx.textAlign = block.textAlign;
            ctx.textBaseline = "middle";

            const centerX = (block.x / 100) * img.width;
            const centerY = (block.y / 100) * img.height;
            const boxWidth = (block.width / 100) * img.width;

            let drawX = centerX;
            if (block.textAlign === "left") {
              drawX = centerX - boxWidth / 2 + padding;
            } else if (block.textAlign === "right") {
              drawX = centerX + boxWidth / 2 - padding;
            }

            const wrapWidth = boxWidth - (padding * 2);
            const words = block.text.split(" ");
            const lines: string[] = [];
            let currentLine = words[0];

            for (let i = 1; i < words.length; i++) {
              const word = words[i];
              const width = ctx.measureText(currentLine + " " + word).width;
              if (width < wrapWidth) {
                currentLine += " " + word;
              } else {
                lines.push(currentLine);
                currentLine = word;
              }
            }
            lines.push(currentLine);

            const lineHeight = fontSize * 1.2;
            const totalHeight = lines.length * lineHeight;
            const startY = centerY - totalHeight / 2 + lineHeight / 2;

            lines.forEach((line, i) => {
              ctx.fillText(line, drawX, startY + i * lineHeight);
            });
          }
        }

        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Failed to create blob from canvas"));
          },
          "image/png"
        );
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => reject(new Error(`Failed to load image: ${imageUrl}`));
    img.src = imageUrl;
  });
}

export async function exportToEPUB(
  story: StoryWithPages,
  onProgress?: (progress: EPUBExportProgress) => void
): Promise<void> {
  onProgress?.({
    stage: "initializing",
    message: "Initializing EPUB generation...",
    progress: 0,
  });

  const zip = new JSZip();

  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  zip.file(
    "META-INF/container.xml",
    `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const totalPages = story.pages.length;
  const hasCover = !!(story as any).coverImageUrl;
  const imageItems: {
    id: string;
    href: string;
    mediaType: string;
    blob: Blob;
  }[] = [];

  onProgress?.({
    stage: "processing-images",
    message: "Processing images...",
    progress: 10,
  });

  if (hasCover) {
    try {
      const blob = await processImageWithOverlay(
        (story as any).coverImageUrl,
        (story as any).coverTextOverlay
      );
      imageItems.push({
        id: "cover-image",
        href: "images/cover.jpg",
        mediaType: "image/jpeg",
        blob,
      });
    } catch (err) {
      console.warn("Failed to include cover image in EPUB", err);
    }
  }

  for (let i = 0; i < story.pages.length; i++) {
    const page = story.pages[i];
    if (page.imageUrl) {
      try {
        onProgress?.({
          stage: "processing-images",
          current: i + 1,
          total: totalPages,
          message: `Processing image for page ${i + 1}...`,
          progress: 10 + Math.round((i / totalPages) * 40),
        });
        const blob = await processImageWithOverlay(
          page.imageUrl,
          (page as any).textOverlay
        );
        imageItems.push({
          id: `page-image-${i}`,
          href: `images/page-${i}.jpg`,
          mediaType: "image/jpeg",
          blob,
        });
      } catch (err) {
        console.warn(`Failed to include image for page ${i + 1} in EPUB`, err);
      }
    }
  }

  imageItems.forEach((item) => {
    zip.file(`OEBPS/${item.href}`, item.blob);
  });

  onProgress?.({
    stage: "generating-content",
    message: "Generating book content...",
    progress: 60,
  });

  zip.file(
    "OEBPS/style.css",
    `body { font-family: sans-serif; margin: 0; padding: 0; text-align: center; }
.page { page-break-after: always; padding: 20px; }
.page-image { max-width: 100%; height: auto; margin-bottom: 20px; }
.page-text { font-size: 1.2em; line-height: 1.5; text-align: left; }
.cover { text-align: center; }
.cover-image { max-width: 100%; height: auto; }
h1 { font-family: serif; }`
  );

  const pageItems: { id: string; href: string; title: string }[] = [];

  if (hasCover) {
    const coverHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Cover</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div class="cover">
    <img src="images/cover.jpg" class="cover-image" alt="Cover"/>
    <h1>${story.title}</h1>
  </div>
</body>
</html>`;
    zip.file("OEBPS/cover.xhtml", coverHtml);
    pageItems.push({ id: "cover", href: "cover.xhtml", title: "Cover" });
  }

  story.pages.forEach((page, i) => {
    const pageId = `page-${i}`;
    const pageHref = `page-${i}.xhtml`;
    const imageHref = page.imageUrl ? `images/page-${i}.jpg` : null;

    const pageHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>Page ${i + 1}</title>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  <div class="page">
    ${
      imageHref
        ? `<img src="${imageHref}" class="page-image" alt="Page ${i + 1}"/>`
        : ""
    }
    ${
      !imageHref || !(page as any).textOverlay?.isVisible
        ? `<div class="page-text">
            ${page.text
              .split("\n")
              .map((p) => `<p>${p}</p>`)
              .join("")}
          </div>`
        : ""
    }
  </div>
</body>
</html>`;
    zip.file(`OEBPS/${pageHref}`, pageHtml);
    pageItems.push({ id: pageId, href: pageHref, title: `Page ${i + 1}` });
  });

  const tocNcx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${story.id}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>${story.title}</text>
  </docTitle>
  <navMap>
    ${pageItems
      .map(
        (page, i) => `
    <navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
      <navLabel><text>${page.title}</text></navLabel>
      <content src="${page.href}"/>
    </navPoint>`
      )
      .join("")}
  </navMap>
</ncx>`;
  zip.file("OEBPS/toc.ncx", tocNcx);

  const contentOpf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:title>${story.title}</dc:title>
    <dc:language>en</dc:language>
    <dc:identifier id="BookId">urn:uuid:${story.id}</dc:identifier>
    <dc:creator>LittleRoot</dc:creator>
    ${hasCover ? '<meta name="cover" content="cover-image"/>' : ""}
  </metadata>
  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
    <item id="style" href="style.css" media-type="text/css"/>
    ${pageItems
      .map(
        (page) =>
          `<item id="${page.id}" href="${page.href}" media-type="application/xhtml+xml"/>`
      )
      .join("\n    ")}
    ${imageItems
      .map(
        (img) =>
          `<item id="${img.id}" href="${img.href}" media-type="${img.mediaType}"/>`
      )
      .join("\n    ")}
  </manifest>
  <spine toc="ncx">
    ${pageItems.map((page) => `<itemref idref="${page.id}"/>`).join("\n    ")}
  </spine>
  <guide>
    ${
      hasCover
        ? '<reference type="cover" title="Cover" href="cover.xhtml"/>'
        : ""
    }
  </guide>
</package>`;
  zip.file("OEBPS/content.opf", contentOpf);

  onProgress?.({
    stage: "finalizing",
    message: "Finalizing EPUB file...",
    progress: 90,
  });

  const blob = await zip.generateAsync({ type: "blob" });

  const fileName = `${story.title.replace(
    /[^a-zA-Z0-9]/g,
    "_"
  )}_${Date.now()}.epub`;

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  onProgress?.({
    stage: "complete",
    message: "Download complete!",
    progress: 100,
  });
}
