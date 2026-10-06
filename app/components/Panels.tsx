"use client";
import { useWorld } from "@/lib/world-store";
import { welcomeLetter } from "@/lib/constants";
import Dialog from "./Dialog";
import AppNavigation from "./AppNavigation";
import type { Panel } from "@/lib/types";
import MailPanel from "./MailPanel";
import DiaryPanel from "./DiaryPanel";
import MemoriesPanel from "./MemoriesPanel";
import BoxPanel from "./BoxPanel";
import CarePanel from "./CarePanel";
import CalendarPanel from "./CalendarPanel";
import SettingsPanel from "./SettingsPanel";
import { AnimatePresence } from "motion/react";
const titles = {
  mail: "Mensajes",
  memories: "Nuestros recuerdos",
  diary: "Tu diario",
  box: "Ábrelo cuando…",
  calendar: "Nuestras fechas",
  care: "Un ratito con Nailoong",
  settings: "A tu manera",
  letter: "Te quería decir algo",
};
export default function Panels({ onRepeat }: { onRepeat: () => void }) {
  const { panel, setPanel, loading, dataReady, error, refresh, conversation } =
    useWorld();
  return (
    <AnimatePresence mode="wait">
      {panel && (
        <Dialog
          key={panel}
          kind={panel}
          title={titles[panel]}
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
            <MailPanel onClose={() => setPanel(null)} />
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
          <AppNavigation
            embedded
            active={panel}
            unread={conversation.unreadCount}
            onChoose={(section) =>
              setPanel(section === "home" ? null : (section as Panel))
            }
          />
        </Dialog>
      )}
    </AnimatePresence>
  );
}
