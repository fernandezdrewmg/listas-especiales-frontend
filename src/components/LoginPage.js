import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const { data } = supabase.storage
      .from("logos_clientes")
      .getPublicUrl("ris3.jpg");

    if (data?.publicUrl) {
      setLogoUrl(data.publicUrl);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        console.error("❌ Error de autenticación:", authError);
        setError("Correo o contraseña incorrectos.");
        setLoading(false);
        return;
      }

      // En la web ya tienes la lógica en App.js que vuelve a leer la sesión
      if (onLogin) onLogin();
    } catch (err) {
      console.error("Error inesperado en login:", err);
      setError("Ocurrió un error al intentar iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        margin: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #1a365d 0%, #2b6cb0 50%, #2f855a 100%)",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 380,
          backgroundColor: "rgba(255,255,255,0.96)",
          borderRadius: 12,
          boxShadow: "0 18px 45px rgba(0,0,0,0.35)",
          padding: "28px 30px 26px",
          border: "1px solid rgba(255,255,255,0.4)",
          backdropFilter: "blur(6px)",
        }}
      >
        {logoUrl && (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 12,
            }}
          >
            <img
              src={logoUrl}
              alt="Logo aplicación"
              style={{
                maxWidth: 72,
                maxHeight: 72,
                objectFit: "contain",
              }}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </div>
        )}

        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 600,
              color: "#1a202c",
            }}
          >
            Listas Especiales
          </h1>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: 13,
              color: "#4a5568",
            }}
          >
            Accede para consultar listas especiales y reportes.
          </p>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 12,
              padding: "8px 10px",
              borderRadius: 6,
              fontSize: 13,
              color: "#742a2a",
              backgroundColor: "#fed7d7",
              border: "1px solid #feb2b2",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 14 }}>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: 4,
                fontSize: 13,
                fontWeight: 500,
                color: "#2d3748",
              }}
            >
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 10px",
                borderRadius: 6,
                border: "1px solid #cbd5e0",
                fontSize: 14,
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3182ce";
                e.target.style.boxShadow = "0 0 0 1px #3182ce33";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: 4,
                fontSize: 13,
                fontWeight: 500,
                color: "#2d3748",
              }}
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "9px 10px",
                borderRadius: 6,
                border: "1px solid #cbd5e0",
                fontSize: 14,
                outline: "none",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#3182ce";
                e.target.style.boxShadow = "0 0 0 1px #3182ce33";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#cbd5e0";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "9px 10px",
              borderRadius: 6,
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "default" : "pointer",
              color: "#fff",
              background:
                "linear-gradient(135deg, #3182ce 0%, #2b6cb0 40%, #2f855a 100%)",
              boxShadow: "0 8px 20px rgba(49,130,206,0.45)",
              opacity: loading ? 0.8 : 1,
            }}
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        <div
          style={{
            marginTop: 14,
            fontSize: 11,
            color: "#a0aec0",
            textAlign: "center",
          }}
        >
          Sesión protegida. Se requiere conexión a internet para validar acceso.
        </div>
      </div>
    </div>
  );
}
