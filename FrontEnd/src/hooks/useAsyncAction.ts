import { useCallback, useEffect, useRef, useState } from "react";
import { errorMessage } from "../services/api";

export function useAsyncAction() {
  const busy = useRef(false);
  const mounted = useRef(true);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const run = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      if (busy.current) return false;
      busy.current = true;
      setPending(true);
      setError(null);
      try {
        await action();
        return true;
      } catch (failure: unknown) {
        if (mounted.current) setError(errorMessage(failure));
        return false;
      } finally {
        busy.current = false;
        if (mounted.current) setPending(false);
      }
    },
    [],
  );
  return { run, pending, error };
}
