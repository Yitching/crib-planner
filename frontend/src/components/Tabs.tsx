import { HouseOnSun, TabIcon } from './Art';
import { money, monthName, percent } from '../format';
import type { Criterion, Result } from '../types';

export type Tab = 'calculator' | 'budget' | 'vendors';

const TABS: [Tab, string][] = [
  ['calculator', 'Calculator'],
  ['budget', 'Budget'],
  ['vendors', 'Vendors'],
];

export function TabBar({ tab, onChange, hidden }: { tab: Tab; onChange: (t: Tab) => void; hidden: boolean }) {
  return (
    <nav className="tabbar" aria-label="Main" inert={hidden}>
      {TABS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          className={`tab ${tab === id ? 'tab--on' : ''}`}
          aria-current={tab === id ? 'page' : undefined}
          onClick={() => onChange(id)}
        >
          {TabIcon[id]}
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

const STATUS_ICON: Record<Criterion['status'], string> = { ok: '✓', warn: '!', fail: '✕', info: 'i' };
const STATUS_TEXT: Record<Criterion['status'], string> = { ok: 'Met', warn: 'Check', fail: 'Not met', info: 'Note' };

export function Budget({ result }: { result: Result | null }) {
  if (!result) {
    return (
      <main className="screen screen--tab">
        <header className="header"><p className="eyebrow">Our Home</p><h1 className="title">Your budget at keys</h1></header>
      </main>
    );
  }
  const cashOut = result.stops.filter((s) => s.status !== 'paid' && !s.monthly).reduce((sum, s) => sum + s.cashPart, 0);
  const r = result;
  return (
    <main className="screen screen--tab">
      <header className="header">
        <p className="eyebrow">Our Home</p>
        <h1 className="title">Your budget at keys</h1>
      </header>

      <div className="card budget-hero">
        <p className="eyebrow eyebrow--muted">Free for your renovation · {monthName(r.keyMonth)}</p>
        <p className="budget-hero__amount">{money(r.cashLeft)}</p>
      </div>

      <h2 className="section-title">How we got there</h2>
      <dl className="card list">
        <Row k="Cash saved today" v={money(r.inputs.cash)} />
        <Row k={`Savings: ${money(r.savingsMonthly)}/mo × ${r.monthsToKeys} months`} v={`+ ${money(r.savedByKeys)}`} />
        <Row k="Cash for the flat payments" v={`− ${money(cashOut)}`} />
        <Row k="Left for renovation" v={money(r.cashLeft)} strong />
      </dl>

      <dl className="card list">
        <Row k="CPF OA left at keys" v={money(r.cpfLeft)} />
        <Row k="Housing grant (estimate)" v={money(r.grant)} />
        <Row k="Stamp duty" v={money(r.stampDuty)} />
        <Row k="CPF OA added each month" v={money(r.monthlyOA)} />
        {r.paidSoFar > 0 && <Row k="Paid to HDB so far" v={money(r.paidSoFar)} />}
      </dl>

      <h2 className="section-title">Getting the biggest loan</h2>
      <div className="card loan-card">
        <p className="eyebrow eyebrow--muted">{r.loan.label} you can expect</p>
        <p className="loan-card__amount">{money(r.loan.amount)}</p>
        <p className="hint">
          {money(r.loan.monthly)} a month over {r.loan.tenureYears} years at about {percent(r.loan.rate)}.
          The most you could borrow is the lower of {money(r.loan.maxByLTV)} (75% of the price) and {money(r.loan.maxByIncome)} (what your income supports).
          {r.loan.cpfToLoan > 0 && ` Then about ${money(r.loan.cpfToLoan)} of your CPF goes to cut the loan.`}
        </p>
      </div>
      <ul className="card criteria">
        {r.loan.criteria.map((c) => (
          <li key={c.label} className={`criterion criterion--${c.status}`}>
            <span className="criterion__icon" aria-label={STATUS_TEXT[c.status]}>{STATUS_ICON[c.status]}</span>
            <span>
              <strong className="criterion__label">{c.label}</strong>
              <span className="criterion__detail">{c.detail}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="hint">These are estimates for planning. Your HFE letter from HDB shows the actual loan amount you can get.</p>
    </main>
  );
}

function Row({ k, v, strong = false }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className={`list__row ${strong ? 'list__row--total' : ''}`}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}

export function Vendors() {
  return (
    <main className="screen screen--tab">
      <header className="header">
        <p className="eyebrow">Our Home</p>
        <h1 className="title">Vendors</h1>
      </header>
      <div className="card empty">
        <HouseOnSun />
        <h2 className="empty__title">No vendors yet</h2>
        <p className="hint">Soon you'll keep your interior designer, contractor and furniture shops here.</p>
      </div>
    </main>
  );
}
