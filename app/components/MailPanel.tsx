"use client";
import { Fragment, useEffect, useRef, useState } from "react";
import { useSavedDraft } from "@/lib/use-draft";
import { decodeMail, emptyMail } from "@/lib/draft-models";
import {
  limits,
  textValue,
  dateTimeValue,
  parseMessage,
} from "@/lib/validation";
import { useSubmitLock } from "@/lib/use-submit-lock";
import DraftStatus from "./DraftStatus";
import { Mail, Send, Paperclip, CheckCheck } from "lucide-react";
import { useWorld } from "@/lib/world-store";
import { uploadFile, friendlyError } from "@/lib/data";
import { prettyDate } from "@/lib/constants";
import PrivateMedia from "./PrivateMedia";
import WritingPrompts from "./WritingPrompts";
export default function MailPanel({ admin = false }: { admin?: boolean }) {
  const { data, profile, preview, sound, notify, say, conversation } =
    useWorld();
  const { markRead } = conversation;
  const draft = useSavedDraft(
    `${profile.id}:mail`,
    emptyMail,
    !preview,
    decodeMail,
  );
  const { text, important, schedule, pending } = draft.value;
  const setText = (text: string) => draft.setValue((v) => ({ ...v, text }));
  const setImportant = (important: boolean) =>
    draft.setValue((v) => ({ ...v, important }));
  const setSchedule = (schedule: string) =>
    draft.setValue((v) => ({ ...v, schedule }));
  const bottom = useRef<HTMLDivElement>(null);
  const conversationRoot = useRef<HTMLDivElement>(null);
  const scrollToLatest = () =>
    bottom.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
      block: "nearest",
    });
  const [file, setFile] = useState<File | null>(null);
  const { busy, acquire, release } = useSubmitLock();
  const [error, setError] = useState("");
  const [fileKey, setFileKey] = useState(0);
  const recipient = data.profiles.find(
    (p) => p.role === (admin ? "janny" : "gela"),
  );
  const messages = [...data.messages].sort(
    (a, b) =>
      a.deliver_at.localeCompare(b.deliver_at) || a.id.localeCompare(b.id),
  );
  const unread = messages
    .filter((m) => m.recipient_id === profile.id && !m.read_at)
    .map((m) => m.id)
    .join(",");
  useEffect(() => {
    if (preview || !unread) return;
    let live = true;
    const pendingReads = new Set<string>();
    const visible = new Set<string>();
    async function mark(id: string) {
      if (document.visibilityState !== "visible" || pendingReads.has(id)) return;
      pendingReads.add(id);
      try {
        await markRead([id]);
      } catch (e) {
        if (live) setError(friendlyError(e));
      } finally {
        pendingReads.delete(id);
      }
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const id = (entry.target as HTMLElement).dataset.messageId!;
        if (entry.isIntersecting) {
          visible.add(id);
          void mark(id);
        } else visible.delete(id);
      });
    }, { threshold: 0.1 });
    conversationRoot.current?.querySelectorAll<HTMLElement>("[data-unread=true]").forEach((node) => observer.observe(node));
    const onVisible = () => visible.forEach((id) => void mark(id));
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      live = false;
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [unread, preview, markRead]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (preview) {
      setError(
        "Esta es una vista de prueba. Entra con tu cuenta para enviar una carta de verdad.",
      );
      return;
    }
    if (!recipient) {
      setError("Todavía falta dar acceso a la otra persona.");
      return;
    }
    if (!draft.ready || !acquire()) return;
    setError("");
    try {
      let submission = pending;
      if (!submission) {
        const body = textValue(text, "La carta", limits.body);
        if (!body && !file)
          throw new Error("Escribe unas palabras o añade un archivo.");
        const deliverAt =
          admin && schedule
            ? dateTimeValue(schedule)
            : new Date().toISOString();
        if (admin && schedule && new Date(deliverAt).getTime() <= Date.now())
          throw new Error(
            "Elige una hora futura o quita la programación para enviarla ahora.",
          );
        const attachment = file ? await uploadFile(file, profile.id) : null;
        submission = parseMessage(
          {
            requestId: crypto.randomUUID(),
            recipientId: recipient.id,
            body,
            attachment,
            attachmentType: file?.type ?? null,
            important: admin && important,
            deliverAt,
          },
          profile.id,
        );
        // Preserve the exact request before sending it; retries reuse this identifier.
        draft.setValue((v) => ({ ...v, pending: submission }));
      }
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission),
        signal: AbortSignal.timeout(20000),
      });
      const result = await response.json();
      if (!response.ok) {
        if (result.retryable === false)
          draft.setValue((v) => ({ ...v, pending: null }));
        throw new Error(
          result.error ||
            "No pudimos confirmar la entrega. Reintenta el mismo envío.",
        );
      }
      if (!result.message?.id)
        throw new Error(
          "No pudimos confirmar la entrega. Reintenta el mismo envío.",
        );
      conversation.merge([result.message], false);
      draft.clear(emptyMail);
      setFile(null);
      setFileKey((k) => k + 1);
      sound("letter");
      say(
        "Llevando tus palabras con muchísimo cuidado. Y sin migas de galleta.",
        "wave",
      );
      notify(
        new Date(result.message.deliver_at).getTime() > Date.now()
          ? "Tu carta quedó programada."
          : "Tu carta ya está en el buzón.",
      );
      requestAnimationFrame(scrollToLatest);
    } catch (e) {
      setError(
        e instanceof DOMException &&
          (e.name === "TimeoutError" || e.name === "AbortError")
          ? "La conexión tardó demasiado. Puedes reintentar el mismo envío sin duplicarlo."
          : friendlyError(e),
      );
    } finally {
      release();
    }
  }
  return (
    <div className="mail-panel">
      <div className="conversation-heading">
        <div>
          <strong>
            {recipient?.name || (admin ? "Janny" : "Tu persona favorita")}
          </strong>
        </div>
        <button type="button" className="text-button" onClick={scrollToLatest}>
          Ver lo más reciente ↓
        </button>
      </div>
      <div ref={conversationRoot} className="letter-history" aria-label="Historial de cartas">
        {conversation.hasOlder && (
          <button
            type="button"
            className="text-button"
            disabled={conversation.loadingOlder}
            onClick={() => void conversation.loadOlder()}
          >
            {conversation.loadingOlder ? "Cargando…" : "Ver cartas anteriores"}
          </button>
        )}
        {conversation.error && (
          <p className="error-text" role="status">
            {conversation.error}
          </p>
        )}
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
          messages.map((m, index) => (
            <Fragment key={m.id}>
              {(index === 0 ||
                new Date(messages[index - 1].deliver_at).toLocaleDateString(
                  "es-MX",
                ) !== new Date(m.deliver_at).toLocaleDateString("es-MX")) && (
                <p className="conversation-day">{prettyDate(m.deliver_at)}</p>
              )}
              <article
                key={m.id}
                data-message-id={m.id}
                data-unread={m.recipient_id === profile.id && !m.read_at}
                className={`message ${m.sender_id === profile.id ? "outgoing" : "incoming"} ${m.important ? "special-message" : ""}`}
              >
                <header>
                  <strong>
                    {m.sender_id === profile.id
                      ? "Tú"
                      : recipient?.name || (admin ? "Janny" : "Gela")}
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
                      <CheckCheck size={13} /> Leída{" "}
                      {prettyDate(m.read_at, true)}
                    </>
                  ) : (
                    "Entregada en el buzón"
                  )}
                </small>
              </article>
            </Fragment>
          ))
        )}
        <div ref={bottom} />
      </div>
      <form className="letter-composer" onSubmit={send}>
        <fieldset
          className="form-fields"
          disabled={busy || !draft.ready || Boolean(pending)}
        >
          <label htmlFor="letter-body">
            {admin ? "Unas palabras para Janny" : "Querido Gela…"}
          </label>
          {!text && (
            <WritingPrompts
              ideas={[
                "Hoy me acordé de ti porque…",
                "Te quería contar algo…",
                "Un plan que me gustaría compartir…",
              ]}
              onChoose={(idea) => {
                setText(idea.replace("…", " "));
                document.getElementById("letter-body")?.focus();
              }}
            />
          )}
          <textarea
            id="letter-body"
            rows={4}
            maxLength={10000}
            placeholder="No tiene que ser algo importante. Puede ser simplemente un hola."
            value={text}
            disabled={!draft.ready}
            onChange={(e) => setText(e.target.value)}
          />
          <DraftStatus status={draft.status} preview={preview} files />
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
        </fieldset>
        {pending && (
          <p className="privacy-note">
            Este envío está pendiente de confirmación. Al reintentar enviaremos
            exactamente la misma carta.
          </p>
        )}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        <button
          className="primary"
          disabled={busy || !draft.ready || (!pending && !text.trim() && !file)}
        >
          {busy
            ? "Guardando tu carta…"
            : pending
              ? "Reintentar el mismo envío"
              : schedule
                ? "Programar carta"
                : "Enviar carta"}
          <Send size={15} />
        </button>
      </form>
    </div>
  );
}
