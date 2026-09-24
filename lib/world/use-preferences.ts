"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Preferences } from "../types";
import { playSound, setAmbience } from "../sound";

export const defaultPrefs: Preferences = {
  music: false,
  effects: false,
  haptics: true,
  night: null,
  room: "home",
  accessory: "",
  notifications: true,
};

function restore(raw: string | null): Preferences {
  if (!raw) return defaultPrefs;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object") return defaultPrefs;
    return {
      music: false,
      effects: typeof value.effects === "boolean" ? value.effects : false,
      haptics: typeof value.haptics === "boolean" ? value.haptics : true,
      notifications:
        typeof value.notifications === "boolean" ? value.notifications : true,
      night: typeof value.night === "boolean" ? value.night : null,
      room: typeof value.room === "string" ? value.room : "home",
      accessory: typeof value.accessory === "string" ? value.accessory : "",
    };
  } catch {
    return defaultPrefs;
  }
}

export function usePreferences(
  profileId: string,
  ephemeral: boolean,
  notify: (text: string) => void,
) {
  const [prefs, setPrefs] = useState(defaultPrefs);
  const prefsRef = useRef(prefs);
  useEffect(() => {
    let live = true;
    queueMicrotask(() => {
      if (!live) return;
      let value = defaultPrefs;
      try {
        value = restore(
          ephemeral ? null : localStorage.getItem(`janny-prefs:${profileId}`),
        );
      } catch {}
      prefsRef.current = value;
      setPrefs(value);
    });
    return () => {
      live = false;
      setAmbience(false);
    };
  }, [profileId, ephemeral]);
  const updatePrefs = useCallback(
    (patch: Partial<Preferences>) => {
      const next = { ...prefsRef.current, ...patch };
      prefsRef.current = next;
      setPrefs(next);
      if (!ephemeral) {
        try {
          localStorage.setItem(
            `janny-prefs:${profileId}`,
            JSON.stringify(next),
          );
        } catch {
          notify(
            "El cambio se aplicó, pero este navegador no pudo recordar tus preferencias.",
          );
        }
      }
      if (patch.music !== undefined) setAmbience(patch.music);
    },
    [profileId, ephemeral, notify],
  );
  const sound = useCallback(
    (kind: "tap" | "letter" | "food" | "unlock" = "tap") => {
      if (prefsRef.current.effects) playSound(kind);
      if (prefsRef.current.haptics && typeof navigator.vibrate === "function")
        navigator.vibrate(kind === "letter" ? [20, 40, 20] : 12);
    },
    [],
  );
  return { prefs, prefsRef, updatePrefs, sound };
}
