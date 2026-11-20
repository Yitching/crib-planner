// Mirrors the JSON types in backend/internal/calc.

export type FlatType = '2-room' | '3-room' | '4-room' | '5-room';
export type LoanType = 'hdb' | 'bank';
export type SchemeId = 'standard' | 'staggered' | 'dia';
export type Stage = 'applying' | 'booked' | 'signed' | 'keys';
export type Verdict = 'ok' | 'tight' | 'no';
export type StopColor = 'peach' | 'purple' | 'yellow' | 'green';
export type StopId = 'book' | 'sign' | 'keys' | 'loan';
export type PayStopId = Exclude<StopId, 'loan'>;
export type StopStatus = 'paid' | 'next' | 'upcoming';

export interface Inputs {
  flatType: FlatType;
  price: number;
  income: number;
  cpfA: number;
  cpfB: number;
  cash: number;
  saveA: number;
  saveB: number;
  ageA: number;
  ageB: number;
  student: boolean;
  loanType: LoanType;
  scheme: SchemeId;
  stage: Stage;
  signDate: string; // YYYY-MM or ''
  keyDate: string; // YYYY-MM or ''
  overrides: Partial<Record<PayStopId, number>>;
}

export interface Item {
  label: string;
  amount: number;
}

export interface Stop {
  id: StopId;
  title: string;
  month: string;
  monthsAway: number;
  amount: number;
  paidFrom: string;
  color: StopColor;
  monthly: boolean;
  status: StopStatus;
  overridden: boolean;
  breakdown: Item[];
  cpfPart: number;
  cashPart: number;
  cpfAvailable: number;
  cashAvailable: number;
  shortfall: number;
}

export interface Criterion {
  label: string;
  detail: string;
  status: 'ok' | 'warn' | 'fail' | 'info';
}

export interface Result {
  inputs: Inputs;
  loan: {
    label: string;
    ltv: number;
    rate: number;
    years: number;
    minCashPct: number;
    amount: number;
    maxByLTV: number;
    maxByIncome: number;
    cpfToLoan: number;
    tenureYears: number;
    monthly: number;
    criteria: Criterion[];
  };
  scheme: { label: string; signingPct: number };
  stops: Stop[];
  grant: number;
  bookingFee: number;
  stampDuty: number;
  monthsToKeys: number;
  keyMonth: string;
  savingsMonthly: number;
  savedByKeys: number;
  cashLeft: number;
  cpfLeft: number;
  monthlyOA: number;
  paidSoFar: number;
  diaEligible: boolean;
  verdict: Verdict;
  reasons: string[];
  notes: string[];
}

export const FLAT_TYPES: FlatType[] = ['2-room', '3-room', '4-room', '5-room'];

export const LOAN_OPTIONS: [LoanType, string][] = [
  ['hdb', 'HDB loan'],
  ['bank', 'Bank loan'],
];

export const SCHEME_OPTIONS: [SchemeId, string][] = [
  ['standard', 'Standard · 10%'],
  ['staggered', 'Staggered · 5%'],
  ['dia', 'Deferred (DIA) · 2.5%'],
];

export const STAGE_OPTIONS: [Stage, string][] = [
  ['applying', 'Not booked yet'],
  ['booked', 'Booked a flat'],
  ['signed', 'Signed the lease'],
  ['keys', 'Got our keys'],
];

export const STAGE_ORDER: Stage[] = ['applying', 'booked', 'signed', 'keys'];

export const DEFAULT_INPUTS: Inputs = {
  flatType: '4-room',
  price: 400000,
  income: 7000,
  cpfA: 25000,
  cpfB: 20000,
  cash: 93000,
  saveA: 800,
  saveB: 700,
  ageA: 28,
  ageB: 28,
  student: false,
  loanType: 'hdb',
  scheme: 'standard',
  stage: 'applying',
  signDate: '',
  keyDate: '',
  overrides: {},
};

/** DIA: one of you is a student / in NS (or just finished), and one of you is 30 or younger. */
export const diaEligible = (i: Pick<Inputs, 'student' | 'ageA' | 'ageB'>) => i.student && (i.ageA <= 30 || i.ageB <= 30);

/** The scheme to suggest when eligibility changes, unless the person picked staggered themselves. */
export function suggestScheme(i: Inputs): SchemeId {
  if (diaEligible(i)) return 'dia';
  return i.scheme === 'dia' ? 'standard' : i.scheme;
}
