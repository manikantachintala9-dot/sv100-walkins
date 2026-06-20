import type { WalkIn } from '../types';
import { TODAY, DAILY_TARGET, formatINR, TRAFFIC_SOURCE_LABELS, LOST_REASON_LABELS, REQUIREMENT_LABELS } from '../constants';
import { LineChart } from './charts/LineChart';

interface DashboardProps {
  walkins: WalkIn[];
}

function polarToSVG(cx: number, cy: number, r: number, angleDegFrom12: number) {
  const rad = (angleDegFrom12 - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function gaugeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const norm = ((endDeg - startDeg) % 360 + 360) % 360;
  if (norm < 0.5) return '';
  const s = polarToSVG(cx, cy, r, startDeg);
  const e = polarToSVG(cx, cy, r, endDeg);
  const large = norm > 180 ? 1 : 0;
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
}

function isHotCustomer(w: WalkIn): boolean {
  if (w.dealStatus !== 'did_not_buy') return false;
  if (w.customerType === 'wedding' || w.requirement === 'bridal') return true;
  if (w.followUpDate) {
    const now = new Date(TODAY + 'T00:00:00');
    const follow = new Date(w.followUpDate + 'T00:00:00');
    const diffHours = (follow.getTime() - now.getTime()) / (1000 * 60 * 60);
    if (diffHours >= 0 && diffHours <= 48) return true;
  }
  return false;
}

export function Dashboard({ walkins }: DashboardProps) {
  const todayWalkins = walkins.filter(w => w.datetime.startsWith(TODAY));
  const count = todayWalkins.length;
  const converted = todayWalkins.filter(w => w.dealStatus === 'bought');
  const lost = todayWalkins.filter(w => w.dealStatus === 'did_not_buy');
  const revenue = converted.reduce((s, w) => s + w.billAmount, 0);
  const hotCustomers = todayWalkins.filter(isHotCustomer);

  // Top lost reasons today
  const lostReasonMap: Record<string, number> = {};
  lost.forEach(w => {
    if (w.lostReason) lostReasonMap[w.lostReason] = (lostReasonMap[w.lostReason] ?? 0) + 1;
  });
  const topLost = Object.entries(lostReasonMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // 7-day trend
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(TODAY + 'T00:00:00');
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toISOString().split('T')[0];
    const dayCount = walkins.filter(w => w.datetime.startsWith(ds)).length;
    return {
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }).slice(0, 5),
      value: dayCount,
    };
  });

  // Gauge math
  const CX = 110, CY = 115, R = 85;
  const GAUGE_START = 225, GAUGE_TOTAL = 270;
  const pct = Math.min(count / DAILY_TARGET, 1);
  const progressEnd = GAUGE_START + pct * GAUGE_TOTAL;
  const bgPath = gaugeArc(CX, CY, R, GAUGE_START, GAUGE_START + GAUGE_TOTAL);
  const progPath = pct > 0.01 ? gaugeArc(CX, CY, R, GAUGE_START, progressEnd) : '';

  const now = new Date();
  const dayStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-rose-800 text-white px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-rose-200 font-medium tracking-wide uppercase">SV 100 Walk-ins Tracker</div>
            <div className="text-sm text-rose-100 mt-0.5">{dayStr}</div>
          </div>
          <div className="text-right">
            <div className="text-xs text-rose-200">Daily Target</div>
            <div className="text-lg font-bold text-amber-400">{DAILY_TARGET}</div>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {/* Gauge + Stats Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 overflow-hidden fade-in-up">
          <div className="flex flex-col items-center pt-4 pb-2">
            <svg viewBox="0 0 220 160" className="w-48 h-auto">
              <defs>
                <linearGradient id="gaugeGrad" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#9f1239" />
                  <stop offset="60%" stopColor="#be123c" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                <linearGradient id="gaugeBg" x1="0" x2="1" y1="0" y2="0">
                  <stop offset="0%" stopColor="#ffe4e6" />
                  <stop offset="100%" stopColor="#fecdd3" />
                </linearGradient>
              </defs>
              {/* Background arc */}
              <path d={bgPath} fill="none" stroke="#ffe4e6" strokeWidth="16"
                strokeLinecap="round" />
              {/* Progress arc */}
              {progPath && (
                <path d={progPath} fill="none" stroke="url(#gaugeGrad)" strokeWidth="16"
                  strokeLinecap="round">
                  <animate attributeName="stroke-dasharray"
                    from={`0 1000`}
                    to={`1000 0`}
                    dur="1.2s" fill="freeze" />
                </path>
              )}
              {/* Center count */}
              <text x={CX} y={CY - 10} textAnchor="middle"
                fill="#9f1239" fontSize="38" fontWeight="800" fontFamily="system-ui">
                {count}
              </text>
              <text x={CX} y={CY + 10} textAnchor="middle"
                fill="#78716c" fontSize="12" fontFamily="system-ui">
                / {DAILY_TARGET} walk-ins
              </text>
              {/* Percentage badge */}
              <rect x={CX - 22} y={CY + 20} width={44} height={18} rx="9"
                fill={pct >= 1 ? '#16a34a' : pct >= 0.5 ? '#d97706' : '#9f1239'} opacity="0.12" />
              <text x={CX} y={CY + 32} textAnchor="middle"
                fill={pct >= 1 ? '#16a34a' : pct >= 0.5 ? '#d97706' : '#9f1239'}
                fontSize="10" fontWeight="700" fontFamily="system-ui">
                {(pct * 100).toFixed(0)}%
              </text>
              {/* Start/end labels */}
              <text x={20} y={152} fill="#a8a29e" fontSize="10" fontFamily="system-ui">0</text>
              <text x={192} y={152} textAnchor="end" fill="#a8a29e" fontSize="10" fontFamily="system-ui">100</text>
            </svg>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 border-t border-rose-50">
            <div className="flex flex-col items-center py-3 border-r border-rose-50">
              <div className="text-xl font-bold text-green-600">{converted.length}</div>
              <div className="text-xs text-stone-500 mt-0.5">Converted</div>
            </div>
            <div className="flex flex-col items-center py-3 border-r border-rose-50">
              <div className="text-lg font-bold text-rose-800 leading-tight">
                {revenue >= 100000
                  ? `₹${(revenue / 100000).toFixed(1)}L`
                  : revenue >= 1000
                  ? `₹${(revenue / 1000).toFixed(1)}K`
                  : formatINR(revenue)}
              </div>
              <div className="text-xs text-stone-500 mt-0.5">Revenue</div>
            </div>
            <div className="flex flex-col items-center py-3">
              <div className="text-xl font-bold text-red-600">{lost.length}</div>
              <div className="text-xs text-stone-500 mt-0.5">Lost</div>
            </div>
          </div>
        </div>

        {/* Hot Customers */}
        {hotCustomers.length > 0 && (
          <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">🔥</span>
              <span className="text-sm font-bold text-stone-800">Hot Customers</span>
              <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {hotCustomers.length}
              </span>
            </div>
            <div className="space-y-2">
              {hotCustomers.map((w, i) => {
                const followTomorrow = w.followUpDate === '2026-06-21';
                const followDayAfter = w.followUpDate === '2026-06-22';
                return (
                  <div key={w.id}
                    className="hot-pulse bg-white rounded-xl p-3"
                    style={{ animationDelay: `${i * 0.2}s` }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-rose-800 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                            {w.customerName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-stone-800 truncate">{w.customerName}</div>
                            <div className="text-xs text-stone-500">{w.phone}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2 ml-10">
                          <span className="text-xs bg-rose-50 text-rose-800 px-2 py-0.5 rounded-full border border-rose-200">
                            {REQUIREMENT_LABELS[w.requirement]}
                          </span>
                          {w.customerType === 'wedding' && (
                            <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                              Wedding
                            </span>
                          )}
                          {w.salesperson && (
                            <span className="text-xs text-stone-500">via {w.salesperson}</span>
                          )}
                        </div>
                      </div>
                      {w.followUpDate && (
                        <div className="flex-shrink-0 text-right">
                          <div className={`text-xs font-bold px-2 py-1 rounded-lg ${
                            followTomorrow
                              ? 'bg-amber-500 text-white'
                              : followDayAfter
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-50 text-rose-800'
                          }`}>
                            {followTomorrow ? '📞 Tomorrow' : followDayAfter ? 'Day after' : w.followUpDate}
                          </div>
                        </div>
                      )}
                    </div>
                    {w.notes && (
                      <div className="text-xs text-stone-600 mt-1.5 ml-10 italic line-clamp-1">{w.notes}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Lost Reasons */}
        {topLost.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.15s' }}>
            <div className="text-sm font-bold text-stone-800 mb-3">Today's Top Lost Reasons</div>
            <div className="space-y-2">
              {topLost.map(([reason, cnt]) => {
                const pctBar = (cnt / (lost.length || 1)) * 100;
                return (
                  <div key={reason}>
                    <div className="flex justify-between text-xs text-stone-600 mb-1">
                      <span>{LOST_REASON_LABELS[reason as keyof typeof LOST_REASON_LABELS] ?? reason}</span>
                      <span className="font-semibold text-rose-800">{cnt}</span>
                    </div>
                    <div className="h-2 bg-rose-50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-rose-800 to-amber-500 rounded-full"
                        style={{ width: `${pctBar}%`, transition: 'width 0.8s ease' }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7-Day Trend */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-sm font-bold text-stone-800 mb-2">7-Day Walk-in Trend</div>
          <LineChart data={trendData} showTarget targetValue={DAILY_TARGET} />
          <div className="flex items-center gap-3 mt-2 text-xs text-stone-500">
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-0.5 bg-rose-800 rounded" />Line
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-amber-500" />Target ({DAILY_TARGET})
            </span>
          </div>
        </div>

        {/* Traffic Source Summary */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.25s' }}>
          <div className="text-sm font-bold text-stone-800 mb-3">Today by Source</div>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(
              todayWalkins.reduce((acc, w) => {
                acc[w.trafficSource] = (acc[w.trafficSource] ?? 0) + 1;
                return acc;
              }, {} as Record<string, number>)
            )
              .sort((a, b) => b[1] - a[1])
              .slice(0, 6)
              .map(([src, n]) => (
                <div key={src} className="bg-rose-50 rounded-xl p-2 text-center">
                  <div className="text-lg font-bold text-rose-800">{n}</div>
                  <div className="text-xs text-stone-600 leading-tight mt-0.5">
                    {TRAFFIC_SOURCE_LABELS[src as keyof typeof TRAFFIC_SOURCE_LABELS]}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
