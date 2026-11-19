import { calculate, estimateGrant, money, fmt, FLAT_TYPES, BOOKING_FEE, LOAN, DEFAULT_INPUTS } from './calc.js';
import { houseOnSun, endHouse, stopIcons, tabIcons } from './art.js';

const STORAGE_KEY = 'crib-planner:v1';
const root = document.getElementById('app');

const state = load() ?? {
  inputs: { ...DEFAULT_INPUTS },
  onboarded: false,
  step: 0,
  tab: 'calculator',
};
state.sheet = null; // draft inputs while the edit sheet is open

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && saved.inputs) return { ...saved, inputs: { ...DEFAULT_INPUTS, ...saved.inputs } };
  } catch { /* storage unavailable */ }
  return null;
}

function save() {
  try {
    const { inputs, onboarded, step, tab } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ inputs, onboarded, step, tab }));
  } catch { /* storage unavailable */ }
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const parseMoney = (v) => Number(String(v).replace(/[^0-9.]/g, '')) || 0;

/* ---------- Shared bits ---------- */

function moneyInput(name, value, { label, large = false, id = `f-${name}` } = {}) {
  return `
  <div class="money ${large ? 'money--large' : ''}">
    <span class="money__prefix" aria-hidden="true">$</span>
    <input id="${id}" name="${name}" class="input" inputmode="numeric" autocomplete="off"
      value="${value ? fmt(value) : ''}" ${label ? `aria-label="${esc(label)}"` : ''} data-money>
  </div>`;
}

function chips(name, options, selected, labelledBy) {
  return `
  <div class="chips" role="radiogroup" aria-labelledby="${labelledBy}">
    ${options.map(([value, text]) => `
      <button type="button" class="chip" role="radio" aria-checked="${value === selected}"
        data-chip="${name}" data-value="${esc(value)}">${esc(text)}</button>`).join('')}
  </div>`;
}

const flatChips = (sel, by) => chips('flatType', FLAT_TYPES.map((t) => [t, t]), sel, by);
const loanChips = (sel, by) => chips('loanType', [['hdb', 'HDB loan'], ['bank', 'Bank loan']], sel, by);

/* ---------- Onboarding (C2) ---------- */

const STEPS = [
  {
    key: 'flat',
    title: 'Which flat are you looking at?',
    hint: 'Use the price range from the HDB launch page.',
    body: (i) => `
      ${flatChips(i.flatType, 'q-title')}
      <label class="field-label" for="f-price">Flat price</label>
      ${moneyInput('price', i.price, { large: true })}`,
    feedback: (i) => `The booking fee for a ${esc(i.flatType)} flat is about ${money(BOOKING_FEE[i.flatType])}.`,
  },
  {
    key: 'income',
    title: 'How much do you earn together each month?',
    hint: 'Add up both your gross salaries. Your payslip shows this before CPF.',
    body: (i) => moneyInput('income', i.income, { large: true, label: 'Combined monthly income' }),
    feedback: (i) => {
      const g = estimateGrant(i.income);
      return g > 0
        ? `Nice! You may get about ${money(g)} in housing grants.`
        : 'Above $9,000 a month you may not get the income-based grant, but you can still buy.';
    },
  },
  {
    key: 'cpfA',
    title: 'How much is in your CPF Ordinary Account?',
    hint: 'Open the CPF app and look for "Ordinary Account".',
    body: (i) => moneyInput('cpfA', i.cpfA, { large: true, label: 'Your CPF OA balance' }),
    feedback: () => 'Your CPF OA can pay the downpayment and the monthly loan.',
  },
  {
    key: 'cpfB',
    title: "And your partner's CPF Ordinary Account?",
    hint: 'Same place in their CPF app.',
    body: (i) => moneyInput('cpfB', i.cpfB, { large: true, label: "Partner's CPF OA balance" }),
    feedback: (i) => `Together that's ${money((+i.cpfA || 0) + (+i.cpfB || 0))} in CPF today.`,
  },
  {
    key: 'cash',
    title: 'How much cash have you saved for the home?',
    hint: 'Count savings you can set aside, not your emergency fund.',
    body: (i) => moneyInput('cash', i.cash, { large: true, label: 'Cash saved' }),
    feedback: (i) => `The ${money(BOOKING_FEE[i.flatType])} booking fee comes from this. The rest can go to renovation.`,
  },
  {
    key: 'loan',
    title: 'HDB loan or bank loan?',
    hint: 'Not sure? Most first-timers start with an HDB loan.',
    body: (i) => loanChips(i.loanType, 'q-title'),
    feedback: (i) => i.loanType === 'bank'
      ? `We'll assume ${(LOAN.bank.rate * 100).toFixed(1)}% interest. Banks need 5% of the price in cash.`
      : `We'll use the HDB rate of ${(LOAN.hdb.rate * 100).toFixed(1)}%. You can pay it all with CPF.`,
  },
];

