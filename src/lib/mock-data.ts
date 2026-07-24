/* ============================================
   EIFA COUTURE — Mock Data
   Realistic development data for all entities
   ============================================ */

import type {
  Product,
  ProductVariant,
  Category,
  Banner,
  Review,
  Testimonial,
  Order,
  Address,
} from "@/types";

// ── Helper to build stock records ──
function buildStock(
  sizes: string[],
  colors: { name: string }[],
  baseQty = 10
): Record<string, number> {
  const stock: Record<string, number> = {};

  for (const size of sizes) {
    for (const color of colors) {
      const stockKey = `${size}-${color.name}`;
      const stableOffset = Array.from(stockKey).reduce(
        (sum, character) => sum + character.charCodeAt(0),
        0
      ) % 15;

      stock[stockKey] = baseQty + stableOffset;
    }
  }

  return stock;
}


const CATEGORY_PLACEHOLDER_IMAGES: Record<string, string> = {
  "womens-kurtas": "/images/categories/kurtas.png",
  "mens-kurtas": "/images/categories/men-kurtas.png",
  anarkalis: "/images/categories/anarkali.png",
  dupattas: "/images/categories/dupattas.png",
  sarees: "/images/categories/sarees.png",
  "palazzo-sets": "/images/categories/palazzo.png",
  "bridal-collection": "/images/categories/bridal.png",
  accessories: "/images/categories/dupattas.png",
  "crochet-bags": "/images/categories/dupattas.png",
};

function getCategoryPlaceholderImage(categorySlug: string): string {
  return (
    CATEGORY_PLACEHOLDER_IMAGES[categorySlug] ??
    "/images/categories/kurtas.png"
  );
}

function buildProductImages(categorySlug: string): string[] {
  return [getCategoryPlaceholderImage(categorySlug)];
}

/* ============================================
   PRODUCTS
   ============================================ */

// This file is dev-only sample data (superseded by the live Supabase
// data layer in lib/data/products.ts) and predates per-variant pricing
// as well as the simple-product inventory fields, so none of these raw
// records carry `variants`/`minPrice`/`maxPrice`/`hasPriceRange`/
// `imagesByColor`, nor `sku`/`productType`/`stockQuantity`/
// `trackInventory`/`allowBackorders`. `withVariantPricing` derives all
// of these below with sane mock defaults, so this file still satisfies
// the current `Product` shape without every entry needing updating.
type RawMockProduct = Omit<
  Product,
  | "variants"
  | "minPrice"
  | "maxPrice"
  | "hasPriceRange"
  | "imagesByColor"
  | "sku"
  | "productType"
  | "stockQuantity"
  | "trackInventory"
  | "allowBackorders"
>;

function withVariantPricing(product: RawMockProduct): Product {
  const variants: ProductVariant[] = [];

  for (const size of product.sizes) {
    for (const color of product.colors) {
      const key = `${size}-${color.name}`;
      variants.push({
        id: `${product.id}-${key}`,
        size,
        colorName: color.name,
        price: product.price,
        stock: product.stock[key] ?? 0,
      });
    }
  }

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return {
    ...product,
    variants,
    minPrice: product.price,
    maxPrice: product.price,
    hasPriceRange: false,
    // Mock data predates per-color image uploads too — every mock
    // product falls back to its single `images` gallery, same as a
    // live product whose colors have no images of their own.
    imagesByColor: {},
    // Mock data also predates the simple-product inventory fields
    // (migration 0013); every mock product has sizes/colors, so model
    // it as a 'variant' product with per-variant stock already summed.
    sku: `${product.id.toUpperCase()}`,
    productType: "variant",
    stockQuantity: totalStock,
    trackInventory: true,
    allowBackorders: false,
  };
}

