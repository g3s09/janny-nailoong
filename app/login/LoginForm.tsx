"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { browserDb, configured } from "@/lib/supabase/client";
import { useSubmitLock } from "@/lib/use-submit-lock";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [recover, setRecover] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { busy, acquire, release } = useSubmitLock();
  useEffect(() => {
    if (!configured) return;
    const params = new URLSearchParams(window.location.search);
    const fragment = new URLSearchParams(window.location.hash.slice(1));
    const setupPassword = ["recovery", "invite"].includes(
      fragment.get("type") ?? "",
    );
    if (params.has("expired") || fragment.has("error"))
      queueMicrotask(() =>
        setError(
          "El enlace ya venció. Puedes entrar con tu contraseña o solicitar uno nuevo para recuperarla.",
        ),
      );
    if (params.has("restricted")) {
      queueMicrotask(() =>
        setError("Esta cuenta todavía no tiene acceso a este rincón."),
      );
      return;
    }
    let active = true;
    const {
      data: { subscription },
    } = browserDb().auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (
          !active ||
          !session ||
          !["SIGNED_IN", "INITIAL_SESSION", "PASSWORD_RECOVERY"].includes(event)
        )
          return;
        window.history.replaceState(null, "", window.location.pathname);
        router.replace(
          event === "PASSWORD_RECOVERY" || setupPassword ? "/password" : "/",
        );
        router.refresh();
      },
    );
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!acquire()) return;
    setError("");
    try {
      if (recover) {
        const { error } = await browserDb().auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo: `${window.location.origin}/auth/callback` },
        );
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await browserDb().auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) throw error;
        setPassword("");
        router.replace("/");
        router.refresh();
      }
    } catch {
      setError(
        recover
          ? "No pudimos solicitar el enlace. Espera un momento y vuelve a intentarlo."
          : "No pudimos entrar. Revisa tu correo y contraseña; si aún no tienes una, usa «Crear o recuperar contraseña».",
      );
    } finally {
      release();
    }
  }
  if (!configured)
    return (
      <div className="setup-notice">
        <h2>Estamos preparando tu acceso.</h2>
        <p>El rincón permanece cerrado hasta completar la conexión privada.</p>
      </div>
    );
  return (
    <form className="stack-form" onSubmit={submit}>
      <fieldset className="form-fields" disabled={busy}>
        <label htmlFor="email">Tu correo</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
        />
        {!recover && (
          <>
            <label htmlFor="password">Tu contraseña</label>
            <div className="password-field">
              <input
                id="password"
                type={visible ? "text" : "password"}
                autoComplete="current-password"
                required
                maxLength={128}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="text-button"
                aria-controls="password"
                aria-pressed={visible}
                onClick={() => setVisible((v) => !v)}
              >
                {visible ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </>
        )}
        {sent && (
          <p role="status" className="success-note">
            Si este correo tiene acceso, recibirás un enlace para elegir tu
            contraseña. Ábrelo en este mismo navegador y revisa también el
            correo no deseado.
          </p>
        )}
        <button className="primary" disabled={busy || (recover && sent)}>
          {busy
            ? "Un momento…"
            : recover
              ? "Recibir enlace para mi contraseña"
              : "Entrar a mi rincón"}
        </button>
        <button
          type="button"
          className="text-button"
          onClick={() => {
            setRecover((v) => !v);
            setSent(false);
            setError("");
            setPassword("");
          }}
        >
          {recover
            ? "Volver a entrar con contraseña"
            : "Crear o recuperar contraseña"}
        </button>
      </fieldset>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <p className="privacy-note">
        Solo las cuentas invitadas pueden entrar. No necesitas un enlace para
        cada visita.
      </p>
      <p className="privacy-note">
        La sesión se conserva en tu dispositivo. Si cierras sesión, puedes
        volver con tu correo y contraseña.
      </p>
    </form>
  );
}
