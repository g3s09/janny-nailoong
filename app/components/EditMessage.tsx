"use client";
import { useState } from "react";
import type { Message } from "@/lib/types";
import { browserDb } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/data";
import { useSubmitLock } from "@/lib/use-submit-lock";
export default function EditMessage({
  message,
  onSave,
  onCancel,
}: {
  message: Message;
  onSave: (message: Message) => void;
  onCancel: () => void;
}) {
  const [body, setBody] = useState(message.body);
  const [error, setError] = useState("");
  const { busy, acquire, release } = useSubmitLock();
  async function save() {
    if (!acquire()) return;
    setError("");
    try {
      const { data, error } = await browserDb().rpc("edit_chat_message", {
        message: message.id,
        new_body: body,
        expected_body: message.body,
      });
      if (error) throw error;
      onSave(data as Message);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      release();
    }
  }
  return (
    <div className="message-editor">
      <textarea
        aria-label="Editar mensaje"
        rows={3}
        maxLength={10000}
        value={body}
        disabled={busy}
        onChange={(event) => setBody(event.target.value)}
      />
      <div>
        <button
          className="text-button"
          disabled={busy || (!body.trim() && !message.attachment)}
          onClick={() => void save()}
        >
          {busy ? "Guardando…" : "Guardar"}
        </button>
        <button className="text-button" disabled={busy} onClick={onCancel}>
          Cancelar
        </button>
      </div>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
    </div>
  );
}
