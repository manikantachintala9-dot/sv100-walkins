import { useState } from 'react';
import type { WalkIn } from '../types';
import { TODAY, DAILY_TARGET } from '../constants';

interface SalesFunnelProps {
  walkins: WalkIn[];
}

type Period = 'today' | 'week' | 'all';

function isQualified(w: WalkIn): boolean {
  return (
    w.customerType !== 'casual_visitor' &&
    w.productsShown.trim().length > 0
  );
}

function getWeekStart(): string {
  const d = new Date(TODAY + 'T00:00:00');
  d.setDate(d.getDate() - 6);
  return d.toISOString().split('T')[0];
}

function FunnelShape({
  stages,
}: {
  stages: { label: string; sublabel: string; count: number; pct: number; color: string; icon: string }[];
}) {
  const VW = 320, PAD = 24;
  const stageH = 72, gapH = 28;
  const totalH = stages.length * stageH + (stages.length - 1) * gapH + PAD * 2;
  const maxW = VW - PAD * 2;

  return (
    <svg viewBox={`0 0 ${VW} ${totalH}`} className="w-full">
      <defs>
        {stages.map((s, i) => (
          <linearGradient key={i} id={`funnelGrad${i}`} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor={s.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={s.color} stopOpacity="0.7" />
          </linearGradient>
        ))}
      </defs>

      {stages.map((s, i) => {
        const w = maxW * (1 - i * 0.22);
        const x = (VW - w) / 2;
        const y = PAD + i * (stageH + gapH);
        const nextW = maxW * (1 - (i + 1) * 0.22);
        const nextX = (VW - nextW) / 2;
        const isLast = i === stages.length - 1;

        return (
          <g key={i}>
            {/* Connector trapezoid to next stage */}
            {!isLast && (
              <path
                d={`M ${x + 8} ${y + stageH} L ${x + w - 8} ${y + stageH} L ${nextX + nextW - 8} ${y + stageH + gapH} L ${nextX + 8} ${y + stageH + gapH} Z`}
                fill={s.color}
                opacity="0.15"
              />
            )}

            {/* Stage box */}
            <rect x={x} y={y} width={w} height={stageH} rx="10"
              fill={`url(#funnelGrad${i})`} />

            {/* Icon */}
            <text x={x + 18} y={y + stageH / 2 + 5}
              fontSize="20" fontFamily="system-ui">{s.icon}</text>

            {/* Label */}
            <text x={x + 46} y={y + stageH / 2 - 6}
              fill="white" fontSize="13" fontWeight="700" fontFamily="system-ui">
              {s.label}
            </text>
            <text x={x + 46} y={y + stageH / 2 + 10}
              fill="white" fontSize="10" opacity="0.85" fontFamily="system-ui">
              {s.sublabel}
            </text>

            {/* Count badge */}
            <rect x={x + w - 60} y={y + stageH / 2 - 16} width={52} height={32} rx="8"
              fill="white" opacity="0.2" />
            <text x={x + w - 34} y={y + stageH / 2 - 2}
              textAnchor="middle" fill="white" fontSize="18" fontWeight="800" fontFamily="system-ui">
              {s.count}
            </text>
            <text x={x + w - 34} y={y + stageH / 2 + 12}
              textAnchor="middle" fill="white" fontSize="9" opacity="0.9" fontFamily="system-ui">
              {s.pct > 0 ? `${s.pct.toFixed(0)}%` : '—'}
            </text>

            {/* Drop-off arrow label */}
            {!isLast && (
              <>
                <text x={VW / 2} y={y + stageH + gapH / 2 + 4}
                  textAnchor="middle" fill="#78716c" fontSize="10" fontWeight="600" fontFamily="system-ui">
                  ↓ {stages[i + 1].count > 0 && s.count > 0
                    ? `${((stages[i + 1].count / s.count) * 100).toFixed(0)}% advance`
                    : 'no data'}
                </text>
              </>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function SalesFunnel({ walkins }: SalesFunnelProps) {
  const [period, setPeriod] = useState<Period>('week');
  const weekStart = getWeekStart();

  const filtered = walkins.filter(w => {
    if (period === 'today') return w.datetime.startsWith(TODAY);
    if (period === 'week') return w.datetime.split('T')[0] >= weekStart;
    return true;
  });

  const totalLeads = filtered.length;
  const qualified = filtered.filter(isQualified);
  const closed = filtered.filter(w => w.dealStatus === 'bought');
  const qualifiedAndClosed = qualified.filter(w => w.dealStatus === 'bought');

  // Funnel 1: Lead → Qualification
  const funnel1 = [
    {
      label: 'Walk-ins (Leads)',
      sublabel: period === 'today' ? `Target: ${DAILY_TARGET}/day` : 'All visitors',
      count: totalLeads,
      pct: period === 'today' ? (totalLeads / DAILY_TARGET) * 100 : 100,
      color: '#9f1239',
      icon: '🚶',
    },
    {
      label: 'Qualified Leads',
      sublabel: 'Shown products, not casual',
      count: qualified.length,
      pct: totalLeads > 0 ? (qualified.length / totalLeads) * 100 : 0,
      color: '#d97706',
      icon: '✅',
    },
  ];

  // Funnel 2: Qualification → Closed
  const funnel2 = [
    {
      label: 'Qualified Leads',
      sublabel: 'Engaged prospects',
      count: qualified.length,
      pct: 100,
      color: '#d97706',
      icon: '✅',
    },
    {
      label: 'Sale Closed',
      sublabel: 'Purchased today',
      count: qualifiedAndClosed.length,
      pct: qualified.length > 0 ? (qualifiedAndClosed.length / qualified.length) * 100 : 0,
      color: '#16a34a',
      icon: '💰',
    },
  ];

  // Summary metrics
  const overallConversion = totalLeads > 0
    ? ((closed.length / totalLeads) * 100).toFixed(1) : '0';
  const qualRate = totalLeads > 0
    ? ((qualified.length / totalLeads) * 100).toFixed(1) : '0';
  const closeRate = qualified.length > 0
    ? ((qualifiedAndClosed.length / qualified.length) * 100).toFixed(1) : '0';

  const todayCount = walkins.filter(w => w.datetime.startsWith(TODAY)).length;
  const toTarget = Math.max(0, DAILY_TARGET - todayCount);

  const PERIODS: { key: Period; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Last 7 Days' },
    { key: 'all', label: 'All Time' },
  ];

  return (
    <div className="pb-4">
      <div className="bg-rose-800 text-white px-4 py-3 sticky top-0 z-10">
        <div className="text-xs text-rose-200 font-medium tracking-wide uppercase">Sales Funnel</div>
        <div className="text-sm text-rose-100 mt-0.5">Lead → Qualification → Closed</div>
      </div>

      <div className="px-4 pt-4 space-y-4">

        {/* Today's target banner */}
        <div className={`rounded-2xl p-4 fade-in-up ${
          todayCount >= DAILY_TARGET
            ? 'bg-green-600 text-white'
            : 'bg-rose-800 text-white'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold">{todayCount} <span className="text-base font-normal opacity-80">/ {DAILY_TARGET}</span></div>
              <div className="text-sm opacity-90 mt-0.5">Today's walk-ins</div>
            </div>
            <div className="text-right">
              {todayCount >= DAILY_TARGET ? (
                <div className="text-3xl">🎯</div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{toTarget}</div>
                  <div className="text-sm opacity-80">more needed</div>
                </>
              )}
            </div>
          </div>
          <div className="mt-3 h-2.5 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${Math.min((todayCount / DAILY_TARGET) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* Period selector */}
        <div className="flex gap-2">
          {PERIODS.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                period === p.key
                  ? 'bg-rose-800 text-white border-rose-800'
                  : 'bg-white text-rose-800 border-rose-200'
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Key metrics row */}
        <div className="grid grid-cols-3 gap-2 fade-in-up">
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm text-center">
            <div className="text-xl font-bold text-rose-800">{qualRate}%</div>
            <div className="text-xs text-stone-500 mt-0.5 leading-tight">Qualification Rate</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm text-center">
            <div className="text-xl font-bold text-amber-600">{closeRate}%</div>
            <div className="text-xs text-stone-500 mt-0.5 leading-tight">Close Rate</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-rose-100 shadow-sm text-center">
            <div className="text-xl font-bold text-green-600">{overallConversion}%</div>
            <div className="text-xs text-stone-500 mt-0.5 leading-tight">Overall Conv.</div>
          </div>
        </div>

        {/* Funnel 1: Lead → Qualification */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-rose-800 text-white text-xs font-bold flex items-center justify-center">1</div>
            <div>
              <div className="text-sm font-bold text-stone-800">Lead → Qualification</div>
              <div className="text-xs text-stone-500">How many walk-ins become engaged prospects</div>
            </div>
          </div>
          <FunnelShape stages={funnel1} />
          <div className="mt-3 bg-rose-50 rounded-xl p-3 text-xs text-stone-600">
            <span className="font-semibold text-rose-800">Qualification criteria:</span> Products shown to customer + not a casual visitor
          </div>
        </div>

        {/* Funnel 2: Qualification → Closed */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center">2</div>
            <div>
              <div className="text-sm font-bold text-stone-800">Qualification → Sale Closed</div>
              <div className="text-xs text-stone-500">How many qualified leads result in a purchase</div>
            </div>
          </div>
          <FunnelShape stages={funnel2} />
          <div className="mt-3 bg-amber-50 rounded-xl p-3 text-xs text-stone-600">
            <span className="font-semibold text-amber-700">Tip:</span> A {Number(closeRate) < 40 ? 'low' : 'healthy'} close rate of {closeRate}% means{' '}
            {Number(closeRate) < 40
              ? 'focus on overcoming objections — check Lost Sales for the top reasons.'
              : 'your team is converting well once they qualify a lead.'}
          </div>
        </div>

        {/* Combined full funnel */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.15s' }}>
          <div className="text-sm font-bold text-stone-800 mb-3">Full Pipeline View</div>
          <FunnelShape stages={[
            { label: 'Walk-ins', sublabel: 'Total leads', count: totalLeads, pct: 100, color: '#9f1239', icon: '🚶' },
            { label: 'Qualified', sublabel: 'Engaged prospects', count: qualified.length, pct: totalLeads > 0 ? (qualified.length / totalLeads) * 100 : 0, color: '#d97706', icon: '✅' },
            { label: 'Sale Closed', sublabel: 'Purchased', count: qualifiedAndClosed.length, pct: qualified.length > 0 ? (qualifiedAndClosed.length / qualified.length) * 100 : 0, color: '#16a34a', icon: '💰' },
          ]} />
        </div>

        {/* Salesperson funnel breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-sm font-bold text-stone-800 mb-3">Pipeline by Salesperson</div>
          <div className="space-y-3">
            {(['Kavitha', 'Meenakshi', 'Preethi', 'Rajan', 'Suresh'] as const).map(sp => {
              const spWalkins = filtered.filter(w => w.salesperson === sp);
              const spQual = spWalkins.filter(isQualified);
              const spClosed = spQual.filter(w => w.dealStatus === 'bought');
              if (spWalkins.length === 0) return null;
              return (
                <div key={sp} className="border border-rose-50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-800 text-xs font-bold flex items-center justify-center">
                        {sp[0]}
                      </div>
                      <span className="text-sm font-semibold text-stone-700">{sp}</span>
                    </div>
                    <span className="text-xs text-stone-400">{spWalkins.length} leads</span>
                  </div>
                  <div className="flex gap-2 text-xs">
                    {[
                      { label: 'Leads', count: spWalkins.length, color: 'bg-rose-800' },
                      { label: 'Qualified', count: spQual.length, color: 'bg-amber-500' },
                      { label: 'Closed', count: spClosed.length, color: 'bg-green-600' },
                    ].map((stage, i) => (
                      <div key={i} className="flex-1 text-center bg-stone-50 rounded-lg py-1.5">
                        <div className={`text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center mx-auto mb-0.5 ${stage.color}`}>
                          {stage.count}
                        </div>
                        <div className="text-stone-500 text-xs">{stage.label}</div>
                      </div>
                    ))}
                    <div className="flex-1 text-center bg-green-50 rounded-lg py-1.5">
                      <div className="text-green-700 font-bold text-sm">
                        {spQual.length > 0 ? `${((spClosed.length / spQual.length) * 100).toFixed(0)}%` : '—'}
                      </div>
                      <div className="text-stone-500 text-xs">Close %</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
