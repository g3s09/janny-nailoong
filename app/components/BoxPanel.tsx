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
      say("Gela me encargó este sobre. Te lo doy sin miguitas, prometido.", "hug");
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      {opened ? (
        <article className="open-letter section-reveal">
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
              <h3>Tengo cosas que quiero decirte.</h3>
              <p>
                Todavía no te he dejado una carta aquí, Janny. Mientras, escríbeme; me va a dar gusto leerte.
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
                      ? "Ya la abriste · una sola lectura"
                      : l.opened_at
                        ? "Léeme otra vez si quieres"
                        : l.once
                          ? "De mí, para ti · una sola lectura"
                          : "De mí, para ti ♡"}
                  </small>
                </button>
              ))}
            </div>
          )}
          {data.open_when.some((letter) => letter.once) && <p className="muted">
            Si un sobre dice «una sola lectura», léelo antes de cerrarlo. Los demás puedes abrirlos cuantas veces quieras.
          </p>}
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
