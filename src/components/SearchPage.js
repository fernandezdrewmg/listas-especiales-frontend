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
  const [fechaActual, setFechaActual] = useState(""); // Ya estás calculando esto

  const {
    results,
    loading,
    error,
    codigoCount,
    fechaReciente, // Puedes considerar usar esta fecha para algo específico de la búsqueda si la necesitas
    summaryData,
    executeSearch,
  } = useSearch();

  const { globalSummary, globalTotal, globalLoading, globalError, globalLastUpdateDate } =
    useGlobalSummary();

  useEffect(() => {
    // Calcula la fecha actual en el formato deseado
    const hoy = new Date().toLocaleDateString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setFechaActual(hoy);
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
        <div className={styles.headerLeft}> {/* Contenedor para el título y la fecha de actualización global */}
          <h2>Buscar en Listas Especiales</h2>
          {/* ✅ Mostrar la fecha de actualización global aquí */}
          <p className={styles.updateDateText}>
            Base de datos actualizada al: <strong>{globalLastUpdateDate || "Cargando..."}</strong>
          </p>
        </div>
        {/* Aquí va el nuevo div para la fecha actual */}
        <div className={styles.headerRight}> {/* Nuevo contenedor para la fecha actual y el botón de logout */}
          <p className={styles.currentDateText}>
            Fecha actual: <strong>{fechaActual}</strong>
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

      {/* Sección del Resumen Global */}
      <GlobalSummaryDisplay
        summary={globalSummary}
        total={globalTotal}
        loading={globalLoading}
        error={globalError}
        // La fecha global ya no se pasa aquí como prop, se muestra en el header
      />

      {/* Bloque de estadísticas y tabla de resumen de la BÚSQUEDA */}
      {results.length > 0 && (
        <div className={styles.summaryTableWrapper}> {/* Usamos el div contenedor correctamente */}
          <h3>Coincidencias encontradas</h3> {/* Título para la tabla de resumen de búsqueda */}
          <SummaryTable summary={summaryData} total={codigoCount} /> {/* Usamos codigoCount como total de la tabla resumen */}
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