// src/components/SearchPage.js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "./SearchPage.module.css";
import { useSearch } from "../hooks/useSearch";
import { useGlobalSummary } from "../hooks/useGlobalSummary";
import SearchResultsTable from "./SearchResultsTable";
import GlobalSummaryDisplay from "./GlobalSummaryDisplay";

function SummaryTable({ summary, total }) {
  return (
    <table className={styles.summaryTable}>
      <thead>
        <tr>
          <th className={styles.summaryTableTh}>Código</th>
          <th className={styles.summaryTableTh}>Registros</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(summary).map(([codigo, count]) => (
          <tr key={codigo}>
            <td className={styles.summaryTableTd}>{codigo}</td>
            <td className={styles.summaryTableTd}>{count}</td>
          </tr>
        ))}
      </tbody>
      <tfoot>
        <tr className={styles.totalRow}>
          <td className={styles.summaryTableTd}>Total</td>
          <td className={styles.summaryTableTd}>{total}</td>
        </tr>
      </tfoot>
    </table>
  );
}

export default function SearchPage({ onLogout }) {
  const [term, setTerm] = useState("");
  const [fechaActual, setFechaActual] = useState("");
  const [usuarioEmail, setUsuarioEmail] = useState("");
  const [busquedaRegistrada, setBusquedaRegistrada] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);

  const {
    results,
    loading,
    error,
    codigoCount,
    summaryData,
    executeSearch,
  } = useSearch();

  const {
    globalSummary,
    globalTotal,
    globalLoading,
    globalError,
    globalLastUpdateDate,
  } = useGlobalSummary();

  useEffect(() => {
    const hoy = new Date().toLocaleDateString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setFechaActual(hoy);
  }, []);

  useEffect(() => {
    const registrarIngreso = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setUsuarioEmail(data.user.email);

        try {
          const { error: insertError } = await supabase.from("accesos").insert([
            {
              usuario_email: data.user.email,
            },
          ]);

          if (insertError) {
            console.error("❌ Error al registrar ingreso:", insertError.message);
          } else {
            console.log("✅ Acceso registrado en Supabase");
          }
        } catch (err) {
          console.error("⚠️ Error inesperado al registrar ingreso:", err);
        }
      }
    };
    registrarIngreso();
  }, []);

  useEffect(() => {
    let warningTimeoutId;
    let logoutTimeoutId;

    const resetTimers = () => {
      clearTimeout(warningTimeoutId);
      clearTimeout(logoutTimeoutId);
      setShowInactivityWarning(false);

      warningTimeoutId = setTimeout(() => {
        setShowInactivityWarning(true);
      }, 90 * 1000);

      logoutTimeoutId = setTimeout(() => {
        console.log("⏳ Sesión cerrada por inactividad");
        supabase.auth.signOut().then(() => {
          onLogout();
        });
      }, 2 * 60 * 1000);
    };

    const eventos = ["mousemove", "keydown", "scroll", "click"];
    eventos.forEach((evento) => window.addEventListener(evento, resetTimers));

    resetTimers();

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, resetTimers));
      clearTimeout(warningTimeoutId);
      clearTimeout(logoutTimeoutId);
    };
  }, [onLogout]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setBusquedaRegistrada(false);
    await executeSearch(term.trim());
  };

  useEffect(() => {
    const registrarBusqueda = async () => {
      if (
        term.trim() !== "" &&
        usuarioEmail &&
        !busquedaRegistrada &&
        (codigoCount > 0 || results.length > 0)
      ) {
        try {
          const { error: insertError } = await supabase.from("busquedas").insert([
            {
              usuario_email: usuarioEmail,
              criterio: term.trim(),
              cantidad_resultados: codigoCount,
            },
          ]);

          if (insertError) {
            console.error("❌ Error al registrar búsqueda:", insertError.message);
          } else {
            console.log("✅ Búsqueda registrada en Supabase");
            setBusquedaRegistrada(true);
          }
        } catch (err) {
          console.error("⚠️ Error inesperado al registrar búsqueda:", err);
        }
      }
    };

    registrarBusqueda();
  }, [codigoCount, busquedaRegistrada, term, usuarioEmail, results.length]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className={styles.container}>
      {showInactivityWarning && (
        <div className={styles.inactivityWarning}>
          <p>Tu sesión se cerrará en 30 segundos por inactividad.</p>
          <p>Mueve el mouse o presiona una tecla para continuar.</p>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Buscar en Listas Especiales</h2>
          <p className={styles.updateDateText}>
            Base de datos actualizada al: <strong>{globalLastUpdateDate || "Cargando..."}</strong>
          </p>
        </div>
        <div className={styles.headerRight}>
          <p className={styles.currentDateText}>
            Fecha actual: <strong>{fechaActual}</strong>
          </p>
          <p className={styles.userEmail}>
            Usuario: <strong>{usuarioEmail}</strong>
          </p>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <form onSubmit={handleSearch} className={styles.form}>
        <label htmlFor="searchTerm" style={{ display: "none" }}>
          Término de búsqueda
        </label>
        <input
          id="searchTerm"
          type="text"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Escribe un nombre o apellido..."
          className={styles.searchInput}
          aria-label="Introduce un nombre o apellido para buscar"
        />
        <button type="submit" className={styles.searchButton}>
          Buscar
        </button>
      </form>

      {term.trim() !== "" && (
        <p className={styles.searchTermDisplay}>
          <strong>Criterio de búsqueda:</strong> {term}
        </p>
      )}

      <GlobalSummaryDisplay
        summary={globalSummary}
        total={globalTotal}
        loading={globalLoading}
        error={globalError}
      />

      {results.length > 0 && (
        <div className={styles.summaryTableWrapper}>
          <h3>Coincidencias encontradas</h3>
          <SummaryTable summary={summaryData} total={codigoCount} />
        </div>
      )}

      {loading && <p className={styles.loading}>Buscando coincidencias…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {results.length > 0 && <SearchResultsTable results={results} />}

      {results.length === 0 && term.trim() !== "" && !loading && (
        <p className={styles.noResults}>No se encontraron coincidencias.</p>
      )}
      {results.length === 0 && term.trim() === "" && !loading && !error && (
        <p className={styles.noResults}>
          Ingresa un término de búsqueda para comenzar.
        </p>
      )}
    </div>
  );
}
