// src/components/OthersTable.js
import React from "react";
import styles from "./SearchPage.module.css";

const numberFormatter = new Intl.NumberFormat("es-BO");

function OthersTable({ summary, total }) {
  if (!summary || summary.length === 0) {
    return null;
  }

  // Ordenar de mayor a menor
  const sorted = [...summary].sort(
    (a, b) => Number(b.count || 0) - Number(a.count || 0)
  );

  // Debe coincidir con la lógica del gráfico:
  // top7 + barra "Otros" => "others" empieza en índice 7
  const others = sorted.slice(7);

  if (others.length === 0) {
    return null;
  }

  const safeTotal =
    total && total > 0
      ? total
      : sorted.reduce((acc, item) => acc + Number(item.count || 0), 0);

  const totalOtros = others.reduce(
    (acc, item) => acc + Number(item.count || 0),
    0
  );

  const porcentajeOtros = safeTotal
    ? ((totalOtros * 100) / safeTotal).toFixed(1)
    : "0.0";

  return (
    <div>
      <p
        style={{
          margin: "0 0 10px",
          fontSize: 12,
          color: "#64748b",
          lineHeight: 1.4,
          textAlign: "center",
        }}
      >
        Otros códigos: <strong>{others.length}</strong> | Registros agrupados:{" "}
        <strong>{numberFormatter.format(totalOtros)}</strong> | Participación:{" "}
        <strong>{porcentajeOtros}%</strong>
      </p>

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
            const count = Number(item.count || 0);

            const percentage = safeTotal
              ? ((count * 100) / safeTotal).toFixed(1)
              : "0.0";

            return (
              <tr key={item.codigo || `codigo-${count}`}>
                <td>
                  <strong>{item.codigo || "Sin código"}</strong>
                </td>

                <td className={styles.numericCell}>
                  {numberFormatter.format(count)}
                </td>

                <td className={styles.numericCell}>{percentage}%</td>
              </tr>
            );
          })}
        </tbody>

        <tfoot>
          <tr>
            <td>
              <strong>Total otros</strong>
            </td>

            <td className={styles.numericCell}>
              <strong>{numberFormatter.format(totalOtros)}</strong>
            </td>

            <td className={styles.numericCell}>
              <strong>{porcentajeOtros}%</strong>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default OthersTable;