const RAW_MOCK_PRODUCTS: RawMockProduct[] = [
  {
    id: "prod-001",
    name: "Chanderi Silk Chikankari Kurta",
    slug: "chanderi-silk-chikankari-kurta",
    description:
      "A masterpiece of Lucknowi craftsmanship, this Chanderi silk kurta features intricate tepchi and phanda work hand-embroidered by our master karigars. The sheer elegance of Chanderi silk combined with the delicate artistry of Chikankari creates a garment that is both ethereal and timeless. Each stitch is a testament to the centuries-old tradition passed down through generations of artisans in the bylanes of Lucknow. Perfect for festive occasions, intimate celebrations, or whenever you wish to make a refined statement.",
    shortDescription:
      "Exquisite Chanderi silk kurta with handcrafted tepchi and phanda Chikankari embroidery.",
    price: 7999,
    compareAtPrice: 9999,
    images: buildProductImages("womens-kurtas"),
    category: "womens-kurtas",
    subcategory: "silk-kurtas",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Blush Pink", hex: "#F8C8DC" },
      { name: "Ivory", hex: "#FFFEF9" },
    ],
    stock: buildStock(
      ["XS", "S", "M", "L", "XL"],
      [{ name: "White" }, { name: "Blush Pink" }, { name: "Ivory" }]
    ),
    fabric: "Pure Chanderi Silk",
    care: [
      "Dry clean only",
      "Store in muslin cloth",
      "Iron on low heat with cloth between",
      "Avoid direct sunlight for storage",
    ],
    tags: ["chikankari", "chanderi", "silk", "festive", "handcrafted"],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    seo: {
      title: "Chanderi Silk Chikankari Kurta | Eifa Couture",
      description:
        "Shop handcrafted Chanderi silk Chikankari kurta with tepchi and phanda work. Premium Lucknowi embroidery.",
      keywords: ["chanderi silk kurta", "chikankari kurta", "lucknowi kurta"],
    },
    createdAt: "2025-01-15T10:00:00Z",
    updatedAt: "2025-06-20T14:30:00Z",
  },
  {
    id: "prod-002",
    name: "Lucknowi Chikankari Anarkali",
    slug: "lucknowi-chikankari-anarkali",
    description:
      "Embrace regal grace with this flowing Anarkali suit, adorned with all-over bakhiya and shadow work Chikankari. The 12-panel kali construction ensures a perfect flare that catches light and movement beautifully. Crafted on premium georgette, this piece comes with a matching Chikankari dupatta and cotton silk churidar. The neckline features intricate jali work — a hallmark of the finest Lucknowi artisanship.",
    shortDescription:
      "Regal Anarkali with all-over bakhiya and shadow work on premium georgette.",
    price: 12999,
    compareAtPrice: 15999,
    images: buildProductImages("anarkalis"),
    category: "anarkalis",
    subcategory: "georgette-anarkalis",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Dusty Rose", hex: "#DCAE96" },
      { name: "Lavender", hex: "#E6E6FA" },
      { name: "White", hex: "#FFFFFF" },
    ],
    stock: buildStock(
      ["S", "M", "L", "XL", "XXL"],
      [{ name: "Dusty Rose" }, { name: "Lavender" }, { name: "White" }]
    ),
    fabric: "Premium Georgette",
    care: [
      "Dry clean recommended",
      "Hand wash in cold water with mild detergent",
      "Do not wring or tumble dry",
      "Iron inside out on low heat",
    ],
    tags: ["anarkali", "chikankari", "georgette", "festive", "wedding"],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    seo: {
      title: "Lucknowi Chikankari Anarkali | Eifa Couture",
      description:
        "Regal Chikankari Anarkali suit with bakhiya and shadow work on premium georgette. Handcrafted in Lucknow.",
      keywords: ["chikankari anarkali", "lucknowi anarkali", "georgette anarkali"],
    },
    createdAt: "2025-03-10T10:00:00Z",
    updatedAt: "2025-06-18T09:15:00Z",
  },
  {
    id: "prod-003",
    name: "Heritage Muslin Cotton Kurta Set",
    slug: "heritage-muslin-cotton-kurta-set",
    description:
      "A tribute to the fabled Dhaka muslin, this kurta set features ultra-fine cotton with delicate murri and phanda Chikankari across the yoke, sleeves, and border. The breathable fabric makes it ideal for warm Indian summers while the intricate embroidery adds an understated luxury. Comes with matching palazzo pants featuring Chikankari detailing at the hem.",
    shortDescription:
      "Ultra-fine muslin cotton kurta set with murri and phanda Chikankari detailing.",
    price: 5999,
    compareAtPrice: 7499,
    images: buildProductImages("palazzo-sets"),
    category: "palazzo-sets",
    subcategory: "cotton-sets",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Peach", hex: "#FFDAB9" },
    ],
    stock: buildStock(
      ["S", "M", "L", "XL"],
      [{ name: "White" }, { name: "Peach" }]
    ),
    fabric: "Premium Muslin Cotton",
    care: [
      "Hand wash in cold water",
      "Use mild detergent",
      "Dry in shade",
      "Iron on medium heat",
    ],
    tags: ["muslin", "cotton", "palazzo set", "summer", "everyday luxury"],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    seo: {
      title: "Heritage Muslin Cotton Kurta Set | Eifa Couture",
      description:
        "Premium muslin cotton kurta set with murri and phanda Chikankari. Handcrafted for everyday luxury.",
      keywords: ["muslin kurta set", "cotton chikankari", "palazzo set"],
    },
    createdAt: "2024-11-01T10:00:00Z",
    updatedAt: "2025-06-15T11:00:00Z",
  },
  {
    id: "prod-004",
    name: "Kamdani Bridal Lehenga Set",
    slug: "kamdani-bridal-lehenga-set",
    description:
      "Our pièce de résistance — a bridal lehenga set that weaves together the finest traditions of Lucknowi craftsmanship. Featuring over 200 hours of hand-embroidery combining kamdani (metallic embellishment), mukaish (badla work), and intricate Chikankari on pure georgette. The lehenga features a 6-meter flare with scalloped border, paired with an embroidered blouse and a heavily worked dupatta with four-sided border detailing.",
    shortDescription:
      "Opulent bridal lehenga with kamdani, mukaish, and Chikankari — over 200 hours of hand-embroidery.",
    price: 25999,
    compareAtPrice: null,
    images: buildProductImages("bridal-collection"),
    category: "bridal-collection",
    subcategory: "lehenga-sets",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Ivory", hex: "#FFFEF9" },
      { name: "Blush Pink", hex: "#F8C8DC" },
    ],
    stock: buildStock(
      ["S", "M", "L", "XL"],
      [{ name: "Ivory" }, { name: "Blush Pink" }],
      3
    ),
    fabric: "Pure Georgette with Silk Lining",
    care: [
      "Professional dry clean only",
      "Store flat in breathable garment bag",
      "Handle with care — delicate metallic work",
      "Avoid contact with perfume or moisture",
    ],
    tags: ["bridal", "lehenga", "kamdani", "mukaish", "luxury", "wedding"],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    seo: {
      title: "Kamdani Bridal Lehenga Set | Eifa Couture",
      description:
        "Opulent bridal lehenga with kamdani, mukaish, and Chikankari on pure georgette. Handcrafted luxury for your special day.",
      keywords: ["bridal lehenga", "kamdani lehenga", "chikankari bridal"],
    },
    createdAt: "2025-04-01T10:00:00Z",
    updatedAt: "2025-06-22T16:00:00Z",
  },
  {
    id: "prod-005",
    name: "Sheer Organza Chikankari Dupatta",
    slug: "sheer-organza-chikankari-dupatta",
    description:
      "A whisper-light organza dupatta that is a canvas for exquisite Chikankari artistry. Featuring intricate jali work (lattice pattern) across the body and dense phanda-murri border work, this dupatta transforms any simple outfit into an elegant ensemble. The sheer organza catches light beautifully, making the white-on-white embroidery shimmer with subtle sophistication.",
    shortDescription:
      "Whisper-light organza dupatta with jali work and phanda-murri border Chikankari.",
    price: 3999,
    compareAtPrice: 4999,
    images: buildProductImages("dupattas"),
    category: "dupattas",
    subcategory: "organza-dupattas",
    sizes: ["Free Size"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Cream", hex: "#FFFDD0" },
      { name: "Sky Blue", hex: "#87CEEB" },
    ],
    stock: buildStock(
      ["Free Size"],
      [{ name: "White" }, { name: "Cream" }, { name: "Sky Blue" }],
      20
    ),
    fabric: "Pure Organza",
    care: [
      "Dry clean only",
      "Store rolled, not folded",
      "Iron on lowest setting with pressing cloth",
    ],
    tags: ["dupatta", "organza", "chikankari", "sheer", "accessory"],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    seo: {
      title: "Sheer Organza Chikankari Dupatta | Eifa Couture",
      description:
        "Exquisite organza dupatta with jali work and phanda-murri Chikankari embroidery. Handcrafted in Lucknow.",
      keywords: ["chikankari dupatta", "organza dupatta", "lucknowi dupatta"],
    },
    createdAt: "2024-09-20T10:00:00Z",
    updatedAt: "2025-06-10T13:00:00Z",
  },
  {
    id: "prod-006",
    name: "Classic Men's Chikankari Kurta",
    slug: "classic-mens-chikankari-kurta",
    description:
      "The quintessential gentleman's kurta, featuring refined shadow work and tepchi Chikankari on premium cotton lawn. The mandarin collar and front placket showcase dense embroidery while the body maintains an elegant restraint. Perfectly tailored with side slits and a comfortable A-line cut that drapes impeccably. A wardrobe essential for the discerning modern man.",
    shortDescription:
      "Refined men's kurta with shadow work and tepchi Chikankari on premium cotton lawn.",
    price: 4999,
    compareAtPrice: 5999,
    images: buildProductImages("mens-kurtas"),
    category: "mens-kurtas",
    subcategory: "cotton-kurtas",
    sizes: ["S", "M", "L", "XL", "XXL", "3XL"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Off White", hex: "#FAF0E6" },
      { name: "Sky Blue", hex: "#87CEEB" },
    ],
    stock: buildStock(
      ["S", "M", "L", "XL", "XXL", "3XL"],
      [{ name: "White" }, { name: "Off White" }, { name: "Sky Blue" }]
    ),
    fabric: "Premium Cotton Lawn",
    care: [
      "Machine wash on gentle cycle",
      "Use mild detergent",
      "Dry in shade",
      "Iron on medium heat",
    ],
    tags: ["mens", "kurta", "chikankari", "cotton", "classic"],
    isFeatured: true,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    seo: {
      title: "Classic Men's Chikankari Kurta | Eifa Couture",
      description:
        "Premium men's cotton kurta with shadow work and tepchi Chikankari. Handcrafted elegance for the modern man.",
      keywords: ["mens chikankari kurta", "cotton kurta men", "lucknowi kurta men"],
    },
    createdAt: "2024-08-05T10:00:00Z",
    updatedAt: "2025-06-19T10:00:00Z",
  },
  {
    id: "prod-007",
    name: "Georgette Chikankari Saree",
    slug: "georgette-chikankari-saree",
    description:
      "Six yards of pure elegance — this georgette saree is adorned with exquisite all-over Chikankari featuring bakhiya, tepchi, and hool work. The pallu showcases dense embroidery with intricate floral motifs inspired by Mughal garden designs. Comes with an unstitched blouse piece featuring complementary Chikankari work. A saree that tells the story of Lucknow's 400-year-old embroidery tradition.",
    shortDescription:
      "All-over Chikankari georgette saree with Mughal-inspired floral motifs on pallu.",
    price: 15999,
    compareAtPrice: 18999,
    images: buildProductImages("sarees"),
    category: "sarees",
    subcategory: "georgette-sarees",
    sizes: ["Free Size"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Peach", hex: "#FFDAB9" },
      { name: "Lavender", hex: "#E6E6FA" },
    ],
    stock: buildStock(
      ["Free Size"],
      [{ name: "White" }, { name: "Peach" }, { name: "Lavender" }],
      8
    ),
    fabric: "Pure Georgette",
    care: [
      "Dry clean only",
      "Store on padded hanger or rolled",
      "Avoid spraying perfume directly on fabric",
    ],
    tags: ["saree", "georgette", "chikankari", "festive", "mughal"],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    seo: {
      title: "Georgette Chikankari Saree | Eifa Couture",
      description:
        "Exquisite all-over Chikankari georgette saree with Mughal-inspired floral motifs. Handcrafted luxury.",
      keywords: ["chikankari saree", "georgette saree", "lucknowi saree"],
    },
    createdAt: "2025-02-14T10:00:00Z",
    updatedAt: "2025-06-21T12:00:00Z",
  },
  {
    id: "prod-008",
    name: "Pastel Palazzo Chikankari Set",
    slug: "pastel-palazzo-chikankari-set",
    description:
      "Contemporary meets tradition in this stylish palazzo set. The A-line kurta features delicate tepchi and keel kangan Chikankari along the neckline, sleeves, and hem, paired with wide-leg palazzo pants with matching border work. Crafted on butter-soft modal cotton that feels like a dream against the skin. The relaxed silhouette and breathable fabric make it perfect for brunches, travel, and everyday elegance.",
    shortDescription:
      "Stylish modal cotton palazzo set with tepchi and keel kangan Chikankari detailing.",
    price: 6499,
    compareAtPrice: 7999,
    images: buildProductImages("palazzo-sets"),
    category: "palazzo-sets",
    subcategory: "modal-sets",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Sage Green", hex: "#B2AC88" },
      { name: "Powder Blue", hex: "#B0E0E6" },
      { name: "Peach", hex: "#FFDAB9" },
    ],
    stock: buildStock(
      ["S", "M", "L", "XL"],
      [{ name: "Sage Green" }, { name: "Powder Blue" }, { name: "Peach" }]
    ),
    fabric: "Premium Modal Cotton",
    care: [
      "Hand wash or machine wash on gentle cycle",
      "Use mild detergent",
      "Dry in shade",
      "Iron on low heat",
    ],
    tags: ["palazzo set", "modal", "pastel", "casual", "everyday"],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: false,
    isActive: true,
    seo: {
      title: "Pastel Palazzo Chikankari Set | Eifa Couture",
      description:
        "Stylish modal cotton palazzo set with tepchi and keel kangan Chikankari. Everyday luxury handcrafted in Lucknow.",
      keywords: ["palazzo set", "chikankari palazzo", "modal cotton kurta"],
    },
    createdAt: "2025-01-20T10:00:00Z",
    updatedAt: "2025-06-17T14:00:00Z",
  },
  {
    id: "prod-009",
    name: "Mukaish Embellished Sharara Set",
    slug: "mukaish-embellished-sharara-set",
    description:
      "Sparkle with understated luxury in this stunning sharara set featuring mukaish (badla) work alongside traditional Chikankari. The short kurta is densely embroidered with hool, bakhiya, and metallic mukaish that catches light with every movement. The sharara pants feature cascading Chikankari panels. Paired with a net dupatta with mukaish border. Ideal for weddings, sangeet, and celebrations.",
    shortDescription:
      "Stunning sharara set with mukaish embellishment and dense Chikankari on georgette.",
    price: 18999,
    compareAtPrice: 22999,
    images: buildProductImages("bridal-collection"),
    category: "bridal-collection",
    subcategory: "sharara-sets",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Ivory", hex: "#FFFEF9" },
      { name: "Dusty Rose", hex: "#DCAE96" },
    ],
    stock: buildStock(
      ["S", "M", "L", "XL"],
      [{ name: "Ivory" }, { name: "Dusty Rose" }],
      5
    ),
    fabric: "Faux Georgette with Mukaish",
    care: [
      "Professional dry clean only",
      "Store in breathable garment cover",
      "Handle metallic work gently",
      "Do not iron directly on embroidery",
    ],
    tags: ["sharara", "mukaish", "bridal", "celebration", "metallic"],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    seo: {
      title: "Mukaish Embellished Sharara Set | Eifa Couture",
      description:
        "Stunning sharara set with mukaish and Chikankari on georgette. Perfect for weddings and celebrations.",
      keywords: ["mukaish sharara", "chikankari sharara", "bridal sharara"],
    },
    createdAt: "2025-05-01T10:00:00Z",
    updatedAt: "2025-06-22T10:00:00Z",
  },
  {
    id: "prod-010",
    name: "Chikankari Embroidered Stole",
    slug: "chikankari-embroidered-stole",
    description:
      "An accessory that speaks volumes — this fine wool-silk blend stole features exquisite Chikankari embroidery across the body with dense border work. Versatile enough to drape over a western outfit, pair with a saree, or wrap around on a cool evening. The generous dimensions (2.5 meters × 0.7 meters) offer multiple styling possibilities.",
    shortDescription:
      "Fine wool-silk blend stole with exquisite all-over Chikankari and dense border work.",
    price: 4499,
    compareAtPrice: 5499,
    images: buildProductImages("accessories"),
    category: "accessories",
    subcategory: "stoles",
    sizes: ["Free Size"],
    colors: [
      { name: "Cream", hex: "#FFFDD0" },
      { name: "Blush Pink", hex: "#F8C8DC" },
      { name: "White", hex: "#FFFFFF" },
    ],
    stock: buildStock(
      ["Free Size"],
      [{ name: "Cream" }, { name: "Blush Pink" }, { name: "White" }],
      15
    ),
    fabric: "Wool-Silk Blend",
    care: [
      "Dry clean only",
      "Store folded in muslin",
      "Keep away from moths — use cedar blocks",
    ],
    tags: ["stole", "accessory", "chikankari", "wool-silk", "versatile"],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    seo: {
      title: "Chikankari Embroidered Stole | Eifa Couture",
      description:
        "Fine wool-silk blend stole with exquisite Chikankari embroidery. A versatile luxury accessory.",
      keywords: ["chikankari stole", "embroidered stole", "wool silk stole"],
    },
    createdAt: "2025-04-15T10:00:00Z",
    updatedAt: "2025-06-20T10:00:00Z",
  },
  {
    id: "prod-011",
    name: "Shadow Work A-Line Kurta",
    slug: "shadow-work-a-line-kurta",
    description:
      "Understated elegance at its finest — this A-line kurta features exquisite shadow work (ulta bakhiya) that creates a beautiful play of light and shadow on the fabric. The all-over floral motifs are visible from both sides of the fabric, a technique that requires exceptional skill. Crafted on premium cotton voile for breathability and drape, this kurta is the epitome of quiet luxury.",
    shortDescription:
      "Elegant A-line kurta with all-over shadow work on premium cotton voile.",
    price: 5499,
    compareAtPrice: 6999,
    images: buildProductImages("womens-kurtas"),
    category: "womens-kurtas",
    subcategory: "cotton-kurtas",
    sizes: ["XS", "S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Mint", hex: "#98FF98" },
      { name: "Coral", hex: "#FF7F7F" },
    ],
    stock: buildStock(
      ["XS", "S", "M", "L", "XL", "XXL"],
      [{ name: "White" }, { name: "Mint" }, { name: "Coral" }]
    ),
    fabric: "Premium Cotton Voile",
    care: [
      "Hand wash in cold water",
      "Use mild detergent",
      "Dry in shade",
      "Steam iron recommended",
    ],
    tags: ["shadow work", "a-line", "cotton", "everyday", "elegant"],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isActive: true,
    seo: {
      title: "Shadow Work A-Line Kurta | Eifa Couture",
      description:
        "Elegant A-line kurta with all-over shadow work on premium cotton voile. Quiet luxury, handcrafted.",
      keywords: ["shadow work kurta", "a-line kurta", "cotton voile kurta"],
    },
    createdAt: "2024-12-01T10:00:00Z",
    updatedAt: "2025-06-14T11:00:00Z",
  },
  {
    id: "prod-012",
    name: "Men's Silk Pathani Kurta Set",
    slug: "mens-silk-pathani-kurta-set",
    description:
      "Command attention with this regal Pathani kurta set in pure silk, featuring refined Chikankari along the placket, collar, and pocket detailing. The structured silhouette with subtle side pleats offers a contemporary take on the classic Pathani cut. Paired with matching silk trousers. Ideal for weddings, Eid celebrations, and formal occasions where distinguished style is called for.",
    shortDescription:
      "Regal pure silk Pathani kurta set with refined Chikankari detailing.",
    price: 9999,
    compareAtPrice: 12999,
    images: buildProductImages("mens-kurtas"),
    category: "mens-kurtas",
    subcategory: "silk-kurtas",
    sizes: ["M", "L", "XL", "XXL", "3XL"],
    colors: [
      { name: "Off White", hex: "#FAF0E6" },
      { name: "Gold", hex: "#C8A548" },
      { name: "Navy", hex: "#1B2A4A" },
    ],
    stock: buildStock(
      ["M", "L", "XL", "XXL", "3XL"],
      [{ name: "Off White" }, { name: "Gold" }, { name: "Navy" }],
      7
    ),
    fabric: "Pure Silk",
    care: [
      "Dry clean only",
      "Store on padded hanger",
      "Iron on silk setting with pressing cloth",
      "Avoid water spots",
    ],
    tags: ["mens", "pathani", "silk", "formal", "wedding", "eid"],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    seo: {
      title: "Men's Silk Pathani Kurta Set | Eifa Couture",
      description:
        "Regal pure silk Pathani kurta set with refined Chikankari detailing. Handcrafted for distinguished style.",
      keywords: ["pathani kurta", "silk kurta men", "chikankari mens formal"],
    },
    createdAt: "2025-05-20T10:00:00Z",
    updatedAt: "2025-06-23T09:00:00Z",
  },
  {
    id: "prod-013",
    name: "Jali Work Cotton Kurta",
    slug: "jali-work-cotton-kurta",
    description:
      "A celebration of the most intricate form of Chikankari — the jali stitch. This cotton kurta features delicate lattice-pattern jali work across the yoke that is so fine, it appears almost like lace. Combined with tepchi and pashni stitches across the body, this piece represents the pinnacle of Lucknowi craftsmanship. The pure cotton fabric ensures comfort through the Indian summer.",
    shortDescription:
      "Finest jali work cotton kurta — lattice-pattern embroidery that rivals handmade lace.",
    price: 8499,
    compareAtPrice: 9999,
    images: buildProductImages("womens-kurtas"),
    category: "womens-kurtas",
    subcategory: "cotton-kurtas",
    sizes: ["XS", "S", "M", "L", "XL"],
    colors: [
      { name: "White", hex: "#FFFFFF" },
      { name: "Off White", hex: "#FAF0E6" },
    ],
    stock: buildStock(
      ["XS", "S", "M", "L", "XL"],
      [{ name: "White" }, { name: "Off White" }],
      6
    ),
    fabric: "Handwoven Cotton",
    care: [
      "Hand wash only",
      "Do not bleach",
      "Dry flat in shade",
      "Iron inside out on cotton setting",
    ],
    tags: ["jali", "cotton", "artisan", "premium", "intricate"],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: false,
    isActive: true,
    seo: {
      title: "Jali Work Cotton Kurta | Eifa Couture",
      description:
        "Exquisite jali work cotton kurta with lattice-pattern Chikankari. The finest handcrafted embroidery from Lucknow.",
      keywords: ["jali work kurta", "chikankari jali", "handwoven cotton kurta"],
    },
    createdAt: "2024-10-15T10:00:00Z",
    updatedAt: "2025-06-12T15:00:00Z",
  },

  {
    id: "prod-014",
    name: "Ivory Crochet Silk Potli Bag",
    slug: "ivory-crochet-silk-potli-bag",
    description:
      "A refined crochet silk potli bag crafted for festive styling, weddings, and elegant evening looks. The soft silk finish and handcrafted crochet texture make it a graceful accessory for Chikankari kurtas, sarees, and celebration wear.",
    shortDescription:
      "Handcrafted ivory crochet silk potli bag for festive and ethnic styling.",
    price: 2499,
    compareAtPrice: 2999,
    images: buildProductImages("crochet-bags"),
    category: "crochet-bags",
    subcategory: "potli-bags",
    sizes: ["Free Size"],
    colors: [
      { name: "Ivory", hex: "#FFFEF9" },
      { name: "Cream", hex: "#FFFDD0" },
    ],
    stock: buildStock(
      ["Free Size"],
      [{ name: "Ivory" }, { name: "Cream" }],
      12
    ),
    fabric: "Silk Crochet",
    care: [
      "Spot clean only",
      "Store in dust bag",
      "Avoid overloading the bag",
      "Keep away from moisture and sharp objects",
    ],
    tags: ["crochet bag", "silk bag", "potli", "accessory", "festive"],
    isFeatured: true,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    seo: {
      title: "Ivory Crochet Silk Potli Bag | Eifa Couture",
      description:
        "Shop handcrafted ivory crochet silk potli bag by Eifa Couture. A premium festive accessory for ethnic wear.",
      keywords: ["crochet silk bag", "potli bag", "festive bag"],
    },
    createdAt: "2025-06-24T10:00:00Z",
    updatedAt: "2025-06-24T10:00:00Z",
  },
  {
    id: "prod-015",
    name: "Maroon Crochet Silk Sling Bag",
    slug: "maroon-crochet-silk-sling-bag",
    description:
      "A statement crochet silk sling bag in a rich maroon tone, designed to pair beautifully with festive kurtas, sarees, and evening ethnic looks. Lightweight yet elegant, it adds a handcrafted finishing touch to your ensemble.",
    shortDescription:
      "Elegant maroon crochet silk sling bag for festive and occasion wear.",
    price: 2799,
    compareAtPrice: 3499,
    images: buildProductImages("crochet-bags"),
    category: "crochet-bags",
    subcategory: "sling-bags",
    sizes: ["Free Size"],
    colors: [
      { name: "Maroon", hex: "#6F1D1B" },
      { name: "Gold", hex: "#C8A548" },
    ],
    stock: buildStock(
      ["Free Size"],
      [{ name: "Maroon" }, { name: "Gold" }],
      10
    ),
    fabric: "Silk Crochet",
    care: [
      "Spot clean only",
      "Do not machine wash",
      "Store separately to protect crochet texture",
      "Avoid heavy items inside the bag",
    ],
    tags: ["crochet bag", "silk sling", "maroon bag", "accessory", "festive"],
    isFeatured: false,
    isBestSeller: true,
    isNewArrival: true,
    isActive: true,
    seo: {
      title: "Maroon Crochet Silk Sling Bag | Eifa Couture",
      description:
        "Premium maroon crochet silk sling bag for festive ethnic styling. Handcrafted accessory by Eifa Couture.",
      keywords: ["crochet sling bag", "silk bag", "maroon ethnic bag"],
    },
    createdAt: "2025-06-24T10:00:00Z",
    updatedAt: "2025-06-24T10:00:00Z",
  },
  {
    id: "prod-016",
    name: "Gold Crochet Silk Clutch",
    slug: "gold-crochet-silk-clutch",
    description:
      "A compact crochet silk clutch with a festive gold finish, perfect for weddings, celebrations, and refined evening wear. Designed to complement Chikankari outfits with a handcrafted luxury touch.",
    shortDescription:
      "Festive gold crochet silk clutch for weddings and celebration wear.",
    price: 3199,
    compareAtPrice: 3999,
    images: buildProductImages("crochet-bags"),
    category: "crochet-bags",
    subcategory: "clutches",
    sizes: ["Free Size"],
    colors: [
      { name: "Gold", hex: "#C8A548" },
      { name: "Ivory", hex: "#FFFEF9" },
    ],
    stock: buildStock(
      ["Free Size"],
      [{ name: "Gold" }, { name: "Ivory" }],
      8
    ),
    fabric: "Silk Crochet",
    care: [
      "Spot clean gently",
      "Store in dust bag",
      "Avoid perfume or moisture contact",
      "Keep away from sharp jewellery edges",
    ],
    tags: ["crochet clutch", "silk bag", "gold bag", "wedding", "accessory"],
    isFeatured: false,
    isBestSeller: false,
    isNewArrival: true,
    isActive: true,
    seo: {
      title: "Gold Crochet Silk Clutch | Eifa Couture",
      description:
        "Handcrafted gold crochet silk clutch for festive and wedding looks. Premium accessory by Eifa Couture.",
      keywords: ["gold clutch", "crochet silk clutch", "wedding bag"],
    },
    createdAt: "2025-06-24T10:00:00Z",
    updatedAt: "2025-06-24T10:00:00Z",
  },
];

