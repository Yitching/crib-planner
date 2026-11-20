import { useCallback, useState } from 'react';
import { Onboarding } from './components/Onboarding';
import { Road } from './components/Road';
import { EditSheet } from './components/EditSheet';
import { StopSheet } from './components/StopSheet';
import { Budget, TabBar, Vendors, type Tab } from './components/Tabs';
import { useCalculation, usePersistentState } from './hooks';
import { DEFAULT_INPUTS, type Inputs, type PayStopId, type StopId } from './types';

interface Saved {
  inputs: Inputs;
  onboarded: boolean;
  step: number;
  tab: Tab;
  checks: Record<string, boolean>;
}

const INITIAL: Saved = { inputs: DEFAULT_INPUTS, onboarded: false, step: 0, tab: 'calculator', checks: {} };

type Open = { kind: 'edit' } | { kind: 'stop'; id: StopId } | null;

export default function App() {
  const [saved, setSaved] = usePersistentState<Saved>('crib-planner:v3', INITIAL);
  const [open, setOpen] = useState<Open>(null);
  const update = (patch: Partial<Saved>) => setSaved((s) => ({ ...s, ...patch }));
  const inputs = { ...DEFAULT_INPUTS, ...saved.inputs };

  const { result, error, retry } = useCalculation(saved.onboarded ? inputs : null);

  const close = useCallback(() => {
    setOpen(null);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[data-edit]')?.focus());
  }, []);

  const setOverride = (id: PayStopId, amount: number | null) => {
    const overrides = { ...inputs.overrides };
    if (amount === null) delete overrides[id];
    else overrides[id] = amount;
    update({ inputs: { ...inputs, overrides } });
  };

  if (!saved.onboarded) {
    return (
      <div className="app">
        <Onboarding
          inputs={inputs}
          setInputs={(next) => update({ inputs: next })}
          step={saved.step}
          setStep={(step) => update({ step })}
          onDone={() => {
            update({ onboarded: true, tab: 'calculator' });
            window.scrollTo(0, 0);
          }}
        />
      </div>
    );
  }

  const openStop = open?.kind === 'stop' ? result?.stops.find((s) => s.id === open.id) : undefined;

  return (
    <div className="app">
      {saved.tab === 'calculator' && (
        <Road
          result={result}
          error={error}
          onRetry={retry}
          onEdit={() => setOpen({ kind: 'edit' })}
          onOpenStop={(id) => setOpen({ kind: 'stop', id })}
          hidden={open !== null}
        />
      )}
      {saved.tab === 'budget' && <Budget result={result} />}
      {saved.tab === 'vendors' && <Vendors />}
      <TabBar
        tab={saved.tab}
        hidden={open !== null}
        onChange={(tab) => {
          update({ tab });
          window.scrollTo(0, 0);
        }}
      />
      {open?.kind === 'edit' && (
        <EditSheet
          initial={inputs}
          onClose={close}
          onApply={(next) => {
            update({ inputs: next });
            close();
          }}
        />
      )}
      {openStop && result && (
        <StopSheet
          key={openStop.id}
          stop={openStop}
          result={result}
          inputs={inputs}
          checks={saved.checks}
          onToggle={(key) => update({ checks: { ...saved.checks, [key]: !saved.checks[key] } })}
          onOverride={setOverride}
          onClose={close}
        />
      )}
    </div>
  );
}
