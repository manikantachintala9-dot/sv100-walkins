import { useState } from 'react';

interface DonutData {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutData[];
  title?: string;
  centerLabel?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = (angleDeg - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = polarToCartesian(cx, cy, r, endAngle - 0.5);
  const end = polarToCartesian(cx, cy, r, startAngle + 0.5);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 0 ${end.x} ${end.y}`;
}

export function DonutChart({ data, title, centerLabel }: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0);
  if (!total) return <div className="text-stone-400 text-sm text-center py-8">No data</div>;

  const CX = 150, CY = 125, OUTER_R = 95, INNER_R = 60;
  let currentAngle = 0;

  const segments = data.map((d, i) => {
    const sweep = (d.value / total) * 360;
    const seg = { ...d, startAngle: currentAngle, endAngle: currentAngle + sweep, index: i };
    currentAngle += sweep;
    return seg;
  });

  return (
    <div>
      {title && <div className="text-sm font-semibold text-stone-700 mb-1">{title}</div>}
      <svg viewBox="0 0 300 240" className="w-full max-w-xs mx-auto block">
        {segments.map((seg, i) => {
          const isHov = hovered === i;
          const midAngle = (seg.startAngle + seg.endAngle) / 2;
          const offset = isHov ? 5 : 0;
          const ox = offset * Math.cos((midAngle - 90) * Math.PI / 180);
          const oy = offset * Math.sin((midAngle - 90) * Math.PI / 180);

          if (seg.endAngle - seg.startAngle < 0.5) return null;

          return (
            <g key={i} transform={`translate(${ox}, ${oy})`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}>
              {/* Outer ring segment */}
              <path
                d={describeArc(CX, CY, OUTER_R, seg.startAngle, seg.endAngle)}
                fill="none"
                stroke={seg.color}
                strokeWidth={isHov ? OUTER_R - INNER_R + 4 : OUTER_R - INNER_R}
                strokeLinecap="butt"
                opacity={isHov ? 1 : 0.88}
              />
            </g>
          );
        })}

        {/* Center */}
        <circle cx={CX} cy={CY} r={INNER_R - 2} fill="white" />
        <text x={CX} y={CY - 8} textAnchor="middle"
          fill="#292524" fontSize="22" fontWeight="700" fontFamily="system-ui">
          {hovered !== null ? data[hovered].value : total}
        </text>
        <text x={CX} y={CY + 12} textAnchor="middle"
          fill="#78716c" fontSize="10" fontFamily="system-ui">
          {hovered !== null ? `${((data[hovered].value / total) * 100).toFixed(1)}%` : (centerLabel ?? 'total')}
        </text>
        {hovered !== null && (
          <text x={CX} y={CY + 26} textAnchor="middle"
            fill={data[hovered].color} fontSize="9" fontFamily="system-ui">
            {data[hovered].label}
          </text>
        )}
      </svg>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 px-2 mt-1">
        {data.map((d, i) => (
          <div key={i}
            className="flex items-center gap-1.5 cursor-pointer"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}>
            <span className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
              style={{ backgroundColor: d.color }} />
            <span className={`text-xs truncate ${hovered === i ? 'font-semibold text-stone-800' : 'text-stone-600'}`}>
              {d.label}
            </span>
            <span className="text-xs text-stone-400 ml-auto flex-shrink-0">
              {((d.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
