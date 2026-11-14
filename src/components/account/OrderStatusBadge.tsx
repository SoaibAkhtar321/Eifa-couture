const statusStyles: Record<string, string> = {
  Pending: 'bg-charcoal/10 text-ink-soft',
  Confirmed: 'bg-gold/15 text-gold',
  Processing: 'bg-gold/15 text-gold',
  Shipped: 'bg-maroon/10 text-maroon',
  'Out for delivery': 'bg-maroon/10 text-maroon',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-600',
  Returned: 'bg-charcoal/10 text-ink-soft',
  Refunded: 'bg-charcoal/10 text-ink-soft',
};

export default function OrderStatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.15em] ${statusStyles[status] ?? statusStyles.Pending}`}>
      {status}
    </span>
  );
}
