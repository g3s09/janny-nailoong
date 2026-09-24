import LoginForm from "./LoginForm";
export default function Login() {
  return (
    <main className="login-screen">
      <div className="login-card">
        <span className="brand-sun">✳</span>
        <p className="eyebrow">EL RINCÓN DE JANNY</p>
        <h1>Tu lugar sigue aquí.</h1>
        <p>Tu correo, tu contraseña y un ratito para ti.</p>
        <LoginForm />
        <p className="handwritten">Hay alguien esperando saludarte.</p>
      </div>
    </main>
  );
}
