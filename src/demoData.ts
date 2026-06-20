import type {
  WalkIn, TrafficSource, CustomerType, Requirement, BudgetRange, LostReason,
} from './types';

const DEMO_FLAG = 'sv100_demo_v1';
const STORAGE_KEY = 'sv100_walkins';

// Deterministic LCG pseudo-random generator (seed=12345)
let _seed = 12345;
function lcgReset() { _seed = 12345; }
function lcgNext(): number {
  _seed = (_seed * 1103515245 + 12345) & 0x7fffffff;
  return _seed / 0x7fffffff;
}
function lcgInt(min: number, max: number): number {
  return Math.floor(lcgNext() * (max - min + 1)) + min;
}
function lcgPick<T>(arr: T[]): T {
  return arr[Math.floor(lcgNext() * arr.length)];
}
function lcgWeighted<T>(arr: T[], weights: number[]): T {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = lcgNext() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= weights[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

const NAMES = [
  'Priya Krishnamurthy', 'Meena Subramaniam', 'Kavitha Rajan', 'Anitha Nair',
  'Radha Venkatesh', 'Sunitha Balaji', 'Deepa Murthy', 'Lalitha Iyer',
  'Usha Chandran', 'Vijaya Pillai', 'Rekha Nadar', 'Saranya Gopal',
  'Divya Mahesh', 'Nandini Rao', 'Padmavathi Kumar', 'Shanthi Menon',
  'Vimala Srinivasan', 'Gomathi Mohan', 'Chitra Balasubramanian', 'Jayalakshmi Naidu',
  'Ambika Reddy', 'Sowmya Krishnaswamy', 'Bhavani Suresh', 'Malathi Patel',
  'Rohini Sekhar', 'Sangeetha Devi', 'Hema Murugan', 'Sumithra Raghavan',
  'Kalpana Nair', 'Yamuna Chandrasekhar',
];

const TRAFFIC_SOURCES: TrafficSource[] = [
  'google_maps', 'instagram', 'passing_traffic', 'whatsapp',
  'referral', 'youtube', 'old_customer', 'ad', 'other',
];
const SOURCE_WEIGHTS = [28, 22, 15, 13, 8, 7, 4, 2, 1];

const CUSTOMER_TYPES: CustomerType[] = ['retail', 'wedding', 'casual_visitor', 'wholesale', 'reseller'];
const TYPE_WEIGHTS = [42, 25, 15, 10, 8];

const REQUIREMENTS: Requirement[] = [
  'silk_saree', 'fancy_saree', 'bridal', 'pattu', 'kanchipuram',
  'cotton', 'readymade', 'accessories', 'other',
];
const REQ_WEIGHTS = [20, 15, 18, 12, 10, 8, 6, 5, 6];
const WEDDING_REQ_WEIGHTS = [10, 8, 35, 15, 22, 3, 2, 3, 2];

const BUDGETS: BudgetRange[] = [
  'under_1000', '1000_5000', '5000_15000', '15000_50000', '50000_plus',
];
const BUDGET_WEIGHTS_RETAIL = [10, 35, 30, 15, 10];
const BUDGET_WEIGHTS_WEDDING = [0, 5, 15, 40, 40];
const BUDGET_WEIGHTS_WHOLESALE = [0, 8, 20, 35, 37];

const LOST_REASONS: LostReason[] = [
  'price_too_high', 'didnt_find_design', 'just_browsing',
  'will_come_back', 'need_to_check_others', 'budget_constraints',
  'not_right_time', 'comparing_options', 'other',
];
const LOST_WEIGHTS = [32, 24, 20, 12, 7, 3, 4, 5, 3];

const SALESPERSONS = ['Kavitha', 'Meenakshi', 'Preethi', 'Rajan', 'Suresh'];
const SP_WEIGHTS = [30, 25, 20, 15, 10];

const PRODUCTS_BY_REQ: Record<string, string[]> = {
  silk_saree: ['Mysore Silk 6yds', 'Bangalore Silk', 'Pure Silk Zari', 'Contrast Border Silk'],
  fancy_saree: ['Designer Georgette', 'Net Embroidered', 'Chiffon Party Wear', 'Organza Fancy'],
  bridal: ['Bridal Kanchi Set', 'Bridal Silk Duo', 'Grand Bridal Pattu', 'Zari Bridal Special'],
  pattu: ['Pattu Pavadai Set', 'Half-Saree Pattu', 'Brocade Pattu', 'Temple Border Pattu'],
  kanchipuram: ['Kanchipuram Pure Silk', 'Kanchi Contrast', 'Kanchi Korvai', 'Kanchi Single Color'],
  cotton: ['Chettinad Cotton', 'Handloom Cotton', 'Printed Cotton', 'Dobby Cotton'],
  readymade: ['Readymade Blouse', 'Stitched Set', 'Fall & Edging Done', 'Pre-Pleated Saree'],
  accessories: ['Blouse Material', 'Saree Belt', 'Hair Accessories', 'Jewelry Set'],
  other: ['Mixed Collection', 'Sample Pieces', 'Casual Wear', 'Party Collection'],
};

function generatePhone(id: number): string {
  const base = 9000000000 + (id * 7919) % 999999999;
  return String(base);
}

function generateBillAmount(budget: BudgetRange, requirement: Requirement): number {
  const ranges: Record<BudgetRange, [number, number]> = {
    under_1000: [400, 999],
    '1000_5000': [1000, 4999],
    '5000_15000': [5000, 14999],
    '15000_50000': [15000, 49999],
    '50000_plus': [50000, 180000],
  };
  const [min, max] = ranges[budget];
  const bridal_mult = (requirement === 'bridal' || requirement === 'kanchipuram') ? 1.3 : 1;
  const amount = lcgInt(min, max) * bridal_mult;
  return Math.round(amount / 100) * 100;
}

function conversionRate(ctype: CustomerType): number {
  const rates: Record<CustomerType, number> = {
    wedding: 0.55, retail: 0.38, wholesale: 0.45, reseller: 0.42, casual_visitor: 0.15,
  };
  return rates[ctype];
}

function generateEntry(date: string, indexInDay: number, globalId: number): WalkIn {
  const startHour = 9;
  const endHour = 20;
  const totalMinutes = (endHour - startHour) * 60;
  const minutes = Math.floor((indexInDay / 60) * totalMinutes);
  const hour = startHour + Math.floor(minutes / 60);
  const minute = minutes % 60;
  const datetime = `${date}T${String(Math.min(hour, 20)).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;

  const source = lcgWeighted(TRAFFIC_SOURCES, SOURCE_WEIGHTS);
  const customerType = lcgWeighted(CUSTOMER_TYPES, TYPE_WEIGHTS);
  const isWedding = customerType === 'wedding';
  const requirement = lcgWeighted(REQUIREMENTS, isWedding ? WEDDING_REQ_WEIGHTS : REQ_WEIGHTS);
  const budgetWeights = isWedding ? BUDGET_WEIGHTS_WEDDING :
    customerType === 'wholesale' ? BUDGET_WEIGHTS_WHOLESALE : BUDGET_WEIGHTS_RETAIL;
  const budget = lcgWeighted(BUDGETS, budgetWeights);
  const salesperson = lcgWeighted(SALESPERSONS, SP_WEIGHTS);
  const isBought = lcgNext() < conversionRate(customerType);
  const dealStatus = isBought ? 'bought' : 'did_not_buy';
  const billAmount = isBought ? generateBillAmount(budget, requirement) : 0;
  const lostReason: LostReason | undefined = isBought ? undefined : lcgWeighted(LOST_REASONS, LOST_WEIGHTS);
  let followUpDate: string | undefined;
  if (!isBought && lcgNext() < 0.25) {
    const d = new Date(date + 'T00:00:00');
    d.setDate(d.getDate() + lcgInt(1, 7));
    followUpDate = d.toISOString().split('T')[0];
  }
  const name = lcgPick(NAMES);
  const products = lcgPick(PRODUCTS_BY_REQ[requirement] || PRODUCTS_BY_REQ.other);

  return {
    id: `demo_${globalId}`,
    datetime,
    customerName: name,
    phone: generatePhone(globalId),
    trafficSource: source,
    customerType,
    requirement,
    budget,
    salesperson,
    productsShown: products,
    dealStatus,
    billAmount,
    lostReason,
    followUpDate,
    notes: '',
  };
}

const SPECIAL_TODAY: Partial<WalkIn>[] = [
  {
    customerName: 'Lakshmi Subramaniam', phone: '9876543210',
    trafficSource: 'whatsapp', customerType: 'wedding', requirement: 'bridal',
    budget: '50000_plus', salesperson: 'Kavitha', dealStatus: 'did_not_buy',
    lostReason: 'will_come_back', followUpDate: '2026-06-21',
    notes: 'Interested in Kanchi pattu bridal set. Will bring husband tomorrow.',
    billAmount: 0,
  },
  {
    customerName: 'Pooja Menon', phone: '9812345670',
    trafficSource: 'instagram', customerType: 'wedding', requirement: 'kanchipuram',
    budget: '15000_50000', salesperson: 'Meenakshi', dealStatus: 'did_not_buy',
    lostReason: 'need_to_check_others', followUpDate: '2026-06-22',
    notes: 'Very interested in the red Kanchipuram silk. Comparing with 2 other shops.',
    billAmount: 0,
  },
  {
    customerName: 'Divya Nair', phone: '9734567890',
    trafficSource: 'referral', customerType: 'wedding', requirement: 'bridal',
    budget: '50000_plus', salesperson: 'Preethi', dealStatus: 'did_not_buy',
    lostReason: 'not_right_time', followUpDate: '2026-06-21',
    notes: 'Wedding in August. Very interested in the bridal collection.',
    billAmount: 0,
  },
];

const RETURNING_CUSTOMER_JUNE17: Partial<WalkIn> = {
  customerName: 'Lakshmi Subramaniam', phone: '9876543210',
  trafficSource: 'old_customer', customerType: 'retail', requirement: 'silk_saree',
  budget: '5000_15000', salesperson: 'Kavitha', dealStatus: 'bought',
  billAmount: 8500, notes: 'Bought Mysore silk for daughter\'s graduation.',
  productsShown: 'Mysore Silk 6yds',
};

export function generateDemoData(): WalkIn[] {
  lcgReset();
  const walkins: WalkIn[] = [];
  let globalId = 0;

  const days = [
    { date: '2026-06-07', count: 32 },
    { date: '2026-06-08', count: 41 },
    { date: '2026-06-09', count: 28 },
    { date: '2026-06-10', count: 35 },
    { date: '2026-06-11', count: 42 },
    { date: '2026-06-12', count: 38 },
    { date: '2026-06-13', count: 45 },
    { date: '2026-06-14', count: 52 },
    { date: '2026-06-15', count: 31 },
    { date: '2026-06-16', count: 44 },
    { date: '2026-06-17', count: 39 },
    { date: '2026-06-18', count: 47 },
    { date: '2026-06-19', count: 56 },
  ];

  for (const day of days) {
    if (day.date === '2026-06-17') {
      // Insert returning customer entry early in the day
      const rc: WalkIn = {
        ...generateEntry(day.date, 0, globalId++),
        ...RETURNING_CUSTOMER_JUNE17,
        id: `demo_${globalId - 1}`,
        datetime: '2026-06-17T10:30:00',
      };
      walkins.push(rc);
      for (let i = 1; i < day.count; i++) {
        walkins.push(generateEntry(day.date, i, globalId++));
      }
    } else {
      for (let i = 0; i < day.count; i++) {
        walkins.push(generateEntry(day.date, i, globalId++));
      }
    }
  }

  // Today: special entries first, then generated
  const todayDate = '2026-06-20';
  const todayCount = 38;

  for (let si = 0; si < SPECIAL_TODAY.length; si++) {
    const base = generateEntry(todayDate, si, globalId++);
    walkins.push({
      ...base,
      ...SPECIAL_TODAY[si],
      id: `demo_special_${si}`,
      datetime: `2026-06-20T${String(9 + si).padStart(2, '0')}:${si * 15}0:00`,
    });
  }

  for (let i = SPECIAL_TODAY.length; i < todayCount; i++) {
    walkins.push(generateEntry(todayDate, i, globalId++));
  }

  return walkins;
}

export function initializeDemoData(): WalkIn[] {
  if (localStorage.getItem(DEMO_FLAG)) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { return JSON.parse(stored); } catch { /* fall through */ }
    }
  }
  const data = generateDemoData();
  localStorage.setItem(DEMO_FLAG, '1');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

export function saveWalkins(walkins: WalkIn[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(walkins));
}
