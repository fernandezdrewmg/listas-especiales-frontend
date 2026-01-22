// src/components/ReportPage.js
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import styles from "./SearchPage.module.css";

export default function ReportPage({ cliente, logoUrl, clienteNombre }) {
  const [emailsCliente, setEmailsCliente] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const tableRef = useRef(null);

  // 1) Cargar TODOS los emails de la entidad (incluye Vigente y Baja)
  //    y normalizarlos a minúsculas para que coincidan con busquedas.usuario_email
  useEffect(() => {
    const fetchEmailsCliente = async () => {
      setError("");
      try {
        const { data, error: usersError } = await supabase
          .from("usuarios")
          .select("email")
          .eq("cliente", cliente); // solo por cliente

        if (usersError) {
          console.error(
            "Error al obtener usuarios de la entidad:",
            usersError.message
          );
          setError("No se pudieron obtener los usuarios de la entidad.");
          return;
        }

        const emails = (data || [])
          .map((u) => (u.email || "").toLowerCase())
          .filter(Boolean);

        setEmailsCliente(emails);
      } catch (err) {
        console.error("Error inesperado al obtener usuarios de la entidad:", err);
        setError("Ocurrió un error al obtener los usuarios de la entidad.");
      }
    };

    if (cliente) {
      fetchEmailsCliente();
    }
  }, [cliente]);

  // 2) Construir y ejecutar la consulta a busquedas con filtros
  const fetchReport = async () => {
    setLoading(true);
    setError("");
    try {
      if (!cliente) {
        setError("No se ha definido la entidad para el reporte.");
        setLoading(false);
        return;
      }

      if (!emailsCliente || emailsCliente.length === 0) {
        setError("No hay usuarios registrados para esta entidad.");
        setLoading(false);
        return;
      }

      let query = supabase
        .from("busquedas")
        .select("usuario_email, criterio, cantidad_resultados, fecha, fuente", {
          count: "exact",
        });

      // Filtro por emails de la entidad (en minúsculas)
      if (selectedEmail) {
        query = query.eq("usuario_email", selectedEmail);
      } else {
        query = query.in("usuario_email", emailsCliente);
      }

      // Filtros por fecha (asumiendo que 'fecha' es timestamp ISO en la BD)
      if (fechaDesde) {
        const desdeISO = new Date(fechaDesde + "T00:00:00").toISOString();
        query = query.gte("fecha", desdeISO);
      }
      if (fechaHasta) {
        const hastaISO = new Date(fechaHasta + "T23:59:59").toISOString();
        query = query.lte("fecha", hastaISO);
      }

      query = query.order("fecha", { ascending: false });

      const { data, error: reportError } = await query;

      if (reportError) {
        console.error("Error al obtener reporte:", reportError.message);
        setError("No se pudo obtener el reporte.");
        setLoading(false);
        return;
      }

      setReportData(data || []);
    } catch (err) {
      console.error("Error inesperado al obtener reporte:", err);
      setError("Ocurrió un error al obtener el reporte.");
    } finally {
      setLoading(false);
    }
  };

  // 3) Generar CSV con separador "|"
  const handleDownloadCsv = () => {
    if (!reportData || reportData.length === 0) return;

    const headers = [
      "usuario_email",
      "criterio",
      "cantidad_resultados",
      "fecha",
      "fuente",
    ];
    const headerLine = headers.join("|");

    const lines = reportData.map((row) => {
      const usuario_email = row.usuario_email ?? "";
      const criterio = (row.criterio ?? "").replace(/\r?\n/g, " ");
      const cantidad_resultados = row.cantidad_resultados ?? 0;
      const fecha = row.fecha ?? "";
      const fuente = (row.fuente ?? "").replace(/\r?\n/g, " ");
      return [
        usuario_email,
        criterio,
        cantidad_resultados,
        fecha,
        fuente,
      ].join("|");
    });

    const csvContent = [headerLine, ...lines].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    const fechaActual = new Date().toISOString().slice(0, 10);
    link.href = url;
    link.setAttribute(
      "download",
      `reporte_busquedas_${cliente}_${fechaActual}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 4) Imprimir / guardar en PDF usando el navegador
  const handlePrintPdf = () => {
    window.print();
  };

  // 5) Función auxiliar para obtener fecha y hora formateada
  const getPrintDateTime = () => {
    const now = new Date();
    return now.toLocaleString("es-BO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  return (
    <div
      className={styles.reportContainer}
      data-print-date={getPrintDateTime()}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoTitleWrapper}>
            {/* Sin logo para no repetir visualmente */}
            <div>
              <h2>Reporte de Búsquedas</h2>
              <p className={styles.userEmail}>
                Entidad: <strong>{clienteNombre}</strong>
              </p>
              <p className={styles.userEmail}>
                Fecha/hora de generación:{" "}
                <strong>{getPrintDateTime()}</strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={styles.reportFilters}>
        <div className={styles.filterGroup}>
          <label>Usuario (email):</label>
          <select
            value={selectedEmail}
            onChange={(e) => setSelectedEmail(e.target.value.toLowerCase())}
            className={styles.filterSelect}
          >
            <option value="">Todos</option>
            {emailsCliente.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label>Fecha desde:</label>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterGroup}>
          <label>Fecha hasta:</label>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className={styles.filterInput}
          />
        </div>

        <div className={styles.filterActions}>
          <button
            type="button"
            onClick={fetchReport}
            className={styles.searchButton}
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className={styles.exportButton}
            disabled={!reportData || reportData.length === 0}
          >
            Descargar CSV (|)
          </button>
          <button
            type="button"
            onClick={handlePrintPdf}
            className={styles.exportButton}
            disabled={!reportData || reportData.length === 0}
          >
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Mensajes de estado */}
      {loading && <p className={styles.loading}>Cargando reporte…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {/* Tabla de resultados */}
      <div className={styles.searchResultsContainer} ref={tableRef}>
        {reportData && reportData.length > 0 ? (
          <table className={styles.resultsTable}>
            <thead>
              <tr>
                <th>Usuario (email)</th>
                <th>Criterio</th>
                <th>Cantidad resultados</th>
                <th>Fecha</th>
                <th>Fuente</th>
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, idx) => (
                <tr key={`${row.usuario_email}-${row.fecha}-${idx}`}>
                  <td>{row.usuario_email}</td>
                  <td>{row.criterio}</td>
                  <td>{row.cantidad_resultados}</td>
                  <td>{row.fecha}</td>
                  <td>{row.fuente || ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading &&
          !error && (
            <p className={styles.noResults}>
              No hay datos para los filtros seleccionados.
            </p>
          )
        )}
      </div>
    </div>
  );
}


