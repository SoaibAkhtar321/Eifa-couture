/* ============================================
   EIFA COUTURE — Type Definitions
   Complete ecommerce type system
   ============================================ */

// ── SEO ──
export interface SEOMeta {
  title: string;
  description: string;
  keywords: string[];
}

// ── Product ──
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  /** Base product price — used only as the default for variants without
   *  a `price_override`. Display and cart/checkout code should prefer
   *  `minPrice`/`maxPrice`/`variants[].price` over this field directly. */
  price: number;
  compareAtPrice: number | null;
  images: string[];
  /** Variant-uploaded images grouped by `colorName`, ordered like
   *  `images` (primary first, then sort_order). A color with no
   *  images of its own is simply absent here — consumers should fall
   *  back to `images` (the product-level gallery) in that case. */
  imagesByColor: Record<string, string[]>;
  category: string;
  subcategory: string;
  sizes: string[];
  colors: ProductColor[];
  /** Stock mapped by "size-color" key, e.g. "M-White": 12 */
  stock: Record<string, number>;
  /** One entry per active size/color combination, with its resolved
   *  price (`price_override ?? price`) and live stock. Source of truth
   *  for all variant-level pricing. */
  variants: ProductVariant[];
  /** Lowest resolved price across all active variants (equals `price`
   *  when the product has no active variants). */
  minPrice: number;
  /** Highest resolved price across all active variants. */
  maxPrice: number;
  /** True when variant prices differ — display surfaces should show
   *  "From {minPrice}" instead of a single price when this is true. */
  hasPriceRange: boolean;
  /** 'simple' products have exactly one hidden variant and manage
   *  stock via `stockQuantity`/`trackInventory`/`allowBackorders`
   *  directly; the storefront hides the size/color selector for
   *  these. 'variant' products keep the existing selector UI. */
  productType: 'simple' | 'variant';
  stockQuantity: number;
  trackInventory: boolean;
  allowBackorders: boolean;
  sku: string | null;
  fabric: string;
  care: string[];
  tags: string[];
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  seo: SEOMeta;
  createdAt: string;
  updatedAt: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

// ── Product Variant (resolved, UI-facing) ──
export interface ProductVariant {
  id: string;
  size: string;
  colorName: string;
  /** Resolved price for this exact variant: `price_override ?? product.price`. */
  price: number;
  /** Live available stock (quantity − reserved) for this variant. */
  stock: number;
}

// ── Category ──
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  parentId: string | null;
  isActive: boolean;
  order: number;
}

// ── Collection ──
// Editorial/marketing groupings (e.g. "Eid Edit", "Bridal Chikankari")
// that sit orthogonal to categories — many-to-many with products via
// `product_collections`. Powers the homepage "Featured Collection"
// section once `isFeatured` + `isActive` + the optional campaign
// window (`startsAt`/`endsAt`) all match.
export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isFeatured: boolean;
  isActive: boolean;
  order: number;
  startsAt: string | null;
  endsAt: string | null;
}

// ── Cart ──
export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
  /** Snapshot of the selected variant's resolved price
   *  (`price_override ?? product.price`) at the moment it was added to
   *  the cart/buy-now flow. This — not `product.price` — is the
   *  authoritative price for cart totals, checkout, and orders; it is
   *  never recomputed from the base product price. */
  unitPrice: number;
}

// ── User ──
export type UserRole = "customer" | "admin" | "superadmin";

export interface User {
  id: string;
  email: string;
  displayName: string;
  phone: string;
  role: UserRole;
  addresses: Address[];
  wishlist: string[];
  createdAt: string;
}

// ── Address ──
export type AddressType = "home" | "work" | "other";

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  type: AddressType;
}

// ── Order ──
export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned"
  | "refunded";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  coupon: string | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentId: string | null;
  razorpayOrderId: string | null;
  shippingAddress: Address;
  trackingNumber: string | null;
  invoiceUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  image: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

// ── Review ──
export interface Review {
  id: string;
  userId: string;
  productId: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  isVerified: boolean;
  createdAt: string;
}

// ── Coupon ──
export type CouponType = "percentage" | "fixed";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minOrder: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
}

// ── Banner ──
export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  isActive: boolean;
  order: number;
}

// ── Blog ──
export interface Blog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  tags: string[];
  isPublished: boolean;
  createdAt: string;
}

// ── Notification ──
export type NotificationType = "order" | "promotion" | "system" | "review";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

// ── Wishlist ──
export interface WishlistItem {
  id: string;
  productId: string;
  userId: string;
  addedAt: string;
}

// ── Filters ──
export type SortOption =
  | "newest"
  | "price-low-high"
  | "price-high-low"
  | "popularity"
  | "rating"
  | "name-a-z"
  | "name-z-a";

export interface PriceRange {
  min: number;
  max: number;
}

export interface FilterState {
  categories: string[];
  sizes: string[];
  colors: string[];
  priceRange: PriceRange;
  sortBy: SortOption;
  search: string;
}

// ── Testimonial (used in mock data / landing page) ──
export interface Testimonial {
  id: string;
  name: string;
  location: string;
  rating: number;
  comment: string;
  image: string;
  productPurchased: string;
}

// ── API Response Wrappers ──
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}