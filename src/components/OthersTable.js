// src/components/OthersTable.js
import React from "react";
import styles from "./SearchPage.module.css";

function OthersTable({ summary, total }) {
  if (!summary || summary.length === 0) {
    return null;
  }

  const sorted = [...summary].sort((a, b) => b.count - a.count);
  const others = sorted.slice(8);

  if (others.length === 0) {
    return null;
  }

  return (
    <div className={styles.othersTableWrapper}>
      <h4 style={{ marginTop: 0 }}>Otros ({others.length})</h4>
      <table className={styles.othersTable}>
        <thead>
          <tr>
            <th>Código</th>
            <th>Registros</th>
            <th>%</th>
          </tr>
        </thead>
        <tbody>
          {others.map((item, idx) => {
            const percentage = ((item.count / total) * 100).toFixed(1);
            return (
              <tr key={`otros-${idx}`}>
                <td>{item.codigo}</td>
                <td className={styles.numeric}>
                  {new Intl.NumberFormat("es-BO").format(item.count)}
                </td>
                <td className={styles.numeric}>{percentage}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default OthersTable;