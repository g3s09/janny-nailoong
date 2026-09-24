import LoginForm from "./LoginForm";
export default function Login() {
  return (
    <main className="login-screen">
      <div className="login-card">
        <span className="brand-sun">✳</span>
        <p className="eyebrow">EL RINCÓN DE JANNY</p>
        <h1>Qué gusto que volviste.</h1>
        <p>Entra con tu correo y contraseña.</p>
        <LoginForm />
        <p className="handwritten">Te dejé esto con mucho cariño. — Gela</p>
      </div>
    </main>
  );
}
