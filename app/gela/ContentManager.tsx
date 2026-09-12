"use client";
import { useState } from "react";
import { useWorld } from "@/lib/world-store";
import { browserDb } from "@/lib/supabase/client";
import { friendlyError, uploadFile, removeFile } from "@/lib/data";
import { today, prettyDate } from "@/lib/constants";
type Table = "open_when" | "events" | "phrases";
type Draft = {
  id?: string;
  title: string;
  body: string;
  day: string;
  annual: boolean;
  decoration: string;
  once: boolean;
  available_at: string;
  state: string;
  attachment: string | null;
  audio: string | null;
};
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
  const [draft, setDraft] = useState<Draft | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const owner = data.profiles.find((p) => p.role === "janny")?.id;
  function patch(value: Partial<Draft>) {
    setDraft((d) => (d ? { ...d, ...value } : d));
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    setBusy(true);
    setError("");
    const uploads: string[] = [];
    try {
      if (table !== "phrases" && !owner)
        throw new Error("Falta el perfil de Janny.");
      let attachment = draft.attachment;
      let sound = draft.audio;
      if (file) {
        attachment = await uploadFile(file, profile.id);
        uploads.push(attachment);
      }
      if (audio) {
        sound = await uploadFile(audio, profile.id);
        uploads.push(sound);
      }
      const value =
        table === "phrases"
          ? { body: draft.body.trim(), state: draft.state }
          : table === "events"
            ? {
                owner_id: owner,
                title: draft.title.trim(),
                body: draft.body.trim(),
                day: draft.day,
                annual: draft.annual,
                decoration: draft.decoration,
              }
            : {
                owner_id: owner,
                title: draft.title.trim(),
                body: draft.body.trim(),
                once: draft.once,
                available_at: draft.available_at
                  ? new Date(draft.available_at).toISOString()
                  : new Date().toISOString(),
                attachment,
                audio: sound,
              };
      const { error } = await (draft.id
        ? browserDb().from(table).update(value).eq("id", draft.id)
        : browserDb().from(table).insert(value));
      if (error) throw new Error(error.message);
      await refresh();
      setDraft(null);
      setFile(null);
      setAudio(null);
      notify("Ese detalle ya tiene un lugar.");
    } catch (e) {
      await Promise.all(uploads.map(removeFile));
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setBusy(true);
    setError("");
    try {
      const { error } = await browserDb().from(table).delete().eq("id", id);
      if (error) throw new Error(error.message);
      setDeleting(null);
      await refresh();
      notify("Detalle eliminado.");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {draft ? (
        <form className="stack-form" onSubmit={save}>
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
                <h3>Un espacio listo para tus ideas.</h3>
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
