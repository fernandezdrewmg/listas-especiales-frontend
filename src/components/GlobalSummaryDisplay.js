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

const numberFormatter = new Intl.NumberFormat("es-BO");

const executivePalette = [
  "#1e3a5f",
  "#2563eb",
  "#0f766e",
  "#334155",
  "#7c3aed",
  "#0369a1",
  "#9f1239",
  "#64748b",
];

const getColorByIndex = (index) =>
  executivePalette[index % executivePalette.length];

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
        Cargando resumen global de la base de datos...
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

  // Ordenar por cantidad descendente
  const sorted = [...summary].sort(
    (a, b) => Number(b.count || 0) - Number(a.count || 0)
  );

  // Total seguro: si viene total, se usa; si no, se calcula.
  const safeTotal =
    total && total > 0
      ? total
      : sorted.reduce((acc, item) => acc + Number(item.count || 0), 0);

  // Top 7 + barra "Otros"
  const top7 = sorted.slice(0, 7);
  const others = sorted.slice(7);

  const othersTotal = others.reduce(
    (acc, item) => acc + Number(item.count || 0),
    0
  );

  const labels = [
    ...top7.map((item) => item.codigo || "Sin código"),
    ...(othersTotal > 0 ? ["Otros"] : []),
  ];

  const dataValues = [
    ...top7.map((item) => Number(item.count || 0)),
    ...(othersTotal > 0 ? [othersTotal] : []),
  ];

  const barColors = labels.map((_, index) => getColorByIndex(index));

  const topCode = sorted[0];
  const topCodePct =
    safeTotal && topCode
      ? ((Number(topCode.count || 0) * 100) / safeTotal).toFixed(1)
      : "0.0";

  const totalCodigos = sorted.length;
  const cantidadTop = top7.length;
  const cantidadOtros = others.length;

  const data = {
    labels,
    datasets: [
      {
        label: "Registros por código",
        data: dataValues,
        backgroundColor: barColors,
        borderColor: barColors,
        borderWidth: 1,
        borderRadius: 8,
        barThickness: 26,
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
        offset: 4,
        formatter: (value) => numberFormatter.format(value),
        color: "#0f172a",
        font: {
          size: 10,
          weight: "700",
        },
      },
      tooltip: {
        backgroundColor: "#0f172a",
        titleColor: "#ffffff",
        bodyColor: "#e2e8f0",
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const value = context.parsed.x || 0;
            const pct = safeTotal
              ? ((value * 100) / safeTotal).toFixed(1)
              : "0.0";

            return `${numberFormatter.format(value)} registros (${pct}%)`;
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: "rgba(148, 163, 184, 0.22)",
        },
        ticks: {
          color: "#64748b",
          callback: (value) => numberFormatter.format(value),
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#334155",
          font: {
            size: 11,
            weight: "600",
          },
        },
      },
    },
  };

  // Filas para el resumen de impresión: todos los códigos individuales
  const allRows = sorted;

  return (
    <div className={styles.globalSummaryContainer}>
      {/* Bloque superior: resumen global */}
      <div className={styles.globalSummaryTop}>
        <h3>Resumen global de la base</h3>

        <div className={styles.globalTotalAndDate}>
          <p className={styles.globalTotalLine}>
            {numberFormatter.format(safeTotal)}{" "}
            <span className={styles.globalTotalLabelInline}>
              registros disponibles para consulta
            </span>
          </p>

          {lastUpdateDate && (
            <p className={styles.globalUpdateDate}>
              Base de datos actualizada al: <strong>{lastUpdateDate}</strong>
            </p>
          )}

          <p className={styles.globalUpdateDate}>
            Códigos identificados: <strong>{totalCodigos}</strong>
            {topCode && (
              <>
                {" "}
                | Principal: <strong>{topCode.codigo}</strong> (
                {numberFormatter.format(Number(topCode.count || 0))} registros,{" "}
                {topCodePct}%)
              </>
            )}
          </p>
        </div>
      </div>

      {/* Bloque inferior: gráfico + detalle */}
      <div className={styles.globalSummaryBottom}>
        <h3>Distribución por código</h3>

        <div className={styles.globalSummaryContent}>
          {/* Gráfico SOLO en pantalla */}
          <div className={`${styles.chartWrapper} ${styles.onlyScreen}`}>
            <div className={styles.chartContainer}>
              <Bar data={data} options={options} />
            </div>

            <p
              className={styles.globalUpdateDate}
              style={{
                marginTop: 10,
                marginBottom: 0,
                textAlign: "left",
              }}
            >
              Se muestran los {cantidadTop} códigos principales
              {cantidadOtros > 0
                ? ` y ${cantidadOtros} códigos agrupados en “Otros”.`
                : "."}
            </p>
          </div>

          {/* Tabla de OTROS SOLO en pantalla */}
          <div className={`${styles.othersTableWrapper} ${styles.onlyScreen}`}>
            <h4>Detalle de otros códigos</h4>

            {cantidadOtros > 0 ? (
              <OthersTable summary={summary} total={safeTotal} />
            ) : (
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: "#64748b",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                No existen códigos adicionales fuera del grupo principal.
              </p>
            )}
          </div>

          {/* Resumen en texto SOLO en impresión */}
          <div className={styles.onlyPrint}>
            <p className={styles.printSummaryText}>
              {allRows
                .map((item) => {
                  const formatted = numberFormatter.format(
                    Number(item.count || 0)
                  );
                  return `${item.codigo} = ${formatted}`;
                })
                .join("; ")}
              {`. TOTAL = ${numberFormatter.format(safeTotal)}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalSummaryDisplay;