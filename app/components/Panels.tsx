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
export default function Panels({ onRepeat }: { onRepeat: () => void }) {
  const { panel, setPanel } = useWorld();
  if (!panel) return null;
  return (
    <Dialog title={titles[panel]} onClose={() => setPanel(null)}>
      {panel === "mail" ? (
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
  );
}
