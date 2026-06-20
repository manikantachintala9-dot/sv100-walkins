import { useState, useRef, useCallback } from 'react';
import type { WalkIn, TrafficSource, CustomerType, Requirement, BudgetRange, LostReason, DealStatus } from '../types';
import {
  TRAFFIC_SOURCE_LABELS, CUSTOMER_TYPE_LABELS, REQUIREMENT_LABELS,
  BUDGET_LABELS, LOST_REASON_LABELS, SALESPERSONS, TODAY,
} from '../constants';

interface AddWalkinProps {
  walkins: WalkIn[];
  onAdd: (w: WalkIn) => void;
}

interface FormState {
  phone: string;
  customerName: string;
  trafficSource: TrafficSource | '';
  customerType: CustomerType | '';
  requirement: Requirement | '';
  budget: BudgetRange | '';
  salesperson: string;
  productsShown: string;
  dealStatus: DealStatus | '';
  billAmount: string;
  lostReason: LostReason | '';
  followUpDate: string;
  notes: string;
}

const EMPTY: FormState = {
  phone: '', customerName: '', trafficSource: '', customerType: '',
  requirement: '', budget: '', salesperson: '', productsShown: '',
  dealStatus: '', billAmount: '', lostReason: '', followUpDate: '', notes: '',
};

function ChipGroup<T extends string>({
  options, labels, value, onChange, required, error,
}: {
  options: T[]; labels: Record<string, string>; value: T | '';
  onChange: (v: T) => void; required?: boolean; error?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`px-3 py-2.5 rounded-lg text-sm font-medium border transition-all min-h-[44px] ${
              value === opt
                ? 'bg-rose-800 text-white border-rose-800 shadow-sm'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-400'
            }`}>
            {labels[opt]}
          </button>
        ))}
      </div>
      {required && error && (
        <p className="text-red-600 text-xs mt-1 slide-down">{error}</p>
      )}
    </div>
  );
}

