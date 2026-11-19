import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { HouseOnSun } from './Art';
import { Chips, MoneyInput } from './Controls';
import { useCalculation } from '../hooks';
import { money, percent } from '../format';
import { FLAT_TYPES, LOAN_OPTIONS, type Inputs, type Result } from '../types';

interface Props {
  inputs: Inputs;
  setInputs: (next: Inputs) => void;
  step: number;
  setStep: (step: number) => void;
  onDone: () => void;
}

interface Step {
  title: string;
  hint: string;
  body: (i: Inputs, set: (patch: Partial<Inputs>) => void) => ReactNode;
  feedback: (i: Inputs, r: Result | null) => ReactNode;
}

const flatOptions = FLAT_TYPES.map((t) => [t, t] as const);

const STEPS: Step[] = [
  {
    title: 'Which flat are you looking at?',
    hint: 'Use the price range from the HDB launch page.',
    body: (i, set) => (
      <>
        <Chips options={flatOptions} value={i.flatType} onChange={(flatType) => set({ flatType })} labelledBy="q-title" />
        <label className="field-label" htmlFor="f-price">Flat price</label>
        <MoneyInput id="f-price" large value={i.price} onChange={(price) => set({ price })} />
      </>
    ),
    feedback: (i, r) => r && `The booking fee for a ${i.flatType} flat is about ${money(r.bookingFee)}.`,
  },
  {
    title: 'How much do you earn together each month?',
    hint: 'Add up both your gross salaries. Your payslip shows this before CPF.',
    body: (i, set) => <MoneyInput id="f-income" large label="Combined monthly income" value={i.income} onChange={(income) => set({ income })} />,
    feedback: (_, r) =>
      r && (r.grant > 0
        ? `Nice! You may get about ${money(r.grant)} in housing grants.`
        : 'Above $9,000 a month you may not get the income-based grant, but you can still buy.'),
  },
  {
    title: 'How much is in your CPF Ordinary Account?',
    hint: 'Open the CPF app and look for "Ordinary Account".',
    body: (i, set) => <MoneyInput id="f-cpfA" large label="Your CPF OA balance" value={i.cpfA} onChange={(cpfA) => set({ cpfA })} />,
    feedback: () => 'Your CPF OA can pay the downpayment and the monthly loan.',
  },
  {
    title: "And your partner's CPF Ordinary Account?",
    hint: 'Same place in their CPF app.',
    body: (i, set) => <MoneyInput id="f-cpfB" large label="Partner's CPF OA balance" value={i.cpfB} onChange={(cpfB) => set({ cpfB })} />,
    feedback: (i) => `Together that's ${money(i.cpfA + i.cpfB)} in CPF today.`,
  },
  {
    title: 'How much cash have you saved for the home?',
    hint: 'Count savings you can set aside, not your emergency fund.',
    body: (i, set) => <MoneyInput id="f-cash" large label="Cash saved" value={i.cash} onChange={(cash) => set({ cash })} />,
    feedback: (_, r) => r && `The ${money(r.bookingFee)} booking fee comes from this. The rest can go to renovation.`,
  },
  {
    title: 'HDB loan or bank loan?',
    hint: 'Not sure? Most first-timers start with an HDB loan.',
    body: (i, set) => <Chips options={LOAN_OPTIONS} value={i.loanType} onChange={(loanType) => set({ loanType })} labelledBy="q-title" />,
    feedback: (i, r) =>
      r && (i.loanType === 'bank'
        ? `We'll assume ${percent(r.loan.rate)} interest. Banks need 5% of the price in cash.`
        : `We'll use the HDB rate of ${percent(r.loan.rate)}. You can pay it all with CPF.`),
  },
];

export function Onboarding({ inputs, setInputs, step, setStep, onDone }: Props) {
  const { result } = useCalculation(inputs);
  const formRef = useRef<HTMLFormElement>(null);
  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  const set = (patch: Partial<Inputs>) => setInputs({ ...inputs, ...patch });
  const feedback = current.feedback(inputs, result);

  useEffect(() => {
    formRef.current?.querySelector<HTMLInputElement>('input')?.focus();
  }, [step]);

  const next = (e: FormEvent) => {
    e.preventDefault();
    if (last) onDone();
    else setStep(step + 1);
  };

  return (
    <main className="screen screen--onboard">
      <div className="topbar">
        <button type="button" className="link-back" hidden={step === 0} onClick={() => setStep(step - 1)}>
          ← Back
        </button>
        <div className="progress" aria-hidden="true">
          {STEPS.map((_, n) => <span key={n} className={`dot ${n <= step ? 'dot--on' : ''}`} />)}
        </div>
        <span className="progress-count">{step + 1} of {STEPS.length}</span>
      </div>
      <HouseOnSun />
      <form ref={formRef} className="question" onSubmit={next} noValidate>
        <h1 id="q-title" className="title">{current.title}</h1>
        <div className="question__body">{current.body(inputs, set)}</div>
        <p className="hint">{current.hint}</p>
        <div className="feedback" role="status">{feedback}</div>
        <button type="submit" className="btn btn--primary btn--block">{last ? 'Show my road' : 'Next'}</button>
      </form>
    </main>
  );
}
