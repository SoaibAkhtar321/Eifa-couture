# Supabase Storage Bucket Plan — Eifa Couture

Not created yet (no live project). This is the plan to apply once the
client's Supabase project exists — via the dashboard or a `supabase storage`
script, either way it's a few clicks/one script run, not a schema change.

## Buckets

| Bucket             | Public | Contents                                      | Notes |
|---------------------|--------|------------------------------------------------|-------|
| `product-images`    | Yes    | `product_images.url`, variant swatches         | CDN-cacheable, immutable filenames (hash-suffixed) |
| `fabric-swatches`    | Yes    | `fabrics.swatch_url`                           | Small images, rarely change |
| `banners`            | Yes    | `banners.image_url` / `mobile_image_url`       | Two sizes per banner |
| `review-images`      | Yes    | `review_images.url`                            | Customer-uploaded, moderated via `reviews.is_published` |
| `avatars`            | Yes    | `profiles.avatar_url`                          | User-uploaded profile photos |
| `invoices`           | No     | Generated order invoice PDFs                    | Private — signed URLs only, referenced by `orders.invoice_url` |

## Path conventions

```
product-images/{product_id}/{variant_id?}/{filename}
fabric-swatches/{fabric_id}/{filename}
banners/{banner_id}/desktop.{ext}
banners/{banner_id}/mobile.{ext}
review-images/{review_id}/{filename}
avatars/{user_id}/{filename}
invoices/{order_id}/invoice.pdf
```

Using the owning row's UUID as the folder prefix means storage RLS
policies can mirror the table's RLS almost exactly (see below), and
makes cleanup on row delete a simple prefix-delete.

## Storage RLS policies (applied when the bucket is created)

- **Public buckets** (`product-images`, `fabric-swatches`, `banners`,
  `review-images`, `avatars`): `select` allowed for everyone; `insert` /
  `update` / `delete` restricted to `is_admin()` — **except**
  `avatars/{user_id}/*` (owner can manage their own) and
  `review-images/{review_id}/*` (owner of the parent review can upload,
  matching the `review_images_write_own_or_admin` table policy).
- **`invoices`** (private): no public `select`. Row access is only ever
  via short-lived signed URLs issued server-side after confirming
  `orders.user_id = auth.uid()` or `is_admin()`.

## Image handling

- Supabase Storage's built-in image transformation (`?width=&height=&quality=`)
  is used for responsive `srcset` generation instead of storing multiple
  pre-resized copies per image.
- Uploads go through the Next.js server (Route Handler) so filenames can
  be sanitized/hashed and validated (mime type, max size) before hitting
  Storage — the browser never uploads directly with the anon key.
