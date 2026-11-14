import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { ImageResponse } from 'next/og';

/**
 * Shared renderer for the dynamic share images (opengraph-image.tsx files).
 * Maroon / gold / ivory, logo on the left, page name large on the right.
 * Fonts and the logo are bundled next to this file (OFL-licensed Playfair
 * Display + Inter, static instances) so rendering never needs the network.
 */
export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

const MAROON = '#5A0B22';
const MAROON_DARK = '#3D0717';
const GOLD = '#C8A548';
const GOLD_LIGHT = '#D4B96A';
const IVORY = '#FBF5EA';

// Read from disk (fetch() of file: URLs is not supported in the Node runtime).
// next.config.ts `outputFileTracingIncludes` ships these files to production.
function loadAsset(file: string) {
  return readFile(path.join(process.cwd(), 'src', 'lib', 'og', file));
}

export async function renderBrandOg({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  const [playfair, inter, logo] = await Promise.all([
    loadAsset('fonts/PlayfairDisplay-SemiBold.ttf'),
    loadAsset('fonts/Inter-Medium.ttf'),
    loadAsset('logo.png'),
  ]);
  const logoSrc = `data:image/png;base64,${logo.toString('base64')}`;

  // Long collection names shrink so they never overflow the card.
  const titleSize = title.length > 34 ? 54 : title.length > 22 ? 66 : 80;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 100%)`,
          padding: 28,
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            border: `2px solid ${GOLD}`,
            padding: 14,
          }}
        >
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              border: `1px solid ${GOLD}66`,
              padding: '0 56px',
            }}
          >
            <div
              style={{
                display: 'flex',
                width: 360,
                height: 360,
                background: IVORY,
                borderRadius: 8,
                border: `3px solid ${GOLD}`,
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- next/og renders <img> via satori */}
              <img src={logoSrc} width={354} height={354} alt="" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', marginLeft: 56, flex: 1 }}>
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'Inter',
                  fontSize: 24,
                  letterSpacing: 6,
                  textTransform: 'uppercase',
                  color: GOLD_LIGHT,
                }}
              >
                {eyebrow}
              </div>
              <div
                style={{
                  display: 'flex',
                  marginTop: 22,
                  fontFamily: 'Playfair',
                  fontSize: titleSize,
                  lineHeight: 1.1,
                  color: '#FFFFFF',
                }}
              >
                {title}
              </div>
              <div style={{ display: 'flex', width: 120, height: 3, background: GOLD, marginTop: 30 }} />
              <div
                style={{
                  display: 'flex',
                  marginTop: 26,
                  fontFamily: 'Inter',
                  fontSize: 28,
                  lineHeight: 1.4,
                  color: IVORY,
                }}
              >
                {subtitle ?? 'Luxury Lucknowi Chikankari'}
              </div>
              <div
                style={{
                  display: 'flex',
                  marginTop: 34,
                  fontFamily: 'Inter',
                  fontSize: 22,
                  letterSpacing: 4,
                  color: GOLD_LIGHT,
                }}
              >
                EIFACOUTURE.COM
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Playfair', data: playfair.buffer.slice(playfair.byteOffset, playfair.byteOffset + playfair.byteLength) as ArrayBuffer, weight: 600, style: 'normal' },
        { name: 'Inter', data: inter.buffer.slice(inter.byteOffset, inter.byteOffset + inter.byteLength) as ArrayBuffer, weight: 500, style: 'normal' },
      ],
    }
  );
}
