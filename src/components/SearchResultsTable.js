// src/components/SearchResultsTable.js
import React from "react";
import styles from "./SearchPage.module.css";

const formatHeader = (key) => {
  // Mapeo de snake_case a nombres legibles
  const headerMap = {
    nombre_completo: "Nombre Completo",
    relevancia: "Relevancia",
    campo_coincidencia: "Coincide En",
    pep_asociado: "PEP Asociado",
    codigo: "Código",
    nro_documento: "Nro. Documento",
    pais: "País",
    cargo: "Cargo",
    entidad: "Entidad",
    justificacion: "Justificación",
    detalle_all: "Detalle Fam",
    profesion: "Profesión",
    alias: "Alias",
    fecha_reporte: "Fecha Reporte",
  };

  return headerMap[key] || key;
};

const mostrarRelevancia = (relevancia) => {
  if (relevancia === 3) return "⭐⭐⭐ Ambos";
  if (relevancia === 2) return "⭐⭐ Nombre";
  if (relevancia === 1) return "⭐ Alias";
  return "-";
};

function SearchResultsTable({ results }) {
  if (!results || results.length === 0) {
    return null;
  }

  // IMPORTANTE: Usa los nombres EXACTOS que retorna la RPC
  const fieldsToShow = [
    "nombre_completo",
    "relevancia",
    "campo_coincidencia",
    "pep_asociado",
    "codigo",
    "nro_documento",
    "pais",
    "cargo",
    "entidad",
    "justificacion",
    "detalle_all",
    "profesion",
    "alias",
  ];

  const headers = fieldsToShow.map(formatHeader);

  return (
    <div className={styles.searchResultsContainer}>
      <h3>Detalle de Coincidencias (Ordenadas por Relevancia)</h3>
      <table className={styles.resultsTable}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={`header-${index}`} className={styles.resultsTableTh}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((item, rowIndex) => (
            <tr key={`row-${rowIndex}`}>
              {fieldsToShow.map((field, cellIndex) => {
                const value = item[field];
                
                return (
                  <td
                    key={`cell-${rowIndex}-${cellIndex}`}
                    className={styles.resultsTableTd}
                  >
                    {field === "relevancia" ? (
                      <span style={{ fontWeight: "bold", color: "#2c5282" }}>
                        {mostrarRelevancia(value)}
                      </span>
                    ) : field === "campo_coincidencia" ? (
                      <span style={{ fontSize: "0.85em", color: "#666" }}>
                        {value || "-"}
                      </span>
                    ) : value !== null && value !== undefined ? (
                      String(value)
                    ) : (
                      "-"
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SearchResultsTable;
