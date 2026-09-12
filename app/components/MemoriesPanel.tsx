"use client";
import { useState } from "react";
import { Camera, Plus } from "lucide-react";
import { useWorld } from "@/lib/world-store";
import { browserDb } from "@/lib/supabase/client";
import { friendlyError, uploadFile, removeFile } from "@/lib/data";
import { prettyDate, today } from "@/lib/constants";
import type { Memory } from "@/lib/types";
import PrivateMedia from "./PrivateMedia";
export default function MemoriesPanel({ admin = false }: { admin?: boolean }) {
  const { data, profile, preview, localUpdate, refresh, notify, reward, say } =
    useWorld();
  const [editing, setEditing] = useState<Partial<Memory> | null>(null);
  const [photo, setPhoto] = useState<File | null>(null);
  const [audio, setAudio] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const owner = admin
    ? data.profiles.find((p) => p.role === "janny")?.id
    : profile.id;
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!editing || !owner) return;
    setBusy(true);
    setError("");
    const uploaded: string[] = [];
    try {
      if (preview && (photo || audio))
        throw new Error(
          "Conecta Supabase para guardar fotos y audio de forma privada.",
        );
      const attachment = photo
        ? await uploadFile(photo, profile.id)
        : (editing.attachment ?? null);
      if (photo && attachment) uploaded.push(attachment);
      const sound = audio
        ? await uploadFile(audio, profile.id)
        : (editing.audio ?? null);
      if (audio && sound) uploaded.push(sound);
      const entry = {
        owner_id: owner,
        title: editing.title?.trim() ?? "",
        body: editing.body?.trim() ?? "",
        date: editing.date || today(),
        place: editing.place?.trim() ?? "",
        attachment,
        audio: sound,
      };
      if (preview)
        localUpdate((s) => ({
          ...s,
          memories: [
            ...s.memories.filter((m) => m.id !== editing.id),
            { ...entry, id: editing.id ?? crypto.randomUUID() },
          ],
        }));
      else {
        const query = editing.id
          ? browserDb().from("memories").update(entry).eq("id", editing.id)
          : browserDb().from("memories").insert(entry);
        const { error } = await query;
        if (error) throw new Error(error.message);
        await refresh();
      }
      setEditing(null);
      setPhoto(null);
      setAudio(null);
      notify("Un recuerdo más para guardar cerquita.");
    } catch (e) {
      await Promise.all(uploaded.map(removeFile));
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {editing ? (
        <form className="stack-form" onSubmit={save}>
          <label>
            Título
            <input
              required
              maxLength={160}
              value={editing.title ?? ""}
              onChange={(e) =>
                setEditing({ ...editing, title: e.target.value })
              }
            />
          </label>
          <div className="form-row">
            <label>
              Fecha
              <input
                type="date"
                required
                value={editing.date ?? today()}
                onChange={(e) =>
                  setEditing({ ...editing, date: e.target.value })
                }
              />
            </label>
            <label>
              Lugar
              <input
                maxLength={200}
                value={editing.place ?? ""}
                onChange={(e) =>
                  setEditing({ ...editing, place: e.target.value })
                }
              />
            </label>
          </div>
          <label>
            Lo que quieres recordar
            <textarea
              rows={4}
              maxLength={10000}
              value={editing.body ?? ""}
              onChange={(e) => setEditing({ ...editing, body: e.target.value })}
            />
          </label>
          <label>
            Una foto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setPhoto(e.target.files?.[0] ?? null)}
            />
          </label>
          <label>
            Un audio (opcional)
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => setAudio(e.target.files?.[0] ?? null)}
            />
          </label>
          {error && (
            <p role="alert" className="error-text">
              {error}
            </p>
          )}
          <div className="button-row">
            <button className="primary" disabled={busy || !owner}>
              {busy ? "Guardando…" : "Guardar recuerdo"}
            </button>
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setEditing(null);
                setPhoto(null);
                setAudio(null);
                setError("");
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <>
          <button
            className="secondary"
            onClick={() => setEditing({ date: today() })}
          >
            <Plus size={15} /> Guardar un momento
          </button>
          {!data.memories.length && (
            <div className="empty-state">
              <Camera size={38} />
              <h3>Hay momentos que merecen quedarse.</h3>
              <p>
                Una foto, una frase, aquel día. El primero puede ser muy
                pequeñito.
              </p>
            </div>
          )}
          <div className="memory-grid">
            {[...data.memories]
              .sort((a, b) => b.date.localeCompare(a.date))
              .map((m) => (
                <article key={m.id} className="polaroid">
                  {m.attachment ? (
                    <PrivateMedia path={m.attachment} alt={m.title} />
                  ) : (
                    <div className="memory-note-art">
                      ♡<span>un pedacito de vida</span>
                    </div>
                  )}
                  <button
                    className="memory-title"
                    onClick={() => {
                      say(
                        "Este sí que merece guardarse en un lugar bonito.",
                        "happy",
                      );
                      void reward("memory", m.id).catch((e) =>
                        notify(friendlyError(e)),
                      );
                    }}
                  >
                    {m.title}
                  </button>
                  <small>
                    {prettyDate(m.date)}
                    {m.place ? ` · ${m.place}` : ""}
                  </small>
                  <p>{m.body}</p>
                  {m.audio && (
                    <PrivateMedia
                      path={m.audio}
                      type="audio"
                      alt={`Audio: ${m.title}`}
                    />
                  )}
                  <button className="text-button" onClick={() => setEditing(m)}>
                    Editar recuerdo
                  </button>
                </article>
              ))}
          </div>
        </>
      )}
    </>
  );
}
