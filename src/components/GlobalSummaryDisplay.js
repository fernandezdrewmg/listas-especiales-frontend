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
        barThickness: 16,
        categoryPercentage: 0.75,
        barPercentage: 0.85,
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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 10,
        titleFont: { size: 11, weight: "bold" },
        bodyFont: { size: 10 },
      },

      datalabels: {
        anchor: "end",
        align: "right",
        offset: 6,
        color: "#555",
        font: {
          weight: "bold",
          size: 10,
        },
        formatter: (value) =>
          new Intl.NumberFormat("es-BO").format(value),
      },
    },

    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          font: { size: 10 },
          callback: (value) =>
            new Intl.NumberFormat("es-BO").format(value),
        },
        max: Math.max(...counts) * 1.15,
      },
      y: {
        ticks: {
          font: { size: 10 },
          padding: 6,
        },
      },
    },

    layout: {
      padding: {
        left: 8,
        right: 50,
        top: 8,
        bottom: 8,
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
        {/* Gráfico de Barras (Top 8 + Otros) - A LA IZQUIERDA */}
        <div className={styles.chartWrapper}>
          <div className={styles.chartContainer} style={{ height: 320 }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Tabla de Otros - A LA DERECHA */}
        {others.length > 0 && (
          <OthersTable summary={summary} total={total} />
        )}
      </div>
    </div>
  );
}

export default GlobalSummaryDisplay;