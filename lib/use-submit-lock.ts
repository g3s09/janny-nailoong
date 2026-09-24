"use client";
import { useCallback, useRef, useState } from "react";

// A synchronous guard closes the gap before React renders a disabled button.
export function useSubmitLock() {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false);
  const acquire = useCallback(() => {
    if (locked.current) return false;
    locked.current = true;
    setBusy(true);
    return true;
  }, []);
  const release = useCallback(() => {
    locked.current = false;
    setBusy(false);
  }, []);
  return { busy, acquire, release };
}
