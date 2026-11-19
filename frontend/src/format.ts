export const fmt = (n: number): string => Math.round(n).toLocaleString('en-US');
export const money = (n: number): string => '$' + fmt(n);
export const parseMoney = (v: string): number => Number(v.replace(/[^0-9.]/g, '')) || 0;
export const percent = (r: number): string => (r * 100).toFixed(1) + '%';
