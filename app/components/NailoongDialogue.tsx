"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useWorld } from "@/lib/world-store";

export default function NailoongDialogue({ name }: { name: string }) {
  const { speech, panel, character, loading } = useWorld();
  const [whisper, setWhisper] = useState("");
  const [quiet, setQuiet] = useState(false);
  const deck = useRef<string[]>([]);
  const last = useRef("");
  const available = !loading && !panel && character === "idle" && !quiet;

  useEffect(() => {
    let next: ReturnType<typeof setTimeout>;
    let hide: ReturnType<typeof setTimeout>;
    let lastActivity = Date.now();
    const reset = setTimeout(() => setWhisper(""), 0);
    if (!available) return () => clearTimeout(reset);
    const schedule = () => {
      clearTimeout(next);
      if (document.visibilityState !== "visible") return;
      next = setTimeout(show, 60000 + Math.random() * 40000);
    };
    const show = () => {
      if (document.visibilityState !== "visible") return;
      if (
        Date.now() - lastActivity < 15000 ||
        document.activeElement?.matches(
          "input, textarea, select, [contenteditable=true]",
        )
      ) {
        schedule();
        return;
      }
      if (!deck.current.length) {
        const who = name.trim() || "Janny";
        const phrases = [
          "Creo que a Gela le gustas… yo nomás digo 👀",
          "Escuché que Gela te quiere mucho. Mi fuente es muy confiable: Gela.",
          "¿Me das una galleta? Una chiquita… del tamaño de mi cabeza.",
          `Te veo, ${who}. Sí, a ti. No te hagas jsjs.`,
          "Hoy te ves muy bonita. Me lo dijo mi intuición de dinosaurio.",
          "Gela también te quiere, él me lo dijo. Pero shhhh…",
          "Tócame la pancita. El botón de las cosquillas está por ahí.",
          `Te quiero, ${who}. Te guardé un abrazo de los grandotes.`,
          "Si Gela pregunta, me porté bien. Tú sígueme la corriente.",
          "¿Otra galleta cuenta como postre o como segunda felicidad?",
          "Gela me encargó sacarte una sonrisa. ¿Voy bien?",
          "Me quedo aquí contigo. Pero si vas por comida, me llevas.",
        ];
        for (let i = phrases.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [phrases[i], phrases[j]] = [phrases[j], phrases[i]];
        }
        if (phrases.at(-1) === last.current)
          [phrases[0], phrases[phrases.length - 1]] = [
            phrases[phrases.length - 1],
            phrases[0],
          ];
        deck.current = phrases;
      }
      const text = deck.current.pop()!;
      last.current = text;
      setWhisper(text);
      clearTimeout(hide);
      hide = setTimeout(() => setWhisper(""), 12000);
      schedule();
    };
    const activity = () => {
      lastActivity = Date.now();
    };
    const visibility = () => {
      clearTimeout(hide);
      setWhisper("");
      schedule();
    };
    schedule();
    window.addEventListener("pointerdown", activity, { passive: true });
    window.addEventListener("keydown", activity);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearTimeout(reset);
      clearTimeout(next);
      clearTimeout(hide);
      window.removeEventListener("pointerdown", activity);
      window.removeEventListener("keydown", activity);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [available, speech, name]);

  const text = available ? whisper : "";
  return text ? (
    <aside className="speech nailoong-whisper">
      <strong className="whisper-speaker">Nailoong te cuenta…</strong>
      <button
        className="whisper-close"
        type="button"
        aria-label="Cerrar mensaje de Nailoong"
        onClick={() => setWhisper("")}
      >
        <X size={15} />
      </button>
      <p role="status" aria-live="polite" key={text}>
        {text}
      </p>
      <button
        className="whisper-quiet"
        type="button"
        onClick={() => setQuiet(true)}
      >
        Un ratito en silencio
      </button>
    </aside>
  ) : (
    <div className="speech" aria-live="polite">
      {speech}
    </div>
  );
}
