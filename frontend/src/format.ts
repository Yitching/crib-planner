export const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');
export const money = (n: number): string => '$' + fmt(n);
export const parseMoney = (v: string): number => Number(v.replace(/[^0-9.]/g, '')) || 0;
export const percent = (r: number): string => (r * 100).toFixed(1) + '%';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2027-05" → "May 2027" */
export function monthName(ym: string): string {
  const [y, m] = ym.split('-').map(Number);
  if (!y || !m) return '';
  return `${MONTHS[m - 1]} ${y}`;
}

/** 7 → "in ~7 months", 42 → "in ~3.5 years" */
export function howFar(months: number): string {
  if (months <= 0) return 'this month';
  if (months < 24) return `in ~${months} month${months === 1 ? '' : 's'}`;
  const years = Math.round((months / 12) * 2) / 2;
  return `in ~${years} years`;
}
