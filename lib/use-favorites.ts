"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { browserDb } from "./supabase/client";
import { friendlyError } from "./data";
export function useFavorites(profileId: string, preview: boolean, ids: string) {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [error, setError] = useState("");
  const locked = useRef(new Set<string>());
  const refresh = useCallback(async () => {
    if (preview || !ids) return;
    const keys = ids.split(",");
    const rows: string[] = [];
    for (let i = 0; i < keys.length; i += 80) {
      const { data, error } = await browserDb()
        .from("message_favorites")
        .select("message_id")
        .eq("profile_id", profileId)
        .in("message_id", keys.slice(i, i + 80));
      if (error) return;
      rows.push(...data.map((row: { message_id: string }) => row.message_id));
    }
    setFavorites(rows);
  }, [profileId, preview, ids]);
  useEffect(() => {
    const timer = setTimeout(() => void refresh(), 0);
    return () => clearTimeout(timer);
  }, [refresh]);
  async function toggle(id: string) {
    if (preview || locked.current.has(id)) return;
    locked.current.add(id);
    setError("");
    try {
      const own = favorites.includes(id);
      const result = own
        ? await browserDb()
            .from("message_favorites")
            .delete()
            .eq("profile_id", profileId)
            .eq("message_id", id)
        : await browserDb()
            .from("message_favorites")
            .insert({ profile_id: profileId, message_id: id });
      if (result.error && result.error.code !== "23505") throw result.error;
      await refresh();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      locked.current.delete(id);
    }
  }
  return { favorites, error, toggle };
}