export function AddWalkin({ walkins, onAdd }: AddWalkinProps) {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [returningCustomer, setReturningCustomer] = useState<WalkIn | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [timestamp] = useState(() => new Date().toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }));
  const phoneDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handlePhone = useCallback((val: string) => {
    set('phone', val);
    if (phoneDebounce.current) clearTimeout(phoneDebounce.current);
    phoneDebounce.current = setTimeout(() => {
      if (val.length >= 7) {
        const match = walkins
          .filter(w => w.phone === val)
          .sort((a, b) => b.datetime.localeCompare(a.datetime))[0];
        if (match) {
          setReturningCustomer(match);
          setForm(f => ({
            ...f, customerName: match.customerName, customerType: match.customerType,
          }));
        } else {
          setReturningCustomer(null);
        }
      } else {
        setReturningCustomer(null);
      }
    }, 300);
  }, [walkins]);

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.trafficSource) errs.trafficSource = 'Please select a traffic source';
    if (form.dealStatus === 'did_not_buy' && !form.lostReason)
      errs.lostReason = 'Please select a reason for not buying';
    if (form.dealStatus === 'did_not_buy' && form.notes.toLowerCase().includes('interested') && !form.followUpDate)
      errs.followUpDate = 'Customer seems interested — follow-up date is required';
    if (!form.dealStatus) errs.dealStatus = 'Please select deal status';
    if (!form.customerName.trim()) errs.customerName = 'Customer name is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const now = new Date();
    const dateStr = `${TODAY}T${now.toTimeString().slice(0, 8)}`;
    const newWalkIn: WalkIn = {
      id: `w_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      datetime: dateStr,
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      trafficSource: form.trafficSource as TrafficSource,
      customerType: (form.customerType || 'retail') as CustomerType,
      requirement: (form.requirement || 'other') as Requirement,
      budget: (form.budget || 'under_1000') as BudgetRange,
      salesperson: form.salesperson,
      productsShown: form.productsShown,
      dealStatus: form.dealStatus as DealStatus,
      billAmount: form.dealStatus === 'bought' ? Number(form.billAmount) || 0 : 0,
      lostReason: form.dealStatus === 'did_not_buy' ? (form.lostReason as LostReason) : undefined,
      followUpDate: form.followUpDate || undefined,
      notes: form.notes,
    };
    onAdd(newWalkIn);
    setForm(EMPTY);
    setReturningCustomer(null);
    setErrors({});
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-rose-800 text-white px-4 py-3 sticky top-0 z-10">
        <div className="text-xs text-rose-200 font-medium tracking-wide uppercase">Add Walk-in</div>
        <div className="text-sm text-rose-100 mt-0.5">{timestamp}</div>
      </div>

      {/* Success Toast */}
      {showToast && (
        <div className="fixed top-16 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg toast-in flex items-center gap-2">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
          Walk-in saved successfully!
        </div>
      )}

      <form onSubmit={handleSubmit} className="px-4 pt-4 space-y-5">
        {/* Phone with returning customer detection */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Phone Number
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={e => handlePhone(e.target.value)}
            placeholder="Enter 10-digit mobile number"
            className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white text-stone-800 text-base focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
            maxLength={10}
          />
          {returningCustomer && (
            <div className="mt-2 bg-amber-50 border border-amber-300 rounded-xl px-3 py-2.5 slide-down">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <div className="text-sm font-bold text-amber-800">RETURNING CUSTOMER ✓</div>
                  <div className="text-xs text-amber-700 mt-0.5">
                    {returningCustomer.customerName} — last visited {returningCustomer.datetime.split('T')[0]}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Customer Name */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Customer Name *</label>
          <input
            type="text"
            value={form.customerName}
            onChange={e => set('customerName', e.target.value)}
            placeholder="Full name"
            className={`w-full px-4 py-3 rounded-xl border bg-white text-stone-800 text-base focus:outline-none focus:ring-2 focus:ring-rose-100 ${
              errors.customerName ? 'border-red-400' : 'border-rose-200 focus:border-rose-600'
            }`}
          />
          {errors.customerName && <p className="text-red-600 text-xs mt-1">{errors.customerName}</p>}
        </div>

        {/* Traffic Source */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">
            Traffic Source <span className="text-red-500">*</span>
          </label>
          <ChipGroup
            options={Object.keys(TRAFFIC_SOURCE_LABELS) as TrafficSource[]}
            labels={TRAFFIC_SOURCE_LABELS}
            value={form.trafficSource}
            onChange={v => { set('trafficSource', v); setErrors(e => ({ ...e, trafficSource: '' })); }}
            required
            error={errors.trafficSource}
          />
        </div>

        {/* Customer Type */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Customer Type</label>
          <ChipGroup
            options={Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[]}
            labels={CUSTOMER_TYPE_LABELS}
            value={form.customerType}
            onChange={v => set('customerType', v)}
          />
        </div>

        {/* Requirement */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Requirement</label>
          <ChipGroup
            options={Object.keys(REQUIREMENT_LABELS) as Requirement[]}
            labels={REQUIREMENT_LABELS}
            value={form.requirement}
            onChange={v => set('requirement', v)}
          />
        </div>

        {/* Budget */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Budget Range</label>
          <ChipGroup
            options={Object.keys(BUDGET_LABELS) as BudgetRange[]}
            labels={BUDGET_LABELS}
            value={form.budget}
            onChange={v => set('budget', v)}
          />
        </div>

        {/* Salesperson */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Salesperson</label>
          <div className="flex flex-wrap gap-2">
            {SALESPERSONS.map(sp => (
              <button
                key={sp}
                type="button"
                onClick={() => set('salesperson', sp)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all min-h-[44px] ${
                  form.salesperson === sp
                    ? 'bg-rose-800 text-white border-rose-800'
                    : 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-400'
                }`}>
                {sp}
              </button>
            ))}
          </div>
        </div>

        {/* Products Shown */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Products Shown</label>
          <textarea
            value={form.productsShown}
            onChange={e => set('productsShown', e.target.value)}
            rows={2}
            placeholder="e.g. Kanchipuram silk, Pattu saree..."
            className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white text-stone-800 text-base focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100 resize-none"
          />
        </div>

        {/* Deal Status */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-2">
            Deal Status <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => { set('dealStatus', 'bought'); setErrors(e => ({ ...e, dealStatus: '' })); }}
              className={`py-4 rounded-xl text-base font-bold border-2 transition-all ${
                form.dealStatus === 'bought'
                  ? 'bg-green-600 text-white border-green-600 shadow-md'
                  : 'bg-green-50 text-green-700 border-green-200 hover:border-green-400'
              }`}>
              ✓ BOUGHT
            </button>
            <button
              type="button"
              onClick={() => { set('dealStatus', 'did_not_buy'); setErrors(e => ({ ...e, dealStatus: '' })); }}
              className={`py-4 rounded-xl text-base font-bold border-2 transition-all ${
                form.dealStatus === 'did_not_buy'
                  ? 'bg-rose-800 text-white border-rose-800 shadow-md'
                  : 'bg-rose-50 text-rose-800 border-rose-200 hover:border-rose-400'
              }`}>
              ✗ DID NOT BUY
            </button>
          </div>
          {errors.dealStatus && <p className="text-red-600 text-xs mt-1">{errors.dealStatus}</p>}
        </div>

        {/* Conditional: Bill Amount */}
        {form.dealStatus === 'bought' && (
          <div className="slide-down">
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">Bill Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-semibold">₹</span>
              <input
                type="number"
                value={form.billAmount}
                onChange={e => set('billAmount', e.target.value)}
                placeholder="0"
                min="0"
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-rose-200 bg-white text-stone-800 text-base focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100"
              />
            </div>
          </div>
        )}

        {/* Conditional: Lost Reason */}
        {form.dealStatus === 'did_not_buy' && (
          <div className="slide-down">
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Lost Reason <span className="text-red-500">*</span>
            </label>
            <ChipGroup
              options={Object.keys(LOST_REASON_LABELS) as LostReason[]}
              labels={LOST_REASON_LABELS}
              value={form.lostReason}
              onChange={v => { set('lostReason', v); setErrors(e => ({ ...e, lostReason: '' })); }}
              required
              error={errors.lostReason}
            />
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-semibold text-stone-700 mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={e => set('notes', e.target.value)}
            rows={3}
            placeholder="Any observations, preferences, or details about the customer..."
            className="w-full px-4 py-3 rounded-xl border border-rose-200 bg-white text-stone-800 text-sm focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-100 resize-none"
          />
          {form.dealStatus === 'did_not_buy' && form.notes.toLowerCase().includes('interested') && (
            <div className="mt-1.5 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 slide-down">
              <p className="text-amber-800 text-xs font-medium">
                💡 Customer seems interested — please set a follow-up date below.
              </p>
            </div>
          )}
        </div>

        {/* Follow-up Date */}
        {form.dealStatus === 'did_not_buy' && (
          <div className="slide-down">
            <label className="block text-sm font-semibold text-stone-700 mb-1.5">
              Follow-up Date
              {form.notes.toLowerCase().includes('interested') && (
                <span className="text-red-500 ml-1">*</span>
              )}
            </label>
            <input
              type="date"
              value={form.followUpDate}
              onChange={e => { set('followUpDate', e.target.value); setErrors(e2 => ({ ...e2, followUpDate: '' })); }}
              min={TODAY}
              className={`w-full px-4 py-3 rounded-xl border bg-white text-stone-800 text-base focus:outline-none focus:ring-2 focus:ring-rose-100 ${
                errors.followUpDate ? 'border-red-400' : 'border-rose-200 focus:border-rose-600'
              }`}
            />
            {errors.followUpDate && (
              <p className="text-red-600 text-xs mt-1 slide-down">{errors.followUpDate}</p>
            )}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-4 bg-rose-800 text-white font-bold text-base rounded-xl shadow-md hover:bg-rose-700 active:scale-95 transition-all mt-2">
          Save Walk-in →
        </button>

        <div className="h-4" />
      </form>
    </div>
  );
}
