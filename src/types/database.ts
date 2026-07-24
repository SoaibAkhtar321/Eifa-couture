/* ============================================
   EIFA COUTURE — Database Types
   Hand-written mirror of supabase/migrations/*.sql, scoped for use in
   Phase 4 (data-fetching layer) once the client's Supabase project is
   connected.

   NOTE: these are intentionally separate from `types/index.ts` (the
   existing mock-data / UI types). Once Supabase is connected, run
   `supabase gen types typescript` and prefer the generated file as the
   source of truth — keep this file only if it still adds convenience
   aliases on top of the generated types.
   ============================================ */

export type UserRole = "customer" | "admin" | "superadmin";
export type AddressType = "home" | "work" | "other";
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
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";
export type PaymentProvider = "razorpay" | "stripe" | "cod" | "other";
export type CouponType = "percentage" | "fixed";
export type NotificationType = "order" | "promotion" | "system" | "review";
export type ReturnStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "picked_up"
  | "received"
  | "refunded"
  | "exchanged";
export type ShipmentStatus =
  | "label_created"
  | "picked_up"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "failed"
  | "rto";

export interface DbProfile {
  id: string;
  display_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAddress {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  pincode: string;
  type: AddressType;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCollection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  is_featured: boolean;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFabric {
  id: string;
  name: string;
  description: string;
  care: string[];
  swatch_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type ProductType = "simple" | "variant";

export interface DbProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  price: number;
  compare_at_price: number | null;
  category_id: string | null;
  fabric_id: string | null;
  tags: string[];
  is_featured: boolean;
  is_best_seller: boolean;
  is_new_arrival: boolean;
  is_active: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[];
  rating_avg: number;
  rating_count: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  /** Phase 3: 'simple' products own their own sku/stock directly below;
   *  'variant' products manage inventory exclusively through
   *  product_variants + inventory (unchanged from Phase 1/2). */
  product_type: ProductType;
  sku: string | null;
  stock_quantity: number;
  track_inventory: boolean;
  allow_backorders: boolean;
}

export interface DbProductImage {
  id: string;
  product_id: string;
  variant_id: string | null;
  url: string;
  alt_text: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface DbProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string;
  color_name: string;
  color_hex: string | null;
  price_override: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** True only for the single auto-managed variant that backs a
   *  'simple' product's inventory (see migration 0013). Never created
   *  or edited directly from the admin variant UI. */
  is_default_variant: boolean;
}

export interface DbInventory {
  id: string;
  variant_id: string;
  quantity: number;
  reserved: number;
  low_stock_at: number;
  updated_at: string;
}

export interface DbWishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface DbCartItem {
  id: string;
  user_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
}

export interface DbWishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface DbCoupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  min_order: number | null;
  max_discount: number | null;
  usage_limit: number | null;
  per_user_limit: number;
  used_count: number;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrder {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_provider: PaymentProvider;
  payment_provider_ref: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  payment_verified_at: string | null;
  stock_settled_at: string | null;
  /** Set by mark_order_paid() when a payment settled after this order's
   *  stock reservation had already been released and current stock
   *  couldn't fully cover it (see migration 0016). Ops-facing only —
   *  not currently surfaced in customer UI. */
  needs_stock_review: boolean;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  coupon_id: string | null;
  shipping_address_id: string | null;
  shipping_address: Record<string, unknown>; // jsonb snapshot
  tracking_number: string | null;
  shipping_provider: string | null;
  invoice_url: string | null;
  placed_at: string;
  created_at: string;
  updated_at: string;
}

export interface DbOrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  name: string;
  image_url: string | null;
  size: string;
  color_name: string;
  quantity: number;
  unit_price: number;
  created_at: string;
}

export interface DbShipment {
  id: string;
  order_id: string;
  provider: string;
  tracking_number: string | null;
  status: ShipmentStatus;
  shipped_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbOrderReturn {
  id: string;
  order_item_id: string;
  user_id: string;
  status: ReturnStatus;
  reason: string;
  is_exchange: boolean;
  exchange_variant_id: string | null;
  refund_amount: number | null;
  requested_at: string;
  resolved_at: string | null;
  updated_at: string;
}

export interface DbReview {
  id: string;
  user_id: string;
  product_id: string;
  order_item_id: string | null;
  rating: number;
  title: string;
  comment: string;
  is_verified: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbBanner {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  mobile_image_url: string | null;
  link_url: string | null;
  cta_label: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link_url: string | null;
  is_read: boolean;
  created_at: string;
}

export type HomepageSectionKey = 'featured_collection' | 'new_arrivals' | 'best_sellers' | 'shop_by_category';

export interface DbHomepageSection {
  id: string;
  section_key: HomepageSectionKey;
  title: string | null;
  subtitle: string | null;
  is_active: boolean;
  sort_order: number;
  item_limit: number;
  source_collection_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStoreSettings {
  singleton: true;
  store_name: string;
  store_email: string | null;
  store_phone: string | null;
  address_line1: string | null;
  address_line2: string | null;
  address_city: string | null;
  address_state: string | null;
  address_pincode: string | null;
  address_country: string;
  business_legal_name: string | null;
  business_registration_no: string | null;
  gstin: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  social_instagram_url: string | null;
  social_facebook_url: string | null;
  social_pinterest_url: string | null;
  social_youtube_url: string | null;
  social_twitter_url: string | null;
  seo_default_title: string | null;
  seo_default_description: string | null;
  currency_code: string;
  currency_symbol: string;
  shipping_flat_rate: number;
  shipping_free_threshold: number | null;
  shipping_processing_days: number;
  tax_gst_percent: number;
  tax_prices_inclusive: boolean;
  updated_at: string;
}

export interface DbAuditLog {
  id: string;
  actor_id: string | null;
  actor_name: string;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_label: string;
  detail: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}