export const MOCK_PRODUCTS: Product[] = RAW_MOCK_PRODUCTS.map(withVariantPricing);

/* ============================================
   ORDERS
   ============================================ */

const DEMO_SHIPPING_ADDRESS: Address = {
  id: "addr-demo-001",
  fullName: "Aisha Khan",
  phone: "+91 98765 43210",
  addressLine1: "14/2 Hazratganj Road",
  addressLine2: "Near GPO Park",
  city: "Lucknow",
  state: "Uttar Pradesh",
  pincode: "226001",
  isDefault: true,
  type: "home",
};

export const MOCK_ORDERS: Order[] = [
  {
    id: "EIFA-10245",
    userId: "user-demo-001",
    items: [
      {
        productId: "prod-010",
        name: "Chikankari Embroidered Stole",
        image: "/images/categories/dupattas.png",
        size: "Free Size",
        color: "Cream",
        quantity: 1,
        price: 4499,
      },
      {
        productId: "prod-003",
        name: "Heritage Muslin Cotton Kurta Set",
        image: "/images/categories/palazzo.png",
        size: "S",
        color: "White",
        quantity: 1,
        price: 5999,
      },
    ],
    subtotal: 10498,
    discount: 0,
    shipping: 0,
    total: 10498,
    coupon: null,
    status: "confirmed",
    paymentStatus: "paid",
    paymentId: "pay_R7k29QsLmN4Pxa",
    razorpayOrderId: "order_R7k28MnLpQ3Yzb",
    shippingAddress: DEMO_SHIPPING_ADDRESS,
    trackingNumber: null,
    invoiceUrl: null,
    createdAt: "2026-06-29T11:20:00Z",
    updatedAt: "2026-06-29T11:20:00Z",
  },
  {
    id: "EIFA-10241",
    userId: "user-demo-001",
    items: [
      {
        productId: "prod-001",
        name: "Chanderi Silk Chikankari Kurta",
        image: "/images/categories/kurtas.png",
        size: "M",
        color: "White",
        quantity: 1,
        price: 7999,
      },
      {
        productId: "prod-005",
        name: "Sheer Organza Chikankari Dupatta",
        image: "/images/categories/dupattas.png",
        size: "Free Size",
        color: "Cream",
        quantity: 1,
        price: 3999,
      },
    ],
    subtotal: 11998,
    discount: 0,
    shipping: 0,
    total: 11998,
    coupon: null,
    status: "delivered",
    paymentStatus: "paid",
    paymentId: "pay_Q9d17XrTkV2Mha",
    razorpayOrderId: "order_Q9d16WqSjU1Lgz",
    shippingAddress: DEMO_SHIPPING_ADDRESS,
    trackingNumber: "SR458219034IN",
    invoiceUrl: null,
    createdAt: "2026-06-18T09:15:00Z",
    updatedAt: "2026-06-21T14:40:00Z",
  },
  {
    id: "EIFA-10238",
    userId: "user-demo-001",
    items: [
      {
        productId: "prod-002",
        name: "Lucknowi Chikankari Anarkali",
        image: "/images/categories/anarkali.png",
        size: "L",
        color: "Dusty Rose",
        quantity: 1,
        price: 12999,
      },
    ],
    subtotal: 12999,
    discount: 1000,
    shipping: 0,
    total: 11999,
    coupon: "EIFA10",
    status: "out_for_delivery",
    paymentStatus: "paid",
    paymentId: "pay_P8c06WqSiT0Kfy",
    razorpayOrderId: "order_P8c05VpRhS9Jex",
    shippingAddress: DEMO_SHIPPING_ADDRESS,
    trackingNumber: "SR458219099IN",
    invoiceUrl: null,
    createdAt: "2026-06-22T16:05:00Z",
    updatedAt: "2026-06-30T08:30:00Z",
  },
  {
    id: "EIFA-10233",
    userId: "user-demo-001",
    items: [
      {
        productId: "prod-006",
        name: "Classic Men's Chikankari Kurta",
        image: "/images/categories/men-kurtas.png",
        size: "L",
        color: "White",
        quantity: 2,
        price: 4999,
      },
    ],
    subtotal: 9998,
    discount: 0,
    shipping: 99,
    total: 10097,
    coupon: null,
    status: "processing",
    paymentStatus: "paid",
    paymentId: "pay_O7b95VpRgR8Idw",
    razorpayOrderId: "order_O7b94UoQfQ7Hdv",
    shippingAddress: DEMO_SHIPPING_ADDRESS,
    trackingNumber: null,
    invoiceUrl: null,
    createdAt: "2026-06-25T13:50:00Z",
    updatedAt: "2026-06-26T10:10:00Z",
  },
  {
    id: "EIFA-10229",
    userId: "user-demo-001",
    items: [
      {
        productId: "prod-008",
        name: "Pastel Palazzo Chikankari Set",
        image: "/images/categories/palazzo.png",
        size: "M",
        color: "Sage Green",
        quantity: 1,
        price: 6499,
      },
    ],
    subtotal: 6499,
    discount: 0,
    shipping: 0,
    total: 6499,
    coupon: null,
    status: "cancelled",
    paymentStatus: "refunded",
    paymentId: "pay_N6a84UoQeP6Gcu",
    razorpayOrderId: "order_N6a83TnPdO5Fbt",
    shippingAddress: DEMO_SHIPPING_ADDRESS,
    trackingNumber: null,
    invoiceUrl: null,
    createdAt: "2026-06-10T18:25:00Z",
    updatedAt: "2026-06-12T09:00:00Z",
  },
];

