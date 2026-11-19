import { useCallback, useState } from 'react';
import { Onboarding } from './components/Onboarding';
import { Road } from './components/Road';
import { EditSheet } from './components/EditSheet';
import { Budget, TabBar, Vendors, type Tab } from './components/Tabs';
import { useCalculation, usePersistentState } from './hooks';
import { DEFAULT_INPUTS, type Inputs } from './types';

interface Saved {
  inputs: Inputs;
  onboarded: boolean;
  step: number;
  tab: Tab;
}

const INITIAL: Saved = { inputs: DEFAULT_INPUTS, onboarded: false, step: 0, tab: 'calculator' };

export default function App() {
  const [saved, setSaved] = usePersistentState<Saved>('crib-planner:v2', INITIAL);
  const [editing, setEditing] = useState(false);
  const update = (patch: Partial<Saved>) => setSaved((s) => ({ ...s, ...patch }));

  const { result, error, retry } = useCalculation(saved.onboarded ? saved.inputs : null);

  const closeSheet = useCallback(() => {
    setEditing(false);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>('[data-edit]')?.focus());
  }, []);

  if (!saved.onboarded) {
    return (
      <div className="app">
        <Onboarding
          inputs={saved.inputs}
          setInputs={(inputs) => update({ inputs })}
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

  return (
    <div className="app">
      {saved.tab === 'calculator' && (
        <Road result={result} error={error} onRetry={retry} onEdit={() => setEditing(true)} hidden={editing} />
      )}
      {saved.tab === 'budget' && <Budget result={result} />}
      {saved.tab === 'vendors' && <Vendors />}
      <TabBar
        tab={saved.tab}
        hidden={editing}
        onChange={(tab) => {
          update({ tab });
          window.scrollTo(0, 0);
        }}
      />
      {editing && (
        <EditSheet
          initial={saved.inputs}
          onClose={closeSheet}
          onApply={(inputs) => {
            update({ inputs });
            closeSheet();
          }}
        />
      )}
    </div>
  );
}
