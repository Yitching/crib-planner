import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Chips, MoneyInput } from './Controls';
import { useCalculation } from '../hooks';
import { money } from '../format';
import { FLAT_TYPES, LOAN_OPTIONS, type Inputs } from '../types';

interface Props {
  initial: Inputs;
  onApply: (inputs: Inputs) => void;
  onClose: () => void;
}

const flatOptions = FLAT_TYPES.map((t) => [t, t] as const);

export function EditSheet({ initial, onApply, onClose }: Props) {
  const [draft, setDraft] = useState(initial);
  const { result } = useCalculation(draft);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const set = (patch: Partial<Inputs>) => setDraft((d) => ({ ...d, ...patch }));

  useEffect(() => {
    titleRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onApply(draft);
  };

  return (
    <>
      <div className="scrim" onClick={onClose} />
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title">
        <span className="sheet__handle" aria-hidden="true" />
        <div className="sheet__head">
          <h2 id="sheet-title" ref={titleRef} className="sheet__title" tabIndex={-1}>Edit my numbers</h2>
          <button type="button" className="icon-btn" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit} noValidate>
          <p id="s-flat" className="field-label">Flat size</p>
          <Chips options={flatOptions} value={draft.flatType} onChange={(flatType) => set({ flatType })} labelledBy="s-flat" />

          <label className="field-label" htmlFor="s-price">Flat price</label>
          <MoneyInput id="s-price" value={draft.price} onChange={(price) => set({ price })} />

          <label className="field-label" htmlFor="s-income">Monthly income (together)</label>
          <MoneyInput id="s-income" value={draft.income} onChange={(income) => set({ income })} />
          <p className="hint hint--grant" aria-live="polite">
            {result && (result.grant > 0 ? `You may get about ${money(result.grant)} in housing grants.` : 'No income-based grant at this income.')}
          </p>

          <div className="split">
            <div>
              <label className="field-label" htmlFor="s-cpfA">Your CPF OA</label>
              <MoneyInput id="s-cpfA" value={draft.cpfA} onChange={(cpfA) => set({ cpfA })} />
            </div>
            <div>
              <label className="field-label" htmlFor="s-cpfB">Partner's CPF OA</label>
              <MoneyInput id="s-cpfB" value={draft.cpfB} onChange={(cpfB) => set({ cpfB })} />
            </div>
          </div>

          <label className="field-label" htmlFor="s-cash">Cash saved</label>
          <MoneyInput id="s-cash" value={draft.cash} onChange={(cash) => set({ cash })} />

          <p id="s-loan" className="field-label">Loan</p>
          <Chips options={LOAN_OPTIONS} value={draft.loanType} onChange={(loanType) => set({ loanType })} labelledBy="s-loan" />

          <button type="submit" className="btn btn--accent btn--block">Show my road</button>
        </form>
      </section>
    </>
  );
}
