import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "../constants/labels";

// Loads data and re-loads when `deps` change. Optional polling keeps live data fresh.
export function useFetch<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  pollMs = 0,
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const seq = useRef(0); // ignores answers that arrive after a newer request started

  const load = useCallback(async (silent = false) => {
    const id = ++seq.current;
    if (!silent) setLoading(true);
    try {
      const result = await fetcher();
      if (id === seq.current) {
        setData(result);
        setError(null);
      }
    } catch (e) {
      if (id === seq.current) setError(e);
    } finally {
      if (id === seq.current) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!pollMs) return;
    const timer = window.setInterval(() => void load(true), pollMs); // silent: no spinner flash
    return () => window.clearInterval(timer);
  }, [load, pollMs]);

  return { data, error, loading, reload: () => void load(true) };
}

// Runs a user action; shows the Arabic error in an alert if it fails, then returns success
export async function act(
  task: () => Promise<unknown>,
  after?: () => void,
): Promise<boolean> {
  try {
    await task();
    after?.();
    return true;
  } catch (e) {
    window.alert(errorMessage(e));
    return false;
  }
}
