"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { browserDb } from "./supabase/client";
import { friendlyError } from "./data";
export function useChatDetails(
  profileId: string,
  recipientId: string | undefined,
  ids: string,
  preview: boolean,
) {
  const [hearts, setHearts] = useState<
    { message_id: string; profile_id: string }[]
  >([]);
  const [ready, setReady] = useState(preview);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(new Set<string>());
  const lastTyping = useRef(0);
  const expiry = useRef<ReturnType<typeof setTimeout> | null>(null);
  const retryAfter = useRef(0);
  const refresh = useCallback(async () => {
    if (preview || Date.now() < retryAfter.current) return false;
    if (!ids) {
      const result = await browserDb()
        .from("message_hearts")
        .select("message_id")
        .limit(0);
      setReady(!result.error);
      if (result.error) retryAfter.current = Date.now() + 30000;
      return !result.error;
    }
    const all = ids.split(",");
    const rows: { message_id: string; profile_id: string }[] = [];
    for (let i = 0; i < all.length; i += 80) {
      const result = await browserDb()
        .from("message_hearts")
        .select("message_id,profile_id")
        .in("message_id", all.slice(i, i + 80));
      if (result.error) {
        setReady(false);
        retryAfter.current = Date.now() + 30000;
        return false;
      }
      rows.push(...result.data);
    }
    setHearts(rows);
    setReady(true);
    return true;
  }, [ids, preview]);
  useEffect(() => {
    if (preview) return;
    let live = true;
    let running = false;
    const sync = async () => {
      if (document.visibilityState !== "visible" || running) return;
      running = true;
      try {
        const available = await refresh();
        if (!available || !recipientId) {
          if (live) setTyping(false);
          return;
        }
        const { data } = await browserDb()
          .from("chat_typing")
          .select("until_at")
          .eq("profile_id", recipientId)
          .maybeSingle();
        if (live)
          setTyping(Boolean(data && Date.parse(data.until_at) > Date.now()));
      } catch {
        if (live) setTyping(false);
      } finally {
        running = false;
      }
    };
    void sync();
    const timer = setInterval(() => void sync(), 2000);
    const visible = () => {
      if (document.visibilityState === "visible") void sync();
      else setTyping(false);
    };
    document.addEventListener("visibilitychange", visible);
    return () => {
      live = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [preview, recipientId, refresh]);
  const writeTyping = useCallback(
    (active: boolean) => {
      if (preview || !ready) return;
      if (active && Date.now() - lastTyping.current < 2500) return;
      lastTyping.current = active ? Date.now() : 0;
      void browserDb()
        .rpc("set_chat_typing", { active })
        .then(() => {});
    },
    [preview, ready],
  );
  const stopTyping = useCallback(() => {
    if (expiry.current) clearTimeout(expiry.current);
    writeTyping(false);
  }, [writeTyping]);
  useEffect(() => {
    const hide = () => {
      if (document.visibilityState !== "visible") stopTyping();
    };
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", stopTyping);
    return () => {
      stopTyping();
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", stopTyping);
    };
  }, [stopTyping]);
  function onTyping(value: string) {
    if (!value.trim()) {
      stopTyping();
      return;
    }
    writeTyping(true);
    if (expiry.current) clearTimeout(expiry.current);
    expiry.current = setTimeout(stopTyping, 3500);
  }
  async function toggleHeart(id: string) {
    if (preview || busy.current.has(id)) return;
    busy.current.add(id);
    setError("");
    try {
      const own = hearts.some(
        (heart) => heart.message_id === id && heart.profile_id === profileId,
      );
      const result = own
        ? await browserDb()
            .from("message_hearts")
            .delete()
            .eq("message_id", id)
            .eq("profile_id", profileId)
        : await browserDb()
            .from("message_hearts")
            .insert({ message_id: id, profile_id: profileId });
      if (result.error && result.error.code !== "23505") throw result.error;
      await refresh();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      busy.current.delete(id);
    }
  }
  return { ready, hearts, typing, error, toggleHeart, onTyping, stopTyping };
}
