const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const SOURCE = path.join(PUBLIC_DIR, "favicon.svg");

// public/favicon.svg is the brand symbol (rounded square + "use." glyph paths),
// so rendering never depends on fonts installed on the build machine.
const source = fs.readFileSync(SOURCE, "utf8");
const [roundedSquare, ...glyphs] = source.match(/<path [^>]*\/>/g);
const viewBox = source.match(/viewBox="([^"]+)"/)[1];
const [x, y, w, h] = viewBox.split(/\s+/).map(Number);

function sized(svg, size) {
  return svg.replace("<svg ", `<svg width="${size}" height="${size}" `);
}

// Tab favicons keep the rounded square; app icons are full-bleed because
// iOS and Android apply their own mask.
const roundedSvg = source;
const fullBleedSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#000000"/>${glyphs.join("")}</svg>`;

function render(svg, size) {
  return sharp(Buffer.from(sized(svg, size))).png().toBuffer();
}

// ICO container holding PNG payloads (supported by every current browser).
function buildIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const entries = [];
  let offset = 6 + images.length * 16;
  for (const { size, data } of images) {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    entries.push(entry);
    offset += data.length;
  }

  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

async function main() {
  if (!roundedSquare || glyphs.length === 0) throw new Error("favicon.svg has no paths");

  const outputs = [
    ["favicon-16x16.png", roundedSvg, 16],
    ["favicon-32x32.png", roundedSvg, 32],
    ["apple-touch-icon.png", fullBleedSvg, 180],
    ["icon-192x192.png", fullBleedSvg, 192],
    ["icon-512x512.png", fullBleedSvg, 512],
  ];
  for (const [file, svg, size] of outputs) {
    fs.writeFileSync(path.join(PUBLIC_DIR, file), await render(svg, size));
  }

  const icoImages = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await render(roundedSvg, size) })));
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.ico"), buildIco(icoImages));

  console.log("Favicons generated in public/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
