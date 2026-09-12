import Link from "next/link";
export default function NotFound() {
  return (
    <main className="login-screen">
      <div className="login-card">
        <span className="brand-sun">✳</span>
        <h1>Por aquí no era.</h1>
        <p>Nailoong también se pierde a veces. Vamos de vuelta.</p>
        <Link className="primary" href="/">
          Volver al rincón
        </Link>
      </div>
    </main>
  );
}
