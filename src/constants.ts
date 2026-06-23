import type {
  TrafficSource, CustomerType, Requirement, BudgetRange, LostReason,
} from './types';

export const TODAY = new Date().toISOString().split('T')[0];

export const TRAFFIC_SOURCE_LABELS: Record<TrafficSource, string> = {
  google_maps: 'Google Maps',
  youtube: 'YouTube',
  instagram: 'Instagram',
  whatsapp: 'WhatsApp',
  referral: 'Referral',
  passing_traffic: 'Walk-by',
  old_customer: 'Old Customer',
  ad: 'Advertisement',
  other: 'Other',
};

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  retail: 'Retail',
  wholesale: 'Wholesale',
  wedding: 'Wedding',
  reseller: 'Reseller',
  casual_visitor: 'Casual Visitor',
};

export const REQUIREMENT_LABELS: Record<Requirement, string> = {
  silk_saree: 'Silk Saree',
  fancy_saree: 'Fancy Saree',
  bridal: 'Bridal',
  pattu: 'Pattu',
  kanchipuram: 'Kanchipuram',
  cotton: 'Cotton',
  readymade: 'Readymade',
  accessories: 'Accessories',
  other: 'Other',
};

export const BUDGET_LABELS: Record<BudgetRange, string> = {
  under_1000: 'Under ₹1K',
  '1000_5000': '₹1K – 5K',
  '5000_15000': '₹5K – 15K',
  '15000_50000': '₹15K – 50K',
  '50000_plus': '₹50K+',
};

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  price_too_high: 'Price Too High',
  didnt_find_design: 'Didn\'t Find Design',
  just_browsing: 'Just Browsing',
  need_to_check_others: 'Checking Others',
  will_come_back: 'Will Come Back',
  budget_constraints: 'Budget Constraint',
  not_right_time: 'Not Right Time',
  comparing_options: 'Comparing Options',
  other: 'Other',
};

export const SALESPERSONS = ['Kavitha', 'Rajan', 'Preethi', 'Suresh', 'Meenakshi'];

export const CHART_COLORS = [
  '#9f1239', '#d97706', '#be123c', '#b45309',
  '#e11d48', '#f59e0b', '#881337', '#92400e',
  '#fbbf24', '#fb7185',
];

export const SOURCE_COLORS: Record<TrafficSource, string> = {
  google_maps: '#9f1239',
  instagram: '#d97706',
  passing_traffic: '#be123c',
  whatsapp: '#b45309',
  referral: '#e11d48',
  youtube: '#f59e0b',
  old_customer: '#881337',
  ad: '#92400e',
  other: '#a8a29e',
};

export const DAILY_TARGET = 100;

export function formatINR(amount: number): string {
  return '₹' + amount.toLocaleString('en-IN');
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
}
