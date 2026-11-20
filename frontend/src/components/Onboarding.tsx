import { useEffect, useRef, type FormEvent, type ReactNode } from 'react';
import { HouseOnSun } from './Art';
import { AboutFields, CPFFields, FlatFields, IncomeField, LoanFields, SavingsFields, StageFields, type FieldProps } from './Fields';
import { useCalculation } from '../hooks';
import { howFar, money, monthName, percent } from '../format';
import { STAGE_ORDER, diaEligible, type Inputs, type Result } from '../types';

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
  Body: (p: FieldProps) => ReactNode;
  feedback: (i: Inputs, r: Result) => ReactNode;
}

function paidSoFarText(i: Inputs, r: Result): string {
  const stage = STAGE_ORDER.indexOf(i.stage);
  const keys = r.stops.find((s) => s.id === 'keys');
  if (stage === 0) return `Your keys are ${howFar(r.monthsToKeys)}, around ${monthName(r.keyMonth)}.`;
  if (stage === 3) return `You've paid about ${money(r.paidSoFar)} so far. Now it's just the monthly loan.`;
  return `You've probably paid about ${money(r.paidSoFar)} so far, and your keys are ${howFar(keys?.monthsAway ?? 0)}. If HDB's figures were different, tap that stop on your road to change it.`;
}

function schemeText(i: Inputs, r: Result): string {
  const sign = r.stops.find((s) => s.id === 'sign');
  const amount = sign ? ` That's ${money(sign.amount)} with stamp duty and fees.` : '';
  if (i.scheme === 'dia' && diaEligible(i)) return `We picked Deferred Income Assessment for you: just 2.5% at signing, and HDB checks your income before key collection.${amount}`;
  if (i.scheme === 'dia') return 'Deferred Income Assessment needs one of you to be a student or in NS, and one of you to be 30 or under.';
  if (i.scheme === 'staggered') return `Pay 5% when you sign and the rest at key collection.${amount}`;
  return `Pay 10% when you sign and 15% at key collection.${amount}`;
}

const STEPS: Step[] = [
  {
    title: 'Which flat are you looking at?',
    hint: 'Use the price range from the HDB launch page.',
    Body: (p) => <FlatFields {...p} />,
    feedback: (i, r) => `The booking fee for a ${i.flatType} flat is about ${money(r.bookingFee)}.`,
  },
  {
    title: 'Where are you in the process?',
    hint: "Not sure of the dates? Leave our estimates, and change them when HDB tells you.",
    Body: (p) => <StageFields {...p} />,
    feedback: paidSoFarText,
  },
  {
    title: 'A bit about you two',
    hint: 'Your ages decide how long your loan can be. Students and NSmen can pay less upfront.',
    Body: (p) => <AboutFields {...p} />,
    feedback: (i, r) => (diaEligible(i)
      ? 'Good news: you may qualify for Deferred Income Assessment. You pay just 2.5% when you sign the lease.'
      : `You can borrow for up to ${r.loan.tenureYears} years.${i.student ? ' Deferred Income Assessment needs one of you to be 30 or under.' : ''}`),
  },
  {
    title: 'How much do you earn together each month?',
    hint: 'Add up both your gross salaries. Your payslip shows this before CPF.',
    Body: (p) => <IncomeField {...p} />,
    feedback: (_, r) => (r.grant > 0
      ? `Nice! You may get about ${money(r.grant)} in housing grants.`
      : 'Above $9,000 a month you may not get the income-based grant, but you can still buy.'),
  },
  {
    title: 'How much is in your CPF Ordinary Accounts?',
    hint: 'Open the CPF app and look for "Ordinary Account".',
    Body: (p) => <CPFFields {...p} />,
    feedback: (i) => `Together that's ${money(i.cpfA + i.cpfB)} in CPF today, and about ${money(i.income * 0.23)} more goes in every month.`,
  },
  {
    title: 'How much cash do you have, and save?',
    hint: 'Count savings you can set aside for the home, not your emergency fund.',
    Body: (p) => <SavingsFields {...p} />,
    feedback: (_, r) => (r.savingsMonthly > 0
      ? `By key collection in ${monthName(r.keyMonth)}, you'll have saved another ${money(r.savedByKeys)}.`
      : 'Add your monthly savings to see how much you will have by key collection.'),
  },
  {
    title: 'How will you pay?',
    hint: 'Not sure? Most first-timers start with an HDB loan.',
    Body: (p) => <LoanFields {...p} />,
    feedback: (i, r) => `${schemeText(i, r)} ${r.loan.label} at about ${percent(r.loan.rate)} interest.`,
  },
];

export function Onboarding({ inputs, setInputs, step, setStep, onDone }: Props) {
  const { result } = useCalculation(inputs);
  const formRef = useRef<HTMLFormElement>(null);
  const current = STEPS[Math.min(step, STEPS.length - 1)];
  const last = step >= STEPS.length - 1;
  const set = (patch: Partial<Inputs>) => setInputs({ ...inputs, ...patch });

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
        <span className="progress-count">{Math.min(step, STEPS.length - 1) + 1} of {STEPS.length}</span>
      </div>
      <HouseOnSun />
      <form ref={formRef} className="question" onSubmit={next} noValidate>
        <h1 id="q-title" className="title">{current.title}</h1>
        <div className="question__body">
          <current.Body i={inputs} set={set} result={result} prefix="f" large />
        </div>
        <p className="hint">{current.hint}</p>
        <div className="feedback" role="status">{result && current.feedback(inputs, result)}</div>
        <button type="submit" className="btn btn--primary btn--block">{last ? 'Show my road' : 'Next'}</button>
      </form>
    </main>
  );
}
