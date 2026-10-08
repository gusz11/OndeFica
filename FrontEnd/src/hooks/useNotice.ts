import { useCallback, useEffect, useState } from "react";
export function useNotice() {
  const [notice, setNotice] = useState<string | null>(null);
  const dismissNotice = useCallback(() => setNotice(null), []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismissNotice, 6000);
    return () => clearTimeout(timer);
  }, [notice, dismissNotice]);
  return { notice, showNotice: setNotice, dismissNotice };
}
