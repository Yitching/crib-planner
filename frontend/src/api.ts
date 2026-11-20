import type { Inputs, Result } from './types';

/** An error from the calculator. `retryable` is false when the inputs themselves were rejected. */
export class ApiError extends Error {
  constructor(message: string, readonly retryable: boolean) {
    super(message);
  }
}

export async function calculate(inputs: Inputs, signal?: AbortSignal): Promise<Result> {
  let res: Response;
  try {
    res = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inputs),
      signal,
    });
  } catch (e) {
    if (signal?.aborted) throw e;
    throw new ApiError("Couldn't reach the calculator.", true);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    // 400 means our inputs were rejected; anything else (e.g. the Go server
    // still starting up behind the dev proxy) is worth retrying.
    throw new ApiError(body?.error ?? "Couldn't reach the calculator.", res.status !== 400);
  }
  return res.json();
}
