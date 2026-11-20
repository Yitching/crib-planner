// Field groups shared by first-time setup and the "Edit my numbers" sheet.
import { AgeInput, Chips, MonthInput, MoneyInput } from './Controls';
import {
  FLAT_TYPES, LOAN_OPTIONS, SCHEME_OPTIONS, STAGE_OPTIONS, STAGE_ORDER, suggestScheme,
  type Inputs, type Result,
} from '../types';

export interface FieldProps {
  i: Inputs;
  set: (patch: Partial<Inputs>) => void;
  result: Result | null;
  prefix: string; // keeps ids unique between setup and the sheet
  large?: boolean;
}

const flatOptions = FLAT_TYPES.map((t) => [t, t] as const);

export function FlatFields({ i, set, prefix, large }: FieldProps) {
  return (
    <>
      <p id={`${prefix}-flat`} className="field-label">Flat size</p>
      <Chips options={flatOptions} value={i.flatType} onChange={(flatType) => set({ flatType })} labelledBy={`${prefix}-flat`} />
      <label className="field-label" htmlFor={`${prefix}-price`}>Flat price</label>
      <MoneyInput id={`${prefix}-price`} large={large} value={i.price} onChange={(price) => set({ price })} />
    </>
  );
}

export function StageFields({ i, set, result, prefix }: FieldProps) {
  const stage = STAGE_ORDER.indexOf(i.stage);
  const signMonth = result?.stops.find((s) => s.id === 'sign')?.month ?? '';
  return (
    <>
      <p id={`${prefix}-stage`} className="field-label">Where are you now?</p>
      <Chips
        options={STAGE_OPTIONS}
        value={i.stage}
        onChange={(s) => set({ stage: s })}
        labelledBy={`${prefix}-stage`}
      />
      {stage < 2 && (
        <>
          <label className="field-label" htmlFor={`${prefix}-sign`}>Signing the lease (estimate)</label>
          <MonthInput id={`${prefix}-sign`} value={i.signDate} placeholder={signMonth} onChange={(signDate) => set({ signDate })} />
        </>
      )}
      {stage < 3 && (
        <>
          <label className="field-label" htmlFor={`${prefix}-keys`}>Key collection (estimate)</label>
          <MonthInput id={`${prefix}-keys`} value={i.keyDate} placeholder={result?.keyMonth ?? ''} onChange={(keyDate) => set({ keyDate })} />
        </>
      )}
    </>
  );
}

export function AboutFields({ i, set, prefix }: FieldProps) {
  // Picking DIA automatically when you look eligible; you can still change it later.
  const setAuto = (patch: Partial<Inputs>) => {
    const next = { ...i, ...patch };
    set({ ...patch, scheme: suggestScheme(next) });
  };
  return (
    <>
      <div className="split">
        <div>
          <label className="field-label" htmlFor={`${prefix}-ageA`}>Your age</label>
          <AgeInput id={`${prefix}-ageA`} value={i.ageA} onChange={(ageA) => setAuto({ ageA })} />
        </div>
        <div>
          <label className="field-label" htmlFor={`${prefix}-ageB`}>Partner's age</label>
          <AgeInput id={`${prefix}-ageB`} value={i.ageB} onChange={(ageB) => setAuto({ ageB })} />
        </div>
      </div>
      <p id={`${prefix}-student`} className="field-label">
        Is either of you a full-time student or serving NS, or finished in the last 12 months?
      </p>
      <Chips
        options={[['no', 'No'], ['yes', 'Yes']] as const}
        value={i.student ? 'yes' : 'no'}
        onChange={(v) => setAuto({ student: v === 'yes' })}
        labelledBy={`${prefix}-student`}
      />
    </>
  );
}

export function IncomeField({ i, set, prefix, large }: FieldProps) {
  return (
    <>
      <label className="field-label" htmlFor={`${prefix}-income`}>Monthly income (together, before CPF)</label>
      <MoneyInput id={`${prefix}-income`} large={large} value={i.income} onChange={(income) => set({ income })} />
    </>
  );
}

export function CPFFields({ i, set, prefix }: FieldProps) {
  return (
    <div className="split">
      <div>
        <label className="field-label" htmlFor={`${prefix}-cpfA`}>Your CPF OA</label>
        <MoneyInput id={`${prefix}-cpfA`} value={i.cpfA} onChange={(cpfA) => set({ cpfA })} />
      </div>
      <div>
        <label className="field-label" htmlFor={`${prefix}-cpfB`}>Partner's CPF OA</label>
        <MoneyInput id={`${prefix}-cpfB`} value={i.cpfB} onChange={(cpfB) => set({ cpfB })} />
      </div>
    </div>
  );
}

export function SavingsFields({ i, set, prefix, large }: FieldProps) {
  return (
    <>
      <label className="field-label" htmlFor={`${prefix}-cash`}>Cash saved for the home today</label>
      <MoneyInput id={`${prefix}-cash`} large={large} value={i.cash} onChange={(cash) => set({ cash })} />
      <p className="field-label">How much you each save a month</p>
      <div className="split">
        <div>
          <label className="sr-only" htmlFor={`${prefix}-saveA`}>You save each month</label>
          <MoneyInput id={`${prefix}-saveA`} value={i.saveA} suffix="you" onChange={(saveA) => set({ saveA })} />
        </div>
        <div>
          <label className="sr-only" htmlFor={`${prefix}-saveB`}>Your partner saves each month</label>
          <MoneyInput id={`${prefix}-saveB`} value={i.saveB} suffix="partner" onChange={(saveB) => set({ saveB })} />
        </div>
      </div>
    </>
  );
}

export function LoanFields({ i, set, prefix }: FieldProps) {
  return (
    <>
      <p id={`${prefix}-loan`} className="field-label">Loan</p>
      <Chips options={LOAN_OPTIONS} value={i.loanType} onChange={(loanType) => set({ loanType })} labelledBy={`${prefix}-loan`} />
      <p id={`${prefix}-scheme`} className="field-label">Downpayment when you sign the lease</p>
      <Chips options={SCHEME_OPTIONS} value={i.scheme} onChange={(scheme) => set({ scheme })} labelledBy={`${prefix}-scheme`} />
    </>
  );
}
