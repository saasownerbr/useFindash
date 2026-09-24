const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const SOURCE = path.join(PUBLIC_DIR, "favicon.svg");

// public/favicon.svg is the "use." brand mark on a transparent background.
// The tab icon stays transparent; home-screen app icons get a solid backdrop
// because iOS and Android apply their own mask and fill transparency.
const source = fs.readFileSync(SOURCE);
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const BACKDROP = "#0F0F0F";

/** The mark fitted into a square canvas, `scale` of its width. */
async function mark(size, scale) {
  const width = Math.round(size * scale);
  const logo = await sharp(source, { density: 600 }).resize({ width }).png().toBuffer();
  return sharp(logo)
    .resize(size, size, { fit: "contain", background: TRANSPARENT })
    .png()
    .toBuffer();
}

async function main() {
  fs.writeFileSync(path.join(PUBLIC_DIR, "favicon.png"), await mark(32, 1));

  for (const [file, size] of [
    ["apple-touch-icon.png", 180],
    ["icon-192x192.png", 192],
    ["icon-512x512.png", 512],
  ]) {
    const icon = await sharp({ create: { width: size, height: size, channels: 4, background: BACKDROP } })
      .composite([{ input: await mark(size, 0.7) }])
      .png()
      .toBuffer();
    fs.writeFileSync(path.join(PUBLIC_DIR, file), icon);
  }

  console.log("Favicons generated in public/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
