import { useState } from 'react';
import { Sheet } from './Sheet';
import { MoneyInput } from './Controls';
import { checklist } from '../checklists';
import { howFar, money, monthName } from '../format';
import type { Inputs, PayStopId, Result, Stop } from '../types';

interface Props {
  stop: Stop;
  result: Result;
  inputs: Inputs;
  checks: Record<string, boolean>;
  onToggle: (key: string) => void;
  onOverride: (id: PayStopId, amount: number | null) => void;
  onClose: () => void;
}

export function StopSheet({ stop, result, inputs, checks, onToggle, onOverride, onClose }: Props) {
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(stop.amount);
  const paid = stop.status === 'paid';
  const isLoan = stop.id === 'loan';
  const when = paid ? 'Done' : stop.month ? `${monthName(stop.month)} · ${howFar(stop.monthsAway)}` : '';

  return (
    <Sheet title={stop.title} eyebrow={when} onClose={onClose}>
      <div className={`stop-total ${paid ? 'stop-total--paid' : ''}`}>
        <span className="stop-total__label">{paid ? 'You paid' : isLoan ? 'Each month' : 'Due at this appointment'}</span>
        <span className="stop-total__amount">{money(stop.amount)}{isLoan && <small>/mo</small>}</span>
      </div>

      <ul className="breakdown">
        {stop.breakdown.map((b) => (
          <li key={b.label}><span>{b.label}</span><strong>{money(b.amount)}</strong></li>
        ))}
      </ul>

      {!paid && !isLoan && (
        <>
          <h3 className="sheet__section">What you'll need by then</h3>
          <div className="need-grid">
            <Need label="From CPF" need={stop.cpfPart} have={stop.cpfAvailable} />
            <Need label="In cash" need={stop.cashPart} have={stop.cashAvailable} />
          </div>
          {stop.shortfall > 0 ? (
            <p className="alert">You're about {money(stop.shortfall)} short. Save a bit more each month, or check if you can use the Staggered or Deferred downpayment.</p>
          ) : (
            <p className="hint">You'll have enough, counting your savings and CPF contributions until then.</p>
          )}
        </>
      )}

      {!isLoan && (
        <div className="override">
          {editing ? (
            <form
              className="override__form"
              onSubmit={(e) => {
                e.preventDefault();
                onOverride(stop.id as PayStopId, amount);
                setEditing(false);
              }}
            >
              <label className="field-label" htmlFor="override-amount">
                {paid ? 'How much did you actually pay?' : 'How much did HDB ask for?'}
              </label>
              <MoneyInput id="override-amount" value={amount} onChange={setAmount} />
              <div className="override__actions">
                <button type="button" className="btn btn--ghost btn--small" onClick={() => setEditing(false)}>Cancel</button>
                <button type="submit" className="btn btn--accent btn--small">Save</button>
              </div>
            </form>
          ) : (
            <p className="hint">
              {stop.overridden ? 'Using the amount you entered. ' : 'This is our estimate. '}
              <button type="button" className="link" onClick={() => { setAmount(stop.amount); setEditing(true); }}>
                {paid ? 'Paid a different amount?' : 'Different amount from HDB?'}
              </button>
              {stop.overridden && (
                <> · <button type="button" className="link" onClick={() => onOverride(stop.id as PayStopId, null)}>Use our estimate</button></>
              )}
            </p>
          )}
        </div>
      )}

      {!isLoan && (
        <>
          <h3 className="sheet__section">Checklist for this appointment</h3>
          <ul className="checklist">
            {checklist(stop.id as PayStopId, stop, inputs, result.cashLeft).map((c) => {
              const key = `${stop.id}:${c.id}`;
              return (
                <li key={key}>
                  <label className="check">
                    <input type="checkbox" checked={Boolean(checks[key])} onChange={() => onToggle(key)} />
                    <span>{c.text}</span>
                  </label>
                </li>
              );
            })}
          </ul>
          <p className="hint">Based on HDB's usual process. Your appointment letter from HDB has the final list.</p>
        </>
      )}

      {isLoan && (
        <>
          <p className="hint">
            {stop.paidFrom === 'Monthly CPF'
              ? `Your CPF contributions (about ${money(result.monthlyOA)} a month) can cover this.`
              : `Your CPF contributions (about ${money(result.monthlyOA)} a month) won't cover it all, so plan to top up in cash.`}
          </p>
          <p className="hint">See the Budget tab for how to get the biggest loan.</p>
        </>
      )}
    </Sheet>
  );
}

function Need({ label, need, have }: { label: string; need: number; have: number }) {
  const short = need > have;
  return (
    <div className={`need ${short ? 'need--short' : ''}`}>
      <span className="need__label">{label}</span>
      <span className="need__amount">{money(need)}</span>
      <span className="need__have">You'll have {money(have)}</span>
    </div>
  );
}
