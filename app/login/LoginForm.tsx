"use client";
import { useState } from "react";
import { browserDb, configured } from "@/lib/supabase/client";
export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
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
