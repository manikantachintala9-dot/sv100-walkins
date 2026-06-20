import type { WalkIn, LostReason } from '../types';
import { LOST_REASON_LABELS, SALESPERSONS, CHART_COLORS } from '../constants';
import { DonutChart } from './charts/DonutChart';

interface LostSalesProps {
  walkins: WalkIn[];
}

export function LostSalesAnalysis({ walkins }: LostSalesProps) {
  const lost = walkins.filter(w => w.dealStatus === 'did_not_buy');
  const total = lost.length;

  // Lost reason breakdown
  const reasonMap: Record<string, number> = {};
  lost.forEach(w => {
    if (w.lostReason) reasonMap[w.lostReason] = (reasonMap[w.lostReason] ?? 0) + 1;
  });
  const reasonsSorted = Object.entries(reasonMap).sort((a, b) => b[1] - a[1]);
  const donutData = reasonsSorted.map(([r, cnt], i) => ({
    label: LOST_REASON_LABELS[r as LostReason] ?? r,
    value: cnt,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  // Pareto: cumulative %
  const paretoData = (() => {
    let cumulative = 0;
    return reasonsSorted.map(([r, cnt], i) => {
      cumulative += cnt;
      return {
        label: LOST_REASON_LABELS[r as LostReason] ?? r,
        count: cnt,
        pct: total > 0 ? (cnt / total) * 100 : 0,
        cumPct: total > 0 ? (cumulative / total) * 100 : 0,
        color: CHART_COLORS[i % CHART_COLORS.length],
      };
    });
  })();

  // By salesperson
  const spMap: Record<string, { total: number; lost: number; reasons: Record<string, number> }> = {};
  SALESPERSONS.forEach(sp => { spMap[sp] = { total: 0, lost: 0, reasons: {} }; });
  walkins.forEach(w => {
    if (!spMap[w.salesperson]) spMap[w.salesperson] = { total: 0, lost: 0, reasons: {} };
    spMap[w.salesperson].total += 1;
    if (w.dealStatus === 'did_not_buy') {
      spMap[w.salesperson].lost += 1;
      if (w.lostReason) {
        spMap[w.salesperson].reasons[w.lostReason] =
          (spMap[w.salesperson].reasons[w.lostReason] ?? 0) + 1;
      }
    }
  });
  const spData = Object.entries(spMap)
    .filter(([, d]) => d.total > 0)
    .map(([sp, d]) => ({
      name: sp,
      total: d.total,
      lost: d.lost,
      lostRate: d.total > 0 ? (d.lost / d.total) * 100 : 0,
      topReason: Object.entries(d.reasons).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    }))
    .sort((a, b) => b.lostRate - a.lostRate);

  // Pareto SVG chart
  const PARETO_W = 400, PARETO_H = 180;
  const PAD = { l: 30, r: 30, t: 16, b: 40 };
  const PW = PARETO_W - PAD.l - PAD.r;
  const PH = PARETO_H - PAD.t - PAD.b;
  const barW = paretoData.length > 0 ? PW / paretoData.length - 4 : 1;

  return (
    <div className="pb-4">
      <div className="bg-rose-800 text-white px-4 py-3 sticky top-0 z-10">
        <div className="text-xs text-rose-200 font-medium tracking-wide uppercase">Lost Sales Analysis</div>
        <div className="text-sm text-rose-100 mt-0.5">{total} lost sales total</div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 fade-in-up">
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm text-center">
            <div className="text-2xl font-bold text-red-600">{total}</div>
            <div className="text-xs text-stone-500 mt-0.5">Total Lost Sales</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm text-center">
            <div className="text-2xl font-bold text-stone-700">
              {walkins.length > 0 ? ((total / walkins.length) * 100).toFixed(1) : 0}%
            </div>
            <div className="text-xs text-stone-500 mt-0.5">Overall Loss Rate</div>
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="text-sm font-bold text-stone-800 mb-2">Lost Reasons Breakdown</div>
          <DonutChart data={donutData} centerLabel="lost sales" />
        </div>

        {/* Pareto Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-sm font-bold text-stone-800 mb-3">Pareto Analysis</div>
          <svg viewBox={`0 0 ${PARETO_W} ${PARETO_H}`} className="w-full">
            <defs>
              <linearGradient id="paretoLine" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>

            {/* Gridlines */}
            {[0, 25, 50, 75, 100].map(pct => {
              const y = PAD.t + PH - (pct / 100) * PH;
              return (
                <g key={pct}>
                  <line x1={PAD.l} y1={y} x2={PAD.l + PW} y2={y}
                    stroke="#ffe4e6" strokeWidth="1" strokeDasharray="2 2" />
                  <text x={PAD.l - 3} y={y + 4} textAnchor="end"
                    fill="#a8a29e" fontSize="9" fontFamily="system-ui">{pct}%</text>
                </g>
              );
            })}

            {/* Bars */}
            {paretoData.map((d, i) => {
              const x = PAD.l + i * (PW / paretoData.length) + 2;
              const bH = (d.pct / 100) * PH;
              const y = PAD.t + PH - bH;
              return (
                <g key={i}>
                  <rect x={x} y={y} width={Math.max(barW, 1)} height={bH}
                    fill={d.color} rx="2" opacity="0.85">
                    <animate attributeName="height" from="0" to={String(bH)}
                      dur="0.6s" begin={`${i * 0.06}s`} fill="freeze" />
                    <animate attributeName="y" from={String(PAD.t + PH)} to={String(y)}
                      dur="0.6s" begin={`${i * 0.06}s`} fill="freeze" />
                  </rect>
                  {/* X label */}
                  <text x={x + barW / 2} y={PARETO_H - PAD.b + 12}
                    textAnchor="middle" fill="#78716c" fontSize="8" fontFamily="system-ui">
                    {d.label.length > 10 ? d.label.slice(0, 9) + '…' : d.label}
                  </text>
                </g>
              );
            })}

            {/* Cumulative line */}
            {paretoData.length > 0 && (
              <polyline
                points={paretoData.map((d, i) => {
                  const x = PAD.l + (i + 0.5) * (PW / paretoData.length);
                  const y = PAD.t + PH - (d.cumPct / 100) * PH;
                  return `${x},${y}`;
                }).join(' ')}
                fill="none"
                stroke="#d97706"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {/* Cumulative dots */}
            {paretoData.map((d, i) => {
              const x = PAD.l + (i + 0.5) * (PW / paretoData.length);
              const y = PAD.t + PH - (d.cumPct / 100) * PH;
              return <circle key={i} cx={x} cy={y} r="3" fill="#d97706" stroke="white" strokeWidth="1.5" />;
            })}
          </svg>
          <div className="flex items-center gap-4 text-xs text-stone-500 mt-1">
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-rose-800" />Frequency
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-0.5 bg-amber-600" />Cumulative %
            </span>
          </div>
        </div>

        {/* By salesperson */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="text-sm font-bold text-stone-800 mb-3">Loss Rate by Salesperson</div>
          <div className="space-y-3">
            {spData.map((sp, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center flex-shrink-0">
                  {sp.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-semibold text-stone-700">{sp.name}</span>
                    <span className={`text-xs font-bold ${
                      sp.lostRate >= 70 ? 'text-red-600' : sp.lostRate >= 55 ? 'text-amber-600' : 'text-green-600'
                    }`}>
                      {sp.lostRate.toFixed(1)}% lost
                    </span>
                  </div>
                  <div className="h-2 bg-rose-50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${sp.lostRate}%`,
                        backgroundColor: sp.lostRate >= 70 ? '#ef4444' : sp.lostRate >= 55 ? '#d97706' : '#22c55e',
                      }}
                    />
                  </div>
                  {sp.topReason && (
                    <div className="text-xs text-stone-400 mt-0.5">
                      Top reason: {LOST_REASON_LABELS[sp.topReason as LostReason]}
                    </div>
                  )}
                </div>
                <div className="text-xs text-stone-400 flex-shrink-0">
                  {sp.lost}/{sp.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
