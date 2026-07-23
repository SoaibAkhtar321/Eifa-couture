'use client';

import { useMemo, useState } from 'react';

import { formatPrice } from '@/lib/utils';
import type { RevenuePoint } from '@/lib/admin/analytics-read';

interface RevenueChartProps {
  series: RevenuePoint[];
}

const CHART_HEIGHT = 220;
const CHART_WIDTH = 720;
const PADDING_X = 12;

export default function RevenueChart({ series }: RevenueChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const { points, maxRevenue } = useMemo(() => {
    const maxRevenue = Math.max(1, ...series.map((p) => p.revenue));
    const step = series.length > 1 ? (CHART_WIDTH - PADDING_X * 2) / (series.length - 1) : 0;

    const points = series.map((p, i) => ({
      ...p,
      x: PADDING_X + i * step,
      y: CHART_HEIGHT - (p.revenue / maxRevenue) * (CHART_HEIGHT - 24),
    }));

    return { points, maxRevenue };
  }, [series]);

  if (series.length === 0) {
    return <p className="text-sm text-charcoal/50">No revenue data for this range.</p>;
  }

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${CHART_HEIGHT} L${points[0].x},${CHART_HEIGHT} Z`;
  const active = activeIndex !== null ? points[activeIndex] : null;

  return (
    <div className="relative">
      {active && (
        <div className="absolute top-0 right-0 rounded-md border border-charcoal/10 bg-cream px-3 py-2 text-xs shadow-sm">
          <p className="text-charcoal/50">{active.date}</p>
          <p className="font-heading text-maroon">{formatPrice(active.revenue)}</p>
          <p className="text-charcoal/50">
            {active.orders} order{active.orders === 1 ? '' : 's'}
          </p>
        </div>
      )}

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-56"
        preserveAspectRatio="none"
        onMouseLeave={() => setActiveIndex(null)}
      >
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-gold, #C9A227)" stopOpacity="0.35" />
            <stop offset="100%" stopColor="var(--color-gold, #C9A227)" stopOpacity="0" />
          </linearGradient>
        </defs>

        <path d={areaPath} fill="url(#revenueFill)" />
        <path d={linePath} fill="none" stroke="#7A1F2B" strokeWidth={2} />

        {points.map((p, i) => (
          <rect
            key={p.date}
            x={p.x - (CHART_WIDTH / points.length) / 2}
            y={0}
            width={CHART_WIDTH / points.length}
            height={CHART_HEIGHT}
            fill="transparent"
            onMouseEnter={() => setActiveIndex(i)}
          />
        ))}

        {activeIndex !== null && (
          <line
            x1={points[activeIndex].x}
            x2={points[activeIndex].x}
            y1={0}
            y2={CHART_HEIGHT}
            stroke="#7A1F2B"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
        )}
      </svg>

      <div className="flex justify-between text-[11px] text-charcoal/40 mt-1">
        <span>{points[0]?.date}</span>
        <span>Peak day: {formatPrice(maxRevenue)}</span>
        <span>{points[points.length - 1]?.date}</span>
      </div>
    </div>
  );
}
