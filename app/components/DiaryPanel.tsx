"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, LockKeyhole } from "lucide-react";
import { moods, prettyDate, today } from "@/lib/constants";
import { useWorld } from "@/lib/world-store";
import { browserDb } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/data";
import WritingPrompts from "./WritingPrompts";
import { useDraft } from "@/lib/use-draft";
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
  const current = data.moods.find((m) => m.day === today());
  const [mood, setMood] = useState<number | null>(
    moodDraft ?? current?.mood ?? null,
  );
  const draft = useDraft(
    `${profile.id}:diary:${today()}`,
    current?.note ?? "",
    !preview,
  );
  const note = draft.value;
  const setNote = draft.setValue;
  const [month, setMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(today());
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (mood === null) return;
    setBusy(true);
    setError("");
    try {
      const entry = {
        owner_id: profile.id,
        day: today(),
        mood,
        note: note.trim(),
      };
      if (preview)
        localUpdate((s) => ({
          ...s,
          moods: [
            ...s.moods.filter((m) => m.day !== today()),
            { ...entry, id: current?.id ?? crypto.randomUUID() },
          ],
        }));
      else {
        const { error } = await browserDb()
          .from("moods")
          .upsert(entry, { onConflict: "owner_id,day" });
        if (error) throw new Error(error.message);
        await refresh();
      }
      say(
        moods[mood].response,
        mood === 3 ? "sad" : mood === 6 ? "sleepy" : "hug",
      );
      setMoodDraft(null);
      draft.clear();
      notify("Guardé este pedacito de tu día.");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (month.getDay() + 6) % 7;
  const viewed = data.moods.find((m) => m.day === selected);
  return (
    <>
      <p className="privacy-note">
        <LockKeyhole size={13} /> Este diario es solo tuyo. Gela no puede
        leerlo.
      </p>
      <form className="stack-form" onSubmit={save}>
        <h3>¿Cómo se siente hoy tu mundo?</h3>
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
        <label htmlFor="diary-note">Si quieres, puedes dejarlo aquí.</label>
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
        <small className="draft-note">
          {preview
            ? "Borrador temporal: se conserva hasta reiniciar esta prueba."
            : draft.saved
              ? "Texto guardado como borrador en este dispositivo."
              : "Guardamos tu borrador mientras escribes, si el navegador permite almacenamiento."}
        </small>
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
              ? viewed.note || "A veces una carita lo dice todo."
              : "Este día no tiene nota. También está bien."}
          </p>
        </div>
      </div>
    </>
  );
}
