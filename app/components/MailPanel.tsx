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
  MessageCircle,
  Search,
  Bookmark,
  Pencil,
  ArrowLeft,
  MoreHorizontal,
  ArrowDown,
  Send,
  Paperclip,
  Heart,
  Reply,
  X,
} from "lucide-react";
import { useWorld } from "@/lib/world-store";
import { uploadFile, friendlyError } from "@/lib/data";
import { prettyDate } from "@/lib/constants";
import PrivateMedia from "./PrivateMedia";
import PushSettings from "./PushSettings";
import VoiceRecorder from "./VoiceRecorder";
import ReplyQuote from "./ReplyQuote";
import HugMessage from "./HugMessage";
import ChatLibrary from "./ChatLibrary";
import EditMessage from "./EditMessage";
import MessageGesture from "./MessageGesture";
import ProfileAvatar from "./ProfileAvatar";
import { useFavorites } from "@/lib/use-favorites";
import type { Message } from "@/lib/types";
import { useChatDetails } from "@/lib/use-chat-details";
export default function MailPanel({
  admin = false,
  onClose,
}: {
  admin?: boolean;
  onClose: () => void;
}) {
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
  const shell = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const [library, setLibrary] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    const timer = setTimeout(update, 0);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  const [options, setOptions] = useState(false);
  const [awayFromBottom, setAwayFromBottom] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    const target =
      shell.current?.closest<HTMLElement>(".paper-dialog") ?? shell.current;
    const resize = () => {
      if (viewport && viewport.scale !== 1) return;
      target?.style.setProperty(
        "--chat-viewport",
        `${viewport?.height ?? window.innerHeight}px`,
      );
      target?.style.setProperty("--chat-top", `${viewport?.offsetTop ?? 0}px`);
    };
    resize();
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    return () => {
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
      target?.style.removeProperty("--chat-viewport");
      target?.style.removeProperty("--chat-top");
    };
  }, []);
  useLayoutEffect(() => {
    if (!input.current) return;
    input.current.style.height = "auto";
    input.current.style.height = `${Math.min(input.current.scrollHeight, 110)}px`;
  }, [text]);
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
  const saved = useFavorites(profile.id, preview, messageIds);
  function reply(message: Message) {
    if (busy || pending || !chat.ready) return;
    draft.setValue((value) => ({
      ...value,
      replyTo: message.id,
      replyText: message.body || "Imagen o audio",
    }));
    setLibrary(false);
    requestAnimationFrame(() => input.current?.focus());
  }
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
    if (preview || library || !unread) return;
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
  }, [unread, preview, library, markRead]);
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (preview) {
      setError(
        "Esta es una vista de prueba. Entra con tu cuenta para enviar un mensaje.",
      );
      return;
    }
    if (!recipient) {
      setError("Todavía falta dar acceso a la otra persona.");
      return;
    }
    if (!navigator.onLine) {
      setError(
        "Sin conexión. Tu mensaje sigue aquí; envíalo cuando vuelva la conexión.",
      );
      return;
    }
    if (recordingVoice || !draft.ready || !acquire()) return;
    setError("");
    try {
      let submission = pending;
      if (!submission) {
        const body = textValue(text, "El mensaje", limits.body);
        if (!body && !file)
          throw new Error("Escribe unas palabras o añade un archivo.");
        const deliverAt =
          admin && schedule
            ? dateTimeValue(schedule)
            : new Date().toISOString();
        if (admin && schedule && new Date(deliverAt) <= new Date())
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
      if (new Date(result.message.deliver_at) > new Date())
        notify("Mensaje programado.");
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
  const person = recipient?.name || (admin ? "Janny" : "Gela");
  return (
    <div className="mail-panel dm-chat" ref={shell}>
      <header className="dm-header">
        <button
          type="button"
          className="icon-button"
          aria-label="Salir del chat"
          onClick={onClose}
        >
          <ArrowLeft size={21} />
        </button>
        <button
          type="button"
          className="dm-contact"
          aria-label={`Ver fotos, audios y mensajes con ${person}`}
          onClick={() => setLibrary(true)}
        >
          <ProfileAvatar name={person} path={recipient?.avatar_path} />
          <span className="dm-person">
            <strong>{person}</strong>
            <span role="status" aria-live="polite">
              {chat.typing ? "Escribiendo…" : ""}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Buscar mensajes"
          onClick={() => setLibrary(true)}
        >
          <Search size={20} />
        </button>
        <button
          type="button"
          className="icon-button"
          aria-label="Opciones del chat"
          aria-expanded={options}
          aria-controls="chat-options"
          onClick={() => setOptions(!options)}
        >
          <MoreHorizontal size={21} />
        </button>
      </header>
      {library && (
        <ChatLibrary
          profileId={profile.id}
          preview={preview}
          onClose={() => setLibrary(false)}
          onReply={reply}
        />
      )}
      {!online && (
        <div className="connection-strip" role="status">
          Sin conexión
        </div>
      )}
      {options && (
        <div id="chat-options" className="dm-options">
          {!preview && <PushSettings />}
          {admin && (
            <div className="admin-options">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={important}
                  disabled={busy || Boolean(pending)}
                  onChange={(e) => setImportant(e.target.checked)}
                />
                Destacar mensaje
              </label>
              <label>
                Programar envío
                <input
                  type="datetime-local"
                  value={schedule}
                  disabled={busy || Boolean(pending)}
                  onChange={(e) => setSchedule(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>
      )}
      <div
        ref={conversationRoot}
        className="letter-history"
        aria-label="Conversación"
        tabIndex={0}
        onScroll={(event) => {
          const root = event.currentTarget;
          followLatest.current =
            root.scrollHeight - root.scrollTop - root.clientHeight < 80;
          setAwayFromBottom(!followLatest.current);
        }}
      >
        {conversation.hasOlder && (
          <button
            type="button"
            className="text-button dm-older"
            disabled={conversation.loadingOlder}
            onClick={() => void loadOlder()}
          >
            {conversation.loadingOlder ? "Cargando…" : "Mensajes anteriores"}
          </button>
        )}
        {conversation.error && (
          <p className="error-text" role="status">
            {conversation.error}
          </p>
        )}
        {messages.length === 0 && (
          <div className="dm-empty">
            <span className="dm-avatar">
              {person.slice(0, 1).toUpperCase()}
            </span>
            <strong>{person}</strong>
            <MessageCircle size={24} />
          </div>
        )}
        {messages.map((m, index) => {
          const mine = m.sender_id === profile.id;
          const previous = messages[index - 1];
          const grouped =
            previous?.sender_id === m.sender_id &&
            new Date(m.deliver_at).getTime() -
              new Date(previous.deliver_at).getTime() <
              5 * 60 * 1000 &&
            new Date(previous.deliver_at).toDateString() ===
              new Date(m.deliver_at).toDateString();
          const future = new Date(m.deliver_at) > new Date();
          const hearts = chat.hearts.filter(
            (heart) => heart.message_id === m.id,
          );
          return (
            <Fragment key={m.id}>
              {(!previous ||
                new Date(previous.deliver_at).toDateString() !==
                  new Date(m.deliver_at).toDateString()) && (
                <p className="conversation-day">{prettyDate(m.deliver_at)}</p>
              )}
              <MessageGesture
                id={m.id}
                unread={m.recipient_id === profile.id && !m.read_at}
                label={mine ? "Mensaje tuyo" : `Mensaje de ${person}`}
                onReply={() => {
                  if (!future) reply(m);
                }}
                onHeart={() => {
                  if (
                    chat.ready &&
                    !future &&
                    !preview &&
                    !hearts.some((heart) => heart.profile_id === profile.id)
                  )
                    void chat.toggleHeart(m.id);
                }}
                className={`message ${mine ? "outgoing" : "incoming"} ${grouped ? "dm-grouped" : ""} ${m.important ? "special-message" : ""}`}
              >
                {m.reply_to && (
                  <ReplyQuote
                    id={m.reply_to}
                    messages={messages}
                    preview={preview}
                  />
                )}
                {editingId === m.id ? (
                  <EditMessage
                    key={m.id}
                    message={m}
                    onCancel={() => setEditingId(null)}
                    onSave={(updated) => {
                      conversation.merge([updated], false);
                      setEditingId(null);
                    }}
                  />
                ) : m.kind === "hug" ? (
                  <HugMessage />
                ) : (
                  m.body && <p>{m.body}</p>
                )}
                {m.attachment && (
                  <PrivateMedia
                    path={m.attachment}
                    type={m.attachment_type ?? "image"}
                    alt="Archivo adjunto"
                  />
                )}
                <div className="dm-message-footer">
                  <time
                    dateTime={m.deliver_at}
                    title={prettyDate(m.deliver_at, true)}
                  >
                    {new Date(m.deliver_at).toLocaleTimeString("es-MX", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {m.edited_at ? " · editado" : ""}
                    {future ? " · Programado" : ""}
                    {m.important ? " ♡" : ""}
                  </time>
                  {chat.ready && !future && (
                    <div className="message-actions">
                      {!preview && (
                        <button
                          type="button"
                          aria-label="Guardar favorito"
                          title="Favorito"
                          aria-pressed={saved.favorites.includes(m.id)}
                          onClick={() => void saved.toggle(m.id)}
                        >
                          <Bookmark size={14} />
                        </button>
                      )}
                      {mine && !preview && m.kind !== "hug" && (
                        <button
                          type="button"
                          aria-label="Editar mensaje"
                          title="Editar"
                          onClick={() => setEditingId(m.id)}
                        >
                          <Pencil size={14} />
                        </button>
                      )}
                      <button
                        type="button"
                        className="dm-reply"
                        aria-label="Responder a este mensaje"
                        title="Responder"
                        disabled={busy || Boolean(pending)}
                        onClick={() => {
                          draft.setValue((value) => ({
                            ...value,
                            replyTo: m.id,
                            replyText: m.body || "Imagen o audio",
                          }));
                          input.current?.focus();
                        }}
                      >
                        <Reply size={15} />
                      </button>
                      {!preview && (
                        <button
                          type="button"
                          className="heart-reaction"
                          aria-label="Corazón"
                          aria-pressed={hearts.some(
                            (heart) => heart.profile_id === profile.id,
                          )}
                          onClick={() => void chat.toggleHeart(m.id)}
                        >
                          <Heart size={14} />
                          {hearts.length > 0 && <span>{hearts.length}</span>}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </MessageGesture>
              {mine && index === messages.length - 1 && !future && (
                <span className="dm-seen">
                  {m.read_at ? "Visto" : "Enviado"}
                </span>
              )}
            </Fragment>
          );
        })}
      </div>
      {awayFromBottom && (
        <button type="button" className="dm-latest" onClick={scrollToLatest}>
          <ArrowDown size={16} />
          {conversation.unreadCount
            ? "Mensajes nuevos"
            : "Ir al último mensaje"}
        </button>
      )}
      <form className="letter-composer dm-composer" onSubmit={send}>
        {saved.error && (
          <p role="alert" className="error-text">
            {saved.error}
          </p>
        )}
        {busy && (
          <p className="send-status" role="status">
            Enviando…
          </p>
        )}
        {chat.error && (
          <p className="error-text" role="alert">
            {chat.error}
          </p>
        )}
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        {pending && !busy && (
          <p className="privacy-note">
            Envío sin confirmar. Reintenta sin duplicarlo.
          </p>
        )}
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
          {file && (
            <div className="dm-file">
              <Paperclip size={15} />
              <span>{file.name}</span>
              <button
                type="button"
                className="icon-button"
                aria-label="Quitar archivo"
                onClick={() => {
                  setFile(null);
                  setFileKey((key) => key + 1);
                }}
              >
                <X size={16} />
              </button>
            </div>
          )}
          {schedule && (
            <div className="dm-scheduled">
              {prettyDate(schedule, true)}
              <button
                type="button"
                className="text-button"
                onClick={() => setSchedule("")}
              >
                Cancelar programación
              </button>
            </div>
          )}
          <div className="dm-input-row">
            <label className="dm-attachment" title="Adjuntar foto o audio">
              <Paperclip size={21} />
              <input
                key={fileKey}
                aria-label="Adjuntar foto o audio"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,audio/*"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <textarea
              ref={input}
              id="letter-body"
              aria-label="Mensaje"
              rows={1}
              maxLength={10000}
              placeholder="Mensaje…"
              value={text}
              onChange={(event) => {
                setText(event.target.value);
                chat.onTyping(event.target.value);
              }}
              onBlur={chat.stopTyping}
              readOnly={kind === "hug"}
              onKeyDown={(event) => {
                if (
                  event.key === "Enter" &&
                  !event.shiftKey &&
                  !event.nativeEvent.isComposing &&
                  window.matchMedia("(hover: hover) and (pointer: fine)")
                    .matches
                ) {
                  event.preventDefault();
                  if (
                    (text.trim() || file) &&
                    !busy &&
                    !recordingVoice &&
                    draft.ready
                  )
                    event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            {chat.ready && !text.trim() && !file && (
              <button
                type="button"
                className="dm-hug"
                aria-label="Preparar un abrazo"
                title="Mandar un abrazo"
                disabled={recordingVoice || preview}
                onClick={() =>
                  draft.setValue((value) => ({
                    ...value,
                    kind: "hug",
                    text: "Te mando un abrazo ♡",
                  }))
                }
              >
                <Heart size={21} />
              </button>
            )}
          </div>
          <VoiceRecorder
            compact
            onChoose={setFile}
            onRecordingChange={setRecordingVoice}
            disabled={busy || Boolean(pending) || preview}
          />
        </fieldset>
        <button
          type="submit"
          className="dm-send"
          aria-label={
            pending
              ? "Reintentar envío"
              : schedule
                ? "Programar mensaje"
                : "Enviar mensaje"
          }
          disabled={
            busy ||
            recordingVoice ||
            !draft.ready ||
            (!pending && !text.trim() && !file)
          }
        >
          {busy ? <span className="dm-sending">…</span> : <Send size={20} />}
          {pending && <span>Reintentar</span>}
        </button>
        {draft.status === "unavailable" && (
          <DraftStatus status={draft.status} preview={preview} />
        )}
      </form>
    </div>
  );
}
