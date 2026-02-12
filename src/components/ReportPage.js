// src/components/ReportPage.js
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import styles from "./SearchPage.module.css";

export default function ReportPage({
  cliente,
  logoUrl,
  clienteNombre,
  puedeVerReporte,
  onOpenAnalytics,
}) {
  const [emailsCliente, setEmailsCliente] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const tableRef = useRef(null);

  // 1) Cargar TODOS los emails de la entidad
  useEffect(() => {
    const fetchEmailsCliente = async () => {
      setError("");
      try {
        const { data, error: usersError } = await supabase
          .from("usuarios")
          .select("email")
          .eq("cliente", cliente);

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

  // 2) Registrar uso del reporte
  const registrarUsoReporte = async (totalRegistrosLocal, dataLocal) => {
    try {
      const filtrosUsuario = selectedEmail || "Todos";

      const totalResultados =
        dataLocal && dataLocal.length
          ? dataLocal.reduce(
              (acc, row) => acc + (row.cantidad_resultados || 0),
              0
            )
          : 0;

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        console.error(
          "Error al obtener usuario autenticado:",
          userError.message
        );
      }

      const authEmail = userData?.user?.email || null;

      const fechaLocal = new Date().toLocaleString("es-BO", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "America/La_Paz",
      });

      const { error: insertError } = await supabase.from("reportes").insert([
        {
          usuario_email: authEmail,
          cliente: cliente || null,
          filtros_usuario: filtrosUsuario,
          filtro_fecha_desde: fechaDesde || null,
          filtro_fecha_hasta: fechaHasta || null,
          total_registros: totalRegistrosLocal,
          total_resultados: totalResultados,
          fecha: new Date().toISOString(),
          fecha_local: fechaLocal,
        },
      ]);

      if (insertError) {
        console.error(
          "Error al registrar uso de reporte:",
          insertError.message
        );
      }
    } catch (err) {
      console.error("Error inesperado al registrar uso de reporte:", err);
    }
  };

  // 3) Construir y ejecutar la consulta a busquedas con filtros
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
        .select(
          "usuario_email, criterio, cantidad_resultados, fecha, fuente, origen",
          {
            count: "exact",
          }
        );

      if (selectedEmail) {
        query = query.eq("usuario_email", selectedEmail);
      } else {
        query = query.in("usuario_email", emailsCliente);
      }

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

      const safeData = data || [];
      setReportData(safeData);

      const totalRegistrosLocal = safeData.length;
      await registrarUsoReporte(totalRegistrosLocal, safeData);
    } catch (err) {
      console.error("Error inesperado al obtener reporte:", err);
      setError("Ocurrió un error al obtener el reporte.");
    } finally {
      setLoading(false);
    }
  };

  // 4) Limpiar filtros
  const handleClearFilters = () => {
    setSelectedEmail("");
    setFechaDesde("");
    setFechaHasta("");
    setReportData([]);
    setError("");
  };

  // 5) Generar CSV con separador "|"
  const handleDownloadCsv = () => {
    if (!reportData || reportData.length === 0) return;

    const headers = [
      "usuario_email",
      "criterio",
      "cantidad_resultados",
      "fecha",
      "fuente",
      "origen",
    ];
    const headerLine = headers.join("|");

    const lines = reportData.map((row) => {
      const usuario_email = row.usuario_email ?? "";
      const criterio = (row.criterio ?? "").replace(/\r?\n/g, " ");
      const cantidad_resultados = row.cantidad_resultados ?? 0;
      const fecha = row.fecha ?? "";
      const fuente = (row.fuente ?? "").replace(/\r?\n/g, " ");
      const origenTexto =
        row.origen === "ESCRITORIO"
          ? "Aplicación escritorio"
          : "Aplicación web";

      return [
        usuario_email,
        criterio,
        cantidad_resultados,
        fecha,
        fuente,
        origenTexto,
      ].join("|");
    });

    const csvContent = [headerLine, ...lines].join("\n");
    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    // ajustar a Bolivia (UTC-4) para el nombre de archivo
    const ahora = new Date();
    const fechaBolivia = new Date(ahora.getTime() - 4 * 60 * 60 * 1000);
    const year = fechaBolivia.getFullYear();
    const month = String(fechaBolivia.getMonth() + 1).padStart(2, "0");
    const day = String(fechaBolivia.getDate()).padStart(2, "0");
    const fechaActual = `${year}-${month}-${day}`;

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

  // 6) Imprimir / guardar en PDF
  const handlePrintPdf = () => {
    window.print();
  };

  // 7) Fecha/hora mostrada
  const getPrintDateTime = () => {
    const now = new Date();
    return now.toLocaleString("es-BO", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/La_Paz",
    });
  };

  // 8) Resumen de filtros
  const getFiltersSummary = () => {
    const emailText = selectedEmail ? selectedEmail : "Todos";
    const desdeText = fechaDesde || "Sin límite inferior";
    const hastaText = fechaHasta || "Sin límite superior";
    return `Usuario: ${emailText} | Rango de fechas: ${desdeText} - ${hastaText}`;
  };

  const totalRegistros = reportData ? reportData.length : 0;

  return (
    <div
      className={styles.reportContainer}
      data-print-date={getPrintDateTime()}
    >
      {/* Encabezado */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoTitleWrapper}>
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

        <div className={styles.headerRight}>
          <p className={styles.userEmail}>
            <strong>Filtros aplicados:</strong> {getFiltersSummary()}
          </p>
          <p className={styles.userEmail}>
            <strong>Total registros:</strong> {totalRegistros}
          </p>

          {puedeVerReporte && typeof onOpenAnalytics === "function" && (
            <button
              type="button"
              onClick={onOpenAnalytics}
              className={styles.reportButton}
            >
              Ver análisis histórico de la Entidad
            </button>
          )}
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
            disabled={loading}
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={handleClearFilters}
            className={styles.exportButton}
            disabled={loading && !reportData.length}
          >
            Limpiar filtros
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

      {/* Mensajes */}
      {loading && <p className={styles.loading}>Cargando reporte…</p>}
      {error && <p className={styles.error}>{error}</p>}

      {/* Tabla */}
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
                <th>Origen</th>
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
                  <td>
                    {row.origen === "ESCRITORIO"
                      ? "Aplicacion escritorio"
                      : "Aplicacion web"}
                  </td>
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