/* ============================================
   CATEGORIES
   ============================================ */

export const MOCK_CATEGORIES: Category[] = [
  {
    id: "cat-womens-kurtas",
    name: "Women's Kurtas",
    slug: "womens-kurtas",
    description:
      "Exquisite handcrafted Chikankari kurtas for women, blending timeless elegance with modern silhouettes.",
    image: "/images/categories/kurtas.png",
    parentId: null,
    isActive: true,
    order: 1,
  },
  {
    id: "cat-mens-kurtas",
    name: "Men's Kurtas",
    slug: "mens-kurtas",
    description:
      "Refined Chikankari kurtas for men, featuring intricate hand-embroidery on the finest fabrics.",
    image: "/images/categories/men-kurtas.png",
    parentId: null,
    isActive: true,
    order: 2,
  },
  {
    id: "cat-anarkalis",
    name: "Anarkalis",
    slug: "anarkalis",
    description:
      "Flowing Anarkali suits adorned with delicate Chikankari work, perfect for celebrations.",
    image: "/images/categories/anarkali.png",
    parentId: null,
    isActive: true,
    order: 3,
  },
  {
    id: "cat-dupattas",
    name: "Dupattas",
    slug: "dupattas",
    description:
      "Lightweight dupattas featuring intricate Chikankari embroidery on fine muslin and chiffon.",
    image: "/images/categories/dupattas.png",
    parentId: null,
    isActive: true,
    order: 4,
  },
  {
    id: "cat-sarees",
    name: "Sarees",
    slug: "sarees",
    description:
      "Graceful Chikankari sarees that embody the rich heritage of Lucknow's artisanal craft.",
    image: "/images/categories/sarees.png",
    parentId: null,
    isActive: true,
    order: 5,
  },
  {
    id: "cat-palazzo-sets",
    name: "Palazzo Sets",
    slug: "palazzo-sets",
    description:
      "Contemporary palazzo sets with traditional Chikankari detailing for effortless style.",
    image: "/images/categories/palazzo.png",
    parentId: null,
    isActive: true,
    order: 6,
  },
  {
    id: "cat-bridal",
    name: "Bridal Collection",
    slug: "bridal-collection",
    description:
      "Opulent bridal ensembles featuring kamdani, mukaish, and exquisite Chikankari on luxurious fabrics.",
    image: "/images/categories/bridal.png",
    parentId: null,
    isActive: true,
    order: 7,
  },
  {
    id: "cat-accessories",
    name: "Accessories",
    slug: "accessories",
    description:
      "Chikankari-embroidered stoles, clutches, and accessories to complete your ensemble.",
    image: "/images/categories/dupattas.png",
    parentId: null,
    isActive: true,
    order: 8,
  },

  {
    id: "cat-crochet-bags",
    name: "Crochet Silk Bags",
    slug: "crochet-bags",
    description:
      "Handcrafted crochet silk bags designed to complete festive, ethnic, and occasion wear looks.",
    image: "/images/categories/dupattas.png",
    parentId: null,
    isActive: true,
    order: 9,
  },
];

