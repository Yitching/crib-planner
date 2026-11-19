import type { Inputs, Result } from './types';

export async function calculate(inputs: Inputs, signal?: AbortSignal): Promise<Result> {
  const res = await fetch('/api/calculate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(inputs),
    signal,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error ?? `Calculator error (${res.status})`);
  }
  return res.json();
}
