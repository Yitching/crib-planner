// BTO payment calculator.
//
// All figures are planning estimates, not official HDB/CPF numbers. The
// constants below are kept in one place so they are easy to update when
// policy changes.

export const FLAT_TYPES = ['2-room', '3-room', '4-room', '5-room'];

// HDB option/booking fee by flat type (paid in cash, counts toward downpayment).
export const BOOKING_FEE = { '2-room': 500, '3-room': 1000, '4-room': 2000, '5-room': 2000 };

export const LOAN = {
  hdb: { label: 'HDB loan', ltv: 0.75, rate: 0.026, years: 25, minCashPct: 0 },
  bank: { label: 'Bank loan', ltv: 0.75, rate: 0.03, years: 25, minCashPct: 0.05 },
};

// Share of the price due when signing the Agreement for Lease (the rest of
// the downpayment is due at key collection).
export const SIGNING_PCT = 0.10;

// Rough legal / registration / insurance costs at each stage.
export const SIGNING_OTHER_FEES = 350;
export const KEYS_OTHER_FEES = 350;

// Share of monthly wages that goes into CPF Ordinary Account (age 35 and below).
export const CPF_OA_RATE = 0.23;

// Mortgage Servicing Ratio cap for HDB flats.
export const MSR = 0.30;

export const MONTHS_TO_SIGNING = 6;
export const MONTHS_TO_KEYS = 42; // ~3.5 years

// Enhanced CPF Housing Grant by combined monthly income (upper bound of band).
const EHG_BANDS = [
  [1500, 120000], [2000, 110000], [2500, 105000], [3000, 95000],
  [3500, 90000], [4000, 80000], [4500, 70000], [5000, 65000],
  [5500, 55000], [6000, 50000], [6500, 40000], [7000, 30000],
  [7500, 25000], [8000, 20000], [8500, 10000], [9000, 5000],
];

export const DEFAULT_INPUTS = {
  flatType: '4-room',
  price: 400000,
  income: 7000,
  cpfA: 25000,
  cpfB: 20000,
  cash: 93000,
  loanType: 'hdb',
};

export function estimateGrant(income) {
  if (!(income >= 0)) return 0;
  for (const [max, grant] of EHG_BANDS) if (income <= max) return grant;
  return 0;
}

// Buyer's Stamp Duty for residential property.
export function stampDuty(price) {
  const tiers = [[180000, 0.01], [180000, 0.02], [640000, 0.03], [500000, 0.04], [1500000, 0.05], [Infinity, 0.06]];
  let left = price, duty = 0;
  for (const [size, rate] of tiers) {
    const part = Math.min(left, size);
    duty += part * rate;
    left -= part;
    if (left <= 0) break;
  }
  return Math.round(duty);
}

export function monthlyPayment(principal, annualRate, years) {
  const n = years * 12;
  const r = annualRate / 12;
  if (principal <= 0) return 0;
  if (r === 0) return principal / n;
  return (principal * r) / (1 - Math.pow(1 + r, -n));
}

function paidFromLabel(cpfPart, cashPart) {
  if (cashPart > 0 && cpfPart > 0) return 'CPF + cash';
  return cashPart > 0 ? 'Cash' : 'CPF';
}

export function calculate(raw) {
  const i = { ...DEFAULT_INPUTS, ...raw };
  const loan = LOAN[i.loanType] ?? LOAN.hdb;
  const price = Math.max(0, Number(i.price) || 0);
  const income = Math.max(0, Number(i.income) || 0);

  const booking = Math.min(BOOKING_FEE[i.flatType] ?? 2000, price);
  const loanAmount = Math.round(price * loan.ltv);
  const downpayment = price - loanAmount;
  const signingDown = Math.max(0, Math.round(price * SIGNING_PCT) - booking);
  const keysDown = Math.max(0, downpayment - booking - signingDown);
  const duty = stampDuty(price);

  const signing = signingDown + duty + SIGNING_OTHER_FEES;
  const keys = keysDown + KEYS_OTHER_FEES;
  const monthly = Math.round(monthlyPayment(loanAmount, loan.rate, loan.years));
  const grant = estimateGrant(income);
  const monthlyOA = income * CPF_OA_RATE;

  // Walk through the stops, spending CPF first (except where cash is required)
  // and topping up any shortfall from cash.
  let cash = Math.max(0, Number(i.cash) || 0);
  let cpf = Math.max(0, Number(i.cpfA) || 0) + Math.max(0, Number(i.cpfB) || 0);
  const shortfalls = [];

  const spend = (stop, amount, mustBeCash = 0) => {
    const cashReq = Math.min(amount, mustBeCash);
    const fromCpf = Math.min(cpf, amount - cashReq);
    const fromCash = amount - fromCpf;
    cpf -= fromCpf;
    cash -= fromCash;
    if (cash < 0) { shortfalls.push([stop, -cash]); cash = 0; }
    return { cpf: fromCpf, cash: fromCash };
  };

  const bookingSplit = spend('when you book', booking, booking);

  cpf += monthlyOA * MONTHS_TO_SIGNING;
  const bankCashAtSigning = Math.max(0, Math.round(price * loan.minCashPct) - booking);
  const signingSplit = spend('when you sign the lease', signing, bankCashAtSigning);

  // Grants are assumed to arrive by key collection (conservative).
  cpf += monthlyOA * (MONTHS_TO_KEYS - MONTHS_TO_SIGNING) + grant;
  const keysSplit = spend('when you get your keys', keys);

  const monthlyFromCpf = monthlyOA >= monthly;
  const msrLimit = income * MSR;
  const withinMsr = monthly <= msrLimit;

  const stops = [
    { id: 'book', title: 'Book your flat', when: 'Today', amount: booking, paidFrom: paidFromLabel(bookingSplit.cpf, bookingSplit.cash), color: 'peach' },
    { id: 'sign', title: 'Sign the lease', when: `In ~${MONTHS_TO_SIGNING} months`, amount: signing, paidFrom: paidFromLabel(signingSplit.cpf, signingSplit.cash), color: 'purple' },
    { id: 'keys', title: 'Get your keys', when: `In ~${MONTHS_TO_KEYS / 12} years`, amount: keys, paidFrom: paidFromLabel(keysSplit.cpf, keysSplit.cash), color: 'yellow' },
    { id: 'loan', title: 'Pay off the loan', when: 'Then, monthly', amount: monthly, paidFrom: monthlyFromCpf ? 'Monthly CPF' : 'CPF + cash', color: 'green', monthly: true },
  ];

  const cashLeft = Math.round(cash);
  const reasons = [];
  for (const [when, amount] of shortfalls) {
    reasons.push(`You're about $${fmt(amount)} short ${when}.`);
  }
  if (!withinMsr) reasons.push(`The monthly payment is above 30% of your income ($${fmt(msrLimit)}).`);

  let verdict = 'ok';
  if (reasons.length) verdict = 'no';
  else if (cashLeft < 10000 || !monthlyFromCpf) verdict = 'tight';

  return {
    inputs: i,
    loan: { ...loan, amount: loanAmount },
    stops,
    grant,
    stampDuty: duty,
    cashLeft,
    cpfLeft: Math.round(cpf),
    monthlyOA: Math.round(monthlyOA),
    verdict,
    reasons,
  };
}

export function fmt(n) {
  return Math.round(n).toLocaleString('en-US');
}

export function money(n) {
  return '$' + fmt(n);
}