function renderOnboarding() {
  const step = STEPS[state.step];
  const i = state.inputs;
  const last = state.step === STEPS.length - 1;
  return `
  <main class="screen screen--onboard">
    <div class="topbar">
      <button type="button" class="link-back" data-action="back" ${state.step === 0 ? 'hidden' : ''}>← Back</button>
      <div class="progress" aria-hidden="true">
        ${STEPS.map((_, n) => `<span class="dot ${n <= state.step ? 'dot--on' : ''}"></span>`).join('')}
      </div>
      <span class="progress-count">${state.step + 1} of ${STEPS.length}</span>
    </div>
    ${houseOnSun()}
    <form class="question" data-form="onboard" novalidate>
      <h1 id="q-title" class="title">${esc(step.title)}</h1>
      <div class="question__body">${step.body(i)}</div>
      <p class="hint">${esc(step.hint)}</p>
      <div class="feedback" role="status" data-live="feedback">${step.feedback(i)}</div>
      <button type="submit" class="btn btn--primary btn--block">${last ? 'Show my road' : 'Next'}</button>
    </form>
  </main>`;
}

/* ---------- Road to your keys (C) ---------- */

const ROW_H = 160;

function roadSvg(n) {
  const W = 390;
  const xs = (k) => (k % 2 === 0 ? 0.8 : 0.2) * W;
  const pts = [[W / 2, 0]];
  for (let k = 0; k < n; k++) pts.push([xs(k), ROW_H * k + ROW_H / 2]);
  pts.push([W / 2, ROW_H * n + 20]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let k = 1; k < pts.length; k++) {
    const [x0, y0] = pts[k - 1];
    const [x1, y1] = pts[k];
    const dy = (y1 - y0) / 2;
    d += ` C${x0} ${y0 + dy} ${x1} ${y1 - dy} ${x1} ${y1}`;
  }
  const h = ROW_H * n + 20;
  return `
  <svg class="road__svg" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
    <path d="${d}" fill="none" stroke="var(--ink)" stroke-width="34" vector-effect="non-scaling-stroke" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="#fff" stroke-width="27" vector-effect="non-scaling-stroke" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="var(--yellow)" stroke-width="3" stroke-dasharray="10 12" vector-effect="non-scaling-stroke"/>
  </svg>`;
}

function verdictPill(r) {
  const text = { ok: 'You can afford it', tight: "It's tight, but doable", no: 'Not quite yet' }[r.verdict];
  const icon = r.verdict === 'no' ? '!' : '✓';
  return `<span class="pill pill--${r.verdict}"><span class="pill__icon" aria-hidden="true">${icon}</span>${text}</span>`;
}

