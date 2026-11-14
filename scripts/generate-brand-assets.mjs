// Generates favicon / app icons from the brand logo.
// Run: node scripts/generate-brand-assets.mjs
// `sharp` ships with Next.js (optional dependency), so no new dependency is needed.
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';

const LOGO = 'public/images/eifa-logo-header.png';
const IVORY = '#FBF5EA';

// Tab icons use the EC monogram only: the full logo (arch, flowers, wordmark)
// turns to mush at 16px. Crop is a square around the E/C letters.
const MONO = { left: 160, top: 122, width: 146, height: 146 };
// The right-hand pillar and arch ornament start ~x=274 in the source; blank it out of the crop.
const PILLAR_CUT = 274 - MONO.left;

async function mono(size, padPct) {
  const inner = Math.round(size * (1 - padPct * 2));
  const cropped = await sharp(LOGO)
    .extract(MONO)
    .flatten({ background: IVORY })
    .composite([
      {
        input: { create: { width: MONO.width - PILLAR_CUT, height: MONO.height, channels: 3, background: IVORY } },
        left: PILLAR_CUT,
        top: 0,
      },
    ])
    .png()
    .toBuffer();
  const glyph = await sharp(cropped).resize(inner, inner, { kernel: 'lanczos3' }).toBuffer();
  return sharp({ create: { width: size, height: size, channels: 3, background: IVORY } })
    .composite([{ input: glyph, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// Manifest (home-screen) icons use the full logo, padded so it survives maskable cropping.
async function full(size, padPct) {
  const inner = Math.round(size * (1 - padPct * 2));
  const glyph = await sharp(LOGO)
    .flatten({ background: IVORY })
    .resize(inner, inner, { kernel: 'lanczos3' })
    .toBuffer();
  return sharp({ create: { width: size, height: size, channels: 3, background: IVORY } })
    .composite([{ input: glyph, gravity: 'center' }])
    .png({ compressionLevel: 9 })
    .toBuffer();
}

// Minimal ICO writer (PNG-compressed entries, supported by all modern browsers).
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  let offset = 6 + entries.length * 16;
  const dirs = [];
  for (const { size, data } of entries) {
    const d = Buffer.alloc(16);
    d.writeUInt8(size >= 256 ? 0 : size, 0);
    d.writeUInt8(size >= 256 ? 0 : size, 1);
    d.writeUInt16LE(1, 4);
    d.writeUInt16LE(32, 6);
    d.writeUInt32LE(data.length, 8);
    d.writeUInt32LE(offset, 12);
    offset += data.length;
    dirs.push(d);
  }
  return Buffer.concat([header, ...dirs, ...entries.map((e) => e.data)]);
}

const icoEntries = [];
for (const size of [16, 32, 48]) {
  // Tighter padding on the smallest sizes so the letters stay readable.
  icoEntries.push({ size, data: await mono(size, size <= 16 ? 0.04 : 0.07) });
}
await writeFile('src/app/favicon.ico', buildIco(icoEntries));
await writeFile('src/app/icon.png', await mono(512, 0.08));
const apple = await mono(180, 0.08);
await writeFile('src/app/apple-icon.png', apple);
// Safari/iOS also probe this legacy path directly, so keep it in sync.
await writeFile('public/apple-touch-icon.png', apple);
await writeFile('public/icon-192.png', await full(192, 0.06));
await writeFile('public/icon-512.png', await full(512, 0.06));
console.log('icons written');

// ── Homepage share image (public/og-image.jpg, 1200x630, <300 KB for WhatsApp) ──
const W = 1200;
const H = 630;
const PANEL = 660; // maroon panel width; photo fills the rest

const photo = await sharp('public/images/hero/hero-1.png')
  .resize(W - PANEL + 40, H, { fit: 'cover', position: 'attention' })
  .toBuffer();

const logoCard = await sharp(LOGO)
  .flatten({ background: IVORY })
  .resize(236, 236, { kernel: 'lanczos3' })
  .extend({ top: 4, bottom: 4, left: 4, right: 4, background: '#C8A548' })
  .png()
  .toBuffer();

const overlay = Buffer.from(`
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#3D0717"/><stop offset="1" stop-color="#5A0B22"/>
    </linearGradient>
    <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#4A0A1D" stop-opacity="1"/><stop offset="1" stop-color="#4A0A1D" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <rect width="${PANEL}" height="${H}" fill="url(#bg)"/>
  <rect x="${PANEL}" width="60" height="${H}" fill="url(#fade)"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="#C8A548" stroke-width="2"/>
  <rect x="34" y="34" width="${W - 68}" height="${H - 68}" fill="none" stroke="#C8A548" stroke-opacity="0.4" stroke-width="1"/>
  <text x="74" y="394" font-family="Playfair Display" font-weight="600" font-size="68" fill="#FFFFFF">Eifa Couture</text>
  <rect x="74" y="418" width="110" height="3" fill="#C8A548"/>
  <text x="74" y="466" font-family="Inter" font-weight="500" font-size="30" fill="#FBF5EA">Luxury Lucknowi Chikankari</text>
  <text x="74" y="512" font-family="Inter" font-weight="500" font-size="20" letter-spacing="4" fill="#D4B96A">HANDCRAFTED SINCE 1998</text>
  <text x="74" y="578" font-family="Inter" font-weight="500" font-size="20" letter-spacing="4" fill="#D4B96A">EIFACOUTURE.COM</text>
</svg>`);

const og = await sharp({ create: { width: W, height: H, channels: 3, background: '#4A0A1D' } })
  .composite([
    { input: photo, left: PANEL - 40, top: 0 },
    { input: overlay, left: 0, top: 0 },
    { input: logoCard, left: 74, top: 70 },
  ])
  .toColourspace('srgb')
  .jpeg({ quality: 82, mozjpeg: true })
  .toBuffer();
await writeFile('public/og-image.jpg', og);
console.log(`og-image.jpg ${(og.length / 1024).toFixed(0)} KB`);
