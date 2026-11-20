import { useState } from 'react';
import { fmt, parseMoney } from '../format';

interface MoneyInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  large?: boolean;
  label?: string;
  suffix?: string;
}

/** A dollar input that shows 400,000 while idle and lets people type freely while focused. */
export function MoneyInput({ id, value, onChange, large = false, label, suffix }: MoneyInputProps) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className={`money ${large ? 'money--large' : ''} ${suffix ? 'money--suffix' : ''}`}>
      <span className="money__prefix" aria-hidden="true">$</span>
      <input
        id={id}
        className="input"
        inputMode="numeric"
        autoComplete="off"
        aria-label={label}
        value={draft ?? (value ? fmt(value) : '')}
        onFocus={() => setDraft(value ? fmt(value) : '')}
        onChange={(e) => {
          setDraft(e.target.value);
          onChange(parseMoney(e.target.value));
        }}
        onBlur={() => setDraft(null)}
      />
      {suffix && <span className="money__suffix" aria-hidden="true">{suffix}</span>}
    </div>
  );
}

export function AgeInput({ id, value, onChange, label }: { id: string; value: number; onChange: (v: number) => void; label?: string }) {
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <input
      id={id}
      className="input input--plain"
      inputMode="numeric"
      autoComplete="off"
      aria-label={label}
      value={draft ?? String(value)}
      onChange={(e) => {
        setDraft(e.target.value);
        const n = parseInt(e.target.value, 10);
        if (n >= 18 && n <= 99) onChange(n);
      }}
      onBlur={() => setDraft(null)}
    />
  );
}

export function MonthInput({ id, value, placeholder, onChange }: { id: string; value: string; placeholder: string; onChange: (v: string) => void }) {
  return (
    <input
      id={id}
      type="month"
      className="input input--plain"
      value={value || placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

interface ChipsProps<T extends string> {
  options: readonly (readonly [T, string])[];
  value: T;
  onChange: (value: T) => void;
  labelledBy: string;
}

export function Chips<T extends string>({ options, value, onChange, labelledBy }: ChipsProps<T>) {
  return (
    <div className="chips" role="radiogroup" aria-labelledby={labelledBy}>
      {options.map(([v, text]) => (
        <button key={v} type="button" className="chip" role="radio" aria-checked={v === value} onClick={() => onChange(v)}>
          {text}
        </button>
      ))}
    </div>
  );
}
