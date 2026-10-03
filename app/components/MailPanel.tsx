"use client";
import { Fragment, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import {
  Mail,
  Send,
  Paperclip,
  CheckCheck,
  Heart,
  Reply,
  X,
} from "lucide-react";
import { useWorld } from "@/lib/world-store";
import { uploadFile, friendlyError } from "@/lib/data";
import { prettyDate } from "@/lib/constants";
import PrivateMedia from "./PrivateMedia";
import WritingPrompts from "./WritingPrompts";
import PushSettings from "./PushSettings";
import VoiceRecorder from "./VoiceRecorder";
import ReplyQuote from "./ReplyQuote";
import HugMessage from "./HugMessage";
import { useChatDetails } from "@/lib/use-chat-details";
export default function MailPanel({ admin = false }: { admin?: boolean }) {
  const { data, profile, preview, sound, notify, say, conversation } =
    useWorld();
  const { markRead, refresh: refreshConversation } = conversation;
  const draft = useSavedDraft(
    `${profile.id}:mail`,
    emptyMail,
    !preview,
    decodeMail,
  );
  const { text, important, schedule, pending, replyTo, replyText, kind } =
    draft.value;
  const setText = (text: string) => draft.setValue((v) => ({ ...v, text }));
  const setImportant = (important: boolean) =>
    draft.setValue((v) => ({ ...v, important }));
  const setSchedule = (schedule: string) =>
    draft.setValue((v) => ({ ...v, schedule }));
  const conversationRoot = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);
  const historyAnchor = useRef<{ id: string; top: number } | null>(null);
  const scrollToLatest = () => {
    const root = conversationRoot.current;
    if (!root) return;
    followLatest.current = true;
    root.scrollTo({ top: root.scrollHeight, behavior: "instant" });
  };
  const [recordingVoice, setRecordingVoice] = useState(false);
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
  const messageIds = messages.map((message) => message.id).join(",");
  const chat = useChatDetails(profile.id, recipient?.id, messageIds, preview);
  useLayoutEffect(() => {
    const root = conversationRoot.current;
    if (!root) return;
    const anchor = historyAnchor.current;
    if (anchor) {
      const node = Array.from(
        root.querySelectorAll<HTMLElement>("[data-message-id]"),
      ).find((item) => item.dataset.messageId === anchor.id);
      if (node) root.scrollTop += node.getBoundingClientRect().top - anchor.top;
      historyAnchor.current = null;
    } else if (followLatest.current) {
      root.scrollTop = root.scrollHeight;
    }
    const observer = new ResizeObserver(() => {
      if (followLatest.current) root.scrollTop = root.scrollHeight;
    });
    observer.observe(root);
    root.querySelectorAll(".message").forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [messageIds]);
  useEffect(() => {
    if (preview) return;
    const sync = () => {
      if (document.visibilityState === "visible") void refreshConversation();
    };
    sync();
    const timer = window.setInterval(sync, 5000);
    return () => window.clearInterval(timer);
  }, [preview, refreshConversation]);
  async function loadOlder() {
    const root = conversationRoot.current;
    const first = root?.querySelector<HTMLElement>("[data-message-id]");
    followLatest.current = false;
    if (first)
      historyAnchor.current = {
        id: first.dataset.messageId!,
        top: first.getBoundingClientRect().top,
      };
    const anchor = historyAnchor.current;
    await conversation.loadOlder();
    requestAnimationFrame(() => {
      if (historyAnchor.current === anchor) historyAnchor.current = null;
    });
  }
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
      if (document.visibilityState !== "visible" || pendingReads.has(id))
        return;
      pendingReads.add(id);
      try {
        await markRead([id]);
      } catch (e) {
        if (live) setError(friendlyError(e));
      } finally {
        pendingReads.delete(id);
      }
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = (entry.target as HTMLElement).dataset.messageId!;
          if (entry.isIntersecting) {
            visible.add(id);
            void mark(id);
          } else visible.delete(id);
        });
      },
      { threshold: 0.1 },
    );
    conversationRoot.current
      ?.querySelectorAll<HTMLElement>("[data-unread=true]")
      .forEach((node) => observer.observe(node));
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
            replyTo,
            kind,
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
      chat.stopTyping();
      followLatest.current = true;
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
      {!preview && (
        <details className="mail-notifications">
          <summary>Avisarme cuando llegue un mensaje</summary>
          <PushSettings />
        </details>
      )}
      <div className="conversation-heading">
        <div>
          <strong>{recipient?.name || (admin ? "Janny" : "Gela")}</strong>
        </div>
        <button type="button" className="text-button" onClick={scrollToLatest}>
          Ver lo más reciente ↓
        </button>
      </div>
      <div
        ref={conversationRoot}
        className="letter-history"
        aria-label="Historial de cartas"
        tabIndex={0}
        onScroll={(event) => {
          const root = event.currentTarget;
          followLatest.current =
            root.scrollHeight - root.scrollTop - root.clientHeight < 80;
        }}
      >
        {conversation.hasOlder && (
          <button
            type="button"
            className="text-button"
            disabled={conversation.loadingOlder}
            onClick={() => void loadOlder()}
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
            <h3>{admin ? "Mi conversación con Janny" : "Cuéntame, Janny."}</h3>
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
                {m.reply_to && (
                  <ReplyQuote
                    id={m.reply_to}
                    messages={messages}
                    preview={preview}
                  />
                )}
                {m.kind === "hug" ? <HugMessage /> : <p>{m.body}</p>}
                {m.attachment && (
                  <PrivateMedia
                    path={m.attachment}
                    type={m.attachment_type ?? "image"}
                    alt="Archivo de la carta"
                  />
                )}
                {chat.ready && new Date(m.deliver_at) <= new Date() && (
                  <div className="message-actions">
                    <button
                      type="button"
                      className="text-button"
                      disabled={busy || Boolean(pending)}
                      onClick={() => {
                        draft.setValue((value) => ({
                          ...value,
                          replyTo: m.id,
                          replyText: m.body || "Imagen o audio",
                        }));
                        document.getElementById("letter-body")?.focus();
                      }}
                    >
                      <Reply size={15} />
                      Responder
                    </button>
                    {!preview && (
                      <button
                        type="button"
                        className="heart-reaction"
                        aria-label="Corazón"
                        aria-pressed={chat.hearts.some(
                          (heart) =>
                            heart.message_id === m.id &&
                            heart.profile_id === profile.id,
                        )}
                        onClick={() => void chat.toggleHeart(m.id)}
                      >
                        <Heart size={16} />
                        <span>
                          {chat.hearts.filter(
                            (heart) => heart.message_id === m.id,
                          ).length || ""}
                        </span>
                      </button>
                    )}
                  </div>
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
      </div>
      <div className="typing-status" role="status" aria-live="polite">
        {chat.typing
          ? `${recipient?.name || (admin ? "Janny" : "Gela")} está escribiendo…`
          : ""}
      </div>
      {chat.error && (
        <p className="error-text" role="alert">
          {chat.error}
        </p>
      )}
      <form className="letter-composer" onSubmit={send}>
        <fieldset
          className="form-fields"
          disabled={busy || !draft.ready || Boolean(pending)}
        >
          {replyTo && (
            <div className="reply-draft">
              <Reply size={17} />
              <span>{replyText}</span>
              <button
                type="button"
                className="icon-button"
                aria-label="Cancelar respuesta"
                onClick={() =>
                  draft.setValue((value) => ({
                    ...value,
                    replyTo: null,
                    replyText: "",
                  }))
                }
              >
                <X size={16} />
              </button>
            </div>
          )}
          {kind === "hug" && (
            <div className="reply-draft">
              <Heart size={17} />
              <span>Un abrazo</span>
              <button
                type="button"
                className="icon-button"
                aria-label="Quitar abrazo"
                onClick={() =>
                  draft.setValue((value) => ({
                    ...value,
                    kind: "text",
                    text: "",
                  }))
                }
              >
                <X size={16} />
              </button>
            </div>
          )}
          <label htmlFor="letter-body">
            {admin
              ? "Mi mensaje para Janny"
              : "Escríbeme lo que quieras, Janny"}
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
            placeholder={admin ? "Janny, te quería contar…" : "Gela, hoy…"}
            value={text}
            disabled={!draft.ready}
            onChange={(e) => {
              setText(e.target.value);
              chat.onTyping(e.target.value);
            }}
            onBlur={chat.stopTyping}
            readOnly={kind === "hug"}
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
          <VoiceRecorder
            onChoose={setFile}
            onRecordingChange={setRecordingVoice}
            disabled={busy || Boolean(pending) || preview}
          />
          {chat.ready && (
            <button
              type="button"
              className="text-button"
              disabled={
                !chat.ready ||
                Boolean(text.trim()) ||
                Boolean(file) ||
                recordingVoice ||
                preview
              }
              onClick={() =>
                draft.setValue((value) => ({
                  ...value,
                  kind: "hug",
                  text: "Te mando un abrazo ♡",
                }))
              }
            >
              <Heart size={16} />
              Mandar un abrazo
            </button>
          )}
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
          disabled={
            busy ||
            recordingVoice ||
            !draft.ready ||
            (!pending && !text.trim() && !file)
          }
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