function renderRoad() {
  const r = calculate(state.inputs);
  return `
  <main class="screen screen--road" ${state.sheet ? 'inert aria-hidden="true"' : ''}>
    <header class="header">
      <p class="eyebrow">Our Home</p>
      <h1 class="title">The road to your keys</h1>
      <div class="header__row">
        ${verdictPill(r)}
        <button type="button" class="btn btn--ghost btn--small" data-action="edit">Edit my numbers</button>
      </div>
      <p class="summary">
        ${r.verdict === 'no'
          ? r.reasons.map(esc).join(' ')
          : `<strong>${money(r.cashLeft)}</strong> cash left for your reno at key collection.`}
      </p>
    </header>
    <ol class="road" style="--rows:${r.stops.length}">
      ${roadSvg(r.stops.length)}
      ${r.stops.map((s, k) => `
        <li class="stop stop--${k % 2 === 0 ? 'left' : 'right'}" style="--row:${k}">
          <span class="stop__marker stop__marker--${s.color}" aria-hidden="true">${k + 1}</span>
          <article class="card stop__card">
            <div class="stop__head">
              <span class="stop__icon stop__icon--${s.color}">${stopIcons[s.id]}</span>
              <span class="stop__when">${esc(s.when)}</span>
            </div>
            <h2 class="stop__title">${esc(s.title)}</h2>
            <p class="stop__amount">${money(s.amount)}${s.monthly ? '<span class="stop__per">/mo</span>' : ''}</p>
            <p class="stop__from">Paid from <strong>${esc(s.paidFrom)}</strong></p>
          </article>
        </li>`).join('')}
    </ol>
    <div class="road__end">
      ${endHouse()}
      <p class="road__caption">Home sweet home 🔑</p>
    </div>
  </main>`;
}

/* ---------- Edit my numbers (C3) ---------- */

function renderSheet() {
  const d = state.sheet;
  if (!d) return '';
  return `
  <div class="scrim" data-action="close"></div>
  <section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
    <span class="sheet__handle" aria-hidden="true"></span>
    <div class="sheet__head">
      <h2 id="sheet-title" class="sheet__title" tabindex="-1">Edit my numbers</h2>
      <button type="button" class="icon-btn" data-action="close" aria-label="Close">✕</button>
    </div>
    <form data-form="sheet" novalidate>
      <p id="s-flat" class="field-label">Flat size</p>
      ${flatChips(d.flatType, 's-flat')}

      <label class="field-label" for="s-price">Flat price</label>
      ${moneyInput('price', d.price, { id: 's-price' })}

      <label class="field-label" for="s-income">Monthly income (together)</label>
      ${moneyInput('income', d.income, { id: 's-income' })}
      <p class="hint hint--grant" data-live="grant">${grantHint(d.income)}</p>

      <div class="split">
        <div>
          <label class="field-label" for="s-cpfA">Your CPF OA</label>
          ${moneyInput('cpfA', d.cpfA, { id: 's-cpfA' })}
        </div>
        <div>
          <label class="field-label" for="s-cpfB">Partner's CPF OA</label>
          ${moneyInput('cpfB', d.cpfB, { id: 's-cpfB' })}
        </div>
      </div>

      <label class="field-label" for="s-cash">Cash saved</label>
      ${moneyInput('cash', d.cash, { id: 's-cash' })}

      <p id="s-loan" class="field-label">Loan</p>
      ${loanChips(d.loanType, 's-loan')}

      <button type="submit" class="btn btn--accent btn--block">Show my road</button>
    </form>
  </section>`;
}

function grantHint(income) {
  const g = estimateGrant(income);
  return g > 0 ? `You may get about ${money(g)} in housing grants.` : 'No income-based grant at this income.';
}

/* ---------- Budget & Vendors ---------- */

function renderBudget() {
  const r = calculate(state.inputs);
  const rows = [
    ['Cash left for renovation', money(r.cashLeft)],
    ['CPF OA left at keys', money(r.cpfLeft)],
    ['Housing grant (estimate)', money(r.grant)],
    [`${r.loan.label} amount`, money(r.loan.amount)],
    ['Stamp duty', money(r.stampDuty)],
    ['CPF OA added each month', money(r.monthlyOA)],
  ];
  return `
  <main class="screen screen--tab">
    <header class="header">
      <p class="eyebrow">Our Home</p>
      <h1 class="title">Your budget at keys</h1>
    </header>
    <div class="card budget-hero">
      <p class="eyebrow eyebrow--muted">Free for your renovation</p>
      <p class="budget-hero__amount">${money(r.cashLeft)}</p>
    </div>
    <dl class="card list">
      ${rows.map(([k, v]) => `<div class="list__row"><dt>${esc(k)}</dt><dd>${v}</dd></div>`).join('')}
    </dl>
    <p class="hint">These are estimates for planning. Check the final figures with HDB and CPF.</p>
  </main>`;
}

