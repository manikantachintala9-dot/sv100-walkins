import { createClient } from '@supabase/supabase-js';
import type { AccountantReport, WalkIn } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// DB row shape (snake_case) ↔ WalkIn (camelCase)
interface Row {
  id: string;
  datetime: string;
  customer_name: string;
  phone: string;
  traffic_source: string;
  customer_type: string;
  requirement: string;
  budget: string;
  salesperson: string;
  products_shown: string;
  deal_status: string;
  bill_amount: number;
  lost_reason: string | null;
  follow_up_date: string | null;
  notes: string;
}

interface AccountantReportRow {
  id: string;
  date: string;
  walk_in_count: number;
  total_revenue: number;
  total_bills: number | null;
  report_file_url: string | null;
  notes: string | null;
  submitted_by: string | null;
  created_at: string;
}

export function toRow(w: WalkIn): Row {
  return {
    id: w.id,
    datetime: w.datetime,
    customer_name: w.customerName,
    phone: w.phone,
    traffic_source: w.trafficSource,
    customer_type: w.customerType,
    requirement: w.requirement,
    budget: w.budget,
    salesperson: w.salesperson,
    products_shown: w.productsShown,
    deal_status: w.dealStatus,
    bill_amount: w.billAmount,
    lost_reason: w.lostReason ?? null,
    follow_up_date: w.followUpDate ?? null,
    notes: w.notes,
  };
}

function fromAccountantReportRow(row: AccountantReportRow): AccountantReport {
  return {
    id: row.id,
    date: row.date,
    walkInCount: row.walk_in_count,
    totalRevenue: Number(row.total_revenue ?? 0),
    totalBills: row.total_bills ?? 0,
    reportFileUrl: row.report_file_url,
    notes: row.notes ?? '',
    submittedBy: row.submitted_by ?? '',
    createdAt: row.created_at,
  };
}

function toAccountantReportRow(report: Omit<AccountantReport, 'createdAt'>): Omit<AccountantReportRow, 'created_at'> {
  return {
    id: report.id,
    date: report.date,
    walk_in_count: report.walkInCount,
    total_revenue: report.totalRevenue,
    total_bills: report.totalBills,
    report_file_url: report.reportFileUrl,
    notes: report.notes,
    submitted_by: report.submittedBy,
  };
}

export function fromRow(row: Row): WalkIn {
  return {
    id: row.id,
    datetime: row.datetime,
    customerName: row.customer_name,
    phone: row.phone ?? '',
    trafficSource: row.traffic_source as WalkIn['trafficSource'],
    customerType: row.customer_type as WalkIn['customerType'],
    requirement: row.requirement as WalkIn['requirement'],
    budget: row.budget as WalkIn['budget'],
    salesperson: row.salesperson ?? '',
    productsShown: row.products_shown ?? '',
    dealStatus: row.deal_status as WalkIn['dealStatus'],
    billAmount: row.bill_amount ?? 0,
    lostReason: (row.lost_reason ?? undefined) as WalkIn['lostReason'],
    followUpDate: row.follow_up_date ?? undefined,
    notes: row.notes ?? '',
  };
}

export async function dbFetchAll(): Promise<WalkIn[]> {
  const { data, error } = await supabase
    .from('walkins')
    .select('*')
    .order('datetime', { ascending: false });
  if (error) throw error;
  return (data as Row[]).map(fromRow);
}

export async function dbInsert(w: WalkIn): Promise<void> {
  const { error } = await supabase.from('walkins').insert(toRow(w));
  if (error) throw error;
}

export async function dbInsertBatch(ws: WalkIn[]): Promise<void> {
  const BATCH = 200;
  for (let i = 0; i < ws.length; i += BATCH) {
    const { error } = await supabase
      .from('walkins')
      .insert(ws.slice(i, i + BATCH).map(toRow));
    if (error) throw error;
  }
}

export async function dbCount(): Promise<number> {
  const { count, error } = await supabase
    .from('walkins')
    .select('*', { count: 'exact', head: true });
  if (error) throw error;
  return count ?? 0;
}

export async function dbFetchAccountantReports(): Promise<AccountantReport[]> {
  const { data, error } = await supabase
    .from('accountant_reports')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  return (data as AccountantReportRow[]).map(fromAccountantReportRow);
}

export async function dbUpsertAccountantReport(report: Omit<AccountantReport, 'createdAt'>): Promise<AccountantReport> {
  const { data, error } = await supabase
    .from('accountant_reports')
    .upsert(toAccountantReportRow(report), { onConflict: 'date' })
    .select('*')
    .single();
  if (error) throw error;
  return fromAccountantReportRow(data as AccountantReportRow);
}

export async function uploadAccountantReportFile(date: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const safeName = file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9_-]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'report';
  const path = `${date}/${Date.now()}-${safeName}.${ext}`;

  const { error } = await supabase.storage
    .from('reports')
    .upload(path, file, { upsert: true });
  if (error) throw error;

  const { data } = supabase.storage.from('reports').getPublicUrl(path);
  return data.publicUrl;
}
