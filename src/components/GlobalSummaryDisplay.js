// src/components/GlobalSummaryDisplay.js
import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import OthersTable from "./OthersTable";
import styles from "./SearchPage.module.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

function GlobalSummaryDisplay({
  summary,
  total,
  loading,
  error,
  lastUpdateDate,
}) {
  if (loading) {
    return (
      <div className={styles.loading}>
        Cargando resumen global...
      </div>
    );
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (!summary || summary.length === 0) {
    return (
      <div className={styles.noResults}>
        No hay datos de resumen global disponibles.
      </div>
    );
  }

  // Ordenar por count descendente
  const sorted = [...summary].sort((a, b) => b.count - a.count);

  // Top 7 + barra "Otros"
  const top7 = sorted.slice(0, 7);
  const others = sorted.slice(7);

  const othersTotal = others.reduce((acc, item) => acc + item.count, 0);

  const labels = [
    ...top7.map((item) => item.codigo),
    ...(othersTotal > 0 ? ["Otros"] : []),
  ];

  const dataValues = [
    ...top7.map((item) => item.count),
    ...(othersTotal > 0 ? [othersTotal] : []),
  ];

  const barColors = labels.map(() => getRandomColor());

  const data = {
    labels,
    datasets: [
      {
        label: "Registros por código",
        data: dataValues,
        backgroundColor: barColors,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
      datalabels: {
        anchor: "end",
        align: "right",
        formatter: (value) =>
          new Intl.NumberFormat("es-BO").format(value),
        color: "#000",
        font: {
          size: 10,
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.x || 0;
            const pct = total
              ? ((value * 100) / total).toFixed(1)
              : "0.0";
            return `${new Intl.NumberFormat("es-BO").format(
              value
            )} registros (${pct}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          callback: (value) =>
            new Intl.NumberFormat("es-BO").format(value),
        },
      },
    },
  };

  // Filas para el resumen de impresión (todos los códigos individuales)
  const allRows = sorted;

  return (
    <div className={styles.globalSummaryContainer}>
      {/* Bloque superior: resumen global (total + fecha) */}
      <div className={styles.globalSummaryTop}>
        <h3>Resumen global</h3>

        <div className={styles.globalTotalAndDate}>
          <p className={styles.globalTotalLine}>
            {new Intl.NumberFormat("es-BO").format(total)}{" "}
            <span className={styles.globalTotalLabelInline}>
              Total de registros en la base
            </span>
          </p>
          {lastUpdateDate && (
            <p className={styles.globalUpdateDate}>
              Base de datos actualizada al: {lastUpdateDate}
            </p>
          )}
        </div>
      </div>

      {/* Bloque inferior / derecho: resumen por código */}
      <div className={styles.globalSummaryBottom}>
        <h3>Resumen global por código</h3>

        {/* Contenedor común para gráfico + tabla + texto impresión */}
        <div className={styles.globalSummaryContent}>
          {/* Gráfico SOLO en pantalla */}
          <div className={`${styles.chartWrapper} ${styles.onlyScreen}`}>
            <div className={styles.chartContainer}>
              <Bar data={data} options={options} />
            </div>
          </div>

          {/* Tabla de OTROS SOLO en pantalla */}
          <div
            className={`${styles.othersTableWrapper} ${styles.onlyScreen}`}
          >
            <h4>Detalle de otros códigos</h4>
            <OthersTable summary={summary} total={total} />
          </div>

          {/* Resumen en texto SOLO en impresión */}
          <div className={styles.onlyPrint}>
            <p className={styles.printSummaryText}>
              {allRows
                .map((item) => {
                  const formatted = new Intl.NumberFormat(
                    "es-BO"
                  ).format(item.count);
                  return `${item.codigo} = ${formatted}`;
                })
                .join("; ")}
              {`. TOTAL = ${new Intl.NumberFormat("es-BO").format(
                total
              )}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalSummaryDisplay;