/* ============================================
   BANNERS
   ============================================ */

export const MOCK_BANNERS: Banner[] = [
  {
    id: "banner-001",
    title: "The Art of Chikankari",
    subtitle:
      "Handcrafted luxury from the heart of Lucknow — discover our new collection",
    image: "/images/hero/hero-1.png",
    link: "/shop",
    isActive: true,
    order: 1,
  },
  {
    id: "banner-002",
    title: "Bridal Season 2025",
    subtitle:
      "Make your special day unforgettable with our opulent bridal collection",
    image: "/images/categories/bridal.png",
    link: "/shop?category=bridal-collection",
    isActive: true,
    order: 2,
  },
  {
    id: "banner-003",
    title: "New Arrivals",
    subtitle: "Fresh designs inspired by Mughal gardens and Lucknowi heritage",
    image: "/images/categories/kurtas.png",
    link: "/shop?collection=new-arrivals",
    isActive: true,
    order: 3,
  },
  {
    id: "banner-004",
    title: "The Men's Edit",
    subtitle:
      "Distinguished kurtas for the modern gentleman — silk, cotton, and linen",
    image: "/images/categories/men-kurtas.png",
    link: "/shop?category=mens-kurtas",
    isActive: true,
    order: 4,
  },
  {
    id: "banner-005",
    title: "Summer Essentials",
    subtitle:
      "Breathable cottons and sheers with delicate Chikankari — perfect for warm days",
    image: "/images/categories/dupattas.png",
    link: "/shop?season=summer",
    isActive: true,
    order: 5,
  },
  {
    id: "banner-006",
    title: "Artisan Heritage",
    subtitle:
      "Meet the master karigars whose hands weave magic into every thread",
    image: "/images/hero/hero-1.png",
    link: "/about#artisans",
    isActive: true,
    order: 6,
  },
];

