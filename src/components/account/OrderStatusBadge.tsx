const statusStyles: Record<string, string> = {
  Pending: 'bg-charcoal/10 text-charcoal/70',
  Processing: 'bg-gold/15 text-gold',
  Shipped: 'bg-maroon/10 text-maroon',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-600',
};

export default function OrderStatusBadge({ status }: { status: keyof typeof statusStyles }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.15em] ${statusStyles[status] ?? statusStyles.Pending}`}>
      {status}
    </span>
  );
}