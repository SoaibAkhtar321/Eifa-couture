# Eifa Couture

Next.js 16 + Supabase storefront and admin panel for Eifa Couture (Lucknowi Chikankari).

## Setup
1. `cp .env.example .env.local` and fill in the Supabase (and later Razorpay) keys.
2. Apply `supabase/migrations/*` in order (`supabase db push`).
3. `npm ci && npm run dev`

## Scripts
`npm run lint` · `npm run typecheck` · `npm run build` — CI runs all three (`.github/workflows/ci.yml`).

## How the homepage is fed
- **Featured** – collection picked in Admin → Homepage, else products toggled *Featured*.
- **New Arrivals** – products toggled *New arrival*, else the newest uploads.
- **Best Sellers** – products toggled *Best seller*.
- **Women / Men** – products in any category whose name/slug mentions women/men (and its sub-categories).
- **Category rails** – one rail per other top-level category (e.g. Bags & Accessories).
- Footer contact/social details and shipping rates come from Admin → Settings.
