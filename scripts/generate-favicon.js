const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const OUT_DIR = path.join(__dirname, "..", "public");
const BG = "#0F0F0F";
const FG = "#F8F8F8";

// "uF" drawn as strokes on a 512 grid so rendering never depends on installed fonts.
function markSvg(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${BG}"/>
  <g transform="translate(-2 0)" fill="none" stroke="${FG}" stroke-width="52">
    <path d="M130 206 V300 A50 50 0 0 0 230 300 V206"/>
    <path d="M230 290 V376"/>
    <path d="M312 136 V376"/>
    <path d="M286 162 H412"/>
    <path d="M286 262 H392"/>
  </g>
</svg>`;
}

function renderPng(size) {
  return sharp(Buffer.from(markSvg(size))).png().toBuffer();
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
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
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
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pngs = {
    "favicon-16x16.png": 16,
    "favicon-32x32.png": 32,
    "apple-touch-icon.png": 180,
    "icon-192x192.png": 192,
    "icon-512x512.png": 512,
  };

  for (const [file, size] of Object.entries(pngs)) {
    fs.writeFileSync(path.join(OUT_DIR, file), await renderPng(size));
  }

  const icoImages = await Promise.all([16, 32, 48].map(async (size) => ({ size, data: await renderPng(size) })));
  fs.writeFileSync(path.join(OUT_DIR, "favicon.ico"), buildIco(icoImages));

  console.log("Favicons generated in public/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
