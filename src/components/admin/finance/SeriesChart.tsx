'use client';

import { useMemo, useState } from 'react';

import { formatPrice } from '@/lib/utils';

export interface SeriesChartPoint {
  label: string;
  value: number;
}

interface SeriesChartProps {
  points: SeriesChartPoint[];
  style?: 'line' | 'bar';
  valueFormat?: 'currency' | 'number';
  emptyMessage?: string;
  color?: string;
}

const CHART_HEIGHT = 200;
const CHART_WIDTH = 720;
const PADDING_X = 12;

/**
 * Generic SVG chart shared by every Financial Dashboard chart
 * (Daily/Weekly/Monthly Revenue, Orders Over Time, Revenue Over Time,
 * Refund Trend). Same hand-rolled SVG technique as the existing
 * `analytics/RevenueChart.tsx` — no new charting library introduced.
 */
export default function SeriesChart({
  points,
  style = 'bar',
  valueFormat = 'currency',
  emptyMessage = 'No data for this range.',
  color = '#7A1F2B',
}: SeriesChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const format = valueFormat === 'currency' ? formatPrice : (n: number) => n.toLocaleString('en-IN');

  const { plotted, maxValue } = useMemo(() => {
    const maxValue = Math.max(1, ...points.map((p) => p.value));
    const step = points.length > 1 ? (CHART_WIDTH - PADDING_X * 2) / (points.length - 1) : 0;

    const plotted = points.map((p, i) => ({
      ...p,
      x: PADDING_X + i * step,
      y: CHART_HEIGHT - (p.value / maxValue) * (CHART_HEIGHT - 24),
    }));

    return { plotted, maxValue };
  }, [points]);

  if (points.length === 0) {
    return <p className="text-sm text-charcoal/50">{emptyMessage}</p>;
  }

  const active = activeIndex !== null ? plotted[activeIndex] : null;
  const linePath = plotted.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${plotted[plotted.length - 1].x},${CHART_HEIGHT} L${plotted[0].x},${CHART_HEIGHT} Z`;
  const barWidth = plotted.length > 0 ? (CHART_WIDTH - PADDING_X * 2) / plotted.length : 0;

  return (
    <div className="relative">
      {active && (
        <div className="absolute top-0 right-0 rounded-md border border-charcoal/10 bg-cream px-3 py-2 text-xs shadow-sm">
          <p className="text-charcoal/50">{active.label}</p>
          <p className="font-heading text-maroon">{format(active.value)}</p>
        </div>
      )}

      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
        className="w-full h-52"
        preserveAspectRatio="none"
        onMouseLeave={() => setActiveIndex(null)}
      >
        {style === 'line' ? (
          <>
            <defs>
              <linearGradient id="seriesFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.25" />
                <stop offset="100%" stopColor={color} stopOpacity="0" />
              </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#seriesFill)" />
            <path d={linePath} fill="none" stroke={color} strokeWidth={2} />
          </>
        ) : (
          plotted.map((p, i) => {
            const barHeight = CHART_HEIGHT - p.y;
            return (
              <rect
                key={p.label}
                x={PADDING_X + i * barWidth + barWidth * 0.15}
                y={p.y}
                width={barWidth * 0.7}
                height={barHeight}
                rx={2}
                fill={activeIndex === i ? color : `${color}CC`}
              />
            );
          })
        )}

        {plotted.map((p, i) => (
          <rect
            key={`${p.label}-hover`}
            x={PADDING_X + i * barWidth}
            y={0}
            width={barWidth || CHART_WIDTH / plotted.length}
            height={CHART_HEIGHT}
            fill="transparent"
            onMouseEnter={() => setActiveIndex(i)}
          />
        ))}
      </svg>

      <div className="flex justify-between text-[11px] text-charcoal/40 mt-1">
        <span>{plotted[0]?.label}</span>
        <span>Peak: {format(maxValue)}</span>
        <span>{plotted[plotted.length - 1]?.label}</span>
      </div>
    </div>
  );
}
