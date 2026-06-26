/* ============================================
   EIFA COUTURE — Application Constants
   ============================================ */

// ── Site Info ──
export const SITE_NAME = 'Eifa Couture';

export const SITE_DESCRIPTION =
  'Discover premium handcrafted Lucknowi Chikankari fashion at Eifa Couture. Since 1998, weaving heritage into every thread.';

export const SITE_URL = 'https://eifacouture.com';

// ── Navigation ──
export interface NavLink {
  label: string;
  href: string;
  children?: NavLink[];
}

export const NAV_LINKS: NavLink[] = [
  {
    label: 'Shop',
    href: '/shop',
    children: [
      { label: "Women's Kurtas", href: '/shop?category=womens-kurtas' },
      { label: "Men's Kurtas", href: '/shop?category=mens-kurtas' },
      { label: 'Anarkalis', href: '/shop?category=anarkalis' },
      { label: 'Dupattas', href: '/shop?category=dupattas' },
      { label: 'Sarees', href: '/shop?category=sarees' },
      { label: 'Palazzo Sets', href: '/shop?category=palazzo-sets' },
      { label: 'Bridal Collection', href: '/shop?category=bridal-collection' },
      { label: 'Accessories', href: '/shop?category=accessories' },
    ],
  },
  { label: 'New Arrivals', href: '/shop?collection=new-arrivals' },
  { label: 'Best Sellers', href: '/shop?collection=best-sellers' },
  { label: 'Bridal', href: '/shop?category=bridal-collection' },
  { label: 'Our Story', href: '/about' },
  { label: 'Journal', href: '/blog' },
  { label: 'Contact', href: '/contact' },
];

// ── Footer Links ──
export interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

