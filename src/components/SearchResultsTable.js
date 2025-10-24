// src/components/SearchResultsTable.js
import React from "react";
import styles from "./SearchPage.module.css"; // Reutilizamos los estilos existentes

// Función auxiliar para formatear los nombres de las cabeceras
const formatHeader = (key) => {
  if (key === "PEPAsociado") return "PEP Asociado";
  if (key === "NroDocumento") return "Nro. Documento";
  //if (key === "JustificacionALL") return "Justificación Ampliada";
  if (key === "DetalleALL") return "Detalle Fam";
  if (key === "NombreCompleto") return "Nombre Completo";
  if (key === "FechaReporte") return "Fecha de Reporte";

  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

function SearchResultsTable({ results }) {
  if (!results || results.length === 0) {
    return null;
  }

  const fieldsToShow = [
    "NombreCompleto",
    "PEPAsociado",
    "Codigo",
    "NroDocumento",
    "Pais",
    "Cargo",
    "Entidad",
    "Justificacion",
    "DetalleALL",
    "Profesion",
  ];

  const headers = fieldsToShow.map(formatHeader);

  return (
    <div className={styles.searchResultsContainer}>
      <h3>Detalle de Coincidencias</h3>
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
              {fieldsToShow.map((field, cellIndex) => (
                <td
                  key={`cell-${rowIndex}-${cellIndex}`}
                  className={styles.resultsTableTd}
                >
                  {item[field] !== null && item[field] !== undefined
                    ? item[field]
                    : "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default SearchResultsTable;
