import { createClient } from '@supabase/supabase-js';
import type { WalkIn } from '../types';

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
