// Mirrors the JSON types in backend/internal/calc.

export type FlatType = '2-room' | '3-room' | '4-room' | '5-room';
export type LoanType = 'hdb' | 'bank';
export type Verdict = 'ok' | 'tight' | 'no';
export type StopColor = 'peach' | 'purple' | 'yellow' | 'green';
export type StopId = 'book' | 'sign' | 'keys' | 'loan';

export interface Inputs {
  flatType: FlatType;
  price: number;
  income: number;
  cpfA: number;
  cpfB: number;
  cash: number;
  loanType: LoanType;
}

export interface Stop {
  id: StopId;
  title: string;
  when: string;
  amount: number;
  paidFrom: string;
  color: StopColor;
  monthly: boolean;
}

export interface Result {
  inputs: Inputs;
  loan: { label: string; ltv: number; rate: number; years: number; minCashPct: number; amount: number };
  stops: Stop[];
  grant: number;
  bookingFee: number;
  stampDuty: number;
  cashLeft: number;
  cpfLeft: number;
  monthlyOA: number;
  verdict: Verdict;
  reasons: string[];
}

export type MoneyField = 'price' | 'income' | 'cpfA' | 'cpfB' | 'cash';

export const FLAT_TYPES: FlatType[] = ['2-room', '3-room', '4-room', '5-room'];

export const LOAN_OPTIONS: [LoanType, string][] = [
  ['hdb', 'HDB loan'],
  ['bank', 'Bank loan'],
];

export const DEFAULT_INPUTS: Inputs = {
  flatType: '4-room',
  price: 400000,
  income: 7000,
  cpfA: 25000,
  cpfB: 20000,
  cash: 93000,
  loanType: 'hdb',
};
