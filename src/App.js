// src/App.js
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import LoginPage from "./components/LoginPage";
import SearchPage from "./components/SearchPage";

function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(circle at top, #eef4ff 0, #f8fafc 45%, #e5e7eb 100%)",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          width: "min(420px, 90%)",
          padding: "30px 28px",
          borderRadius: 22,
          background: "rgba(255, 255, 255, 0.92)",
          boxShadow: "0 22px 55px rgba(15, 23, 42, 0.14)",
          border: "1px solid rgba(148, 163, 184, 0.35)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            margin: "0 auto 16px",
            borderRadius: "50%",
            border: "4px solid #dbeafe",
            borderTopColor: "#1e3a5f",
            animation: "spin 0.9s linear infinite",
          }}
        />

        <h2
          style={{
            margin: "0 0 8px",
            fontSize: 20,
            color: "#0f172a",
            fontWeight: 800,
          }}
        >
          Validando sesión
        </h2>

        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: "#64748b",
            lineHeight: 1.5,
          }}
        >
          Estamos verificando sus credenciales de acceso. Espere un momento.
        </p>

        <style>
          {`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!isActive) return;

        if (error) {
          console.error("Error obteniendo sesión:", error.message);
          setSession(null);
        } else {
          setSession(data?.session || null);
        }
      } catch (err) {
        console.error("Error inesperado al validar sesión:", err);

        if (isActive) {
          setSession(null);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (isActive) {
          setSession(currentSession || null);
        }
      }
    );

    return () => {
      isActive = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Error al cerrar sesión:", err);
    } finally {
      setSession(null);
    }
  };

  const handleLogin = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error || !data?.session) {
        setSession(null);
      } else {
        setSession(data.session);
      }
    } catch (err) {
      console.error("Error al obtener sesión después del login:", err);
      setSession(null);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return session ? (
    <SearchPage onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}

export default App;