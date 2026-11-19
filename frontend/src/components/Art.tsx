// Flat illustrations with bold ink outlines. All decorative: hidden from screen readers.
import type { ReactElement } from 'react';
import type { StopId } from '../types';

const INK = 'var(--ink)';
const line = { stroke: INK, strokeWidth: 3 } as const;

function Tree({ x, ground, scale = 1 }: { x: number; ground: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${ground}) scale(${scale})`}>
      <line x1="0" y1="0" x2="0" y2="-22" {...line} strokeLinecap="round" />
      <circle cx="0" cy="-34" r="16" fill="var(--green)" {...line} />
    </g>
  );
}

export function HouseOnSun() {
  return (
    <svg className="art-sun" viewBox="0 0 200 150" aria-hidden="true" focusable="false">
      <circle cx="100" cy="78" r="62" fill="var(--yellow)" {...line} />
      <rect x="62" y="74" width="76" height="56" rx="3" fill="#fff" {...line} />
      <path d="M52 78 L100 40 L148 78 Z" fill="var(--peach)" {...line} strokeLinejoin="round" />
      <rect x="90" y="98" width="20" height="32" rx="2" fill="var(--accent)" {...line} />
      <rect x="70" y="86" width="14" height="14" rx="2" fill="var(--yellow)" {...line} />
      <rect x="116" y="86" width="14" height="14" rx="2" fill="var(--yellow)" {...line} />
      <line x1="20" y1="130" x2="180" y2="130" {...line} strokeLinecap="round" />
      <Tree x={36} ground={130} scale={0.8} />
      <Tree x={166} ground={130} scale={0.65} />
    </svg>
  );
}

export function EndHouse() {
  return (
    <svg className="art-end" viewBox="0 0 240 150" aria-hidden="true" focusable="false">
      <circle cx="184" cy="38" r="22" fill="var(--yellow)" {...line} />
      <rect x="70" y="72" width="100" height="62" rx="3" fill="#fff" {...line} />
      <path d="M58 76 L120 30 L182 76 Z" fill="var(--peach)" {...line} strokeLinejoin="round" />
      <rect x="108" y="98" width="24" height="36" rx="2" fill="var(--accent)" {...line} />
      <circle cx="126" cy="117" r="2.5" fill="var(--yellow)" />
      <rect x="80" y="86" width="18" height="18" rx="2" fill="var(--yellow)" {...line} />
      <rect x="142" y="86" width="18" height="18" rx="2" fill="var(--yellow)" {...line} />
      <line x1="10" y1="134" x2="230" y2="134" {...line} strokeLinecap="round" />
      <Tree x={36} ground={134} scale={0.9} />
      <Tree x={206} ground={134} scale={0.75} />
    </svg>
  );
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

const icon = (children: ReactElement) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    {children}
  </svg>
);

export const StopIcon: Record<StopId, ReactElement> = {
  book: icon(<><rect x="4" y="3" width="16" height="18" rx="2" {...stroke} /><path d="M8 8h8M8 12h8M8 16h5" {...stroke} /></>),
  sign: icon(<><path d="M4 20c3-1 4-5 6-5s1 3 3 3 3-2 4-3" {...stroke} /><path d="M14 4l6 6-8 8H6v-6z" {...stroke} /></>),
  keys: icon(<><circle cx="8" cy="12" r="4.5" {...stroke} /><path d="M12.5 12H21M18 12v3M21 12v3" {...stroke} /></>),
  loan: icon(<><rect x="3" y="5" width="18" height="16" rx="2" {...stroke} /><path d="M3 10h18M8 3v4M16 3v4" {...stroke} /></>),
};

export const TabIcon = {
  calculator: icon(<path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" {...stroke} />),
  budget: icon(<><circle cx="12" cy="12" r="8.5" {...stroke} /><path d="M12 3.5V12l6 6" {...stroke} /></>),
  vendors: icon(<path d="M4 9l2-5h12l2 5M4 9h16v11H4zM10 20v-6h4v6" {...stroke} />),
};
