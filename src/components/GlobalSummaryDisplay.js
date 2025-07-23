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
import ChartDataLabels from 'chartjs-plugin-datalabels'; // ✅ Importar correctamente desde el plugin
import styles from "./SearchPage.module.css";

// ✅ Registrar el plugin ChartDataLabels junto con los componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels // ✅ Registrar aquí
);

const getRandomColor = () => {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

// lastUpdateDate ahora se usará directamente para mostrar la fecha de actualización global
function GlobalSummaryDisplay({ summary, total, loading, error, lastUpdateDate }) {
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
        <p className={styles.noResults}>No hay datos de resumen global disponibles.</p>
      </div>
    );
  }

  const labels = summary.map((item) => item.codigo);
  const counts = summary.map((item) => item.count);
  const backgroundColors = labels.map(() => getRandomColor());

  const chartData = {
    labels: labels,
    datasets: [
      {
        label: "Total de Registros",
        data: counts,
        backgroundColor: backgroundColors,
        borderColor: backgroundColors.map((color) => color.replace(")", ", 0.8)")),
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "Distribución Global de Registros por Código",
        font: {
          size: 16,
          weight: "bold",
        },
        color: "#333",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.x !== null) {
              label += new Intl.NumberFormat("es-BO").format(context.parsed.x);
            }
            return label;
          },
        },
      },
      datalabels: { // ✅ Configuración del plugin ChartDataLabels
        anchor: 'end', // Posición de la etiqueta (start, end, center)
        align: 'end', // Alineación de la etiqueta (start, end, center)
        color: '#555', // Color del texto de la etiqueta
        font: {
          weight: 'bold',
          size: 10, // Tamaño de la fuente para las etiquetas de datos
        },
        formatter: function(value) {
            return new Intl.NumberFormat("es-BO").format(value); // Formato numérico
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Número de Registros",
          font: {
            size: 14,
          },
        },
        ticks: {
          callback: function (value) {
            return new Intl.NumberFormat("es-BO").format(value);
          },
        },
      },
      y: {
        title: {
          display: true,
          text: "Código",
          font: {
            size: 14,
          },
        },
      },
    },
  };

  return (
    <div className={styles.globalSummaryContainer}>
      <h3>Resumen Global de Registros</h3>

      {/* Sección para mostrar el total de registros y la fecha de actualización */}
      <div className={styles.globalTotalAndDate}>
        <span className={styles.globalTotalLabel}>Total de Registros en la Base:</span>
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
          <div className={styles.chartContainer}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GlobalSummaryDisplay;