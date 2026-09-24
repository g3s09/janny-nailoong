"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="login-screen">
      <div className="login-card">
        <span className="brand-sun">✳</span>
        <h1>Esto no cargó bien.</h1>
        <p>
          Intenta abrirlo otra vez en un momento.
        </p>
        <button className="primary" onClick={reset}>
          Volver a intentarlo
        </button>
      </div>
    </main>
  );
}
