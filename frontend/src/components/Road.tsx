import type { CSSProperties } from 'react';
import { EndHouse, StopIcon } from './Art';
import { howFar, money, monthName } from '../format';
import type { Result, Stop, Verdict } from '../types';

const ROW_H = 160; // keep in sync with --row-h in styles.css
const W = 390;

function roadPath(n: number): string {
  const pts: [number, number][] = [[W / 2, 0]];
  for (let k = 0; k < n; k++) pts.push([(k % 2 === 0 ? 0.8 : 0.2) * W, ROW_H * k + ROW_H / 2]);
  pts.push([W / 2, ROW_H * n + 20]);
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let k = 1; k < pts.length; k++) {
    const [x0, y0] = pts[k - 1];
    const [x1, y1] = pts[k];
    const dy = (y1 - y0) / 2;
    d += ` C${x0} ${y0 + dy} ${x1} ${y1 - dy} ${x1} ${y1}`;
  }
  return d;
}

function RoadSvg({ n }: { n: number }) {
  const d = roadPath(n);
  const common = { d, fill: 'none', vectorEffect: 'non-scaling-stroke' } as const;
  return (
    <svg className="road__svg" viewBox={`0 0 ${W} ${ROW_H * n + 20}`} preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path {...common} stroke="var(--ink)" strokeWidth={34} strokeLinecap="round" />
      <path {...common} stroke="#fff" strokeWidth={27} strokeLinecap="round" />
      <path {...common} stroke="var(--yellow)" strokeWidth={3} strokeDasharray="10 12" />
    </svg>
  );
}

const VERDICT_TEXT: Record<Verdict, string> = {
  ok: 'You can afford it',
  tight: "It's tight, but doable",
  no: 'Not quite yet',
};

export function VerdictPill({ verdict }: { verdict: Verdict }) {
  return (
    <span className={`pill pill--${verdict}`}>
      <span className="pill__icon" aria-hidden="true">{verdict === 'no' ? '!' : '✓'}</span>
      {VERDICT_TEXT[verdict]}
    </span>
  );
}

function stopWhen(s: Stop): string {
  if (s.status === 'paid') return 'Paid';
  if (s.monthly) return `From ${monthName(s.month)}`;
  if (s.monthsAway <= 0) return 'Now';
  return `${monthName(s.month)} · ${howFar(s.monthsAway).replace('in ', '')}`;
}

function NextUp({ stop, onOpen }: { stop: Stop; onOpen: () => void }) {
  if (stop.monthly) {
    return (
      <button type="button" className="card next-up" onClick={onOpen}>
        <span className="eyebrow">Next up</span>
        <span className="next-up__title">Monthly loan payments</span>
        <span className="next-up__line">{money(stop.amount)} a month, paid from {stop.paidFrom.toLowerCase()}</span>
      </button>
    );
  }
  return (
    <button type="button" className={`card next-up ${stop.shortfall > 0 ? 'next-up--short' : ''}`} onClick={onOpen}>
      <span className="eyebrow">Next up · {stop.monthsAway > 0 ? monthName(stop.month) : 'now'}</span>
      <span className="next-up__title">{stop.title}: {money(stop.amount)}</span>
      <span className="next-up__line">
        Need {money(stop.cpfPart)} CPF + {money(stop.cashPart)} cash. You'll have {money(stop.cpfAvailable)} CPF and {money(stop.cashAvailable)} cash.
      </span>
      <span className="next-up__cta">{stop.shortfall > 0 ? `${money(stop.shortfall)} short · see what to do` : 'See checklist →'}</span>
    </button>
  );
}

interface Props {
  result: Result | null;
  error: string | null;
  onRetry: () => void;
  onEdit: () => void;
  onOpenStop: (id: Stop['id']) => void;
  hidden: boolean;
}

export function Road({ result, error, onRetry, onEdit, onOpenStop, hidden }: Props) {
  const next = result?.stops.find((s) => s.status === 'next');
  return (
    <main className="screen screen--road" inert={hidden} aria-hidden={hidden || undefined}>
      <header className="header">
        <p className="eyebrow">Our Home</p>
        <h1 className="title">The road to your keys</h1>
        <div className="header__row">
          {result ? <VerdictPill verdict={result.verdict} /> : <span className="pill pill--loading">Working it out…</span>}
          <button type="button" className="btn btn--ghost btn--small" data-edit onClick={onEdit}>
            Edit my numbers
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error} <button type="button" className="link" onClick={onRetry}>Try again</button>
          </p>
        )}
        {result && (
          <p className="summary">
            {result.verdict === 'no'
              ? result.reasons.join(' ')
              : <><strong>{money(result.cashLeft)}</strong> cash left for your reno when you get your keys in {monthName(result.keyMonth)}.</>}
          </p>
        )}
        {result && result.notes.length > 0 && (
          <ul className="notes">
            {result.notes.map((n) => <li key={n}>{n}</li>)}
          </ul>
        )}
        {next && <NextUp stop={next} onOpen={() => onOpenStop(next.id)} />}
      </header>

      {result && (
        <>
          <ol className="road" style={{ '--rows': result.stops.length } as CSSProperties}>
            <RoadSvg n={result.stops.length} />
            {result.stops.map((s, k) => (
              <li key={s.id} className={`stop stop--${k % 2 === 0 ? 'left' : 'right'} stop--${s.status}`} style={{ '--row': k } as CSSProperties}>
                <span className={`stop__marker stop__marker--${s.color}`} aria-hidden="true">{s.status === 'paid' ? '✓' : k + 1}</span>
                <button type="button" className="card stop__card" onClick={() => onOpenStop(s.id)} aria-label={`${s.title}, ${money(s.amount)}${s.monthly ? ' a month' : ''}, ${stopWhen(s)}. Open details`}>
                  <span className="stop__head">
                    <span className={`stop__icon stop__icon--${s.color}`}>{StopIcon[s.id]}</span>
                    <span className="stop__when">{stopWhen(s)}</span>
                    {s.status === 'next' && <span className="badge">Next</span>}
                  </span>
                  <span className="stop__title">{s.title}</span>
                  <span className="stop__amount">
                    {money(s.amount)}
                    {s.monthly && <span className="stop__per">/mo</span>}
                  </span>
                  <span className="stop__from">
                    {s.status === 'paid' ? 'Done ✓' : <>Paid from <strong>{s.paidFrom}</strong></>}
                  </span>
                </button>
              </li>
            ))}
          </ol>
          <div className="road__end">
            <EndHouse />
            <p className="road__caption">Home sweet home 🔑</p>
          </div>
        </>
      )}
    </main>
  );
}
