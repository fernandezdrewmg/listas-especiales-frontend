// src/App.js
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import LoginPage from "./components/LoginPage";
import SearchPage from "./components/SearchPage";
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
