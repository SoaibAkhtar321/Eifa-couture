-- ============================================================
-- Phase 2 — STEP 2: FIX DATA (run only AFTER reviewing step 1)
-- Edit the slug lists in STEP 2a to match YOUR categories, then run
-- the whole script. Wrapped in a transaction: check the result
-- queries at the bottom, then change ROLLBACK to COMMIT.
-- ============================================================
begin;

-- 2a) Give every still-unassigned category an audience (by slug).
--     Sub-categories pick up their parent's audience in 2b.
update categories set audience = 'women'
where audience is null and deleted_at is null
  and slug in ('sarees', 'kurta-sets', 'suits', 'lehengas');      -- EDIT ME

update categories set audience = 'men'
where audience is null and deleted_at is null
  and slug in ('mens-kurtas', 'men-kurtas');                       -- EDIT ME

update categories set audience = 'accessories'
where audience is null and deleted_at is null
  and slug in ('bags', 'potlis', 'clutches', 'dupattas');          -- EDIT ME

-- 2b) Sub-categories inherit from their parent.
do $$
declare i int;
begin
  for i in 1..5 loop
    update categories child set audience = parent.audience
    from categories parent
    where child.parent_id = parent.id and child.audience is null and parent.audience is not null;
  end loop;
end $$;

-- 2c) Products: the CATEGORY is the source of truth. This fixes products
--     that are missing an audience AND products placed in the wrong audience.
--     (Replaces the audience; the product's category is never changed.)
alter table products disable trigger trg_products_audience_category;

update products p
set audience = c.audience
from categories c
where p.category_id = c.id
  and c.audience is not null
  and p.audience is distinct from c.audience
  and p.deleted_at is null;

alter table products enable trigger trg_products_audience_category;

-- 2d) Results — must show no rows for the first two queries.
select p.id, p.name from products p
join categories c on c.id = p.category_id
where p.deleted_at is null and c.audience is not null and p.audience <> c.audience;

select id, name from products where deleted_at is null and audience is null;

select coalesce(audience,'(none)') as audience, count(*) from products
where deleted_at is null and is_active group by 1 order by 1;

rollback;   -- <- change to COMMIT once the results above look right
