"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="login-screen">
      <div className="login-card">
        <span className="brand-sun">✳</span>
        <h1>Se nos enredó un hilito.</h1>
        <p>
          No pudimos abrir esta parte del rincón. Tus cosas guardadas siguen en
          su lugar.
        </p>
        <button className="primary" onClick={reset}>
          Volver a intentarlo
        </button>
      </div>
    </main>
  );
}
