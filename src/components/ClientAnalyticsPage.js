// src/components/ClientAnalyticsPage.js
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import styles from "./SearchPage.module.css";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

export default function ClientAnalyticsPage({
  cliente,
  clienteNombre,
  onBackToReport,
}) {
  const [historico, setHistorico] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [selectedUser, setSelectedUser] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Rango de meses para el gráfico (YYYY-MM)
  const [fechaDesdeGraf, setFechaDesdeGraf] = useState("");
  const [fechaHastaGraf, setFechaHastaGraf] = useState("");

  const rangoMesInvalido =
    fechaDesdeGraf && fechaHastaGraf && fechaDesdeGraf > fechaHastaGraf;

  useEffect(() => {
    const fetchHistorico = async () => {
      if (!cliente) return;

      setLoading(true);
      setError("");

      try {
        const { data: usersData, error: usersError } = await supabase
          .from("usuarios")
          .select("email")
          .eq("cliente", cliente);

        if (usersError) {
          console.error(
            "Error al obtener usuarios de la entidad:",
            usersError.message
          );

          setError("No se pudieron obtener los usuarios de la entidad.");
          setLoading(false);
          return;
        }

        const emailsCliente = (usersData || [])
          .map((u) => (u.email || "").toLowerCase())
          .filter(Boolean);

        if (!emailsCliente.length) {
          setError("No hay usuarios registrados para esta entidad.");
          setLoading(false);
          return;
        }

        const { data, error: histError } = await supabase
          .from("busquedas")
          .select("usuario_email, fecha, cantidad_resultados")
          .in("usuario_email", emailsCliente);

        if (histError) {
          console.error("Error al obtener histórico:", histError.message);
          setError("No se pudo obtener el histórico del cliente.");
          setLoading(false);
          return;
        }

        const registros = data || [];
        setHistorico(registros);

        const usuariosUnicos = [
          ...new Set(
            registros
              .map((r) => (r.usuario_email || "").toLowerCase())
              .filter(Boolean)
          ),
        ].sort();

        setUsuarios(usuariosUnicos);
      } catch (err) {
        console.error("Error inesperado al obtener histórico:", err);
        setError("Ocurrió un error al obtener el histórico del cliente.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistorico();
  }, [cliente]);

  const formatDate = (date) =>
    date.toLocaleDateString("es-BO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  const formatMonth = (ym) => {
    if (!ym) return "";

    const [year, month] = ym.split("-");
    const d = new Date(Number(year), Number(month) - 1, 1);

    if (Number.isNaN(d.getTime())) return ym;

    return d.toLocaleDateString("es-BO", {
      year: "numeric",
      month: "2-digit",
    });
  };

  // Helper de rango
  const dentroDeRango = (fecha) => {
    if (rangoMesInvalido) return false;

    const ym = `${fecha.getFullYear()}-${String(
      fecha.getMonth() + 1
    ).padStart(2, "0")}`;

    if (fechaDesdeGraf && ym < fechaDesdeGraf) return false;
    if (fechaHastaGraf && ym > fechaHastaGraf) return false;

    return true;
  };

  const getSerie = () => {
    if (!historico.length) return [];

    const base = selectedUser
      ? historico.filter(
          (r) =>
            (r.usuario_email || "").toLowerCase() ===
            selectedUser.toLowerCase()
        )
      : historico;

    const filtrados = base.filter((row) => {
      const fecha = new Date(row.fecha);
      if (Number.isNaN(fecha.getTime())) return false;
      return dentroDeRango(fecha);
    });

    const grupos = {};

    filtrados.forEach((row) => {
      const fecha = new Date(row.fecha);
      if (Number.isNaN(fecha.getTime())) return;

      const key = `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!grupos[key]) {
        grupos[key] = { total: 0, conMatch: 0 };
      }

      grupos[key].total += 1;

      if ((row.cantidad_resultados || 0) > 0) {
        grupos[key].conMatch += 1;
      }
    });

    return Object.entries(grupos)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([periodo, vals]) => ({
        periodo,
        total: vals.total,
        conMatch: vals.conMatch,
      }));
  };

  const getSerieGlobal = () => {
    if (!historico.length) return [];

    const filtrados = historico.filter((row) => {
      const fecha = new Date(row.fecha);
      if (Number.isNaN(fecha.getTime())) return false;
      return dentroDeRango(fecha);
    });

    const grupos = {};

    filtrados.forEach((row) => {
      const fecha = new Date(row.fecha);
      if (Number.isNaN(fecha.getTime())) return;

      const key = `${fecha.getFullYear()}-${String(
        fecha.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!grupos[key]) {
        grupos[key] = { total: 0 };
      }

      grupos[key].total += 1;
    });

    return Object.entries(grupos)
      .sort(([a], [b]) => (a > b ? 1 : -1))
      .map(([periodo, vals]) => ({
        periodo,
        total: vals.total,
      }));
  };

  const getTopUsuarios = () => {
    if (!historico.length) return [];

    const conteo = {};

    historico.forEach((row) => {
      const email = (row.usuario_email || "").toLowerCase();
      if (!email) return;

      conteo[email] = (conteo[email] || 0) + 1;
    });

    const totalGlobal = Object.values(conteo).reduce(
      (acc, v) => acc + v,
      0
    );

    return Object.entries(conteo)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([email, count]) => ({
        email,
        count,
        pct: totalGlobal ? (count * 100) / totalGlobal : 0,
      }));
  };

  const getFechasActividad = () => {
    if (!historico.length) return { first: null, last: null };

    const filtrados = selectedUser
      ? historico.filter(
          (r) =>
            (r.usuario_email || "").toLowerCase() ===
            selectedUser.toLowerCase()
        )
      : historico;

    if (!filtrados.length) return { first: null, last: null };

    const fechas = filtrados
      .map((r) => new Date(r.fecha))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => a - b);

    if (!fechas.length) return { first: null, last: null };

    return {
      first: formatDate(fechas[0]),
      last: formatDate(fechas[fechas.length - 1]),
    };
  };

  const getTextoRangoGrafico = () => {
    if (rangoMesInvalido) {
      return "Rango de fechas del gráfico: rango inválido";
    }

    if (!fechaDesdeGraf && !fechaHastaGraf) {
      return "Rango de fechas del gráfico: todos los meses disponibles";
    }

    if (fechaDesdeGraf && !fechaHastaGraf) {
      return `Rango de fechas del gráfico: desde ${formatMonth(
        fechaDesdeGraf
      )}`;
    }

    if (!fechaDesdeGraf && fechaHastaGraf) {
      return `Rango de fechas del gráfico: hasta ${formatMonth(
        fechaHastaGraf
      )}`;
    }

    return `Rango de fechas del gráfico: ${formatMonth(
      fechaDesdeGraf
    )} a ${formatMonth(fechaHastaGraf)}`;
  };

  const serie = getSerie();
  const serieGlobal = getSerieGlobal();
  const topUsuarios = getTopUsuarios();
  const fechasActividad = getFechasActividad();

  const totalActual = serie.reduce((acc, p) => acc + p.total, 0);
  const totalConMatch = serie.reduce((acc, p) => acc + p.conMatch, 0);
  const mesesConDatos = serie.length || 1;
  const promedioPorMes = totalActual / mesesConDatos;

  const labels = serie.map((p) => p.periodo);

  let shareTexto = "No aplica sin filtro de usuario";

  if (selectedUser && labels.length > 0) {
    const ultimoPeriodo = labels[labels.length - 1];
    const filaUsuario = serie.find((p) => p.periodo === ultimoPeriodo);
    const filaGlobal = serieGlobal.find((g) => g.periodo === ultimoPeriodo);
    const totalUsr = filaUsuario ? filaUsuario.total : 0;
    const totalEnt = filaGlobal ? filaGlobal.total : 0;

    const share =
      totalEnt > 0 ? ((totalUsr * 100) / totalEnt).toFixed(1) : "0.0";

    shareTexto = `${share}% del total de consultas de la entidad en ${ultimoPeriodo}`;
  }

  let tendenciaTexto = "Sin datos suficientes para calcular tendencia";

  if (serie.length >= 4) {
    const valores = serie.map((p) => p.total);
    const n = valores.length;
    const ultimos3 = valores.slice(Math.max(n - 3, 0));
    const previos3 = valores.slice(Math.max(n - 6, 0), n - 3);

    const suma = (arr) => arr.reduce((a, b) => a + b, 0);
    const sUlt = suma(ultimos3);
    const sPrev = suma(previos3);

    if (sPrev === 0 && sUlt === 0) {
      tendenciaTexto = "Tendencia: sin movimiento en los últimos meses";
    } else if (sPrev === 0 && sUlt > 0) {
      tendenciaTexto = "Tendencia: en aumento fuerte, sin actividad previa";
    } else {
      const cambio = ((sUlt - sPrev) * 100) / sPrev;

      if (cambio > 10) {
        tendenciaTexto = `Tendencia: en aumento (+${cambio.toFixed(
          1
        )}% vs. 3 meses previos)`;
      } else if (cambio < -10) {
        tendenciaTexto = `Tendencia: en descenso (${cambio.toFixed(
          1
        )}% vs. 3 meses previos)`;
      } else {
        tendenciaTexto = "Tendencia: relativamente estable (±10%)";
      }
    }
  }

  const dataLine = {
    labels,
    datasets: [
      {
        label: "Total de consultas",
        data: serie.map((p) => p.total),
        borderColor: "#1e3a5f",
        backgroundColor: "rgba(30, 58, 95, 0.16)",
        tension: 0.25,
      },
      {
        label: "Consultas con coincidencias",
        data: serie.map((p) => p.conMatch),
        borderColor: "#9f1239",
        backgroundColor: "rgba(159, 18, 57, 0.14)",
        tension: 0.25,
      },
      ...(selectedUser
        ? [
            {
              label: "Total entidad",
              data: labels.map((periodo) => {
                const row = serieGlobal.find((g) => g.periodo === periodo);
                return row ? row.total : 0;
              }),
              borderColor: "#0f766e",
              backgroundColor: "rgba(15, 118, 110, 0.14)",
              borderDash: [6, 4],
              tension: 0.25,
            },
          ]
        : []),
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          usePointStyle: true,
          boxWidth: 8,
          font: {
            size: 12,
            weight: "600",
          },
        },
      },
      tooltip: {
        mode: "index",
        intersect: false,
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.parsed.y ?? 0;
            return `${label}: ${value}`;
          },
        },
      },
      datalabels: {
        anchor: (ctx) => {
          if (ctx.datasetIndex === 1) return "start";
          if (ctx.datasetIndex === 2) return "center";
          return "end";
        },
        align: (ctx) => {
          if (ctx.datasetIndex === 1) return "bottom";
          if (ctx.datasetIndex === 2) return "right";
          return "top";
        },
        offset: 4,
        color: "#0f172a",
        font: {
          size: 10,
          weight: "bold",
        },
        formatter: (value) => value,
      },
    },
    interaction: {
      mode: "nearest",
      intersect: false,
    },
    elements: {
      point: {
        radius: 5,
        hoverRadius: 7,
        hitRadius: 7,
        borderWidth: 2,
        borderColor: "#ffffff",
        backgroundColor: (ctx) => ctx.dataset.borderColor,
      },
      line: {
        borderWidth: 2,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          autoSkip: true,
          maxRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          precision: 0,
        },
      },
    },
  };

  const limpiarFiltrosGrafico = () => {
    setSelectedUser("");
    setFechaDesdeGraf("");
    setFechaHastaGraf("");
  };

  return (
    <div className={styles.reportContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Análisis histórico de consultas</h2>

          <p className={styles.userEmail}>
            Entidad:{" "}
            <strong>{clienteNombre || "No identificada"}</strong>
          </p>

          <p className={styles.userEmail}>
            Registros históricos cargados:{" "}
            <strong>{historico.length}</strong>
          </p>
        </div>

        <div className={styles.headerRight}>
          <p className={styles.userEmail}>
            Vista de comportamiento mensual, coincidencias y actividad por
            usuario.
          </p>

          <button
            type="button"
            onClick={onBackToReport}
            className={styles.reportButton}
          >
            Volver al reporte
          </button>
        </div>
      </div>

      {loading && (
        <p className={styles.loading}>
          Cargando histórico de consultas. Espere un momento...
        </p>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <>
          <div className={styles.reportFilters}>
            <div className={styles.filterGroup}>
              <label htmlFor="usuarioHistorico">Usuario</label>

              <select
                id="usuarioHistorico"
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Todos los usuarios</option>

                {usuarios.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Rango mensual del gráfico</label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <input
                  type="month"
                  value={fechaDesdeGraf}
                  onChange={(e) => setFechaDesdeGraf(e.target.value)}
                  className={styles.filterInput}
                  aria-label="Mes inicial del gráfico"
                />

                <span style={{ color: "#64748b", fontSize: 13 }}>a</span>

                <input
                  type="month"
                  value={fechaHastaGraf}
                  onChange={(e) => setFechaHastaGraf(e.target.value)}
                  className={styles.filterInput}
                  aria-label="Mes final del gráfico"
                />
              </div>
            </div>

            <div className={styles.filterActions}>
              <button
                type="button"
                onClick={limpiarFiltrosGrafico}
                className={styles.exportButton}
              >
                Limpiar filtros
              </button>
            </div>
          </div>

          {rangoMesInvalido && (
            <p className={styles.error}>
              El mes inicial no puede ser posterior al mes final.
            </p>
          )}

          {serie.length > 0 ? (
            <div className={styles.globalSummaryContainer}>
              <div
                className={styles.chartWrapper}
                style={{
                  width: "100%",
                  maxWidth: "100%",
                  minWidth: 0,
                }}
              >
                <div className={styles.chartContainer}>
                  <Line data={dataLine} options={chartOptions} />
                </div>
              </div>

              <div
                className={styles.metricsRow}
                style={{
                  width: "100%",
                  marginTop: 18,
                  alignItems: "stretch",
                }}
              >
                <div
                  className={styles.metricsColumn}
                  style={{
                    flex: "1 1 620px",
                  }}
                >
                  <p className={styles.userEmail}>
                    Usuario seleccionado:{" "}
                    <strong>
                      {selectedUser
                        ? selectedUser
                        : `Todos los usuarios de ${
                            clienteNombre || "la entidad"
                          }`}
                    </strong>
                  </p>

                  <p className={styles.userEmail}>
                    Consultas en la serie mostrada:{" "}
                    <strong>{totalActual}</strong> | Con coincidencias:{" "}
                    <strong>{totalConMatch}</strong> | Promedio mensual:{" "}
                    <strong>{promedioPorMes.toFixed(1)}</strong>
                  </p>

                  <p className={styles.userEmail}>
                    Actividad histórica: Primera consulta{" "}
                    <strong>{fechasActividad.first || "N/D"}</strong> | Última
                    consulta <strong>{fechasActividad.last || "N/D"}</strong>
                  </p>

                  <p className={styles.userEmail}>
                    Participación en el último mes:{" "}
                    <strong>{shareTexto}</strong>
                  </p>

                  <p className={styles.userEmail}>
                    <strong>{tendenciaTexto}</strong>
                  </p>

                  <p className={styles.userEmail}>{getTextoRangoGrafico()}</p>
                </div>

                <div
                  className={styles.peakCard}
                  style={{
                    flex: "1 1 280px",
                  }}
                >
                  {(() => {
                    if (!serieGlobal.length) {
                      return <p>Mes de mayor actividad: N/D</p>;
                    }

                    const picoEntidad = serieGlobal.reduce(
                      (best, curr) =>
                        !best || curr.total > best.total ? curr : best,
                      null
                    );

                    const picoUsuario =
                      selectedUser && serie.length
                        ? serie.reduce(
                            (best, curr) =>
                              !best || curr.total > best.total ? curr : best,
                            null
                          )
                        : null;

                    return (
                      <>
                        <p
                          style={{
                            fontWeight: "bold",
                            marginBottom: "4px",
                          }}
                        >
                          Mes de mayor actividad de la entidad
                        </p>

                        <p style={{ marginBottom: "10px" }}>
                          {picoEntidad.periodo}:{" "}
                          <strong>{picoEntidad.total}</strong> consultas
                        </p>

                        {picoUsuario && (
                          <>
                            <p
                              style={{
                                fontWeight: "bold",
                                marginBottom: "4px",
                              }}
                            >
                              Pico del usuario seleccionado
                            </p>

                            <p>
                              {picoUsuario.periodo}:{" "}
                              <strong>{picoUsuario.total}</strong> consultas
                            </p>
                          </>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          ) : (
            <p className={styles.noResults}>
              No hay datos históricos para los filtros seleccionados.
            </p>
          )}

          {topUsuarios.length > 0 && (
            <div className={styles.searchResultsContainer}>
              <h3 className={styles.sectionTitle}>
                Top 5 usuarios por número de consultas
              </h3>

              <table className={styles.resultsTable}>
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Consultas</th>
                    <th>% del total</th>
                  </tr>
                </thead>

                <tbody>
                  {topUsuarios.map((u) => (
                    <tr key={u.email}>
                      <td>{u.email}</td>
                      <td>{u.count}</td>
                      <td>{u.pct.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}