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
  mail: "De mi buzón al tuyo",
  memories: "Lo bonito se queda",
  diary: "Un pedacito de hoy",
  box: "Para cuando lo necesites",
  calendar: "Días que brillan",
  care: "Un ratito con Nailoong",
  settings: "A tu manera",
  letter: "Este lugar nació pensando en ti",
};
const subtitles = {
  mail: "Un hola, una historia, eso que querías contar. Aquí llega hasta la otra persona.",
  memories:
    "No hace falta una ocasión especial para guardar algo que te hizo sonreír.",
  diary:
    "No tienes que encontrar las palabras perfectas. Este espacio es solo tuyo.",
  box: "Pequeñas cartas para acompañarte, justo cuando tú decidas.",
  calendar:
    "Fechas para recordar y pequeños motivos para celebrar lo cotidiano.",
  care: "A veces el mejor plan es compartir un ratito, sin hacer nada extraordinario.",
  settings: "Los sonidos, la luz y los pequeños detalles, a tu ritmo.",
  letter: "Antes de empezar, hay unas palabras esperando por ti.",
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
                Entrar a nuestra habitación →
              </button>
            </article>
          )}
        </Dialog>
      )}
    </AnimatePresence>
  );
}
