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
import styles from "./SearchPage.module.css";

// ✅ Registrar componentes y plugin
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

// ✅ Generar colores
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
      <div className={styles.globalSummaryContainer}>
        <p className={styles.loading}>Cargando resumen global...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.globalSummaryContainer}>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  if (!summary || summary.length === 0) {
    return (
      <div className={styles.globalSummaryContainer}>
        <p className={styles.noResults}>
          No hay datos de resumen global disponibles.
        </p>
      </div>
    );
  }

  // ✅ Ordenar y limitar (Top 8 + Otros)
  const sorted = [...summary].sort((a, b) => b.count - a.count);
  const top = sorted.slice(0, 8);
  const others = sorted.slice(8);

  if (others.length > 0) {
    top.push({
      codigo: "OTROS",
      count: others.reduce((acc, i) => acc + i.count, 0),
    });
  }

  const labels = top.map((item) => item.codigo);
  const counts = top.map((item) => item.count);
  const backgroundColors = labels.map(() => getRandomColor());

  const chartData = {
    labels,
    datasets: [
      {
        label: "Total de Registros",
        data: counts,
        backgroundColor: backgroundColors,
        borderWidth: 0,
        barThickness: 14, // ✅ barras más delgadas
        categoryPercentage: 0.7,
        barPercentage: 0.8,
      },
    ],
  };

  const chartOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: { display: false },
      title: { display: false },

      tooltip: {
        callbacks: {
          label: (context) =>
            new Intl.NumberFormat("es-BO").format(context.parsed.x),
        },
      },

      datalabels: {
        anchor: "end",
        align: "right",
        offset: 2,
        color: "#555",
        font: {
          weight: "bold",
          size: 8,
        },
        formatter: (value) =>
          new Intl.NumberFormat("es-BO").format(value),
      },
    },

    scales: {
      x: {
        beginAtZero: true,
        ticks: { font: { size: 9 } },
      },
      y: {
        ticks: {
          font: { size: 8 },
          padding: 4,
        },
      },
    },

    layout: {
      padding: {
        left: 6,
        right: 10,
        top: 4,
        bottom: 4,
      },
    },
  };

  return (
    <div className={styles.globalSummaryContainer}>
      <h3>Resumen Global de Registros</h3>

      <div className={styles.globalTotalAndDate}>
        <span className={styles.globalTotalLabel}>
          Total de Registros en la Base:
        </span>
        <span className={styles.globalTotal}>
          {new Intl.NumberFormat("es-BO").format(total)}
        </span>
        {lastUpdateDate && (
          <span className={styles.globalUpdateDate}>
            Fecha de actualización: {lastUpdateDate}
          </span>
        )}
      </div>

      <div className={styles.globalSummaryContent}>
        <div className={styles.chartWrapper}>
          {/* ✅ Altura controlada sin tocar CSS */}
          <div
            className={styles.chartContainer}
            style={{ height: 280 }}
          >
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalSummaryDisplay;
