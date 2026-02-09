// src/components/SearchResultsTable.js
import React from "react";
import styles from "./SearchPage.module.css";

const formatHeader = (key) => {
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
    <div className={styles.tableResponsive}>
      <table className={styles.resultsTable}>
        <thead>
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className={styles.resultsTableTh}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((row, index) => (
            <tr key={index}>
              {fieldsToShow.map((field) => {
                const value = row[field];
                return (
                  <td
                    key={field}
                    className={styles.resultsTableTd}
                  >
                    {field === "relevancia"
                      ? mostrarRelevancia(value)
                      : field === "campo_coincidencia"
                      ? value || "-"
                      : value !== null && value !== undefined
                      ? String(value)
                      : "-"}
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
