/* ============================================
   EIFA COUTURE — Application Constants
   ============================================ */

// ── Site Info ──
export const SITE_URL = "https://eifacouture.com";

// ── Product Sizes ──
export const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"] as const;

export type Size = (typeof SIZES)[number];

// ── Social Links ──
// Single source of truth for the storefront (footer, mobile menu, schema.org
// `sameAs`). Admin → Settings can still override a platform per-field in the
// footer. Add Pinterest / YouTube / WhatsApp here only once real, working
// profiles exist — placeholder links hurt trust and SEO.
export const SOCIAL_LINKS = [
  {
    name: "Instagram",
    href: "https://www.instagram.com/eifachikankari/",
    icon: "instagram",
  },
  {
    name: "Facebook",
    // Page name: "Eifa chikankari". Confirm the exact page URL/handle.
    href: "https://www.facebook.com/eifachikankari",
    icon: "facebook",
  },
] as const;

// ── Contact Info ──
export const CONTACT_INFO = {
  email: "eifachikankari@gmail.com",
  phone: "+91 88745 77757",
  address: {
    line1: "F No. 402, Bhukhand No. 466/112 072/3 D",
    line2: "Chowk, Lucknow, Uttar Pradesh 226003",
    locality: "Chowk",
    city: "Lucknow",
    district: "Lucknow",
    state: "Uttar Pradesh",
    pincode: "226003",
    country: "India",
  },
  workingHours: {
    weekdays: "10:00 AM – 8:00 PM",
    weekends: "10:00 AM – 6:00 PM",
    note: "Closed on national holidays",
  },
} as const;

// ── Shipping Info ──
export const SHIPPING_INFO = {
  freeShippingThreshold: 2999,
  standardShippingCost: 149,
  expressShippingCost: 349,
  standardDeliveryDays: { min: 5, max: 7 },
  expressDeliveryDays: { min: 2, max: 3 },
  codAvailable: true,
  codCharge: 49,
  internationalShipping: false,
  message:
    "Free shipping on all orders above ₹2,999. Each piece is carefully hand-packed with love.",
} as const;

// ── Return Policy ──
export const RETURN_POLICY = {
  returnWindow: 7,
  exchangeWindow: 15,
  refundProcessingDays: { min: 5, max: 7 },
  conditions: [
    "Item must be unused and in original packaging with all tags intact.",
    "Returns are accepted within 7 days of delivery.",
    "Exchanges are accepted within 15 days of delivery.",
    "Customised, altered, or bridal pieces are not eligible for return.",
    "Sale items are final sale and cannot be returned or exchanged.",
    "Refunds will be processed to the original payment method.",
  ],
  message: "We want you to love your purchase. If something isn't right, we're here to help.",
} as const;
// ── Size chart (approximate body measurements, inches) ──
// Shown in the product page "Size guide" modal. Edit here if the atelier's
// fit differs; only sizes the product actually offers are displayed.
export const SIZE_CHART = {
  women: {
    measureLabel: "Bust",
    rows: [
      { size: "XS", measure: "32", waist: "26" },
      { size: "S", measure: "34", waist: "28" },
      { size: "M", measure: "36", waist: "30" },
      { size: "L", measure: "38", waist: "32" },
      { size: "XL", measure: "40", waist: "34" },
      { size: "XXL", measure: "42", waist: "36" },
    ],
  },
  men: {
    measureLabel: "Chest",
    rows: [
      { size: "S", measure: "38", waist: "32" },
      { size: "M", measure: "40", waist: "34" },
      { size: "L", measure: "42", waist: "36" },
      { size: "XL", measure: "44", waist: "38" },
      { size: "XXL", measure: "46", waist: "40" },
    ],
  },
} as const;
