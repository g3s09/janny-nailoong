"use client";
import { useCallback, useEffect, useState } from "react";
import type { CharacterState } from "../types";

export function useCharacter() {
  const [character, setCharacter] = useState<CharacterState>("idle");
  const [speech, setSpeech] = useState(
    "Te guardé el lugar más bonito. Bueno… y una galleta. Casi.",
  );
  const [toast, setToast] = useState("");
  const notify = useCallback((text: string) => setToast(text), []);
  const say = useCallback((text: string, state: CharacterState = "happy") => {
    setSpeech(text);
    setCharacter(state);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    if (character === "idle" || character === "sleepy") return;
    const timer = setTimeout(() => setCharacter("idle"), 3000);
    return () => clearTimeout(timer);
  }, [character]);
  return { character, speech, toast, setCharacter, notify, say };
}
