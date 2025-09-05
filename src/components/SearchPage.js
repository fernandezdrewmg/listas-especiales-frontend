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
    const obtenerUsuario = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setUsuarioEmail(data.user.email);
      }
    };
    obtenerUsuario();
  }, []);

  useEffect(() => {
    let timeoutId;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("⏳ Sesión cerrada por inactividad");
        supabase.auth.signOut().then(() => {
          onLogout();
        });
      }, 2 * 60 * 1000); // 2 minutos
    };

    const eventos = ["mousemove", "keydown", "scroll", "click"];
    eventos.forEach((evento) => window.addEventListener(evento, resetTimer));
    resetTimer();

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, resetTimer));
      clearTimeout(timeoutId);
    };
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    await executeSearch(term.trim());
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className={styles.container}>
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


// Nota: El componente SummaryTable se ha movido fuera del export default
// para que pueda ser utilizado internamente si está en el mismo archivo.
// Si SummaryTable está en un archivo separado, no es necesario hacer esto.
// Tu código original ya lo tiene bien separado si está en otro archivo.
