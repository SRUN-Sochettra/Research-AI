import fs from "fs";
import path from "path";
import sharp from "sharp";

const SVG_MARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="112" fill="#13201e" stroke="#30403d" stroke-width="24"/>
  <line x1="130" y1="148" x2="382" y2="126" stroke="#38e1a6" stroke-width="28" stroke-opacity="0.85" stroke-linecap="round"/>
  <line x1="130" y1="148" x2="182" y2="384" stroke="#38e1a6" stroke-width="28" stroke-opacity="0.85" stroke-linecap="round"/>
  <line x1="182" y1="384" x2="376" y2="330" stroke="#38e1a6" stroke-width="28" stroke-opacity="0.85" stroke-linecap="round"/>
  <circle cx="130" cy="148" r="40" fill="#38e1a6"/>
  <circle cx="382" cy="126" r="40" fill="#38e1a6"/>
  <circle cx="182" cy="384" r="40" fill="#38e1a6"/>
  <circle cx="376" cy="330" r="40" fill="#38e1a6"/>
</svg>`;

function buildIco(pngBuffers: { size: number; buffer: Buffer }[]): Buffer {
  const count = pngBuffers.length;
  const headerSize = 6;
  const dirEntrySize = 16;
  const dirSize = count * dirEntrySize;
  let currentOffset = headerSize + dirSize;

  const header = Buffer.alloc(headerSize);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // number of images

  const entries: Buffer[] = [];
  const imageBuffers: Buffer[] = [];

  for (const { size, buffer } of pngBuffers) {
    const entry = Buffer.alloc(dirEntrySize);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bpp
    entry.writeUInt32LE(buffer.length, 8); // image size
    entry.writeUInt32LE(currentOffset, 12); // image offset

    entries.push(entry);
    imageBuffers.push(buffer);
    currentOffset += buffer.length;
  }

  return Buffer.concat([header, ...entries, ...imageBuffers]);
}

async function main() {
  const root = process.cwd();
  const svgBuffer = Buffer.from(SVG_MARK);

  console.log("Generating SynapseDoc brand favicon assets...");

  // 1. Write SVG icons
  const iconSvgPath = path.join(root, "src/app/icon.svg");
  const pubSvgPath = path.join(root, "public/favicon.svg");
  fs.writeFileSync(iconSvgPath, SVG_MARK, "utf8");
  fs.writeFileSync(pubSvgPath, SVG_MARK, "utf8");
  console.log("  ✓ Written src/app/icon.svg and public/favicon.svg");

  // 2. Generate PNG resolutions
  const p16 = await sharp(svgBuffer).resize(16, 16).png().toBuffer();
  const p32 = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  const p48 = await sharp(svgBuffer).resize(48, 48).png().toBuffer();
  const p180 = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  const p192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  const p512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();

  // 3. Write Apple touch icons
  fs.writeFileSync(path.join(root, "src/app/apple-icon.png"), p180);
  fs.writeFileSync(path.join(root, "public/apple-touch-icon.png"), p180);
  console.log(
    "  ✓ Written src/app/apple-icon.png and public/apple-touch-icon.png (180x180)"
  );

  // 4. Write manifest icons
  fs.writeFileSync(path.join(root, "public/icon-192.png"), p192);
  fs.writeFileSync(path.join(root, "public/icon-512.png"), p512);
  console.log("  ✓ Written public/icon-192.png and public/icon-512.png");

  // 5. Build multi-res ICO files (16, 32, 48)
  const icoBuffer = buildIco([
    { size: 16, buffer: p16 },
    { size: 32, buffer: p32 },
    { size: 48, buffer: p48 },
  ]);

  fs.writeFileSync(path.join(root, "src/app/favicon.ico"), icoBuffer);
  fs.writeFileSync(path.join(root, "public/favicon.ico"), icoBuffer);
  console.log(
    "  ✓ Written src/app/favicon.ico and public/favicon.ico (multi-resolution 16, 32, 48)"
  );

  console.log("All brand icons generated successfully!");
}

main().catch((err) => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
