"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type SetStateAction,
} from "react";

export const PreviewDrafts = createContext<Map<string, string> | null>(null);
const MAX_AGE = 30 * 86400000;
type Status = "loading" | "empty" | "saved" | "unavailable";

export function useSavedDraft<T>(
  key: string,
  initial: T,
  enabled: boolean,
  decode: (value: unknown) => T,
) {
  const temporary = useContext(PreviewDrafts);
  const [snapshot, setSnapshot] = useState({
    key: "",
    value: initial,
    status: "loading" as Status,
  });
  const current = useRef(initial);
  const options = useRef({ initial, decode });
  const lastRecord = useRef<string | null>(null);
  const storageKey = `janny-draft:${key}`;
  useEffect(() => {
    let live = true;
    queueMicrotask(() => {
      if (!live) return;
      let value = options.current.initial;
      let status: Status = "empty";
      try {
        const stored = enabled
          ? localStorage.getItem(storageKey)
          : temporary?.get(storageKey);
        lastRecord.current = stored ?? null;
        if (stored) {
          const record = JSON.parse(stored);
          const age = Date.now() - record.time;
          if (typeof record.time === "number" && age >= 0 && age < MAX_AGE) {
            value = options.current.decode(record.value);
            status = "saved";
          } else {
            if (enabled) localStorage.removeItem(storageKey);
            else temporary?.delete(storageKey);
            lastRecord.current = null;
          }
        }
      } catch {
        status = "unavailable";
      }
      current.current = value;
      setSnapshot({ key, value, status });
    });
    return () => {
      live = false;
    };
  }, [key, storageKey, enabled, temporary]);
  function setValue(action: SetStateAction<T>) {
    const value =
      typeof action === "function"
        ? (action as (value: T) => T)(current.current)
        : action;
    current.current = value;
    let status: Status = "saved";
    try {
      const record = JSON.stringify({ value, time: Date.now() });
      const latest = enabled
        ? localStorage.getItem(storageKey)
        : (temporary?.get(storageKey) ?? null);
      if (latest !== lastRecord.current)
        throw new Error("A newer draft exists in another view");
      if (enabled) localStorage.setItem(storageKey, record);
      else if (temporary) temporary.set(storageKey, record);
      else status = "unavailable";
      lastRecord.current = record;
    } catch {
      status = "unavailable";
    }
    setSnapshot({ key, value, status });
  }
  function clear(value: T = current.current) {
    let status: Status = "empty";
    try {
      const latest = enabled
        ? localStorage.getItem(storageKey)
        : (temporary?.get(storageKey) ?? null);
      // A completed request must not erase a newer draft opened in another tab.
      if (latest === lastRecord.current) {
        if (enabled) localStorage.removeItem(storageKey);
        else temporary?.delete(storageKey);
        lastRecord.current = null;
      }
    } catch {
      status = "unavailable";
    }
    current.current = value;
    setSnapshot({ key, value, status });
  }
  const ready = snapshot.key === key;
  return {
    value: ready ? snapshot.value : initial,
    setValue,
    clear,
    ready,
    saved: ready && snapshot.status === "saved",
    status: ready ? snapshot.status : ("loading" as Status),
  };
}

const decodeText = (value: unknown) => {
  if (typeof value !== "string") throw new Error("Invalid text draft");
  return value;
};
export function useDraft(key: string, initial: string, enabled = true) {
  return useSavedDraft(key, initial, enabled, decodeText);
}
