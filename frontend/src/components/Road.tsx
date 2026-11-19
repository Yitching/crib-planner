import { EndHouse, StopIcon } from './Art';
import { money } from '../format';
import type { Result, Verdict } from '../types';

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

interface Props {
  result: Result | null;
  error: string | null;
  onRetry: () => void;
  onEdit: () => void;
  hidden: boolean;
}

export function Road({ result, error, onRetry, onEdit, hidden }: Props) {
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
              : <><strong>{money(result.cashLeft)}</strong> cash left for your reno at key collection.</>}
          </p>
        )}
      </header>

      {result && (
        <>
          <ol className="road" style={{ '--rows': result.stops.length } as React.CSSProperties}>
            <RoadSvg n={result.stops.length} />
            {result.stops.map((s, k) => (
              <li key={s.id} className={`stop stop--${k % 2 === 0 ? 'left' : 'right'}`} style={{ '--row': k } as React.CSSProperties}>
                <span className={`stop__marker stop__marker--${s.color}`} aria-hidden="true">{k + 1}</span>
                <article className="card stop__card">
                  <div className="stop__head">
                    <span className={`stop__icon stop__icon--${s.color}`}>{StopIcon[s.id]}</span>
                    <span className="stop__when">{s.when}</span>
                  </div>
                  <h2 className="stop__title">{s.title}</h2>
                  <p className="stop__amount">
                    {money(s.amount)}
                    {s.monthly && <span className="stop__per">/mo</span>}
                  </p>
                  <p className="stop__from">Paid from <strong>{s.paidFrom}</strong></p>
                </article>
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
