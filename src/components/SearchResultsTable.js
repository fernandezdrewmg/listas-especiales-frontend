// src/components/SearchResultsTable.js
import React from "react";
import styles from "./SearchPage.module.css";

const formatHeader = (key) => {
  const headerMap = {
    nombre_completo: "Nombre / Denominación",
    relevancia: "Relevancia",
    campo_coincidencia: "Coincidencia",
    pep_asociado: "PEP asociado",
    codigo: "Código / Lista",
    nro_documento: "Documento",
    pais: "País",
    cargo: "Cargo",
    entidad: "Entidad",
    justificacion: "Justificación",
    detalle_all: "Detalle relacionado",
    profesion: "Profesión",
    alias: "Alias",
    fecha_reporte: "Fecha reporte",
  };

  return headerMap[key] || key;
};

const normalizarTexto = (value) => {
  if (value === null || value === undefined) return "-";

  const text = String(value).trim();

  return text || "-";
};

const mostrarRelevancia = (relevancia) => {
  const valor = Number(relevancia);

  if (valor === 3) {
    return {
      label: "Alta",
      detail: "Nombre y alias",
      stars: "●●●",
      color: "#991b1b",
      background: "#fef2f2",
      border: "#fecaca",
    };
  }

  if (valor === 2) {
    return {
      label: "Media",
      detail: "Nombre",
      stars: "●●",
      color: "#92400e",
      background: "#fffbeb",
      border: "#fde68a",
    };
  }

  if (valor === 1) {
    return {
      label: "Referencial",
      detail: "Alias",
      stars: "●",
      color: "#1e3a5f",
      background: "#eff6ff",
      border: "#bfdbfe",
    };
  }

  return {
    label: "N/D",
    detail: "-",
    stars: "○",
    color: "#475569",
    background: "#f8fafc",
    border: "#e2e8f0",
  };
};

const formatCampoCoincidencia = (value) => {
  const text = normalizarTexto(value);

  if (text === "-") return "-";

  const normalized = text.toLowerCase();

  if (normalized.includes("ambos")) return "Nombre y alias";
  if (normalized.includes("nombre")) return "Nombre";
  if (normalized.includes("alias")) return "Alias";

  return text;
};

const formatCellValue = (field, value) => {
  if (field === "campo_coincidencia") {
    return formatCampoCoincidencia(value);
  }

  return normalizarTexto(value);
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
              <th key={header} className={styles.resultsTableTh}>
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {results.map((row, index) => (
            <tr key={`${row.nombre_completo || "resultado"}-${index}`}>
              {fieldsToShow.map((field) => {
                const value = row[field];

                if (field === "relevancia") {
                  const relevancia = mostrarRelevancia(value);

                  return (
                    <td key={field} className={styles.resultsTableTd}>
                      <span
                        title={relevancia.detail}
                        style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          gap: 2,
                          minWidth: 82,
                          padding: "6px 8px",
                          borderRadius: 10,
                          border: `1px solid ${relevancia.border}`,
                          background: relevancia.background,
                          color: relevancia.color,
                          fontWeight: 800,
                          lineHeight: 1.15,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            letterSpacing: "0.04em",
                          }}
                        >
                          {relevancia.stars}
                        </span>

                        <span style={{ fontSize: 12 }}>
                          {relevancia.label}
                        </span>

                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 600,
                            opacity: 0.85,
                          }}
                        >
                          {relevancia.detail}
                        </span>
                      </span>
                    </td>
                  );
                }

                return (
                  <td key={field} className={styles.resultsTableTd}>
                    {formatCellValue(field, value)}
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