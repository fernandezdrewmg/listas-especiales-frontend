// src/components/LoginPage.js
import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Solo login sin verificar estado
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Correo o contraseña incorrectos.");
      return;
    }

    onLogin(); // Avanza a SearchPage
  };

  return (
    <div style={{ maxWidth: 400, margin: "auto", padding: 30, textAlign: "center", backgroundColor: "#fff", borderRadius: 8, boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
      {/* Título de la aplicación */}
      <h1 style={{ color: "#2c5282", marginBottom: "10px", fontSize: "2em", fontWeight: "bold" }}>
        Consulta a listas especiales
      </h1>
      {/* Mensaje de bienvenida */}
      <p style={{ color: "#555", marginBottom: "20px", fontSize: "1.1em" }}>
        Bienvenido
      </p>

      {/* Eliminado el <h2>Iniciar sesión</h2> duplicado/genérico */}

      <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          required
          style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, fontSize: "1em" }}
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Contraseña"
          required
          style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 4, fontSize: "1em" }}
        />
        <button
          type="submit"
          style={{ padding: "10px 15px", background: "#2c5282", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontSize: "1em" }}
        >
          Entrar
        </button>
      </form>
      {error && <p style={{ color: "red", marginTop: 15 }}>{error}</p>}
    </div>
  );
}