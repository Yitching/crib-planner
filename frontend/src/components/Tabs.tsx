import { HouseOnSun, TabIcon } from './Art';
import { money } from '../format';
import type { Result } from '../types';

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

export function Budget({ result }: { result: Result | null }) {
  return (
    <main className="screen screen--tab">
      <header className="header">
        <p className="eyebrow">Our Home</p>
        <h1 className="title">Your budget at keys</h1>
      </header>
      {result && (
        <>
          <div className="card budget-hero">
            <p className="eyebrow eyebrow--muted">Free for your renovation</p>
            <p className="budget-hero__amount">{money(result.cashLeft)}</p>
          </div>
          <dl className="card list">
            {[
              ['Cash left for renovation', money(result.cashLeft)],
              ['CPF OA left at keys', money(result.cpfLeft)],
              ['Housing grant (estimate)', money(result.grant)],
              [`${result.loan.label} amount`, money(result.loan.amount)],
              ['Stamp duty', money(result.stampDuty)],
              ['CPF OA added each month', money(result.monthlyOA)],
            ].map(([k, v]) => (
              <div key={k} className="list__row">
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </>
      )}
      <p className="hint">These are estimates for planning. Check the final figures with HDB and CPF.</p>
    </main>
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
