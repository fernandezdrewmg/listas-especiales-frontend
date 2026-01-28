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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
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

  // Cargar histórico completo: usuarios del cliente -> busquedas de esos emails
  useEffect(() => {
    const fetchHistorico = async () => {
      if (!cliente) return;
      setLoading(true);
      setError("");

      try {
        // 1) Obtener emails de usuarios de la entidad
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

        // 2) Obtener histórico desde "busquedas" filtrando por esos emails
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
        ];
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

  // Serie mensual (total y con coincidencias) según filtro de usuario
  const getSerie = () => {
    if (!historico.length) return [];

    const filtrados = selectedUser
      ? historico.filter(
          (r) =>
            (r.usuario_email || "").toLowerCase() ===
            selectedUser.toLowerCase()
        )
      : historico;

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

  // Serie global de la entidad (sin filtro de usuario)
  const getSerieGlobal = () => {
    if (!historico.length) return [];

    const grupos = {};
    historico.forEach((row) => {
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

  const serie = getSerie();
  const serieGlobal = getSerieGlobal();

  const totalActual = serie.reduce((acc, p) => acc + p.total, 0);
  const totalConMatch = serie.reduce((acc, p) => acc + p.conMatch, 0);
  const mesesConDatos = serie.length || 1;
  const promedioPorMes = totalActual / mesesConDatos;

  const labels = serie.map((p) => p.periodo);

  const dataLine = {
    labels,
    datasets: [
      {
        label: "Total de consultas",
        data: serie.map((p) => p.total),
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        tension: 0.2,
      },
      {
        label: "Consultas con coincidencias",
        data: serie.map((p) => p.conMatch),
        borderColor: "#ff0000",
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        tension: 0.2,
      },
      // Línea verde de total de la entidad (solo cuando hay usuario filtrado)
      ...(selectedUser
        ? [
            {
              label: "Total entidad (todas las consultas)",
              data: labels.map((periodo) => {
                const row = serieGlobal.find((g) => g.periodo === periodo);
                return row ? row.total : 0;
              }),
              borderColor: "#28a745",
              backgroundColor: "rgba(40, 167, 69, 0.2)",
              borderDash: [6, 4],
              tension: 0.2,
            },
          ]
        : []),
    ],
  };

  // Top 5 usuarios por consultas (histórico completo)
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

  const topUsuarios = getTopUsuarios();

  // Fechas de primera y última actividad (según filtro de usuario)
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

    const format = (d) =>
      d.toLocaleDateString("es-BO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });

    return {
      first: format(fechas[0]),
      last: format(fechas[fechas.length - 1]),
    };
  };

  const fechasActividad = getFechasActividad();

  return (
    <div className={styles.reportContainer}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Análisis histórico de consultas</h2>
          <p className={styles.userEmail}>
            Entidad: <strong>{clienteNombre}</strong>
          </p>
        </div>
        <div className={styles.headerRight}>
          <button
            type="button"
            onClick={onBackToReport}
            className={styles.reportButton}
          >
            Volver al reporte
          </button>
        </div>
      </div>

      {loading && <p className={styles.loading}>Cargando histórico…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {!loading && !error && (
        <>
          {/* Panel superior: solo filtro de usuario */}
          <div className={styles.reportFilters}>
            <div className={styles.filterGroup}>
              <label>Usuario (email):</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className={styles.filterSelect}
              >
                <option value="">Todos</option>
                {usuarios.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Gráfico de líneas + métricas imprimibles */}
          {serie.length > 0 ? (
            <div className={styles.historicoContent}>
              <p className={styles.userEmail} style={{ marginBottom: "4px" }}>
                Usuario seleccionado:{" "}
                <strong>
                  {selectedUser
                    ? selectedUser
                    : `Todos (Entidad: ${clienteNombre})`}
                </strong>
              </p>

              <p
                className={styles.userEmail}
                style={{ marginBottom: "4px", whiteSpace: "nowrap" }}
              >
                Consultas en la serie mostrada: Total:{" "}
                <strong>{totalActual}</strong> | Con coincidencias:{" "}
                <strong>{totalConMatch}</strong> | Promedio mensual:{" "}
                <strong>{promedioPorMes.toFixed(1)}</strong>
              </p>

              <p
                className={styles.userEmail}
                style={{ marginBottom: "12px", whiteSpace: "nowrap" }}
              >
                Actividad en el histórico: Primera:{" "}
                <strong>{fechasActividad.first || "N/D"}</strong> | Última:{" "}
                <strong>{fechasActividad.last || "N/D"}</strong>
              </p>

              <Line data={dataLine} />
            </div>
          ) : (
            <p className={styles.noResults}>
              No hay datos históricos para este cliente.
            </p>
          )}

          {/* Top usuarios */}
          {topUsuarios.length > 0 && (
            <div className={styles.summaryTableWrapper}>
              <h3>Top 5 usuarios por número de consultas (histórico completo)</h3>
              <table className={styles.summaryTable}>
                <thead>
                  <tr>
                    <th className={styles.summaryTableTh}>Usuario (email)</th>
                    <th className={styles.summaryTableTh}>Consultas</th>
                    <th className={styles.summaryTableTh}>% del total</th>
                  </tr>
                </thead>
                <tbody>
                  {topUsuarios.map((u) => (
                    <tr key={u.email}>
                      <td className={styles.summaryTableTd}>{u.email}</td>
                      <td className={styles.summaryTableTd}>{u.count}</td>
                      <td className={styles.summaryTableTd}>
                        {u.pct.toFixed(1)}%
                      </td>
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
