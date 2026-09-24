"use client";
import { useCallback, useEffect, useState } from "react";
import type { CharacterState } from "../types";

export function useCharacter() {
  const [character, setCharacter] = useState<CharacterState>("idle");
  const [speech, setSpeech] = useState(
    "Te guardé el lugar más bonito. Bueno… y una galleta. Casi.",
  );
  const [toast, setToast] = useState("");
  const [treat, setTreat] = useState<{ icon: string; id: number } | null>(null);
  const feed = useCallback((icon: string) => {
    setTreat({ icon, id: Date.now() });
    setSpeech("Ñam, ñam… espera, estoy contando las miguitas.");
    setCharacter("eat");
  }, []);
  useEffect(() => {
    if (!treat) return;
    const timer = setTimeout(() => {
      setTreat(null);
      setCharacter("happy");
      setSpeech([
        "¿Otra? Es para mi otra pancita. Tengo dos, claramente.",
        "No quedó ni una miguita. Qué misterio… ¿hay más?",
        "Mi pancita dice gracias. Y también dice: ¿repetimos?",
      ][Math.floor(Math.random() * 3)]);
    }, 3200);
    return () => clearTimeout(timer);
  }, [treat]);
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
    if (character === "idle" || character === "sleepy" || treat) return;
    const timer = setTimeout(() => setCharacter("idle"), 3000);
    return () => clearTimeout(timer);
  }, [character, treat]);
  return { character, speech, toast, treat, feed, setCharacter, notify, say };
}
