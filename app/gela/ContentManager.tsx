"use client";
import { useState, type SetStateAction } from "react";
import { useSavedDraft } from "@/lib/use-draft";
import { decodeContent, type ContentDraft as Draft } from "@/lib/draft-models";
import { textValue, dayValue, dateTimeValue, limits } from "@/lib/validation";
import { useSubmitLock } from "@/lib/use-submit-lock";
import DraftStatus from "../components/DraftStatus";
import { useWorld } from "@/lib/world-store";
import { browserDb } from "@/lib/supabase/client";
import { friendlyError, uploadFile } from "@/lib/data";
import { today, prettyDate } from "@/lib/constants";
type Table = "open_when" | "events" | "phrases";
const blank = (): Draft => ({
  title: "",
  body: "",
  day: today(),
  annual: false,
  decoration: "stars",
  once: false,
  available_at: "",
  state: "idle",
  attachment: null,
  audio: null,
});
export default function ContentManager({ table }: { table: Table }) {
  const { data, profile, refresh, notify } = useWorld();
  const savedDraft = useSavedDraft<Draft | null>(
    `${profile.id}:content:${table}`,
    null,
    true,
    decodeContent,
  );
  const draft = savedDraft.value;
  const setDraft = (action: SetStateAction<Draft | null>) =>
    savedDraft.setValue((current) => {
      const value = typeof action === "function" ? action(current) : action;
      return value && !value.id
        ? { ...value, saveId: value.saveId ?? crypto.randomUUID() }
        : value;
    });
  const [file, setFile] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const { busy, acquire, release } = useSubmitLock();
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const owner = data.profiles.find((p) => p.role === "janny")?.id;
  function patch(value: Partial<Draft>) {
    setDraft((d) => (d ? { ...d, ...value } : d));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft || !savedDraft.ready || !acquire()) return;
    setError("");
    try {
      if (table !== "phrases" && !owner)
        throw new Error("Falta el perfil de Janny.");
      let attachment = draft.attachment;
      let sound = draft.audio;
      if (file) {
        attachment = await uploadFile(file, profile.id);
        savedDraft.setValue((v) => (v ? { ...v, attachment } : v));
        setFile(null);
      }
      if (audio) {
        sound = await uploadFile(audio, profile.id);
        savedDraft.setValue((v) => (v ? { ...v, audio: sound } : v));
        setAudio(null);
      }
      const value =
        table === "phrases"
          ? {
              body: textValue(draft.body, "La frase", limits.phrase, true),
              state: draft.state,
            }
          : table === "events"
            ? {
                owner_id: owner,
                title: textValue(draft.title, "El título", limits.title, true),
                body: textValue(draft.body, "El contenido", limits.body),
                day: dayValue(draft.day),
                annual: draft.annual,
                decoration: draft.decoration,
              }
            : {
                owner_id: owner,
                title: textValue(draft.title, "El título", limits.title, true),
                body: textValue(
                  draft.body,
                  "El contenido",
                  limits.body,
                  table === "open_when",
                ),
                once: draft.once,
                available_at: draft.available_at
                  ? dateTimeValue(draft.available_at)
                  : new Date().toISOString(),
                attachment,
                audio: sound,
              };
      const { error } = await browserDb()
        .from(table)
        .upsert(
          { ...value, id: draft.id ?? draft.saveId },
          { onConflict: "id" },
        );
      if (error) throw new Error(error.message);
      const updated = await refresh([table]);
      savedDraft.clear(null);
      setFile(null);
      setAudio(null);
      notify(
        updated
          ? "Ese detalle ya tiene un lugar."
          : "El detalle quedó guardado. Vuelve a abrir la sección para actualizar la lista.",
      );
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      release();
    }
  }
  async function remove(id: string) {
    if (!acquire()) return;
    setError("");
    try {
      const { error } = await browserDb().from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
      setDeleting(null);
      await refresh([table]);
      notify("Detalle eliminado.");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      release();
    }
  }
  if (!savedDraft.ready) return <p role="status">Recuperando tu borrador…</p>;
  return (
    <>
      {draft ? (
        <form className="stack-form" onSubmit={save}>
          <fieldset className="form-fields" disabled={busy}>
            <DraftStatus
              status={savedDraft.status}
              preview={false}
              files={table === "open_when"}
            />
            <h2>{draft.id ? "Editar detalle" : "Un nuevo detalle"}</h2>
            {table !== "phrases" && (
              <label>
                {table === "open_when" ? "Ábrelo cuando…" : "Nombre del día"}
                <input
                  required
                  maxLength={160}
                  value={draft.title}
                  onChange={(e) => patch({ title: e.target.value })}
                  placeholder={
                    table === "open_when"
                      ? "no puedas dormir"
                      : "Un día que quiero recordar"
                  }
                />
              </label>
            )}
            <label>
              {table === "phrases"
                ? "Qué dice Nailoong"
                : "Lo que quieres decirle"}
              <textarea
                required={table !== "events"}
                rows={6}
                maxLength={table === "phrases" ? 300 : 10000}
                value={draft.body}
                onChange={(e) => patch({ body: e.target.value })}
              />
            </label>
            {table === "open_when" && (
              <>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={draft.once}
                    onChange={(e) => patch({ once: e.target.checked })}
                  />{" "}
                  Una sola apertura
                </label>
                <label>
                  Disponible desde (opcional)
                  <input
                    type="datetime-local"
                    value={draft.available_at}
                    onChange={(e) => patch({ available_at: e.target.value })}
                  />
                </label>
                <label>
                  Imagen
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <label>
                  Audio
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
                  />
                </label>
              </>
            )}
            {table === "events" && (
              <>
                <label>
                  Fecha
                  <input
                    required
                    type="date"
                    value={draft.day}
                    onChange={(e) => patch({ day: e.target.value })}
                  />
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={draft.annual}
                    onChange={(e) => patch({ annual: e.target.checked })}
                  />{" "}
                  Repetir cada año
                </label>
                <label>
                  Un cambio en la habitación
                  <select
                    value={draft.decoration}
                    onChange={(e) => patch({ decoration: e.target.value })}
                  >
                    <option value="stars">Estrellitas</option>
                    <option value="flowers">Flores</option>
                    <option value="hearts">Corazones</option>
                    <option value="birthday">Cumpleaños</option>
                    <option value="winter">Luz de invierno</option>
                  </select>
                </label>
              </>
            )}
            {table === "phrases" && (
              <label>
                Cómo lo dice
                <select
                  value={draft.state}
                  onChange={(e) => patch({ state: e.target.value })}
                >
                  {[
                    "idle",
                    "happy",
                    "thinking",
                    "sleepy",
                    "laugh",
                    "surprised",
                  ].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
            )}
            <div className="button-row">
              <button className="primary" disabled={busy}>
                {busy ? "Guardando…" : "Guardar detalle"}
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  setDraft(null);
                  setFile(null);
                  setAudio(null);
                }}
              >
                Cancelar
              </button>
            </div>
          </fieldset>
        </form>
      ) : (
        <>
          <button className="secondary" onClick={() => setDraft(blank())}>
            ＋ Crear{" "}
            {table === "open_when"
              ? "carta"
              : table === "events"
                ? "fecha especial"
                : "frase"}
          </button>
          <div className="managed-list">
            {data[table].length === 0 && (
              <div className="empty-state">
                <h3>Todavía no he añadido nada aquí.</h3>
                <p>
                  Los detalles que guardes aquí aparecerán en el rincón de
                  Janny.
                </p>
              </div>
            )}
            {data[table].map((row) => (
              <article key={row.id}>
                <h3>{"title" in row ? row.title : row.body}</h3>
                {"title" in row && <p>{row.body}</p>}
                {"day" in row && <small>{prettyDate(row.day)}</small>}
                {"opened_at" in row && (
                  <small>
                    {row.opened_at
                      ? `Abierta ${prettyDate(row.opened_at, true)}`
                      : "Todavía sin abrir"}
                  </small>
                )}
                <div className="button-row">
                  <button
                    className="text-button"
                    onClick={() => {
                      const values = { ...blank(), ...row };
                      if ("available_at" in row) {
                        const date = new Date(row.available_at);
                        date.setMinutes(
                          date.getMinutes() - date.getTimezoneOffset(),
                        );
                        values.available_at = date.toISOString().slice(0, 16);
                      }
                      setDraft(values);
                    }}
                  >
                    Editar
                  </button>
                  {deleting === row.id ? (
                    <>
                      <span>¿Eliminar este detalle?</span>
                      <button
                        disabled={busy}
                        className="text-button danger"
                        onClick={() => void remove(row.id)}
                      >
                        Sí, eliminar
                      </button>
                      <button
                        className="text-button"
                        onClick={() => setDeleting(null)}
                      >
                        Conservar
                      </button>
                    </>
                  ) : (
                    <button
                      className="text-button danger"
                      onClick={() => setDeleting(row.id)}
                    >
                      Eliminar
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </>
  );
}
