"use client";
import { useEffect, useRef } from "react";
import { useWorld } from "./world-store";
import { streak, today } from "./constants";
export function useNarrative() {
  const { data, loading, say } = useWorld();
  const greeted = useRef(false);
  useEffect(() => {
    if (loading || greeted.current) return;
    const timer = setTimeout(() => {
      greeted.current = true;
      const previous = data.visits
        .filter((v) => v.day !== today())
        .sort((a, b) => b.day.localeCompare(a.day))[0];
      const gap = previous
        ? Math.round(
            (new Date(today() + "T12:00:00").getTime() -
              new Date(previous.day + "T12:00:00").getTime()) /
              86400000,
          )
        : 0;
      const recent = [...data.moods]
        .sort((a, b) => b.day.localeCompare(a.day))
        .slice(0, 3);
      const days = streak(data.visits.map((v) => v.day));
      if (Math.random() < 0.01) {
        say("Tenemos que hablar. Se acabaron las galletas.", "thinking");
      } else if (
        recent.length === 3 &&
        recent.every((m) => [3, 4, 5].includes(m.mood))
      ) {
        say(
          "Estos días no han sido fáciles, ¿verdad? Hoy podemos ir despacio.",
          "hug",
        );
      } else if (gap >= 3) {
        say(
          `Qué bonito volver a verte después de ${gap} días. Tu lugar sigue aquí.`,
          "wave",
        );
      } else if (days >= 3) {
        say(
          `Llevas ${days} días viniendo a verme. Ya te guardé tu lugar.`,
          "happy",
        );
      } else if (data.phrases.length) {
        const phrase =
          data.phrases[Math.floor(Math.random() * data.phrases.length)];
        say(phrase.body, phrase.state);
      }
    }, 1400);
    return () => clearTimeout(timer);
  }, [data, loading, say]);
}
