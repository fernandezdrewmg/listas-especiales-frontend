// src/components/OthersTable.js
import React from "react";
import styles from "./SearchPage.module.css";

function OthersTable({ summary, total }) {
  if (!summary || summary.length === 0) {
    return null;
  }

  // Ordenar de mayor a menor
  const sorted = [...summary].sort((a, b) => b.count - a.count);

  // IMPORTANTE: debe coincidir con la lógica del gráfico:
  // top7 + barra "Otros" => "others" empieza en índice 7
  const others = sorted.slice(7);

  if (others.length === 0) {
    return null;
  }

  return (
    <table className={styles.othersTable}>
      <thead>
        <tr>
          <th>Código</th>
          <th>Registros</th>
          <th>%</th>
        </tr>
      </thead>
      <tbody>
        {others.map((item) => {
          const percentage = total
            ? ((item.count * 100) / total).toFixed(1)
            : "0.0";
          return (
            <tr key={item.codigo}>
              <td>{item.codigo}</td>
              <td className={styles.numericCell}>
                {new Intl.NumberFormat("es-BO").format(item.count)}
              </td>
              <td className={styles.numericCell}>{percentage}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default OthersTable;
