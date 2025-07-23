import { useEffect } from "react";
import { supabase } from "./supabaseClient";

export default function AuthTest() {
  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      console.log("Usuario activo:", data?.user);
    });

    supabase.auth.getSession().then(({ data }) => {
      console.log("Sesión actual:", data?.session);
    });
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h2>Test de Sesión Supabase</h2>
      <p>Abre la consola (F12) para ver resultados.</p>
    </div>
  );
}
