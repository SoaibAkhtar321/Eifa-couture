interface FinanceExportButtonsProps {
  rangeQuery: string;
}

const EXPORTS: { type: 'revenue' | 'orders' | 'refunds'; label: string }[] = [
  { type: 'revenue', label: 'Revenue Report (CSV)' },
  { type: 'orders', label: 'Orders Report (CSV)' },
  { type: 'refunds', label: 'Refund Report (CSV)' },
];

export default function FinanceExportButtons({ rangeQuery }: FinanceExportButtonsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {EXPORTS.map((exp) => (
        <a
          key={exp.type}
          href={`/api/admin/finance/export/${exp.type}?${rangeQuery}`}
          className="px-3 py-1.5 text-sm rounded-md border border-charcoal/15 text-charcoal/70 hover:border-maroon hover:text-maroon transition-colors"
        >
          {exp.label}
        </a>
      ))}
    </div>
  );
}
