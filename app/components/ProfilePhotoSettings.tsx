"use client";
import { useState } from "react";
import { useWorld } from "@/lib/world-store";
import { uploadFile, friendlyError } from "@/lib/data";
import { browserDb } from "@/lib/supabase/client";
import { useSubmitLock } from "@/lib/use-submit-lock";
import ProfileAvatar from "./ProfileAvatar";
export default function ProfilePhotoSettings() {
  const { profile, data, preview, refresh } = useWorld();
  const { busy, acquire, release } = useSubmitLock();
  const [error, setError] = useState("");
  const current =
    data.profiles.find((person) => person.id === profile.id) ?? profile;
  async function change(file: File | null) {
    if (preview || !acquire()) return;
    setError("");
    try {
      if (
        file &&
        !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
          file.type,
        )
      )
        throw new Error("Elige una foto JPG, PNG, WebP o GIF.");
      const path = file ? await uploadFile(file, profile.id) : null;
      const result = await browserDb().rpc("set_profile_avatar", {
        file_path: path,
      });
      if (result.error) throw result.error;
      await refresh(["profiles"]);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      release();
    }
  }
  return (
    <section className="profile-photo-settings">
      <ProfileAvatar name={current.name} path={current.avatar_path} />
      <label className="secondary photo-picker">
        {busy ? "Guardando…" : "Mi foto"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          disabled={busy || preview}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void change(file);
          }}
        />
      </label>
      {current.avatar_path && (
        <button
          className="text-button"
          disabled={busy || preview}
          onClick={() => void change(null)}
        >
          Quitar foto
        </button>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
