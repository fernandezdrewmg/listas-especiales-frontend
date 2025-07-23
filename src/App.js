// src/App.js
// src/App.js
import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import LoginPage from "./components/LoginPage";
import SearchPage from "./components/SearchPage";

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true); // indicador para evitar cambio de vista inmediato

  useEffect(() => {
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Error obteniendo sesión:", error.message);
        setSession(null);
      } else {
        setSession(data?.session || null);
      }
      setLoading(false);
    };

    checkSession();

    // Escuchar cambios de sesión en tiempo real
    const { data: listener } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    supabase.auth.signOut();  // limpia sesión en Supabase
    setSession(null);         // actualiza estado local
  };

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data?.session) {
      setSession(null);
    } else {
      setSession(data.session);
    }
  };

  if (loading) return <p style={{ textAlign: "center", marginTop: 40 }}>Validando sesión…</p>;

  return session
    ? <SearchPage onLogout={handleLogout} />
    : <LoginPage onLogin={handleLogin} />;
}

export default App;

