// src/components/SearchResultsTable.js
import React, { useState, useEffect } from "react";
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
  const [selectedList, setSelectedList] = useState("");
  const [selectedRelevance, setSelectedRelevance] = useState("");
  const [compact, setCompact] = useState(false);
  useEffect(() => {
    setSelectedList("");
    setSelectedRelevance("");
  }, [results]);
  const listCode = (row) => String(row.codigo || "Sin Código").trim();
  const lists = [...new Set((results || []).map(listCode))].sort((a, b) =>
    a.localeCompare(b, "es"),
  );
  const visibleResults = (results || []).filter(
    (row) =>
      (!selectedList || listCode(row) === selectedList) &&
      (!selectedRelevance ||
        Number(row.relevancia) === Number(selectedRelevance)),
  );
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
    <div className={compact ? styles.compact : undefined}>
      <div className={styles.resultToolbar}>
        <div className={styles.resultFilters}>
          <label htmlFor="result-list">
            Código / Lista
            <select
              id="result-list"
              aria-label="Código / Lista"
              value={selectedList}
              onChange={(e) => setSelectedList(e.target.value)}
            >
              <option value="">Todas las listas</option>
              {lists.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
          <label htmlFor="result-relevance">
            Relevancia
            <select
              id="result-relevance"
              aria-label="Relevancia"
              value={selectedRelevance}
              onChange={(e) => setSelectedRelevance(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="3">Alta · Nombre y alias</option>
              <option value="2">Media · Nombre</option>
              <option value="1">Referencial · Alias</option>
            </select>
          </label>
          <button
            type="button"
            className={styles.densityButton}
            aria-pressed={compact}
            onClick={() => setCompact(!compact)}
          >
            Vista compacta
          </button>
          {(selectedList || selectedRelevance) && (
            <button
              type="button"
              className={styles.textButton}
              onClick={() => {
                setSelectedList("");
                setSelectedRelevance("");
              }}
            >
              Restablecer
            </button>
          )}
        </div>
        <span role="status">
          {visibleResults.length} de {results.length} registros
        </span>
      </div>
      <div
        className={styles.tableResponsive}
        tabIndex={0}
        role="region"
        aria-label="Detalle de coincidencias; desplace horizontalmente para ver todas las columnas"
      >
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
            {visibleResults.map((row, index) => (
              <tr key={`${row.nombre_completo || "resultado"}-${index}`}>
                {fieldsToShow.map((field) => {
                  const value = row[field];

                  if (field === "relevancia") {
                    const relevancia = mostrarRelevancia(value);

                    return (
                      <td key={field} className={styles.resultsTableTd}>
                        <span
                          className={styles.relevanceBadge}
                          title={relevancia.detail}
                          style={{
                            color: relevancia.color,
                            background: relevancia.background,
                            borderColor: relevancia.border,
                          }}
                        >
                          <span aria-hidden="true">●</span>
                          {relevancia.label}
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
            {visibleResults.length === 0 && (
              <tr>
                <td colSpan={fieldsToShow.length}>
                  No hay coincidencias para estos filtros. Puede restablecerlos
                  para ver todos los registros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default SearchResultsTable;
