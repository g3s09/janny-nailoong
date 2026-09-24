"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { browserDb, configured } from "@/lib/supabase/client";
import { useSubmitLock } from "@/lib/use-submit-lock";
import type { UserResponse } from "@supabase/supabase-js";

export default function PasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState("");
  const { busy, acquire, release } = useSubmitLock();
  useEffect(() => {
    let active = true;
    if (!configured) return;
    void browserDb()
      .auth.getUser()
      .then(({ data, error }: UserResponse) => {
        if (!active) return;
        if (error || !data.user)
          setError(
            "Abre tu enlace de recuperación o inicia sesión antes de elegir una contraseña.",
          );
        else setReady(true);
      })
      .catch(() => {
        if (active)
          setError(
            "No pudimos conectar. Vuelve a abrir esta página cuando tengas conexión.",
          );
      });
    return () => {
      active = false;
    };
  }, []);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || !acquire()) return;
    setError("");
    try {
      if (password.length < 12 || password.length > 128)
        throw new Error(
          "Usa entre 12 y 128 caracteres. Una frase con varias palabras es fácil de recordar.",
        );
      if (password !== confirmation)
        throw new Error("Las dos contraseñas deben coincidir.");
      const { error } = await browserDb().auth.updateUser({ password });
      if (error)
        throw new Error(
          "No pudimos guardar la contraseña. Prueba otra frase o pide un enlace nuevo si tu sesión venció.",
        );
      setPassword("");
      setConfirmation("");
      router.replace("/");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "No se pudo guardar la contraseña.",
      );
    } finally {
      release();
    }
  }
  return (
    <main className="login-screen">
      <div className="login-card">
        <span className="brand-sun">✳</span>
        <p className="eyebrow">TU ACCESO PERSONAL</p>
        <h1>Una llave que puedas recordar.</h1>
        <p>
          Elige una frase con varias palabras. Solo la necesitarás cuando
          vuelvas a iniciar sesión.
        </p>
        <form className="stack-form" onSubmit={save}>
          <fieldset className="form-fields" disabled={!ready || busy}>
            <label htmlFor="new-password">Nueva contraseña</label>
            <input
              id="new-password"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <label htmlFor="confirm-password">Repite tu contraseña</label>
            <input
              id="confirm-password"
              type={visible ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
            />
            <button
              type="button"
              className="text-button"
              aria-pressed={visible}
              onClick={() => setVisible((v) => !v)}
            >
              {visible ? "Ocultar contraseñas" : "Mostrar contraseñas"}
            </button>
            <button className="primary" disabled={!ready || busy}>
              {busy ? "Guardando…" : "Guardar mi contraseña"}
            </button>
          </fieldset>
          {error && (
            <p className="error-text" role="alert">
              {error}
            </p>
          )}
        </form>
        <Link className="text-button" href="/login">
          Volver al acceso
        </Link>
      </div>
    </main>
  );
}
