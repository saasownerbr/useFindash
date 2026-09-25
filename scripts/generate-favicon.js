const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const PUBLIC_DIR = path.join(__dirname, "..", "public");
const SOURCE = path.join(PUBLIC_DIR, "favicon.svg");

// public/favicon.svg is the "use." brand mark (copied as-is from the brand file) on a transparent background.
// The tab icon stays transparent; home-screen app icons put the mark in
// #F7F7F7 on a #111111 tile with 22% rounded corners.
const source = fs.readFileSync(SOURCE);
const TRANSPARENT = { r: 0, g: 0, b: 0, alpha: 0 };
const BACKDROP = "#111111";
const CORNER_RADIUS = 0.22;

/** Rounded #111111 tile, `size` px square. */
function tile(size) {
  const r = Math.round(size * CORNER_RADIUS);
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${BACKDROP}"/></svg>`
  );
}

/**
 * The mark centered on a transparent square, its letters spanning `scale` of the width.
 * Trimming first centers the glyphs themselves, not the SVG's viewBox.
 */
async function mark(size, scale) {
  const trimmed = await sharp(source, { density: 600 }).trim().png().toBuffer();
  const logo = await sharp(trimmed)
    .resize({ width: Math.round(size * scale), height: Math.round(size * scale), fit: "inside" })
    .png()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = logo.info;
  const left = Math.floor((size - width) / 2);
  const top = Math.floor((size - height) / 2);
  return sharp(logo.data)
    .extend({ left, right: size - width - left, top, bottom: size - height - top, background: TRANSPARENT })
    .png()
    .toBuffer();
}

async function main() {
  for (const [file, size] of [
    ["apple-touch-icon.png", 180],
    ["icon-192x192.png", 192],
    ["icon-512x512.png", 512],
  ]) {
    const icon = await sharp(tile(size))
      .composite([{ input: await mark(size, 0.58) }])
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