/* ============================================
   REVIEWS
   ============================================ */

export const MOCK_REVIEWS: Review[] = [
  {
    id: "review-001",
    userId: "user-101",
    productId: "prod-001",
    rating: 5,
    title: "Absolutely Stunning Craftsmanship",
    comment:
      "The Chanderi silk kurta is beyond beautiful. The embroidery is so intricate and fine — you can tell it's genuinely handcrafted. I wore it to a family wedding and received endless compliments. The fabric feels luxurious and the fit is perfect. Worth every rupee.",
    images: [
      "/images/categories/kurtas.png",
      "/images/categories/kurtas.png",
    ],
    isVerified: true,
    createdAt: "2025-05-10T14:30:00Z",
  },
  {
    id: "review-002",
    userId: "user-102",
    productId: "prod-006",
    rating: 5,
    title: "Best Kurta I've Ever Owned",
    comment:
      "As someone who appreciates fine clothing, this men's Chikankari kurta exceeded my expectations. The shadow work is exquisite and the cotton is incredibly comfortable even in Lucknow's summer heat. The packaging was beautiful too — felt like unwrapping a gift. Will definitely order more.",
    images: [],
    isVerified: true,
    createdAt: "2025-04-22T09:15:00Z",
  },
  {
    id: "review-003",
    userId: "user-103",
    productId: "prod-002",
    rating: 4,
    title: "Beautiful Anarkali, Minor Size Issue",
    comment:
      "The Anarkali is gorgeous — the flare is perfect and the embroidery is stunning. I would have given 5 stars but the bust area runs slightly small, so I'd recommend ordering one size up. The dupatta alone is worth the price! Customer service was helpful when I reached out about sizing.",
    images: ["/images/categories/anarkali.png"],
    isVerified: true,
    createdAt: "2025-06-01T16:45:00Z",
  },
  {
    id: "review-004",
    userId: "user-104",
    productId: "prod-005",
    rating: 5,
    title: "Exquisite Dupatta — Elevates Everything",
    comment:
      "This organza dupatta is sheer perfection (pun intended!). I've worn it with a plain kurta, a saree, and even draped over a western outfit. The jali work is so fine and detailed. The quality of Eifa Couture's pieces is consistently outstanding. My third purchase and definitely not my last.",
    images: [],
    isVerified: true,
    createdAt: "2025-05-28T11:00:00Z",
  },
];

