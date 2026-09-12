"use client";
import { useEffect, useState } from "react";
import { Mail, Send, Paperclip, CheckCheck } from "lucide-react";
import { useWorld } from "@/lib/world-store";
import { browserDb } from "@/lib/supabase/client";
import { uploadFile, removeFile, friendlyError } from "@/lib/data";
import { prettyDate } from "@/lib/constants";
import PrivateMedia from "./PrivateMedia";
export default function MailPanel({ admin = false }: { admin?: boolean }) {
  const { data, profile, preview, refresh, sound, notify } = useWorld();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [important, setImportant] = useState(false);
  const [schedule, setSchedule] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fileKey, setFileKey] = useState(0);
  const recipient = data.profiles.find(
    (p) => p.role === (admin ? "janny" : "gela"),
  );
  const messages = [...data.messages].sort((a, b) =>
    a.deliver_at.localeCompare(b.deliver_at),
  );
  const unread = messages
    .filter((m) => m.recipient_id === profile.id && !m.read_at)
    .map((m) => m.id)
    .join(",");
  useEffect(() => {
    if (preview || !unread) return;
    let live = true;
    async function mark() {
      const results = await Promise.all(
        unread
          .split(",")
          .map((message) => browserDb().rpc("mark_message_read", { message })),
      );
      const failure = results.find((r) => r.error);
      if (failure?.error) {
        if (live)
          setError(
            "No se pudo confirmar la lectura. Puedes volver a abrir el buzón.",
          );
        return;
      }
      if (live) await refresh();
    }
    void mark();
    return () => {
      live = false;
    };
  }, [unread, preview, refresh]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (preview) {
      setError(
        "El buzón necesita conectar Supabase para que tu carta llegue de verdad.",
      );
      return;
    }
    if (!recipient) {
      setError("Todavía falta dar acceso a la otra persona.");
      return;
    }
    setBusy(true);
    setError("");
    let attachment: string | null = null;
    try {
      if (file) attachment = await uploadFile(file, profile.id);
      const { error } = await browserDb()
        .from("messages")
        .insert({
          sender_id: profile.id,
          recipient_id: recipient.id,
          body: text.trim(),
          attachment,
          attachment_type: file?.type ?? null,
          important: admin && important,
          deliver_at:
            admin && schedule
              ? new Date(schedule).toISOString()
              : new Date().toISOString(),
        });
      if (error) throw new Error(error.message);
      setText("");
      setFile(null);
      setFileKey((k) => k + 1);
      setSchedule("");
      setImportant(false);
      sound("letter");
      notify(
        schedule
          ? "Tu carta quedó programada."
          : "Tu carta ya está en el buzón.",
      );
      await refresh();
    } catch (e) {
      if (attachment) await removeFile(attachment);
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mail-panel">
      <div className="letter-history" aria-label="Historial de cartas">
        {messages.length === 0 ? (
          <div className="empty-state">
            <Mail size={36} />
            <h3>Las palabras también abrazan.</h3>
            <p>
              {admin
                ? "Aquí aparecerán las cartas de Janny. Puedes dejarle la primera."
                : "Todavía no hay cartas. Puedes dejarle unas palabras a Gela."}
            </p>
          </div>
        ) : (
          messages.map((m) => (
            <article
              key={m.id}
              className={`message ${m.sender_id === profile.id ? "outgoing" : "incoming"} ${m.important ? "special-message" : ""}`}
            >
              <header>
                <strong>
                  {m.sender_id === profile.id ? "Tú" : admin ? "Janny" : "Gela"}
                  {m.important ? " · una carta especial ♡" : ""}
                </strong>
                <time>{prettyDate(m.deliver_at, true)}</time>
              </header>
              <p>{m.body}</p>
              {m.attachment && (
                <PrivateMedia
                  path={m.attachment}
                  type={m.attachment_type ?? "image"}
                  alt="Archivo de la carta"
                />
              )}
              <small>
                {new Date(m.deliver_at) > new Date() ? (
                  "Programada"
                ) : m.read_at ? (
                  <>
                    <CheckCheck size={13} /> Leída {prettyDate(m.read_at, true)}
                  </>
                ) : (
                  "Entregada en el buzón"
                )}
              </small>
            </article>
          ))
        )}
      </div>
      <form className="letter-composer" onSubmit={send}>
        <label htmlFor="letter-body">
          {admin ? "Unas palabras para Janny" : "Querido Gela…"}
        </label>
        <textarea
          id="letter-body"
          rows={4}
          maxLength={10000}
          placeholder="No tiene que ser algo importante. Puede ser simplemente un hola."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="composer-tools">
          <label className="attachment-button">
            <Paperclip size={15} />
            {file ? file.name : "Añadir imagen o audio"}
            <input
              key={fileKey}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,audio/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {file && (
            <button
              type="button"
              className="text-button"
              onClick={() => {
                setFile(null);
                setFileKey((k) => k + 1);
              }}
            >
              Quitar archivo
            </button>
          )}
        </div>
        {admin && (
          <div className="admin-options">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={important}
                onChange={(e) => setImportant(e.target.checked)}
              />{" "}
              Carta especial
            </label>
            <label>
              Entregar más tarde (opcional)
              <input
                type="datetime-local"
                value={schedule}
                onChange={(e) => setSchedule(e.target.value)}
              />
            </label>
          </div>
        )}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button className="primary" disabled={busy || (!text.trim() && !file)}>
          {busy
            ? "Guardando tu carta…"
            : schedule
              ? "Programar carta"
              : "Enviar carta"}
          <Send size={15} />
        </button>
        <p className="privacy-note">Solo ustedes dos pueden leer este buzón.</p>
      </form>
    </div>
  );
}
