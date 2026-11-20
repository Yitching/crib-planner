import { useState, type FormEvent } from 'react';
import { Sheet } from './Sheet';
import { AboutFields, CPFFields, FlatFields, IncomeField, LoanFields, SavingsFields, StageFields } from './Fields';
import { useCalculation } from '../hooks';
import { money, monthName } from '../format';
import type { Inputs } from '../types';

interface Props {
  initial: Inputs;
  onApply: (inputs: Inputs) => void;
  onClose: () => void;
}

export function EditSheet({ initial, onApply, onClose }: Props) {
  const [draft, setDraft] = useState(initial);
  const { result } = useCalculation(draft);
  const set = (patch: Partial<Inputs>) => setDraft((d) => ({ ...d, ...patch }));
  const p = { i: draft, set, result, prefix: 's' };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    onApply(draft);
  };

  return (
    <Sheet title="Edit my numbers" onClose={onClose}>
      <form onSubmit={submit} noValidate>
        <h3 className="sheet__section">Your flat</h3>
        <FlatFields {...p} />
        <StageFields {...p} />

        <h3 className="sheet__section">You two</h3>
        <AboutFields {...p} />
        <IncomeField {...p} />
        <p className="hint hint--grant" aria-live="polite">
          {result && (result.grant > 0 ? `You may get about ${money(result.grant)} in housing grants.` : 'No income-based grant at this income.')}
        </p>

        <h3 className="sheet__section">Money</h3>
        <CPFFields {...p} />
        <SavingsFields {...p} />
        {result && result.savingsMonthly > 0 && (
          <p className="hint hint--grant">+{money(result.savedByKeys)} saved by {monthName(result.keyMonth)}</p>
        )}

        <h3 className="sheet__section">Paying</h3>
        <LoanFields {...p} />

        <button type="submit" className="btn btn--accent btn--block">Show my road</button>
      </form>
    </Sheet>
  );
}