function renderVendors() {
  return `
  <main class="screen screen--tab">
    <header class="header">
      <p class="eyebrow">Our Home</p>
      <h1 class="title">Vendors</h1>
    </header>
    <div class="card empty">
      ${houseOnSun()}
      <h2 class="empty__title">No vendors yet</h2>
      <p class="hint">Soon you'll keep your interior designer, contractor and furniture shops here.</p>
    </div>
  </main>`;
}

function renderTabs() {
  const tabs = [['calculator', 'Calculator'], ['budget', 'Budget'], ['vendors', 'Vendors']];
  return `
  <nav class="tabbar" aria-label="Main" ${state.sheet ? 'inert' : ''}>
    ${tabs.map(([id, label]) => `
      <button type="button" class="tab ${state.tab === id ? 'tab--on' : ''}" data-tab="${id}"
        ${state.tab === id ? 'aria-current="page"' : ''}>
        ${tabIcons[id]}<span>${label}</span>
      </button>`).join('')}
  </nav>`;
}

/* ---------- Render & events ---------- */

function render() {
  let html;
  if (!state.onboarded) html = renderOnboarding();
  else {
    const page = { calculator: renderRoad, budget: renderBudget, vendors: renderVendors }[state.tab] ?? renderRoad;
    html = page() + renderTabs() + (state.tab === 'calculator' ? renderSheet() : '');
  }
  root.innerHTML = html;
  root.className = `app ${state.sheet ? 'app--sheet' : ''}`;
  save();
}

function target() {
  return state.sheet ?? state.inputs;
}

function refreshLive() {
  const fb = root.querySelector('[data-live="feedback"]');
  if (fb && !state.onboarded) fb.innerHTML = STEPS[state.step].feedback(state.inputs);
  const g = root.querySelector('[data-live="grant"]');
  if (g && state.sheet) g.textContent = grantHint(state.sheet.income);
}

function openSheet() {
  state.sheet = { ...state.inputs };
  render();
  root.querySelector('#sheet-title')?.focus();
}

function closeSheet(apply) {
  if (apply) state.inputs = { ...state.sheet };
  state.sheet = null;
  render();
  root.querySelector('[data-action="edit"]')?.focus();
}

root.addEventListener('input', (e) => {
  const el = e.target;
  if (el.matches('[data-money]')) {
    target()[el.name] = parseMoney(el.value);
    refreshLive();
  }
});

root.addEventListener('focusout', (e) => {
  const el = e.target;
  if (el.matches('[data-money]')) {
    const v = parseMoney(el.value);
    el.value = v ? fmt(v) : '';
  }
});

root.addEventListener('click', (e) => {
  const chip = e.target.closest('[data-chip]');
  if (chip) {
    target()[chip.dataset.chip] = chip.dataset.value;
    for (const c of chip.parentElement.querySelectorAll('[data-chip]')) {
      c.setAttribute('aria-checked', String(c === chip));
    }
    refreshLive();
    return;
  }
  const tab = e.target.closest('[data-tab]');
  if (tab) {
    state.tab = tab.dataset.tab;
    render();
    window.scrollTo(0, 0);
    return;
  }
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'back') {
    state.step = Math.max(0, state.step - 1);
    render();
  } else if (action === 'edit') {
    openSheet();
  } else if (action === 'close') {
    closeSheet(false);
  }
});

root.addEventListener('submit', (e) => {
  e.preventDefault();
  const form = e.target.dataset.form;
  if (form === 'onboard') {
    if (state.step < STEPS.length - 1) {
      state.step += 1;
      render();
      root.querySelector('[data-money]')?.focus();
    } else {
      state.onboarded = true;
      state.tab = 'calculator';
      render();
      window.scrollTo(0, 0);
    }
  } else if (form === 'sheet') {
    closeSheet(true);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && state.sheet) closeSheet(false);
});

render();
