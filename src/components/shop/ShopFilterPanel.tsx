'use client';

import { AUDIENCE_LABELS, AUDIENCES, type Audience } from '@/lib/catalog';
import type { ShopFacets } from '@/lib/data/shop';
import { PRICE_FILTER_OPTIONS } from '@/lib/search';
import { SHOP_COLLECTIONS, type ShopCollection, type ShopFilters } from '@/lib/shop-filters';
import type { Category } from '@/types';

interface Props {
  value: ShopFilters;
  onChange: (next: ShopFilters) => void;
  categories: Category[];
  facets: ShopFacets;
}

function toggle(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter((entry) => entry !== item) : [...list, item];
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="border-b border-beige py-5 first:pt-0 last:border-b-0">
      <legend className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

function Radio({
  name,
  label,
  checked,
  onSelect,
  indent = false,
}: {
  name: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
  indent?: boolean;
}) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink ${indent ? 'pl-5' : ''}`}>
      <input type="radio" name={name} checked={checked} onChange={onSelect} className="h-4 w-4 accent-maroon" />
      <span className={checked ? 'font-semibold' : ''}>{label}</span>
    </label>
  );
}

function Check({ label, checked, onToggle }: { label: string; checked: boolean; onToggle: () => void }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-ink">
      <input type="checkbox" checked={checked} onChange={onToggle} className="h-4 w-4 accent-maroon" />
      <span>{label}</span>
    </label>
  );
}

/**
 * All shop filter groups. Stateless: the desktop sidebar applies each
 * change straight away, the mobile sheet edits a draft and applies it
 * on "Apply".
 */
export default function ShopFilterPanel({ value, onChange, categories, facets }: Props) {
  const set = (patch: Partial<ShopFilters>) => onChange({ ...value, ...patch, limit: 12 });

  const visibleCategories = categories
    .filter((category) => category.isActive && (!value.audience || category.audience === value.audience))
    .slice()
    .sort((a, b) => a.order - b.order);

  const setAudience = (audience: Audience | null) => {
    // Drop a category that does not belong to the newly chosen audience.
    const stillValid =
      !audience ||
      !value.category ||
      categories.some((c) => c.slug === value.category && c.audience === audience);
    set({ audience, category: stillValid ? value.category : null });
  };

  return (
    <div>
      <Group title="Shop for">
        <Radio name="audience" label="Everyone" checked={!value.audience} onSelect={() => setAudience(null)} />
        {AUDIENCES.map((audience) => (
          <Radio
            key={audience}
            name="audience"
            label={AUDIENCE_LABELS[audience]}
            checked={value.audience === audience}
            onSelect={() => setAudience(audience)}
          />
        ))}
      </Group>

      <Group title="Collection">
        <Radio name="collection" label="All" checked={!value.collection} onSelect={() => set({ collection: null })} />
        {SHOP_COLLECTIONS.map((collection) => (
          <Radio
            key={collection.value}
            name="collection"
            label={collection.label}
            checked={value.collection === collection.value}
            onSelect={() => set({ collection: collection.value as ShopCollection })}
          />
        ))}
      </Group>

      {visibleCategories.length > 0 && (
        <Group title="Category">
          <Radio name="category" label="All categories" checked={!value.category} onSelect={() => set({ category: null })} />
          {visibleCategories.map((category) => (
            <Radio
              key={category.id}
              name="category"
              label={category.name}
              indent={!!category.parentId}
              checked={value.category === category.slug}
              onSelect={() => set({ category: category.slug })}
            />
          ))}
        </Group>
      )}

      <Group title="Price">
        {PRICE_FILTER_OPTIONS.map((option) => (
          <Radio
            key={option.value}
            name="price"
            label={option.label}
            checked={value.price === option.value}
            onSelect={() => set({ price: option.value })}
          />
        ))}
      </Group>

      {facets.sizes.length > 0 && (
        <Group title="Size">
          <div className="flex flex-wrap gap-2">
            {facets.sizes.map((size) => {
              const active = value.sizes.includes(size);
              return (
                <button
                  key={size}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ sizes: toggle(value.sizes, size) })}
                  className={`min-h-11 min-w-11 border px-3 text-sm font-medium transition-colors ${
                    active ? 'border-maroon bg-maroon text-white' : 'border-ink-soft/40 bg-white text-ink hover:border-maroon'
                  }`}
                >
                  {size}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {facets.colors.length > 0 && (
        <Group title="Colour">
          <div className="flex flex-wrap gap-2">
            {facets.colors.map((color) => {
              const active = value.colors.includes(color.name);
              return (
                <button
                  key={color.name}
                  type="button"
                  aria-pressed={active}
                  onClick={() => set({ colors: toggle(value.colors, color.name) })}
                  className={`flex min-h-11 items-center gap-2 border px-3 text-sm transition-colors ${
                    active ? 'border-maroon bg-maroon text-white' : 'border-ink-soft/40 bg-white text-ink hover:border-maroon'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="h-4 w-4 rounded-full border border-ink-soft/50"
                    style={{ backgroundColor: color.hex }}
                  />
                  {color.name}
                </button>
              );
            })}
          </div>
        </Group>
      )}

      {facets.fabrics.length > 0 && (
        <Group title="Fabric">
          {facets.fabrics.map((fabric) => (
            <Check
              key={fabric}
              label={fabric}
              checked={value.fabrics.includes(fabric)}
              onToggle={() => set({ fabrics: toggle(value.fabrics, fabric) })}
            />
          ))}
        </Group>
      )}

      <Group title="Availability">
        <Check label="In stock only" checked={value.inStock} onToggle={() => set({ inStock: !value.inStock })} />
      </Group>
    </div>
  );
}
