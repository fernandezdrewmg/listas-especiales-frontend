// src/App.js
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import LoginPage from "./components/LoginPage";
import WorkspaceGate from "./components/WorkspaceGate";
import styles from "./components/SearchPage.module.css";

function LoadingScreen() {
  return (
    <div
      className={styles.emptyState}
      style={{ minHeight: "100vh" }}
      role="status"
    >
      <span className={styles.spinner} />
      <h2>Validando sesión</h2>
      <p>Estamos preparando su espacio de trabajo.</p>
    </div>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [recovery, setRecovery] = useState(
    () =>
      window.sessionStorage.getItem("listas-recovery") === "true" ||
      new URLSearchParams(window.location.hash.slice(1)).get("type") ===
        "recovery",
  );
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
      (event, currentSession) => {
        if (event === "PASSWORD_RECOVERY") {
          window.sessionStorage.setItem("listas-recovery", "true");
          setRecovery(true);
        }
        if (event === "SIGNED_OUT") {
          window.sessionStorage.removeItem("listas-recovery");
          setRecovery(false);
        }
        if (isActive) {
          setSession(currentSession || null);
        }
      },
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
      setRecovery(false);
      window.sessionStorage.removeItem("listas-recovery");
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

  return recovery ? (
    <LoginPage recoveryMode onPasswordChanged={handleLogout} />
  ) : session ? (
    <WorkspaceGate key={session.user?.id} onLogout={handleLogout} />
  ) : (
    <LoginPage onLogin={handleLogin} />
  );
}

export default App;
