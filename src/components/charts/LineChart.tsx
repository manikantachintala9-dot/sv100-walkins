import { useState } from 'react';

interface LineChartProps {
  data: { label: string; value: number }[];
  title?: string;
  showTarget?: boolean;
  targetValue?: number;
}

export function LineChart({ data, title, showTarget = true, targetValue = 100 }: LineChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (!data.length) return <div className="text-stone-400 text-sm text-center py-8">No data</div>;

  const VW = 500, VH = 200;
  const PAD_L = 44, PAD_R = 20, PAD_T = 20, PAD_B = 36;
  const W = VW - PAD_L - PAD_R;
  const H = VH - PAD_T - PAD_B;

  const maxVal = Math.max(...data.map(d => d.value), targetValue) * 1.15 || 1;
  const minVal = 0;
  const range = maxVal - minVal;

  function xOf(i: number) { return PAD_L + (i / (data.length - 1)) * W; }
  function yOf(v: number) { return PAD_T + H - ((v - minVal) / range) * H; }

  // Cubic bezier smooth path
  function buildPath(): string {
    if (data.length < 2) return `M${xOf(0)},${yOf(data[0].value)}`;
    let d = `M${xOf(0)},${yOf(data[0].value)}`;
    for (let i = 0; i < data.length - 1; i++) {
      const x1 = xOf(i), y1 = yOf(data[i].value);
      const x2 = xOf(i + 1), y2 = yOf(data[i + 1].value);
      const cpx = (x1 + x2) / 2;
      d += ` C${cpx},${y1} ${cpx},${y2} ${x2},${y2}`;
    }
    return d;
  }

  function buildArea(): string {
    const path = buildPath();
    const lastX = xOf(data.length - 1);
    const firstX = xOf(0);
    const baseY = PAD_T + H;
    return `${path} L${lastX},${baseY} L${firstX},${baseY} Z`;
  }

  const path = buildPath();
  const area = buildArea();
  const targetY = yOf(targetValue);

  // Y-axis ticks
  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const v = Math.round((maxVal / tickCount) * i);
    return { v, y: yOf(v) };
  });

  return (
    <div>
      {title && <div className="text-sm font-semibold text-stone-700 mb-2">{title}</div>}
      <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full">
        <defs>
          <linearGradient id="lineAreaGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#9f1239" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#9f1239" stopOpacity="0.02" />
          </linearGradient>
          <clipPath id="lineClip">
            <rect x={PAD_L} y={PAD_T} width={W} height={H} />
          </clipPath>
        </defs>

        {/* Gridlines */}
        {ticks.map(({ v, y }) => (
          <g key={v}>
            <line x1={PAD_L} y1={y} x2={PAD_L + W} y2={y}
              stroke="#fecdd3" strokeWidth="1" strokeDasharray="3 3" />
            <text x={PAD_L - 4} y={y + 4} textAnchor="end"
              fill="#78716c" fontSize="10" fontFamily="system-ui">{v}</text>
          </g>
        ))}

        {/* Target line */}
        {showTarget && targetY >= PAD_T && targetY <= PAD_T + H && (
          <g>
            <line x1={PAD_L} y1={targetY} x2={PAD_L + W} y2={targetY}
              stroke="#d97706" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.7" />
            <text x={PAD_L + W + 3} y={targetY + 4}
              fill="#d97706" fontSize="9" fontFamily="system-ui" fontWeight="600">
              {targetValue}
            </text>
          </g>
        )}

        {/* Area fill */}
        <path d={area} fill="url(#lineAreaGrad)" clipPath="url(#lineClip)" />

        {/* Line */}
        <path d={path} fill="none" stroke="#9f1239" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" clipPath="url(#lineClip)" />

        {/* Data points */}
        {data.map((d, i) => {
          const x = xOf(i), y = yOf(d.value);
          const isHov = hovered === i;
          return (
            <g key={i}>
              {/* Invisible wider hit area */}
              <rect
                x={x - 16} y={PAD_T} width={32} height={H}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
              <circle cx={x} cy={y} r={isHov ? 5 : 3.5}
                fill={isHov ? '#d97706' : '#9f1239'}
                stroke="white" strokeWidth="2" />
              {isHov && (
                <g>
                  <rect x={x - 20} y={y - 28} width={40} height={20}
                    rx="4" fill="#292524" opacity="0.88" />
                  <text x={x} y={y - 13} textAnchor="middle"
                    fill="white" fontSize="11" fontWeight="600" fontFamily="system-ui">
                    {d.value}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text key={i} x={xOf(i)} y={VH - 6}
            textAnchor="middle" fill="#78716c" fontSize="10" fontFamily="system-ui">
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
