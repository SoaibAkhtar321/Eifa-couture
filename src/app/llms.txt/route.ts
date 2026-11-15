import { CONTACT_INFO, RETURN_POLICY, SITE_URL, SOCIAL_LINKS } from '@/lib/constants';
import { getCachedCategories } from '@/lib/data/storefront-cache';

// Re-generated at most once an hour so new categories appear without a deploy.
export const revalidate = 3600;

/**
 * /llms.txt — a plain-Markdown brief for AI assistants and answer engines
 * (llmstxt.org convention). Facts here come from src/lib/constants.ts so
 * they stay in sync with the site.
 */
export async function GET() {
  let categoryLines: string[] = [];
  try {
    const categories = await getCachedCategories();
    categoryLines = categories.map(
      (category) => `- [${category.name}](${SITE_URL}/shop?category=${category.slug})`,
    );
  } catch {
    // Catalogue unavailable: still serve the static brief.
  }

  const lines = [
    '# Eifa Couture',
    '',
    '> Eifa Couture is a Lucknow-based fashion house selling premium handcrafted Lucknowi Chikankari clothing — kurtas, anarkalis, sarees, sets, dupattas and bridal pieces — online across India. The house has worked with Chikankari since 1998.',
    '',
    '## Key pages',
    `- [Shop all](${SITE_URL}/shop): the full catalogue`,
    `- [Women](${SITE_URL}/women): women's Chikankari wear`,
    `- [Men](${SITE_URL}/men): men's Chikankari wear`,
    `- [Accessories](${SITE_URL}/accessories): accessories`,
    `- [Our story](${SITE_URL}/about): heritage and craft`,
    `- [Size guide](${SITE_URL}/size-guide): measurements for every size`,
    `- [Shipping policy](${SITE_URL}/shipping-policy): delivery areas, times and charges`,
    `- [Cancellation, returns & refunds](${SITE_URL}/refund-policy): cancellations, returns, exchanges and refunds`,
    `- [Privacy policy](${SITE_URL}/privacy-policy): how personal data is handled under India's DPDP Act`,
    `- [Terms of service](${SITE_URL}/terms): terms of use and purchase`,
    `- [Contact](${SITE_URL}/contact): how to reach us`,
    '',
    ...(categoryLines.length ? ['## Categories', ...categoryLines, ''] : []),
    '## Policies',
    `- Returns accepted within ${RETURN_POLICY.returnWindow} days of delivery on unused items with tags; size exchanges within ${RETURN_POLICY.exchangeWindow} days. Customised and bridal pieces are not returnable.`,
    '- Payments are processed securely through Razorpay. Delivery is across India.',
    '',
    '## Contact',
    `- Email: ${CONTACT_INFO.email}`,
    `- Phone: ${CONTACT_INFO.phone}`,
    `- Address: ${CONTACT_INFO.address.line1}, ${CONTACT_INFO.address.line2}, India`,
    ...SOCIAL_LINKS.map((link) => `- ${link.name}: ${link.href}`),
    '',
  ];

  return new Response(lines.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
