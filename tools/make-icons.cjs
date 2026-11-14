// Regenerates public/icons/* (PWA icons, favicon, Apple icon) from src/assets/logo.svg.
// Usage (from the repo root):  npm install --no-save sharp  &&  node tools/make-icons.cjs .
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const repo = process.argv[2];
const out = path.join(repo, "public", "icons");
fs.mkdirSync(out, { recursive: true });

const CREAM = "#FFEFD6";
const INK = "#3B4A52";
const PINK = "#EE7D9C";

// תוכן הלוגו (עם הפילטרים) כ-SVG מקונן, כדי לשים אותו במרכז הרקע
const logoSvg = fs.readFileSync(path.join(repo, "src", "assets", "logo.svg"), "utf8");
const logoInner = logoSvg.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
const LOGO_W = 320, LOGO_H = 190;

/** ריבוע בצבע קרם עם הלוגו במרכז. widthFrac = רוחב הלוגו כחלק מהריבוע. */
function logoIcon(size, widthFrac, radiusFrac = 0) {
  const w = size * widthFrac, h = (w * LOGO_H) / LOGO_W;
  const x = (size - w) / 2, y = (size - h) / 2 + size * 0.01;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * radiusFrac}" fill="${CREAM}"/>
    <svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="0 0 ${LOGO_W} ${LOGO_H}">${logoInner}</svg>
  </svg>`;
}

/** favicon קטן: ספסל פשוט וקווים עבים (המילה לא קריאה בגודל כזה) ולב ורוד. */
function faviconSvg(size = 64) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="${CREAM}"/>
  <g fill="none" stroke="${INK}" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 22 L52 21 L52.5 36 L12.5 37 Z"/>
    <path d="M10 41 L54 40 L55 47 L9 48 Z"/>
    <path d="M16 48 L15 57 M48 47 L49 57"/>
  </g>
  <path d="M46 18 C41 14.5 38.5 12 38.5 8.5 C38.5 6 40.4 4.5 42.6 4.5 C44.2 4.5 45.4 5.4 46 6.8 C46.6 5.4 47.8 4.5 49.4 4.5 C51.6 4.5 53.5 6 53.5 8.5 C53.5 12 51 14.5 46 18 Z" fill="${PINK}" stroke="#fff" stroke-width="1.2" stroke-linejoin="round"/>
</svg>`;
}

async function png(svg, size, file) {
  await sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toFile(path.join(out, file));
  console.log("wrote", file);
}

(async () => {
  await png(logoIcon(512, 0.8, 0.18), 512, "icon-512.png");
  await png(logoIcon(512, 0.8, 0.18), 192, "icon-192.png");
  await png(logoIcon(512, 0.58, 0), 512, "icon-maskable-512.png"); // ללא פינות מעוגלות: המערכת חותכת בעצמה, והלוגו בתוך האזור הבטוח
  await png(logoIcon(512, 0.8, 0), 180, "apple-touch-icon.png");   // iOS מעגל את הפינות בעצמו
  const fav = faviconSvg();
  fs.writeFileSync(path.join(out, "favicon.svg"), fav);
  console.log("wrote favicon.svg");
  await png(fav, 32, "favicon-32.png");
  await png(fav, 48, "favicon-48.png");
})();
