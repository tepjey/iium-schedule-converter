import { useCallback, useEffect, useState } from 'react';
import { PRO_STORAGE_KEY, verifyProKey } from './proModel';

const readKey = () => {
  try {
    return localStorage.getItem(PRO_STORAGE_KEY) || '';
  } catch {
    return '';
  }
};

// Whether this browser has unlocked Pro: { isPro, key, unlock(key) }. The saved key is
// checked again on every visit, so a hand-edited one doesn't count. unlock() saves a key
// only if it's genuine and resolves to whether it was.
export function usePro() {
  const [key, setKey] = useState(readKey);
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (key) verifyProKey(key).then((payload) => !cancelled && setIsPro(Boolean(payload)));
    return () => {
      cancelled = true;
    };
  }, [key]);

  const unlock = useCallback(async (candidate) => {
    const clean = String(candidate || '').trim();
    if (!(await verifyProKey(clean))) return false;
    try {
      localStorage.setItem(PRO_STORAGE_KEY, clean);
    } catch {
      // Storage unavailable: Pro lasts until the page closes.
    }
    setKey(clean);
    setIsPro(true);
    return true;
  }, []);

  return { isPro, key, unlock };
}
