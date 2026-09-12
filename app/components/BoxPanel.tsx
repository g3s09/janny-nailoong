"use client";
import { useState } from "react";
import { MailOpen, Heart } from "lucide-react";
import { useWorld } from "@/lib/world-store";
import { browserDb } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/data";
import type { Letter } from "@/lib/types";
import PrivateMedia from "./PrivateMedia";
export default function BoxPanel() {
  const { data, preview, localUpdate, refresh, sound, say } = useWorld();
  const [opened, setOpened] = useState<Letter | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function open(letter: Letter) {
    setBusy(true);
    setError("");
    try {
      if (preview)
        localUpdate((s) => ({
          ...s,
          open_when: s.open_when.map((l) =>
            l.id === letter.id
              ? { ...l, opened_at: l.opened_at ?? new Date().toISOString() }
              : l,
          ),
        }));
      else {
        const { error } = await browserDb().rpc("open_letter", {
          letter: letter.id,
        });
        if (error) throw new Error(error.message);
        await refresh();
      }
      setOpened(letter);
      sound("letter");
      say("Esta estaba esperando el momento de acompañarte.", "hug");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {opened ? (
        <article className="open-letter">
          <button className="text-button" onClick={() => setOpened(null)}>
            ← Volver a la caja
          </button>
          <Heart size={28} />
          <h3>Ábrelo cuando {opened.title}</h3>
          <p className="letter-text">{opened.body}</p>
          {opened.attachment && (
            <PrivateMedia path={opened.attachment} alt={opened.title} />
          )}{" "}
          {opened.audio && <PrivateMedia path={opened.audio} type="audio" />}
          <p className="signature">Con cariño, Gela.</p>
        </article>
      ) : (
        <>
          {!data.open_when.length ? (
            <div className="empty-state">
              <MailOpen size={38} />
              <h3>Para el momento justo.</h3>
              <p>
                Las cartas que Gela deje aquí te esperarán sin prisa. Aún no hay
                ninguna.
              </p>
            </div>
          ) : (
            <div className="envelope-grid">
              {data.open_when.map((l) => (
                <button
                  className="envelope"
                  key={l.id}
                  disabled={busy || (l.once && !!l.opened_at)}
                  onClick={() => void open(l)}
                >
                  <span>ÁBRELO CUANDO…</span>
                  <strong>{l.title}</strong>
                  <Heart size={18} />
                  <small>
                    {l.once && l.opened_at
                      ? "Ya fue abierta · guardada en tu historia"
                      : l.opened_at
                        ? "Siempre puedes volver"
                        : "Una carta para ti"}
                  </small>
                </button>
              ))}
            </div>
          )}
          <p className="muted">
            Las cartas de una sola apertura se leen al abrirlas y después quedan
            cerradas. Las demás puedes releerlas siempre.
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </>
  );
}
