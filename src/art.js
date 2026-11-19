// Flat illustrations with bold ink outlines. All decorative: hidden from screen readers.

const INK = 'var(--ink)';

export function houseOnSun() {
  return `
<svg class="art-sun" viewBox="0 0 200 150" aria-hidden="true" focusable="false">
  <circle cx="100" cy="78" r="62" fill="var(--yellow)" stroke="${INK}" stroke-width="3"/>
  <rect x="62" y="74" width="76" height="56" rx="3" fill="#fff" stroke="${INK}" stroke-width="3"/>
  <path d="M52 78 L100 40 L148 78 Z" fill="var(--peach)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="90" y="98" width="20" height="32" rx="2" fill="var(--accent)" stroke="${INK}" stroke-width="3"/>
  <rect x="70" y="86" width="14" height="14" rx="2" fill="var(--yellow)" stroke="${INK}" stroke-width="3"/>
  <rect x="116" y="86" width="14" height="14" rx="2" fill="var(--yellow)" stroke="${INK}" stroke-width="3"/>
  <line x1="20" y1="130" x2="180" y2="130" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  ${tree(36, 130, 0.8)}
  ${tree(166, 130, 0.65)}
</svg>`;
}

export function tree(x, groundY, s = 1) {
  return `
  <g transform="translate(${x} ${groundY}) scale(${s})">
    <line x1="0" y1="0" x2="0" y2="-22" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <circle cx="0" cy="-34" r="16" fill="var(--green)" stroke="${INK}" stroke-width="3"/>
  </g>`;
}

export function endHouse() {
  return `
<svg class="art-end" viewBox="0 0 240 150" aria-hidden="true" focusable="false">
  <circle cx="184" cy="38" r="22" fill="var(--yellow)" stroke="${INK}" stroke-width="3"/>
  <rect x="70" y="72" width="100" height="62" rx="3" fill="#fff" stroke="${INK}" stroke-width="3"/>
  <path d="M58 76 L120 30 L182 76 Z" fill="var(--peach)" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>
  <rect x="108" y="98" width="24" height="36" rx="2" fill="var(--accent)" stroke="${INK}" stroke-width="3"/>
  <circle cx="126" cy="117" r="2.5" fill="var(--yellow)"/>
  <rect x="80" y="86" width="18" height="18" rx="2" fill="var(--yellow)" stroke="${INK}" stroke-width="3"/>
  <rect x="142" y="86" width="18" height="18" rx="2" fill="var(--yellow)" stroke="${INK}" stroke-width="3"/>
  <line x1="10" y1="134" x2="230" y2="134" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
  ${tree(36, 134, 0.9)}
  ${tree(206, 134, 0.75)}
</svg>`;
}

// Small icons for the road stops.
export const stopIcons = {
  book: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  sign: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20c3-1 4-5 6-5s1 3 3 3 3-2 4-3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M14 4l6 6-8 8H6v-6z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
  keys: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="12" r="4.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12.5 12H21M18 12v3M21 12v3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  loan: `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
};

export const tabIcons = {
  calculator: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1z" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
  budget: `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 3.5V12l6 6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>`,
  vendors: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9l2-5h12l2 5M4 9h16v11H4zM10 20v-6h4v6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>`,
};