/* ============================================
   TESTIMONIALS
   ============================================ */

export const MOCK_TESTIMONIALS: Testimonial[] = [
  {
    id: "testimonial-001",
    name: "Priya Sharma",
    location: "New Delhi",
    rating: 5,
    comment:
      "Eifa Couture has completely changed how I view ethnic wear. Every piece feels like wearing art. The craftsmanship is extraordinary, and you can feel the love and heritage in every stitch. My go-to for festive season shopping.",
    image: "/images/eifa-logo-header.png",
    productPurchased: "Chanderi Silk Chikankari Kurta",
  },
  {
    id: "testimonial-002",
    name: "Ayesha Khan",
    location: "Mumbai",
    rating: 5,
    comment:
      "I ordered the bridal lehenga set for my sister's wedding, and it was nothing short of breathtaking. The mukaish and kamdani work sparkled beautifully under lights. Multiple guests asked where she got it. Eifa Couture made her day extra special.",
    image: "/images/eifa-logo-header.png",
    productPurchased: "Kamdani Bridal Lehenga Set",
  },
  {
    id: "testimonial-003",
    name: "Rajesh Verma",
    location: "Lucknow",
    rating: 5,
    comment:
      "Being from Lucknow, I'm very particular about my Chikankari. Eifa Couture lives up to the highest standards. Their men's kurtas use genuine hand-embroidery — not the machine-made imitations flooding the market. Authentic Lucknowi quality.",
    image: "/images/eifa-logo-header.png",
    productPurchased: "Classic Men's Chikankari Kurta",
  },
  {
    id: "testimonial-004",
    name: "Meera Iyer",
    location: "Bangalore",
    rating: 5,
    comment:
      "The palazzo set I ordered is my most-worn outfit now. It's so comfortable yet looks incredibly elegant. The modal cotton is like butter against the skin, and the Chikankari detailing gets me compliments everywhere. Already eyeing the Anarkali for my next purchase!",
    image: "/images/eifa-logo-header.png",
    productPurchased: "Pastel Palazzo Chikankari Set",
  },
  {
    id: "testimonial-005",
    name: "Fatima Siddiqui",
    location: "Hyderabad",
    rating: 5,
    comment:
      "I've been searching for authentic Chikankari online for years, and Eifa Couture is the first brand that delivers genuine handcrafted pieces. The organza dupatta I bought is a work of art. Their attention to packaging and customer care is equally impressive.",
    image: "/images/eifa-logo-header.png",
    productPurchased: "Sheer Organza Chikankari Dupatta",
  },
  {
    id: "testimonial-006",
    name: "Ananya Gupta",
    location: "Kolkata",
    rating: 5,
    comment:
      "The Chikankari saree from Eifa Couture is hands down the most beautiful saree in my collection. The all-over embroidery, the Mughal-inspired motifs on the pallu — it's museum-quality work that you can actually wear. I feel like royalty every time I drape it.",
    image: "/images/eifa-logo-header.png",
    productPurchased: "Georgette Chikankari Saree",
  },
];

/* ── Convenience exports ── */

export function getProductById(id: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.id === id);
}

export function getProductBySlug(slug: string): Product | undefined {
  return MOCK_PRODUCTS.find((p) => p.slug === slug);
}

export function getFeaturedProducts(): Product[] {
  return MOCK_PRODUCTS.filter((p) => p.isFeatured && p.isActive);
}

export function getBestSellers(): Product[] {
  return MOCK_PRODUCTS.filter((p) => p.isBestSeller && p.isActive);
}

export function getNewArrivals(): Product[] {
  return MOCK_PRODUCTS.filter((p) => p.isNewArrival && p.isActive);
}

export function getProductsByCategory(categorySlug: string): Product[] {
  return MOCK_PRODUCTS.filter(
    (p) => p.category === categorySlug && p.isActive
  );
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return MOCK_CATEGORIES.find((c) => c.slug === slug);
}