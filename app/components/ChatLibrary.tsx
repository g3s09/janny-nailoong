"use client";
import { useEffect, useRef, useState } from "react";
import { X, Search, Images, Bookmark, Reply } from "lucide-react";
import { browserDb } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/data";
import { prettyDate } from "@/lib/constants";
import type { Message } from "@/lib/types";
import PrivateMedia from "./PrivateMedia";
export default function ChatLibrary({
  profileId,
  preview,
  onClose,
  onReply,
}: {
  profileId: string;
  preview: boolean;
  onClose: () => void;
  onReply: (message: Message) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const el = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    el?.showModal();
    return () => {
      el?.close();
      previous?.focus();
    };
  }, []);
  const [mode, setMode] = useState<"search" | "media" | "favorites">("search");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const version = useRef(0);
  const lock = useRef(false);
  async function load(append = false, run = version.current) {
    if (preview) return;
    if (append && lock.current) return;
    lock.current = true;
    setLoading(true);
    setError("");
    try {
      let request = browserDb()
        .from("messages")
        .select(
          mode === "favorites" ? "*,message_favorites!inner(profile_id)" : "*",
        )
        .lte("deliver_at", new Date().toISOString())
        .order("deliver_at", { ascending: false })
        .order("id", { ascending: false })
        .limit(41);
      if (mode === "media") request = request.not("attachment", "is", null);
      if (mode === "favorites")
        request = request.eq("message_favorites.profile_id", profileId);
      if (query.trim())
        request = request.ilike(
          "body",
          "%" + query.trim().replace(/[\\%_]/g, "\\$&") + "%",
        );
      const before = append ? rows.at(-1) : undefined;
      if (before)
        request = request.or(
          `deliver_at.lt.${before.deliver_at},and(deliver_at.eq.${before.deliver_at},id.lt.${before.id})`,
        );
      const result = await request;
      if (result.error) throw result.error;
      if (run !== version.current) return;
      const page = result.data as unknown as Message[];
      setRows((old) =>
        append ? [...old, ...page.slice(0, 40)] : page.slice(0, 40),
      );
      setMore(page.length > 40);
    } catch (e) {
      if (run === version.current) setError(friendlyError(e));
    } finally {
      if (run === version.current) {
        lock.current = false;
        setLoading(false);
      }
    }
  }
  useEffect(() => {
    const run = ++version.current;
    const task = setTimeout(() => {
      setRows([]);
      setMore(false);
      void load(false, run);
    }, 250);
    return () => {
      clearTimeout(task);
      version.current = run + 1;
    };
    // Each search owns its result version; pagination uses the current cursor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, mode, profileId, preview]);
  return (
    <dialog
      ref={dialog}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      className="chat-library"
      aria-label="Buscar en la conversación"
    >
      <header>
        <h3>Tu conversación</h3>
        <button
          type="button"
          className="icon-button"
          aria-label="Cerrar búsqueda"
          onClick={onClose}
        >
          <X size={18} />
        </button>
      </header>
      <div className="library-tabs">
        {(
          [
            { id: "search", label: "Buscar", icon: Search },
            { id: "media", label: "Fotos y audios", icon: Images },
            { id: "favorites", label: "Favoritos", icon: Bookmark },
          ] as const
        ).map(({ id, label, icon: Icon }) => (
          <button
            type="button"
            aria-pressed={mode === id}
            key={id}
            onClick={() => setMode(id)}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>
      <input
        aria-label="Buscar mensajes"
        placeholder="Buscar una palabra…"
        value={query}
        maxLength={160}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="library-results" aria-busy={loading}>
        {error && (
          <p role="alert" className="error-text">
            {error}
            <button className="text-button" onClick={() => void load()}>
              Reintentar
            </button>
          </p>
        )}
        {!loading && !rows.length && !error && (
          <p className="library-empty">
            {preview ? "Sin mensajes en esta vista." : "Sin resultados."}
          </p>
        )}
        {rows.map((message) => (
          <article key={message.id}>
            <small>{prettyDate(message.deliver_at, true)}</small>
            {message.body && <p>{message.body}</p>}
            {message.attachment && (
              <PrivateMedia
                path={message.attachment}
                type={message.attachment_type ?? "image"}
                alt="Archivo compartido"
              />
            )}
            <button className="text-button" onClick={() => onReply(message)}>
              <Reply size={15} />
              Responder
            </button>
          </article>
        ))}
        {loading && <p role="status">Buscando…</p>}
        {more && (
          <button
            className="secondary"
            disabled={loading}
            onClick={() => void load(true)}
          >
            Ver más
          </button>
        )}
      </div>
    </dialog>
  );
}
