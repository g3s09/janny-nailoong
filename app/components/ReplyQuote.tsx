"use client";
import { useEffect, useState } from "react";
import { browserDb } from "@/lib/supabase/client";
import type { Message } from "@/lib/types";
export default function ReplyQuote({
  id,
  messages,
  preview,
}: {
  id: string;
  messages: Message[];
  preview: boolean;
}) {
  const known = messages.find((message) => message.id === id);
  const [fetched, setFetched] = useState<{ id: string; body: string } | null>(
    null,
  );
  useEffect(() => {
    if (known || preview) return;
    let live = true;
    void browserDb()
      .from("messages")
      .select("id,body")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }: { data: { id: string; body: string } | null }) => {
        if (live) setFetched(data ?? { id, body: "Mensaje no disponible" });
      });
    return () => {
      live = false;
    };
  }, [known, id, preview]);
  const body = known?.body ?? (fetched?.id === id ? fetched.body : "…");
  return (
    <blockquote className="reply-quote">{body || "Imagen o audio"}</blockquote>
  );
}
