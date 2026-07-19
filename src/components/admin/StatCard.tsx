import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  tone?: 'default' | 'warning';
}

export default function StatCard({ label, value, tone = 'default' }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-lg border p-5 bg-ivory',
        tone === 'warning' ? 'border-gold/40 bg-gold/5' : 'border-charcoal/10'
      )}
    >
      <p className="text-xs uppercase tracking-wide text-charcoal/50">{label}</p>
      <p className="mt-2 font-heading text-2xl text-maroon">{value}</p>
    </div>
  );
}