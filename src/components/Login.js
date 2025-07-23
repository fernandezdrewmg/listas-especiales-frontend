import { useState } from "react";
import { auth } from "../firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("🍃 handleSubmit iniciado", { email, password });
  setError("");

  if (!email || !password) {
    console.log("⚠️ Faltan campos");
    setError("Debes completar ambos campos.");
    return;
  }

  try {
    console.log("🔐 Intentando signInWithEmailAndPassword…");
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("✅ signIn exitoso", userCredential.user);
    onLoginSuccess(userCredential.user);
  } catch (err) {
    console.error("❌ Error en signIn:", err);
    setError("Correo o contraseña inválidos.");
  }
};


  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 20 }}>
      <h2>Iniciar sesión</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Correo electrónico</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="usuario@ejemplo.com"
          />
        </div>
        <div style={{ marginTop: 12 }}>
          <label>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        <button type="submit" style={{ marginTop: 16 }}>
          Entrar
        </button>
      </form>
    </div>
  );
}

