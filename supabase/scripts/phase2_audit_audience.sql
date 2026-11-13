-- ============================================================
-- Phase 2 — STEP 1: REVIEW ONLY (changes nothing)
-- Run each block in the Supabase SQL editor and look at the rows.
-- ============================================================

-- A) Categories that still have NO audience (admin must assign one).
select id, name, slug, parent_id
from categories
where deleted_at is null and audience is null
order by sort_order, name;

-- B) Products with NO audience (they will not show in Women/Men/Accessories).
select p.id, p.name, c.name as category, c.audience as category_audience
from products p
left join categories c on c.id = p.category_id
where p.deleted_at is null and p.audience is null
order by p.created_at desc;

-- C) WRONGLY PLACED products: product audience differs from its category's audience.
select p.id, p.name, p.audience as product_audience,
       c.name as category, c.audience as category_audience
from products p
join categories c on c.id = p.category_id
where p.deleted_at is null
  and p.audience is not null
  and c.audience is not null
  and p.audience <> c.audience
order by p.created_at desc;

-- D) Quick count per audience (active products only).
select coalesce(audience, '(none)') as audience, count(*) as products
from products
where deleted_at is null and is_active
group by 1 order by 1;
