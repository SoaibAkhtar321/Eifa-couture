import { formatPrice } from '@/lib/utils';
import type { TopProductRow } from '@/lib/admin/analytics-read';

interface TopProductsTableProps {
  products: TopProductRow[];
}

export default function TopProductsTable({ products }: TopProductsTableProps) {
  if (products.length === 0) {
    return <p className="text-sm text-charcoal/50">No paid orders in this range yet.</p>;
  }

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-charcoal/50 text-xs uppercase tracking-wide">
          <th className="pb-2 font-normal">Product</th>
          <th className="pb-2 font-normal text-right">Units sold</th>
          <th className="pb-2 font-normal text-right">Revenue</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-charcoal/5">
        {products.map((p) => (
          <tr key={p.productId ?? p.name}>
            <td className="py-2 text-charcoal/80">{p.name}</td>
            <td className="py-2 text-right text-charcoal/60">{p.unitsSold.toLocaleString('en-IN')}</td>
            <td className="py-2 text-right font-medium text-maroon">{formatPrice(p.revenue)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
