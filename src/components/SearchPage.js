// src/components/SearchPage.js
import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import styles from "./SearchPage.module.css";
import { useSearch } from "../hooks/useSearch";
import { useGlobalSummary } from "../hooks/useGlobalSummary";
import SearchResultsTable from "./SearchResultsTable";
import GlobalSummaryDisplay from "./GlobalSummaryDisplay";
import ReportPage from "./ReportPage";
import ClientAnalyticsPage from "./ClientAnalyticsPage";

function SummaryTable({ summary, total }) {
  return (
    <div className={styles.summaryTableWrapper}>
      <h3 className={styles.sectionTitle}>Coincidencias encontradas</h3>
      <table className={styles.summaryTable}>
        <thead>
          <tr>
            <th className={styles.summaryTableTh}>Código</th>
            <th className={styles.summaryTableTh}>Registros</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(summary).map(([codigo, count]) => (
            <tr key={codigo}>
              <td className={styles.summaryTableTd}>{codigo}</td>
              <td
                className={`${styles.summaryTableTd} ${styles.numericCell}`}
              >
                {count}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="totalRow">
            <td className={styles.summaryTableTd}>Total</td>
            <td
              className={`${styles.summaryTableTd} ${styles.numericCell}`}
            >
              {total}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default function SearchPage({ onLogout }) {
  const [term, setTerm] = useState("");
  const [fechaActual, setFechaActual] = useState("");
  const [usuarioEmail, setUsuarioEmail] = useState("");
  const [clienteNombre, setClienteNombre] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [pendingRegister, setPendingRegister] = useState(false);

  const [puedeVerReporte, setPuedeVerReporte] = useState(false);
  const [clienteCodigo, setClienteCodigo] = useState("");
  const [view, setView] = useState("search"); // "search" | "report" | "analytics"

  // Métricas de uso del usuario
  const [consultasMesActual, setConsultasMesActual] = useState(0);
  const [ultimaConsulta, setUltimaConsulta] = useState(null);

  const { results, loading, error, summaryData, executeSearch } = useSearch();
  const {
    globalSummary,
    globalTotal,
    globalLoading,
    globalError,
    globalLastUpdateDate,
  } = useGlobalSummary();

  // Fecha actual
  useEffect(() => {
    const hoy = new Date().toLocaleDateString("es-BO", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    setFechaActual(hoy);
  }, []);

  // Obtener usuario, logo y permiso de reporte
  useEffect(() => {
    const obtenerUsuario = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.email) return;

      setUsuarioEmail(user.email);

      const { data, error } = await supabase
        .from("usuarios")
        .select('cliente, logo_cliente, "Reporte"')
        .ilike("email", user.email)
        .single();

      if (error || !data) {
        if (error) {
          console.error("Error al buscar usuario:", error.message);
        }
        return;
      }

      setClienteNombre(data.cliente || "");
      setClienteCodigo(data.cliente || "");

      const nombreLogo = (data.logo_cliente || "").trim();
      if (nombreLogo) {
        const { data: urlData } = supabase.storage
          .from("logos_clientes")
          .getPublicUrl(nombreLogo);
        setLogoUrl(urlData?.publicUrl || "");
      } else {
        setLogoUrl("");
      }

      const valorReporte = (data.Reporte || "").toLowerCase();
      const puede = valorReporte === "si" || valorReporte === "sí";
      setPuedeVerReporte(puede);
    };

    obtenerUsuario();
  }, []);

  // Estadísticas de búsquedas del usuario (mes actual + última consulta)
  useEffect(() => {
    const fetchStatsBusqueda = async () => {
      if (!usuarioEmail) return;

      const ahora = new Date();
      const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
      const finMes = new Date(
        ahora.getFullYear(),
        ahora.getMonth() + 1,
        0,
        23,
        59,
        59
      );

      const inicioISO = inicioMes.toISOString();
      const finISO = finMes.toISOString();

      const { data, error } = await supabase
        .from("busquedas")
        .select("fecha")
        .eq("usuario_email", usuarioEmail.toLowerCase())
        .gte("fecha", inicioISO)
        .lte("fecha", finISO)
        .order("fecha", { ascending: false });

      if (error) {
        console.error("Error al obtener stats de búsquedas:", error.message);
        return;
      }

      const registros = data || [];
      setConsultasMesActual(registros.length);

      if (registros.length > 0) {
        const ultima = new Date(registros[0].fecha);
        setUltimaConsulta(
          ultima.toLocaleString("es-BO", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
        );
      } else {
        setUltimaConsulta(null);
      }
    };

    fetchStatsBusqueda();
  }, [usuarioEmail]);

  // Control de inactividad
  useEffect(() => {
    let warningTimeoutId;
    let logoutTimeoutId;

    const resetTimers = () => {
      clearTimeout(warningTimeoutId);
      clearTimeout(logoutTimeoutId);
      setShowInactivityWarning(false);

      warningTimeoutId = setTimeout(() => {
        setShowInactivityWarning(true);
      }, 90 * 1000);

      logoutTimeoutId = setTimeout(() => {
        supabase.auth.signOut().then(() => {
          onLogout();
        });
      }, 2 * 60 * 1000);
    };

    const eventos = ["mousemove", "keydown", "scroll", "click"];
    eventos.forEach((evento) =>
      window.addEventListener(evento, resetTimers)
    );

    resetTimers();

    return () => {
      eventos.forEach((evento) =>
        window.removeEventListener(evento, resetTimers)
      );
      clearTimeout(warningTimeoutId);
      clearTimeout(logoutTimeoutId);
    };
  }, [onLogout]);

  // Ejecutar búsqueda
  const handleSearch = async (e) => {
    e.preventDefault();
    const criterio = term.trim();
    if (criterio === "" || !usuarioEmail) return;

    await executeSearch(criterio);
    setPendingRegister(true);
  };

  // Registrar búsqueda
  useEffect(() => {
    if (pendingRegister && summaryData && usuarioEmail) {
      const totalCoincidencias = Object.values(summaryData).reduce(
        (acc, val) => acc + val,
        0
      );

      const fechaBolivia = new Date(
        Date.now() - 4 * 60 * 60 * 1000
      ).toISOString();

      let fuenteResumen = null;

      if (totalCoincidencias > 0 && results.length > 0) {
        const codigosUnicos = [
          ...new Set(results.map((r) => r.codigo).filter(Boolean)),
        ];

        if (codigosUnicos.length > 0) {
          fuenteResumen = codigosUnicos.join(", ");
        }
      }

      const registrarBusqueda = async () => {
        try {
          const { error: insertError } = await supabase
            .from("busquedas")
            .insert([
              {
                usuario_email: usuarioEmail.toLowerCase(),
                criterio: term.trim(),
                cantidad_resultados: totalCoincidencias,
                fuente: fuenteResumen,
                fecha: fechaBolivia,
              },
            ]);

          if (insertError) {
            console.error(
              "❌ Error al registrar búsqueda:",
              insertError.message
            );
          } else {
            console.log("✅ Búsqueda registrada en Supabase");
          }
        } catch (err) {
          console.error(
            "⚠️ Error inesperado al registrar búsqueda:",
            err
          );
        }

        setPendingRegister(false);
      };

      registrarBusqueda();
    }
  }, [summaryData, pendingRegister, usuarioEmail, term, results]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className={styles.container}>
      {showInactivityWarning && (
        <div className={styles.inactivityWarning}>
          <p>Tu sesión se cerrará en 30 segundos por inactividad.</p>
          <p>Mueve el mouse o presiona una tecla para continuar.</p>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logoTitleWrapper}>
            <div className={styles.logoBox}>
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt={`Logo de ${clienteNombre}`}
                  className={styles.logoCliente}
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
            <div>
              <h2>Buscar en Listas Especiales</h2>
              <p className={styles.updateDateText}>
                Base de datos actualizada al:{" "}
                <strong>
                  {globalLastUpdateDate || "Cargando..."}
                </strong>
              </p>
              <p className={styles.userEmail}>
                Usuario: <strong>{usuarioEmail}</strong>
              </p>
              {/* Métricas visibles solo en pantalla */}
              <div className={styles.noPrint}>
                <p className={styles.userEmail}>
                  Consultas realizadas en el mes actual:{" "}
                  <strong>{consultasMesActual}</strong>
                </p>
                <p className={styles.userEmail}>
                  Última consulta registrada:{" "}
                  <strong>{ultimaConsulta || "N/D"}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <p className={styles.currentDateText}>
            Fecha actual: <strong>{fechaActual}</strong>
          </p>

          {puedeVerReporte && (
            <button
              type="button"
              onClick={() =>
                setView((prev) =>
                  prev === "report" ? "search" : "report"
                )
              }
              className={styles.reportButton}
            >
              {view === "report" ? "Volver a búsqueda" : "Ver reporte"}
            </button>
          )}

          <button
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            Cerrar sesión
          </button>
        </div>
      </div>

      {view === "report" ? (
        <ReportPage
          cliente={clienteCodigo}
          logoUrl={logoUrl}
          clienteNombre={clienteNombre}
          puedeVerReporte={puedeVerReporte}
          onOpenAnalytics={() => setView("analytics")}
        />
      ) : view === "analytics" ? (
        <ClientAnalyticsPage
          cliente={clienteCodigo}
          clienteNombre={clienteNombre}
          onBackToReport={() => setView("report")}
        />
      ) : (
        <>
          <form onSubmit={handleSearch} className={styles.form}>
            <input
              id="searchTerm"
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Escribe un nombre o apellido..."
              className={styles.searchInput}
              aria-label="Introduce un nombre o apellido para buscar"
            />
            <button type="submit" className={styles.searchButton}>
              Buscar
            </button>
          </form>

          {term.trim() !== "" && (
            <p className={styles.searchTermDisplay}>
              <strong>Criterio de búsqueda:</strong> {term}
            </p>
          )}

          <GlobalSummaryDisplay
            summary={globalSummary}
            total={globalTotal}
            loading={globalLoading}
            error={globalError}
          />

          {results.length > 0 && (
            <SummaryTable
              summary={summaryData}
              total={Object.values(summaryData).reduce(
                (acc, val) => acc + val,
                0
              )}
            />
          )}

          {loading && (
            <p className={styles.loading}>
              Buscando coincidencias…
            </p>
          )}
          {error && <p className={styles.error}>{error}</p>}

          {results.length > 0 && (
            <>
              <h3 className={styles.sectionTitle}>
                Detalle de Coincidencias (Ordenadas por Relevancia)
              </h3>
              <SearchResultsTable results={results} />
            </>
          )}

          {results.length === 0 &&
            term.trim() !== "" &&
            !loading && (
              <p className={styles.noResults}>
                No se encontraron coincidencias.
              </p>
            )}

          {results.length === 0 &&
            term.trim() === "" &&
            !loading &&
            !error && (
              <p className={styles.noResults}>
                Ingresa un término de búsqueda para comenzar.
              </p>
            )}
        </>
      )}
    </div>
  );
}
