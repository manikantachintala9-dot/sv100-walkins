import { useEffect, useMemo, useState } from 'react';
import type { AccountantReport, WalkIn } from '../types';
import { TODAY, formatINR } from '../constants';
import {
  dbFetchAccountantReports,
  dbUpsertAccountantReport,
  uploadAccountantReportFile,
} from '../lib/supabase';

interface AccountantReportsProps {
  walkins: WalkIn[];
}

interface FormState {
  date: string;
  walkInCount: string;
  totalRevenue: string;
  totalBills: string;
  submittedBy: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  date: TODAY,
  walkInCount: '',
  totalRevenue: '',
  totalBills: '',
  submittedBy: 'Accountant',
  notes: '',
};

function toNumber(value: string): number {
  return Number(value.replace(/,/g, '').trim()) || 0;
}

function statusTone(diff: number): string {
  if (diff === 0) return 'bg-green-50 text-green-700 border-green-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

export function AccountantReports({ walkins }: AccountantReportsProps) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [file, setFile] = useState<File | null>(null);
  const [reports, setReports] = useState<AccountantReport[]>([]);
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'saved' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    dbFetchAccountantReports()
      .then(data => {
        if (!mounted) return;
        setReports(data);
        setStatus('idle');
      })
      .catch(err => {
        console.error('Accountant reports load error:', err);
        if (!mounted) return;
        setError('Could not load accountant reports. Check the Supabase table and storage setup.');
        setStatus('error');
      });
    return () => {
      mounted = false;
    };
  }, []);

  const selectedReport = useMemo(
    () => reports.find(r => r.date === selectedDate),
    [reports, selectedDate]
  );

  const trackerTotals = useMemo(() => {
    const dayWalkins = walkins.filter(w => w.datetime.startsWith(selectedDate));
    const bought = dayWalkins.filter(w => w.dealStatus === 'bought');
    return {
      walkIns: dayWalkins.length,
      revenue: bought.reduce((sum, w) => sum + w.billAmount, 0),
      bills: bought.length,
    };
  }, [selectedDate, walkins]);

  const comparison = selectedReport
    ? {
        walkIns: selectedReport.walkInCount - trackerTotals.walkIns,
        revenue: selectedReport.totalRevenue - trackerTotals.revenue,
        bills: selectedReport.totalBills - trackerTotals.bills,
      }
    : null;

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(current => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus('saving');
    setError('');

    try {
      const reportFileUrl = file
        ? await uploadAccountantReportFile(form.date, file)
        : reports.find(r => r.date === form.date)?.reportFileUrl ?? null;

      const saved = await dbUpsertAccountantReport({
        id: `accountant_${form.date}`,
        date: form.date,
        walkInCount: toNumber(form.walkInCount),
        totalRevenue: toNumber(form.totalRevenue),
        totalBills: toNumber(form.totalBills),
        reportFileUrl,
        notes: form.notes.trim(),
        submittedBy: form.submittedBy.trim(),
      });

      setReports(current => [saved, ...current.filter(r => r.date !== saved.date)]
        .sort((a, b) => b.date.localeCompare(a.date)));
      setSelectedDate(saved.date);
      setFile(null);
      setStatus('saved');
    } catch (err) {
      console.error('Accountant report save error:', err);
      setError('Report could not be saved. Confirm the accountant_reports table and reports bucket exist.');
      setStatus('error');
    }
  }

  function loadReport(report: AccountantReport) {
    setForm({
      date: report.date,
      walkInCount: String(report.walkInCount),
      totalRevenue: String(report.totalRevenue),
      totalBills: String(report.totalBills),
      submittedBy: report.submittedBy || 'Accountant',
      notes: report.notes,
    });
    setSelectedDate(report.date);
    setFile(null);
  }

  return (
    <div className="pb-6">
      <div className="bg-rose-800 text-white px-4 py-3 sticky top-0 z-10">
        <div className="text-xs text-rose-200 font-medium tracking-wide uppercase">Day-End Verification</div>
        <div className="text-sm text-rose-100 mt-0.5">Accountant sales report upload</div>
      </div>

      <div className="px-4 pt-4 grid grid-cols-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] gap-4">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4 space-y-4">
          <div>
            <div className="text-sm font-bold text-stone-800">Upload Report</div>
            <div className="text-xs text-stone-500 mt-0.5">One report per date. Re-submitting updates the same day.</div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm font-semibold text-stone-700 mb-1.5">Date</span>
              <input
                type="date"
                value={form.date}
                onChange={e => { set('date', e.target.value); setSelectedDate(e.target.value); }}
                className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white text-stone-800 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
                required
              />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-stone-700 mb-1.5">Submitted By</span>
              <input
                type="text"
                value={form.submittedBy}
                onChange={e => set('submittedBy', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white text-stone-800 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="block">
              <span className="block text-sm font-semibold text-stone-700 mb-1.5">Walk-ins</span>
              <input
                type="number"
                min="0"
                value={form.walkInCount}
                onChange={e => set('walkInCount', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white text-stone-800 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
                required
              />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-stone-700 mb-1.5">Sales Amount</span>
              <input
                inputMode="numeric"
                value={form.totalRevenue}
                onChange={e => set('totalRevenue', e.target.value)}
                placeholder="0"
                className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white text-stone-800 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
                required
              />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-stone-700 mb-1.5">Bills</span>
              <input
                type="number"
                min="0"
                value={form.totalBills}
                onChange={e => set('totalBills', e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white text-stone-800 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-sm font-semibold text-stone-700 mb-1.5">Sales Report File</span>
            <input
              type="file"
              accept=".pdf,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-rose-800 file:px-3 file:py-2 file:text-white file:text-sm file:font-semibold"
            />
            {file && <div className="text-xs text-stone-500 mt-1">{file.name}</div>}
          </label>

          <label className="block">
            <span className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</span>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white text-stone-800 focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
            />
          </label>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}
          {status === 'saved' && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">Report saved.</div>
          )}

          <button
            type="submit"
            disabled={status === 'saving'}
            className="w-full min-h-[46px] rounded-xl bg-rose-800 text-white font-bold text-sm shadow-sm disabled:opacity-60">
            {status === 'saving' ? 'Saving…' : 'Save Accountant Report'}
          </button>
        </form>

        <div className="space-y-4">
          <section className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-4">
              <div>
                <div className="text-sm font-bold text-stone-800">Verify Day</div>
                <div className="text-xs text-stone-500 mt-0.5">Compare accountant totals with tracker entries.</div>
              </div>
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-rose-200 text-sm text-stone-800 focus:outline-none focus:border-rose-600"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">
                <div className="text-xs text-stone-500">Tracker Walk-ins</div>
                <div className="text-xl font-bold text-rose-800 mt-1">{trackerTotals.walkIns}</div>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">
                <div className="text-xs text-stone-500">Tracker Sales</div>
                <div className="text-base font-bold text-rose-800 mt-1">{formatINR(trackerTotals.revenue)}</div>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-100 p-3">
                <div className="text-xs text-stone-500">Tracker Bills</div>
                <div className="text-xl font-bold text-rose-800 mt-1">{trackerTotals.bills}</div>
              </div>
            </div>

            {selectedReport ? (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-stone-50 border border-stone-200 p-3">
                    <div className="text-xs text-stone-500">Accountant Walk-ins</div>
                    <div className="text-xl font-bold text-stone-800 mt-1">{selectedReport.walkInCount}</div>
                  </div>
                  <div className="rounded-xl bg-stone-50 border border-stone-200 p-3">
                    <div className="text-xs text-stone-500">Accountant Sales</div>
                    <div className="text-base font-bold text-stone-800 mt-1">{formatINR(selectedReport.totalRevenue)}</div>
                  </div>
                  <div className="rounded-xl bg-stone-50 border border-stone-200 p-3">
                    <div className="text-xs text-stone-500">Accountant Bills</div>
                    <div className="text-xl font-bold text-stone-800 mt-1">{selectedReport.totalBills}</div>
                  </div>
                </div>

                {comparison && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${statusTone(comparison.walkIns)}`}>
                      Walk-in diff: {comparison.walkIns > 0 ? '+' : ''}{comparison.walkIns}
                    </div>
                    <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${statusTone(comparison.revenue)}`}>
                      Sales diff: {comparison.revenue > 0 ? '+' : ''}{formatINR(comparison.revenue)}
                    </div>
                    <div className={`rounded-xl border px-3 py-2 text-sm font-semibold ${statusTone(comparison.bills)}`}>
                      Bills diff: {comparison.bills > 0 ? '+' : ''}{comparison.bills}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => loadReport(selectedReport)}
                    className="px-3 py-2 rounded-lg border border-rose-200 text-rose-800 text-sm font-semibold">
                    Edit Report
                  </button>
                  {selectedReport.reportFileUrl && (
                    <a
                      href={selectedReport.reportFileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-2 rounded-lg bg-rose-800 text-white text-sm font-semibold">
                      Open File
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800">
                No accountant report uploaded for this date yet.
              </div>
            )}
          </section>

          <section className="bg-white rounded-2xl shadow-sm border border-rose-100 p-4">
            <div className="text-sm font-bold text-stone-800 mb-3">Recent Accountant Reports</div>
            {status === 'loading' ? (
              <div className="text-sm text-stone-500">Loading reports…</div>
            ) : reports.length === 0 ? (
              <div className="text-sm text-stone-500">No reports submitted yet.</div>
            ) : (
              <div className="space-y-2">
                {reports.slice(0, 8).map(report => (
                  <button
                    key={report.id}
                    type="button"
                    onClick={() => loadReport(report)}
                    className="w-full text-left rounded-xl border border-rose-100 hover:border-rose-300 px-3 py-3 transition-colors">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-bold text-stone-800">{report.date}</div>
                        <div className="text-xs text-stone-500 mt-0.5">
                          {report.walkInCount} walk-ins · {formatINR(report.totalRevenue)} · {report.totalBills} bills
                        </div>
                      </div>
                      <div className="text-xs text-rose-700 font-semibold">{report.submittedBy || 'Accountant'}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
