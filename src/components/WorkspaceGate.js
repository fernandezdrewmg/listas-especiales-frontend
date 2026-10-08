import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import SearchPage from "./SearchPage";
import styles from "./SearchPage.module.css";
export default function WorkspaceGate({ onLogout }) {
  const [state, setState] = useState("loading");
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user?.email) throw new Error("session");
        const exactEmail = data.user.email.replace(/[\\%_]/g, "\\$&");
        const { data: profile, error: profileError } = await supabase
          .from("usuarios")
          .select('cliente, logo_cliente, "Reporte"')
          .ilike("email", exactEmail)
          .single();
        if (active) setState(!profileError && profile ? "allowed" : "denied");
      } catch {
        if (active) setState("denied");
      }
    })();
    return () => {
      active = false;
    };
  }, []);
  if (state === "allowed") return <SearchPage onLogout={onLogout} />;
  return (
    <main className={styles.emptyState} style={{ minHeight: "100vh" }}>
      {state === "loading" ? (
        <>
          <span className={styles.spinner} />
          <h2>Validando acceso</h2>
        </>
      ) : (
        <>
          <h2>Acceso no disponible</h2>
          <p>
            No se pudo validar el perfil de su entidad. Contacte al
            administrador.
          </p>
          <button className={styles.primaryButton} onClick={onLogout}>
            Volver al ingreso
          </button>
        </>
      )}
    </main>
  );
}
