"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { browserDb } from "../supabase/client";
import { friendlyError } from "../data";
import type { Message } from "../types";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

const PAGE_SIZE = 40;
type Cursor = Pick<Message, "deliver_at" | "id">;
async function page(before?: Cursor) {
  let query = browserDb()
    .from("messages")
    .select("*")
    .lte("deliver_at", new Date().toISOString())
    .order("deliver_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(PAGE_SIZE + 1);
  if (before)
    query = query.or(
      `deliver_at.lt.${before.deliver_at},and(deliver_at.eq.${before.deliver_at},id.lt.${before.id})`,
    );
  const { data, error } = await query;
  if (error) throw error;
  return {
    rows: (data ?? []).slice(0, PAGE_SIZE) as Message[],
    hasMore: (data?.length ?? 0) > PAGE_SIZE,
  };
}

export function useConversation(
  profileId: string,
  preview: boolean,
  onIncoming: () => void,
) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasOlder, setHasOlder] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [error, setError] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const unreadVersion = useRef(0);
  const cursor = useRef<Cursor | undefined>(undefined);
  const latestBoundary = useRef<Cursor | undefined>(undefined);
  const seen = useRef(new Set<string>());
  const initialized = useRef(false);
  const olderLock = useRef(false);
  const running = useRef<Promise<boolean> | null>(null);
  const generation = useRef(0);
  const refreshUnread = useCallback(async () => {
    if (preview) return;
    const version = ++unreadVersion.current;
    const { count, error } = await browserDb()
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("recipient_id", profileId)
      .is("read_at", null)
      .lte("deliver_at", new Date().toISOString());
    if (error) throw error;
    if (version === unreadVersion.current) setUnreadCount(count ?? 0);
  }, [preview, profileId]);
  const merge = useCallback(
    (rows: Message[], announce = true) => {
      if (
        announce &&
        initialized.current &&
        rows.some(
          (m) =>
            m.recipient_id === profileId &&
            !m.read_at &&
            !seen.current.has(m.id),
        )
      )
        onIncoming();
      rows.forEach((m) => seen.current.add(m.id));
      setMessages((current) => {
        const next = new Map(current.map((m) => [m.id, m]));
        rows.forEach((m) =>
          next.set(m.id, {
            ...m,
            read_at: m.read_at ?? next.get(m.id)?.read_at ?? null,
          }),
        );
        return [...next.values()];
      });
    },
    [profileId, onIncoming],
  );
  const refresh = useCallback((): Promise<boolean> => {
    if (preview) return Promise.resolve(true);
    if (running.current) return running.current;
    const version = generation.current;
    const task = async () => {
      try {
        const { error: deliveryError } =
          await browserDb().rpc("deliver_messages");
        if (deliveryError) throw deliveryError;
        const [recent, scheduled] = await Promise.all([
          page(),
          browserDb()
            .from("messages")
            .select("*")
            .eq("sender_id", profileId)
            .gt("deliver_at", new Date().toISOString())
            .order("deliver_at")
            .limit(100),
        ]);
        if (scheduled.error) throw scheduled.error;
        if (generation.current !== version) return false;
        const oldest = recent.rows.at(-1);
        const boundary = latestBoundary.current;
        const gap = Boolean(
          boundary &&
          oldest &&
          recent.hasMore &&
          (Date.parse(oldest.deliver_at) > Date.parse(boundary.deliver_at) ||
            (oldest.deliver_at === boundary.deliver_at &&
              oldest.id > boundary.id)),
        );
        if (!initialized.current || gap || !cursor.current) {
          cursor.current = recent.rows.at(-1);
          setHasOlder(recent.hasMore);
        }
        merge([...recent.rows, ...((scheduled.data ?? []) as Message[])]);
        latestBoundary.current = recent.rows[0] ?? latestBoundary.current;
        initialized.current = true;
        await refreshUnread();
        setError("");
        return true;
      } catch (e) {
        if (generation.current === version) setError(friendlyError(e));
        return false;
      }
    };
    const pending = task().finally(() => {
      if (running.current === pending) running.current = null;
    });
    running.current = pending;
    return pending;
  }, [preview, profileId, merge, refreshUnread]);
  const loadOlder = useCallback(async () => {
    if (preview || olderLock.current || !cursor.current) return;
    olderLock.current = true;
    setLoadingOlder(true);
    const version = generation.current;
    try {
      const result = await page(cursor.current);
      if (generation.current !== version) return;
      merge(result.rows, false);
      cursor.current = result.rows.at(-1) ?? cursor.current;
      setHasOlder(result.hasMore);
      setError("");
    } catch (e) {
      if (generation.current === version) setError(friendlyError(e));
    } finally {
      olderLock.current = false;
      setLoadingOlder(false);
    }
  }, [preview, merge]);
  const markRead = useCallback(
    async (ids: string[]) => {
      if (preview || !ids.length) return;
      const results = await Promise.all(
        ids.map((message) => browserDb().rpc("mark_message_read", { message })),
      );
      const accepted = new Set(ids.filter((_, index) => !results[index].error));
      setMessages((current) =>
        current.map((m) =>
          accepted.has(m.id) && m.recipient_id === profileId
            ? { ...m, read_at: m.read_at ?? new Date().toISOString() }
            : m,
        ),
      );
      await refreshUnread();
      if (results.some((result) => result.error))
        throw new Error(
          "No se pudo confirmar la lectura. Vuelve a abrir el buzón para reintentarlo.",
        );
    },
    [preview, profileId, refreshUnread],
  );
  useEffect(() => {
    if (preview) return;
    const db = browserDb();
    let live = true;
    const version = generation.current;
    const channel = db
      .channel(`conversation:${profileId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        async (
          event: RealtimePostgresChangesPayload<Record<string, unknown>>,
        ) => {
          if (!live) return;
          const id =
            (event.new as { id?: string }).id ??
            (event.old as { id?: string }).id;
          if (!id) return;
          if (event.eventType === "DELETE") {
            setMessages((current) => current.filter((m) => m.id !== id));
            void refreshUnread().catch((e) => { if (live) setError(friendlyError(e)); });
            return;
          }
          const { data, error } = await db
            .from("messages")
            .select("*")
            .eq("id", id)
            .maybeSingle();
          if (live && !error && data) {
            merge([data as Message]);
            void refreshUnread().catch((e) => { if (live) setError(friendlyError(e)); });
          }
        },
      )
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") void refresh();
      });
    const sync = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    const timer = setInterval(sync, 30000);
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("online", sync);
    return () => {
      live = false;
      generation.current = version + 1;
      running.current = null;
      void db.removeChannel(channel);
      clearInterval(timer);
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("online", sync);
    };
  }, [preview, profileId, merge, refresh, refreshUnread]);
  return {
    messages,
    unreadCount,
    hasOlder,
    loadingOlder,
    error,
    refresh,
    loadOlder,
    markRead,
    merge,
  };
}
