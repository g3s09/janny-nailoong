"use client";
import { useWorld } from "@/lib/world-store";
import { welcomeLetter } from "@/lib/constants";
import Dialog from "./Dialog";
import MailPanel from "./MailPanel";
import DiaryPanel from "./DiaryPanel";
import MemoriesPanel from "./MemoriesPanel";
import BoxPanel from "./BoxPanel";
import CarePanel from "./CarePanel";
import CalendarPanel from "./CalendarPanel";
import SettingsPanel from "./SettingsPanel";
import { AnimatePresence } from "motion/react";
const titles = {
  mail: "Escríbeme, Janny",
  memories: "Nuestros recuerdos",
  diary: "Tu diario",
  box: "Ábrelo cuando…",
  calendar: "Nuestras fechas",
  care: "Un ratito con Nailoong",
  settings: "A tu manera",
  letter: "Te quería decir algo",
};
const subtitles = {
  mail: "Escríbeme lo que quieras, Janny. Me gusta saber de ti.",
  memories:
    "Quiero guardar contigo esas cosas que nos hacen sonreír.",
  diary:
    "Te dejé un diario para que escribas lo que tú quieras.",
  box: "Para esos días en que quisiera estar ahí contigo. Abre la que necesites.",
  calendar:
    "Hay días que quiero recordar contigo.",
  care: "Te encargo a Nailoong. Si pide otra galleta, no le creas que no ha comido jsjs.",
  settings: "Ponlo como más te guste.",
  letter: "Esto sí quería que lo leyeras antes de empezar.",
};
export default function Panels({ onRepeat }: { onRepeat: () => void }) {
  const { panel, setPanel, loading, dataReady, error, refresh } = useWorld();
  return (
    <AnimatePresence mode="wait">
      {panel && (
        <Dialog
          key={panel}
          kind={panel}
          title={titles[panel]}
          subtitle={subtitles[panel]}
          onClose={() => setPanel(null)}
        >
          {(!dataReady || loading) &&
          panel !== "letter" &&
          panel !== "settings" ? (
            <div role="status">
              <p>{error || "Abriendo tus recuerdos…"}</p>
              {error && (
                <button className="secondary" onClick={() => void refresh()}>
                  Reintentar
                </button>
              )}
            </div>
          ) : panel === "mail" ? (
            <MailPanel />
          ) : panel === "diary" ? (
            <DiaryPanel />
          ) : panel === "memories" ? (
            <MemoriesPanel />
          ) : panel === "box" ? (
            <BoxPanel />
          ) : panel === "care" ? (
            <CarePanel />
          ) : panel === "calendar" ? (
            <CalendarPanel />
          ) : panel === "settings" ? (
            <SettingsPanel onRepeat={onRepeat} />
          ) : (
            <article className="open-letter">
              <span className="letter-seal">♡</span>
              <p className="letter-text">{welcomeLetter}</p>
              <button className="primary" onClick={() => setPanel(null)}>
                Ver qué más hay →
              </button>
            </article>
          )}
        </Dialog>
      )}
    </AnimatePresence>
  );
}
