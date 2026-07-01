/* ============================================
   EIFA COUTURE — Utility Functions
   ============================================ */

/**
 * Format a number as INR currency (₹).
 * @example formatPrice(4999) → "₹4,999"
 * @example formatPrice(25999.5) → "₹25,999.50"
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Merge class names — filters falsy values and joins.
 * Simple alternative to clsx without external dependencies.
 * @example cn("btn", isActive && "btn-active", undefined, "ml-2") → "btn btn-active ml-2"
 */
export function cn(
  ...classes: (string | boolean | undefined | null)[]
): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Truncate text to a given length and add ellipsis.
 * @example truncateText("Hello World", 5) → "Hello…"
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

/**
 * Generate a URL-safe slug from a string.
 * @example generateSlug("Chanderi Silk Kurta — Special") → "chanderi-silk-kurta-special"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Calculate discount percentage between original and current price.
 * @example getDiscountPercentage(1000, 700) → 30
 */
export function getDiscountPercentage(
  originalPrice: number,
  currentPrice: number
): number {
  if (originalPrice <= 0 || currentPrice >= originalPrice) return 0;
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
}

/**
 * Format a date string into a human-readable format.
 * @example formatDate("2025-06-15T10:30:00Z") → "15 Jun 2025"
 * @example formatDate("2025-06-15T10:30:00Z", "long") → "15 June 2025"
 */
export function formatDate(
  dateString: string,
  style: "short" | "long" | "relative" = "short"
): string {
  const date = new Date(dateString);

  if (style === "relative") {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHrs = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHrs / 24);

    if (diffSec < 60) return "Just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    // Fall through to "short" for older dates
  }

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: style === "long" ? "long" : "short",
    year: "numeric",
  });
}

/**
 * Debounce a function — delays execution until after `delay` ms
 * have elapsed since the last invocation.
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Validate an email address.
 * @example isValidEmail("user@example.com") → true
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validate an Indian phone number (10 digits, starting with 6-9).
 * Accepts optional +91 prefix and spaces/dashes.
 * @example isValidPhone("+91 98765 43210") → true
 * @example isValidPhone("9876543210") → true
 */
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s\-+]/g, "");
  // With country code
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return /^91[6-9]\d{9}$/.test(cleaned);
  }
  // Without country code
  return /^[6-9]\d{9}$/.test(cleaned);
}

/**
 * Validate an Indian pincode (6-digit number).
 * First digit must be 1-9.
 * @example isValidPincode("226018") → true
 */
export function isValidPincode(pincode: string): boolean {
  return /^[1-9]\d{5}$/.test(pincode.trim());
}

/**
 * Get initials from a full name.
 * @example getInitials("Soaib Akhtar") → "SA"
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Generate a stock key for product inventory lookup.
 * @example getStockKey("M", "White") → "M-White"
 */
export function getStockKey(size: string, color: string): string {
  return `${size}-${color}`;
}

/**
 * Check if a product is in stock for a given size and color.
 */
export function isInStock(
  stock: Record<string, number>,
  size: string,
  color: string
): boolean {
  const key = getStockKey(size, color);
  return (stock[key] ?? 0) > 0;
}

/**
 * Split text into segments around a case-insensitive match of `query`,
 * for rendering highlighted search matches. Returns the original text
 * as a single non-matching segment if there's no match.
 * @example highlightSegments("Chanderi Silk Kurta", "silk")
 *   → [{ text: "Chanderi ", match: false }, { text: "Silk", match: true }, { text: " Kurta", match: false }]
 */
export interface TextSegment {
  text: string;
  match: boolean;
}

export function highlightSegments(text: string, query: string): TextSegment[] {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) return [{ text, match: false }];

  const lowerText = text.toLowerCase();
  const lowerQuery = trimmedQuery.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);

  if (matchIndex === -1) return [{ text, match: false }];

  const segments: TextSegment[] = [];

  if (matchIndex > 0) {
    segments.push({ text: text.slice(0, matchIndex), match: false });
  }

  segments.push({
    text: text.slice(matchIndex, matchIndex + trimmedQuery.length),
    match: true,
  });

  const remainder = text.slice(matchIndex + trimmedQuery.length);
  if (remainder) {
    segments.push({ text: remainder, match: false });
  }

  return segments;
}