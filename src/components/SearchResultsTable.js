// src/components/SearchResultsTable.js
import React from "react";
import styles from "./SearchPage.module.css"; // Reutilizamos los estilos existentes

// Función auxiliar para formatear los nombres de las cabeceras
const formatHeader = (key) => {
  // Casos especiales para acrónimos o nombres que no queremos dividir
  if (key === "PEPAsociado") return "PEP Asociado";
  if (key === "NroDocumento") return "Nro. Documento";
  //if (key === "JustificacionALL") return "Justificación Ampliada";
  if (key === "DetalleALL") return "Detalle Fam";
  if (key === "NombreCompleto") return "Nombre Completo";
  if (key === "FechaReporte") return "Fecha de Reporte"; // Aunque no lo mostremos, es bueno tener la lógica

  // Divide el string por mayúsculas (excepto la primera letra) y une con espacios
  return key
    .replace(/([A-Z])/g, " $1") // Agrega un espacio antes de cada mayúscula
    .replace(/^./, (str) => str.toUpperCase()) // Capitaliza la primera letra
    .trim(); // Elimina espacios extra al inicio/final
};

function SearchResultsTable({ results }) {
  if (!results || results.length === 0) {
    return null; // No renderiza nada si no hay resultados
  }

  // Definimos el orden y los campos que queremos mostrar.
  // Excluimos 'id' y 'FechaReporte' como se solicitó.
  // También "Profesion" se agregó como ejemplo.
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
    "Profesion", // Asegúrate de que este campo exista en tus datos
    // Agrega o quita campos según tus necesidades. El orden aquí define el orden de las columnas.
  ];

  // Obtener las cabeceras de la tabla
  const headers = fieldsToShow.map(formatHeader);

  return (
    <div className={styles.searchResultsContainer}>
      <h3>Detalle de Coincidencias</h3>
      <table className={styles.resultsTable}>
        <thead>
          <tr>
            {headers.map((header, index) => (
              <th key={index} className={styles.resultsTableTh}>
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.map((item) => (
            <tr key={item.id}>
              {fieldsToShow.map((field) => (
                <td key={field} className={styles.resultsTableTd}>
                  {/* Manejo especial para valores nulos o indefinidos */}
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