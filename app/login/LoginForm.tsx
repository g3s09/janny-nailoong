"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { browserDb, configured } from "@/lib/supabase/client";
export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!configured) return;
    const params = new URLSearchParams(window.location.search);
    if (
      params.has("expired") ||
      new URLSearchParams(window.location.hash.slice(1)).has("error")
    ) {
      queueMicrotask(() =>
        setError(
          "Esta llave ya venció o fue utilizada. Pide una nueva para entrar.",
        ),
      );
    }
    if (params.has("restricted")) {
      queueMicrotask(() =>
        setError(
          "Tu correo todavía no tiene un perfil en este rincón. Estamos preparando tu acceso.",
        ),
      );
      return;
    }
    const db = browserDb();
    let active = true;
    const enter = () => {
      if (!active) return;
      // Remove invitation fragments after Supabase has stored the session.
      window.history.replaceState(null, "", window.location.pathname);
      router.replace("/");
      router.refresh();
    };
    const {
      data: { subscription },
    } = db.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION"))
          enter();
      },
    );
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [router]);
  async function login(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { error } = await browserDb().auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      setSent(true);
    } catch {
      setError(
        "No pudimos enviar la llave. Comprueba que sea el correo invitado e inténtalo de nuevo.",
      );
    } finally {
      setBusy(false);
    }
  }
  if (!configured)
    return (
      <div className="setup-notice">
        <h2>Estamos preparando la llave.</h2>
        <p>
          Falta conectar la cuenta privada de Supabase. El acceso permanece
          cerrado hasta terminar esa configuración.
        </p>
      </div>
    );
  return (
    <form className="stack-form" onSubmit={login}>
      {sent ? (
        <p role="status" className="success-note">
          Si este correo tiene acceso, encontrarás una llave en tu bandeja. Abre
          el enlace en este mismo navegador. Revisa también el correo no
          deseado.
        </p>
      ) : (
        <>
          <label htmlFor="email">Tu correo invitado</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
          <button className="primary" disabled={busy}>
            {busy ? "Preparando tu llave…" : "Recibir mi llave"}
          </button>
        </>
      )}
      {sent && (
        <button
          type="button"
          className="text-button"
          onClick={() => setSent(false)}
        >
          Usar otro correo o volver a intentar
        </button>
      )}
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <p className="privacy-note">
        Solo pueden entrar los dos correos invitados.
      </p>
    </form>
  );
}
