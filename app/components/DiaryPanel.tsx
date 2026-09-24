"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { moods, prettyDate, today } from "@/lib/constants";
import { useWorld } from "@/lib/world-store";
import { browserDb } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/data";
import WritingPrompts from "./WritingPrompts";
import { useSavedDraft } from "@/lib/use-draft";
import { decodeDiary } from "@/lib/draft-models";
import { textValue, limits } from "@/lib/validation";
import { useSubmitLock } from "@/lib/use-submit-lock";
import DraftStatus from "./DraftStatus";
export default function DiaryPanel() {
  const {
    data,
    profile,
    preview,
    localUpdate,
    refresh,
    say,
    notify,
    moodDraft,
    setMoodDraft,
  } = useWorld();
  const [entryDay] = useState(today);
  const current = data.moods.find((m) => m.day === entryDay);
  const draft = useSavedDraft(
    `${profile.id}:diary:${entryDay}`,
    { note: current?.note ?? "", mood: moodDraft ?? current?.mood ?? null },
    !preview,
    decodeDiary,
  );
  const mood = moodDraft ?? draft.value.mood ?? current?.mood ?? null;
  const note = draft.value.note;
  const setNote = (note: string) => draft.setValue((v) => ({ ...v, note }));
  const setMood = (mood: number) => draft.setValue((v) => ({ ...v, mood }));
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const { busy, acquire, release } = useSubmitLock();
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(entryDay);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (mood === null || !draft.ready || !acquire()) return;
    setError("");
    try {
      const entry = {
        owner_id: profile.id,
        day: entryDay,
        mood,
        note: textValue(note, "La nota", limits.body),
      };
      if (preview)
        localUpdate((s) => ({
          ...s,
          moods: [
            ...s.moods.filter((m) => m.day !== entryDay),
            { ...entry, id: current?.id ?? crypto.randomUUID() },
          ],
        }));
      else {
        const { error } = await browserDb()
          .from("moods")
          .upsert(entry, { onConflict: "owner_id,day" });
        if (error) throw new Error(error.message);
        const updated = await refresh(["moods"]);
        if (!updated)
          setError(
            "Tu día quedó guardado, pero no pudimos actualizar el calendario. Puedes volver a abrirlo.",
          );
      }
      say(
        moods[mood].response,
        mood === 3 ? "sad" : mood === 6 ? "sleepy" : "hug",
      );
      setMoodDraft(null);
      draft.clear();
      notify("Tu nota quedó guardada.");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      release();
    }
  }
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const viewed = data.moods.find((m) => m.day === selected);
  return (
    <>
      <form className="stack-form" onSubmit={save}>
        <fieldset className="form-fields" disabled={busy || !draft.ready}>
          <h3>¿Cómo te sientes hoy, Janny?</h3>
          <div className="mood-picker">
            {moods.map((m, i) => (
              <button
                type="button"
                key={m.label}
                aria-pressed={mood === i}
                title={m.label}
                onClick={() => {
                  setMood(i);
                  setMoodDraft(i);
                }}
              >
                <span>{m.face}</span>
                <small>{m.label}</small>
              </button>
            ))}
          </div>
          <label htmlFor="diary-note">Lo que quieras escribir para ti</label>
          {!note && (
            <WritingPrompts
              ideas={[
                "Hoy agradezco…",
                "Algo que necesito soltar…",
                "Un momento que quiero recordar…",
              ]}
              onChoose={(idea) => {
                setNote(idea.replace("…", " "));
                document.getElementById("diary-note")?.focus();
              }}
            />
          )}
          <textarea
            id="diary-note"
            rows={4}
            maxLength={10000}
            value={note}
            disabled={!draft.ready}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Hoy me sentí…"
          />
          <DraftStatus status={draft.status} preview={preview} />
          <p className="muted">
            Puedes volver y cambiar la nota de hoy cuando quieras.
          </p>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
          <button className="primary" disabled={busy || mood === null}>
            {busy
              ? "Guardando…"
              : current
                ? "Actualizar mi día"
                : "Guardar mi día"}
          </button>
        </fieldset>
      </form>
      <div className="emotion-calendar">
        <header>
          <button
            className="icon-button"
            aria-label="Mes anterior"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))
            }
          >
            <ChevronLeft size={16} />
          </button>
          <h3>
            {month.toLocaleDateString("es-MX", {
              month: "long",
              year: "numeric",
            })}
          </h3>
          <button
            className="icon-button"
            aria-label="Mes siguiente"
            onClick={() =>
              setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))
            }
          >
            <ChevronRight size={16} />
          </button>
        </header>
        <div className="calendar-grid">
          {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
            <small key={d}>{d}</small>
          ))}
          {Array.from({ length: offset }, (_, i) => (
            <span key={`gap${i}`} />
          ))}
          {Array.from({ length: days }, (_, i) => {
            const day = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(i + 1).padStart(2, "0")}`;
            const entry = data.moods.find((m) => m.day === day);
            return (
              <button
                key={day}
                className={day === selected ? "selected-day" : ""}
                onClick={() => setSelected(day)}
                aria-label={`${i + 1}, ${entry ? moods[entry.mood].label : "sin nota"}`}
              >
                <small>{i + 1}</small>
                {entry && <span>{moods[entry.mood].face}</span>}
              </button>
            );
          })}
        </div>
        <div className="diary-read section-reveal" key={selected}>
          <strong>{prettyDate(selected)}</strong>
          <p>
            {viewed
              ? viewed.note || "Ese día guardaste una carita."
              : "No escribiste una nota este día."}
          </p>
        </div>
      </div>
    </>
  );
}