export const FOOTER_LINKS: FooterColumn[] = [
  {
    title: 'Shop',
    links: [
      { label: "Women's Kurtas", href: '/shop?category=womens-kurtas' },
      { label: "Men's Kurtas", href: '/shop?category=mens-kurtas' },
      { label: 'Anarkalis', href: '/shop?category=anarkalis' },
      { label: 'Dupattas', href: '/shop?category=dupattas' },
      { label: 'Sarees', href: '/shop?category=sarees' },
      { label: 'Palazzo Sets', href: '/shop?category=palazzo-sets' },
      { label: 'Bridal Collection', href: '/shop?category=bridal-collection' },
      { label: 'Accessories', href: '/shop?category=accessories' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Our Story', href: '/about' },
      { label: 'Artisan Heritage', href: '/about#artisans' },
      { label: 'Journal', href: '/blog' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact Us', href: '/contact' },
    ],
  },
  {
    title: 'Customer Care',
    links: [
      { label: 'Track Order', href: '/track-order' },
      { label: 'Shipping Policy', href: '/shipping-policy' },
      { label: 'Returns & Exchange', href: '/returns' },
      { label: 'Size Guide', href: '/size-guide' },
      { label: 'Care Instructions', href: '/care-instructions' },
      { label: 'FAQs', href: '/faqs' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Refund Policy', href: '/refund-policy' },
    ],
  },
];

// ── Product Sizes ──
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'] as const;
export type Size = (typeof SIZES)[number];

// ── Product Colors ──
export const COLORS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Off White', hex: '#FAF0E6' },
  { name: 'Ivory', hex: '#FFFEF9' },
  { name: 'Cream', hex: '#FFFDD0' },
  { name: 'Blush Pink', hex: '#F8C8DC' },
  { name: 'Dusty Rose', hex: '#DCAE96' },
  { name: 'Peach', hex: '#FFDAB9' },
  { name: 'Lavender', hex: '#E6E6FA' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Sage Green', hex: '#B2AC88' },
  { name: 'Mint', hex: '#98FF98' },
  { name: 'Powder Blue', hex: '#B0E0E6' },
  { name: 'Coral', hex: '#FF7F7F' },
  { name: 'Maroon', hex: '#5A0B22' },
  { name: 'Gold', hex: '#C8A548' },
  { name: 'Black', hex: '#1A1A1A' },
  { name: 'Navy', hex: '#1B2A4A' },
  { name: 'Wine', hex: '#722F37' },
  { name: 'Teal', hex: '#008080' },
  { name: 'Mustard', hex: '#C6973B' },
] as const;

// ── Sort Options ──
export const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-low-high' },
  { label: 'Price: High to Low', value: 'price-high-low' },
  { label: 'Popularity', value: 'popularity' },
  { label: 'Rating', value: 'rating' },
  { label: 'Name: A to Z', value: 'name-a-z' },
  { label: 'Name: Z to A', value: 'name-z-a' },
] as const;

// ── Categories ──
export const CATEGORIES = [
  {
    id: 'cat-womens-kurtas',
    name: "Women's Kurtas",
    slug: 'womens-kurtas',
    description:
      'Exquisite handcrafted Chikankari kurtas for women, blending timeless elegance with modern silhouettes.',
    image: 'https://picsum.photos/seed/cat-womens/600/800',
  },
  {
    id: 'cat-mens-kurtas',
    name: "Men's Kurtas",
    slug: 'mens-kurtas',
    description:
      'Refined Chikankari kurtas for men, featuring intricate hand-embroidery on the finest fabrics.',
    image: 'https://picsum.photos/seed/cat-mens/600/800',
  },
  {
    id: 'cat-anarkalis',
    name: 'Anarkalis',
    slug: 'anarkalis',
    description:
      'Flowing Anarkali suits adorned with delicate Chikankari work, perfect for celebrations.',
    image: 'https://picsum.photos/seed/cat-anarkali/600/800',
  },
  {
    id: 'cat-dupattas',
    name: 'Dupattas',
    slug: 'dupattas',
    description:
      'Lightweight dupattas featuring intricate Chikankari embroidery on fine muslin and chiffon.',
    image: 'https://picsum.photos/seed/cat-dupatta/600/800',
  },
  {
    id: 'cat-sarees',
    name: 'Sarees',
    slug: 'sarees',
    description:
      "Graceful Chikankari sarees that embody the rich heritage of Lucknow's artisanal craft.",
    image: 'https://picsum.photos/seed/cat-saree/600/800',
  },
  {
    id: 'cat-palazzo-sets',
    name: 'Palazzo Sets',
    slug: 'palazzo-sets',
    description:
      'Contemporary palazzo sets with traditional Chikankari detailing for effortless style.',
    image: 'https://picsum.photos/seed/cat-palazzo/600/800',
  },
  {
    id: 'cat-bridal',
    name: 'Bridal Collection',
    slug: 'bridal-collection',
    description:
      'Opulent bridal ensembles featuring kamdani, mukaish, and exquisite Chikankari on luxurious fabrics.',
    image: 'https://picsum.photos/seed/cat-bridal/600/800',
  },
  {
    id: 'cat-accessories',
    name: 'Accessories',
    slug: 'accessories',
    description:
      'Chikankari-embroidered stoles, clutches, and accessories to complete your ensemble.',
    image: 'https://picsum.photos/seed/cat-accessory/600/800',
  },
] as const;

// ── Social Links ──
export const SOCIAL_LINKS = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/eifacouture',
    icon: 'instagram',
  },
  {
    name: 'Facebook',
    href: 'https://facebook.com/eifacouture',
    icon: 'facebook',
  },
  {
    name: 'Pinterest',
    href: 'https://pinterest.com/eifacouture',
    icon: 'pinterest',
  },
  {
    name: 'YouTube',
    href: 'https://youtube.com/@eifacouture',
    icon: 'youtube',
  },
  {
    name: 'WhatsApp',
    href: 'https://wa.me/919876543210',
    icon: 'whatsapp',
  },
] as const;

// ── Contact Info ──
export const CONTACT_INFO = {
  email: 'hello@eifacouture.com',
  phone: '+91 98765 43210',
  whatsapp: '+91 98765 43210',
  address: {
    line1: 'Aminabad Market, Near Gol Darwaza',
    line2: 'Lucknow, Uttar Pradesh 226018',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226018',
    country: 'India',
  },
  workingHours: {
    weekdays: '10:00 AM – 8:00 PM',
    weekends: '10:00 AM – 6:00 PM',
    note: 'Closed on national holidays',
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
    'Free shipping on all orders above ₹2,999. Each piece is carefully hand-packed with love.',
} as const;

// ── Return Policy ──
export const RETURN_POLICY = {
  returnWindow: 7,
  exchangeWindow: 15,
  refundProcessingDays: { min: 5, max: 7 },
  conditions: [
    'Item must be unused and in original packaging with all tags intact.',
    'Returns are accepted within 7 days of delivery.',
    'Exchanges are accepted within 15 days of delivery.',
    'Customised, altered, or bridal pieces are not eligible for return.',
    'Sale items are final sale and cannot be returned or exchanged.',
    'Refunds will be processed to the original payment method.',
  ],
  message:
    "We want you to love your purchase. If something isn't right, we're here to help.",
} as const;