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
        setError("Correo o contraseña incorrectos.");
        return;
      }

      if (onLogin) onLogin();
    } catch (err) {
      setError("Ocurrió un error al intentar iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  // ===== Estilos reutilizables =====

  const inputStyle = {
    width: "100%",
    padding: "11px 12px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    fontSize: 14,
    outline: "none",
    transition: "all 0.2s ease",
    backgroundColor: "#f9fafb",
  };

  const labelStyle = {
    fontSize: 13,
    fontWeight: 500,
    color: "#334155",
    marginBottom: 6,
    display: "block",
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #1e293b 0%, #1d4ed8 50%, #0f766e 100%)",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div
        style={{
          width: 400,
          background: "rgba(255,255,255,0.97)",
          borderRadius: 16,
          padding: "40px 36px",
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          backdropFilter: "blur(8px)",
        }}
      >
        {/* Logo centrado */}
        {logoUrl && (
          <div style={{ textAlign: "center", marginBottom: 18 }}>
            <img
              src={logoUrl}
              alt="Logo aplicación"
              style={{
                maxWidth: 90,
                objectFit: "contain",
                opacity: 0.9,
              }}
            />
          </div>
        )}

        {/* Título */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 600,
              color: "#0f172a",
            }}
          >
            Listas Especiales
          </h1>
          <p
            style={{
              marginTop: 6,
              fontSize: 13,
              color: "#64748b",
            }}
          >
            Acceso a consultas y reportes
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 12px",
              borderRadius: 8,
              fontSize: 13,
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #fecaca",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: 18 }}>
            <label htmlFor="email" style={labelStyle}>
              Correo
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563eb";
                e.target.style.boxShadow =
                  "0 0 0 3px rgba(37,99,235,0.15)";
                e.target.style.backgroundColor = "#ffffff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
                e.target.style.backgroundColor = "#f9fafb";
              }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="password" style={labelStyle}>
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={inputStyle}
              onFocus={(e) => {
                e.target.style.borderColor = "#2563eb";
                e.target.style.boxShadow =
                  "0 0 0 3px rgba(37,99,235,0.15)";
                e.target.style.backgroundColor = "#ffffff";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#e2e8f0";
                e.target.style.boxShadow = "none";
                e.target.style.backgroundColor = "#f9fafb";
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: 10,
              border: "none",
              fontSize: 14,
              fontWeight: 600,
              letterSpacing: 0.4,
              cursor: loading ? "default" : "pointer",
              color: "#fff",
              background:
                "linear-gradient(135deg, #2563eb 0%, #1d4ed8 50%, #0f766e 100%)",
              boxShadow: "0 8px 20px rgba(37,99,235,0.35)",
              transition: "all 0.2s ease",
              opacity: loading ? 0.8 : 1,
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = "translateY(-1px)";
                e.target.style.boxShadow =
                  "0 12px 25px rgba(37,99,235,0.4)";
              }
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow =
                "0 8px 20px rgba(37,99,235,0.35)";
            }}
          >
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>

        <div
          style={{
            marginTop: 18,
            fontSize: 12,
            color: "#94a3b8",
            textAlign: "center",
          }}
        >
          🔒 Autenticación segura
        </div>
      </div>
    </div>
  );
}