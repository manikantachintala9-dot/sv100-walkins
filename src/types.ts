export type TrafficSource =
  | 'google_maps' | 'youtube' | 'instagram' | 'whatsapp'
  | 'referral' | 'passing_traffic' | 'old_customer' | 'ad' | 'other';

export type CustomerType =
  | 'retail' | 'wholesale' | 'wedding' | 'reseller' | 'casual_visitor';

export type Requirement =
  | 'silk_saree' | 'fancy_saree' | 'bridal' | 'pattu'
  | 'kanchipuram' | 'cotton' | 'readymade' | 'accessories' | 'other';

export type BudgetRange =
  | 'under_1000' | '1000_5000' | '5000_15000' | '15000_50000' | '50000_plus';

export type DealStatus = 'bought' | 'did_not_buy';

export type LostReason =
  | 'price_too_high' | 'didnt_find_design' | 'just_browsing'
  | 'need_to_check_others' | 'will_come_back' | 'budget_constraints'
  | 'not_right_time' | 'comparing_options' | 'other';

export interface WalkIn {
  id: string;
  datetime: string;
  customerName: string;
  phone: string;
  trafficSource: TrafficSource;
  customerType: CustomerType;
  requirement: Requirement;
  budget: BudgetRange;
  salesperson: string;
  productsShown: string;
  dealStatus: DealStatus;
  billAmount: number;
  lostReason?: LostReason;
  followUpDate?: string;
  notes: string;
}

export type View =
  | 'dashboard' | 'add' | 'registry' | 'channel-analytics'
  | 'lost-sales' | 'followup' | 'daily-summary' | 'funnel';
