"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";

export const PreviewDrafts = createContext<Map<string, string> | null>(null);

// Per-profile, device-local drafts. Never shared with the other account.
export function useDraft(key: string, initial: string, enabled = true) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  const [saved, setSaved] = useState(false);
  const fallback = useRef(initial);
  const temporary = useContext(PreviewDrafts);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      try {
        const stored = enabled
          ? localStorage.getItem(`janny-draft:${key}`)
          : (temporary?.get(key) ?? null);
        const draft = stored ? JSON.parse(stored) : null;
        if (
          draft &&
          typeof draft.value === "string" &&
          typeof draft.time === "number" &&
          Date.now() - draft.time < 30 * 86400000
        ) {
          setValue(draft.value);
          setSaved(true);
        } else setValue(fallback.current);
      } catch {
        /* Storage is optional; writing remains available. */
      }
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [key, enabled, temporary]);
  function update(next: string) {
    setValue(next);
    try {
      const stored = JSON.stringify({ value: next, time: Date.now() });
      if (enabled) localStorage.setItem(`janny-draft:${key}`, stored);
      else temporary?.set(key, stored);
      setSaved(true);
    } catch {
      setSaved(false);
    }
  }
  function clear() {
    try {
      if (enabled) localStorage.removeItem(`janny-draft:${key}`);
      else temporary?.delete(key);
    } catch {}
    setSaved(false);
  }
  return { value, setValue: update, ready, saved, clear };
}
