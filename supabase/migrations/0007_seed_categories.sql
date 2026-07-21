insert into categories (name, slug, description, sort_order, is_active)
values
  ('Women''s Wear', 'womens-wear', 'Chikankari sarees, kurta sets, and suits.', 1, true),
  ('Men''s Wear', 'mens-wear', 'Chikankari kurtas and men''s ethnic wear.', 2, true),
  ('Bags & Accessories', 'bags-accessories', 'Silk bags and other accessories.', 3, true)
on conflict (slug) do nothing;