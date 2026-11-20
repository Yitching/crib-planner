import { useCallback, useEffect, useState } from 'react';
import { ApiError, calculate } from './api';

const RETRIES = 10;
const RETRY_MS = 1500;
import type { Inputs, Result } from './types';

interface Calculation {
  result: Result | null;
  error: string | null;
  retry: () => void;
}

/** Asks the Go API for a result whenever the inputs change (debounced). Pass null to skip. */
export function useCalculation(inputs: Inputs | null, delay = 200): Calculation {
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = inputs ? JSON.stringify(inputs) : null;

  useEffect(() => {
    if (!key) return;
    const ctrl = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    let tries = 0;

    const run = () => {
      calculate(JSON.parse(key) as Inputs, ctrl.signal)
        .then((r) => {
          setResult(r);
          setError(null);
        })
        .catch((e: unknown) => {
          if (ctrl.signal.aborted) return;
          // The server may still be starting: quietly retry for ~15 seconds first.
          if (e instanceof ApiError && e.retryable && tries < RETRIES) {
            tries += 1;
            timer = setTimeout(run, RETRY_MS);
            return;
          }
          setError(e instanceof Error ? e.message : String(e));
        });
    };

    timer = setTimeout(run, delay);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [key, delay, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  return { result, error, retry };
}

/** useState that is mirrored to localStorage. Storage failures are ignored. */
export function usePersistentState<T>(storageKey: string, initial: T): [T, (v: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) return { ...initial, ...JSON.parse(raw) };
    } catch {
      /* storage unavailable */
    }
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  }, [storageKey, value]);

  return [value, setValue];
}
