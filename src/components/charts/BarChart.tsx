interface BarData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarData[];
  title?: string;
  unit?: string;
  maxValue?: number;
  height?: number;
}

export function BarChart({ data, title, unit = '', maxValue, height }: BarChartProps) {
  if (!data.length) return <div className="text-stone-400 text-sm text-center py-8">No data available</div>;

  const computedMax = Math.max(...data.map(d => d.value)) * 1.1 || 1;
  const max = maxValue ?? computedMax;
  const BAR_H = 30;
  const GAP = 10;
  const LEFT = 115;
  const BAR_W = 230;
  const RIGHT_PAD = 55;
  const TOP_PAD = title ? 30 : 8;
  const BOTTOM_PAD = 8;
  const totalH = height ?? (data.length * (BAR_H + GAP) - GAP + TOP_PAD + BOTTOM_PAD);
  const VW = LEFT + BAR_W + RIGHT_PAD;

  return (
    <svg viewBox={`0 0 ${VW} ${totalH}`} className="w-full" style={{ maxHeight: totalH }}>
      <defs>
        <linearGradient id="barGrad" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor="#9f1239" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>

      {title && (
        <text x={VW / 2} y={20} textAnchor="middle"
          fill="#292524" fontSize="13" fontWeight="600" fontFamily="system-ui">
          {title}
        </text>
      )}

      {data.map((d, i) => {
        const y = TOP_PAD + i * (BAR_H + GAP);
        const barW = Math.max(2, (d.value / max) * BAR_W);
        const color = d.color ?? 'url(#barGrad)';

        return (
          <g key={i}>
            {/* Background track */}
            <rect x={LEFT} y={y + 4} width={BAR_W} height={BAR_H - 8}
              rx="4" fill="#ffe4e6" />
            {/* Value bar */}
            <rect x={LEFT} y={y + 4} width={barW} height={BAR_H - 8}
              rx="4" fill={color} opacity="0.92">
              <animate attributeName="width" from="0" to={String(barW)}
                dur="0.7s" begin={`${i * 0.08}s`} fill="freeze" calcMode="spline"
                keySplines="0.4 0 0.2 1" keyTimes="0;1" />
            </rect>
            {/* Label */}
            <text x={LEFT - 6} y={y + BAR_H / 2 + 4}
              textAnchor="end" fill="#44403c" fontSize="11" fontFamily="system-ui">
              {d.label.length > 13 ? d.label.slice(0, 12) + '…' : d.label}
            </text>
            {/* Value */}
            <text x={LEFT + barW + 6} y={y + BAR_H / 2 + 4}
              fill="#292524" fontSize="11" fontWeight="600" fontFamily="system-ui">
              {unit === '%' ? `${d.value.toFixed(1)}%` : unit === '₹' ? `₹${d.value.toLocaleString('en-IN')}` : d.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
