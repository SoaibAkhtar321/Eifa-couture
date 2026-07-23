import { formatPrice } from '@/lib/utils';
import type { TopCategoryRow } from '@/lib/admin/analytics-read';

interface TopCategoriesTableProps {
  categories: TopCategoryRow[];
}

export default function TopCategoriesTable({ categories }: TopCategoriesTableProps) {
  if (categories.length === 0) {
    return <p className="text-sm text-charcoal/50">No paid orders in this range yet.</p>;
  }

  const maxRevenue = Math.max(...categories.map((c) => c.revenue));

  return (
    <div className="space-y-3">
      {categories.map((c) => (
        <div key={c.categoryId ?? c.name}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-charcoal/70">{c.name}</span>
            <span className="text-charcoal/50">{formatPrice(c.revenue)}</span>
          </div>
          <div className="h-2 rounded-full bg-charcoal/5">
            <div
              className="h-2 rounded-full bg-maroon"
              style={{ width: `${maxRevenue > 0 ? (c.revenue / maxRevenue) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
