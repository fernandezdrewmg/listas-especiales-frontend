// src/components/SearchPage.js
import { useState, useEffect, useRef } from "react";
import { supabase } from "../supabaseClient";
import styles from "./SearchPage.module.css";
import { useSearch } from "../hooks/useSearch";
import { useGlobalSummary } from "../hooks/useGlobalSummary";
import SearchResultsTable from "./SearchResultsTable";
import GlobalSummaryDisplay from "./GlobalSummaryDisplay";
import ReportPage from "./ReportPage";
import ClientAnalyticsPage from "./ClientAnalyticsPage";
import Icon from "./Icon";
import BrandLogo from "./BrandLogo";
import PrintSearchSummary from "./PrintSearchSummary";
import ChangePassword from "./ChangePassword";

export default function SearchPage({ onLogout }) {
  const [term, setTerm] = useState("");
  const [submittedTerm, setSubmittedTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const searchRef = useRef(null);
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

  const criterioActual = term.trim();

  const totalCoincidencias = Object.values(summaryData || {}).reduce(
    (acc, val) => acc + val,
    0,
  );

  const views = {
    account: {
      title: "Mi cuenta",
      description: "Administre la contraseña de su acceso.",
    },
    search: {
      title: "Consultas",
      description: "Información relevante para decisiones con respaldo.",
    },
    coverage: {
      title: "Cobertura de listas",
      description:
        "Conozca la composición y actualización de su base de consulta.",
    },
    report: {
      title: "Reportes",
      description: "Consulte, filtre y exporte la actividad de su entidad.",
    },
    analytics: {
      title: "Análisis histórico",
      description: "Una visión de la actividad y las tendencias de su entidad.",
    },
  };
  const activeView =
    !puedeVerReporte && ["report", "analytics"].includes(view)
      ? "search"
      : view;
  const navigate = (next) => {
    setView(next);
    setMenuOpen(false);
  };
  const number = (value) => new Intl.NumberFormat("es-BO").format(value);

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

  // Estadísticas de búsquedas del usuario: mes actual + última consulta
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
        59,
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
          }),
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

      logoutTimeoutId = setTimeout(
        () => {
          supabase.auth.signOut().then(() => {
            onLogout();
          });
        },
        2 * 60 * 1000,
      );
    };

    const eventos = ["mousemove", "keydown", "scroll", "click"];

    eventos.forEach((evento) => window.addEventListener(evento, resetTimers));

    resetTimers();

    return () => {
      eventos.forEach((evento) =>
        window.removeEventListener(evento, resetTimers),
      );

      clearTimeout(warningTimeoutId);
      clearTimeout(logoutTimeoutId);
    };
  }, [onLogout]);

  // Ejecutar búsqueda
  const handleSearch = async (e) => {
    e.preventDefault();

    if (criterioActual === "" || !usuarioEmail || loading || pendingRegister)
      return;

    setSubmittedTerm(criterioActual);
    const succeeded = await executeSearch(criterioActual);
    if (succeeded) setPendingRegister(true);
  };

  // Registrar búsqueda
  useEffect(() => {
    if (pendingRegister && summaryData && usuarioEmail) {
      const totalCoincidenciasLocal = Object.values(summaryData).reduce(
        (acc, val) => acc + val,
        0,
      );

      const fechaBolivia = new Date(
        Date.now() - 4 * 60 * 60 * 1000,
      ).toISOString();

      let fuenteResumen = null;

      if (totalCoincidenciasLocal > 0 && results.length > 0) {
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
                criterio: submittedTerm,
                cantidad_resultados: totalCoincidenciasLocal,
                fuente: fuenteResumen,
                fecha: fechaBolivia,
              },
            ]);

          if (insertError) {
            console.error(
              "❌ Error al registrar búsqueda:",
              insertError.message,
            );
          } else {
            console.log("✅ Búsqueda registrada en Supabase");
          }
        } catch (err) {
          console.error("⚠️ Error inesperado al registrar búsqueda:", err);
        }

        setPendingRegister(false);
      };

      registrarBusqueda();
    }
  }, [summaryData, pendingRegister, usuarioEmail, submittedTerm, results]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
  };

  return (
    <div className={styles.appShell}>
      <a href="#main-content" className={styles.skipLink}>
        Ir al contenido
      </a>
      <aside className={styles.sidebar} aria-label="Navegación principal">
        <div className={styles.brand}>
          <span className={styles.brandMark}>
            <BrandLogo />
          </span>
          <div>
            <strong>Listas Especiales</strong>
            <span>INTELIGENCIA Y CONTROL</span>
          </div>
          <button
            className={styles.menuToggle}
            aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={menuOpen}
            aria-controls="workspace-navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </div>
        <div
          id="workspace-navigation"
          className={menuOpen ? styles.navigationOpen : styles.navigation}
        >
          <p className={styles.navLabel}>ESPACIO DE TRABAJO</p>
          <nav className={styles.navList}>
            <button
              className={
                activeView === "search" ? styles.navActive : styles.navItem
              }
              aria-current={activeView === "search" ? "page" : undefined}
              onClick={() => navigate("search")}
            >
              <Icon name="search" />
              Consultas
              <Icon name="chevron" size={14} />
            </button>
            <button
              className={
                activeView === "coverage" ? styles.navActive : styles.navItem
              }
              aria-current={activeView === "coverage" ? "page" : undefined}
              onClick={() => navigate("coverage")}
            >
              <Icon name="database" />
              Cobertura de listas
            </button>
            {puedeVerReporte && (
              <>
                <p className={styles.navLabel}>GESTIÓN Y SEGUIMIENTO</p>
                <button
                  className={
                    activeView === "report" ? styles.navActive : styles.navItem
                  }
                  aria-current={activeView === "report" ? "page" : undefined}
                  onClick={() => navigate("report")}
                >
                  <Icon name="report" />
                  Reportes
                </button>
                <button
                  className={
                    activeView === "analytics"
                      ? styles.navActive
                      : styles.navItem
                  }
                  aria-current={activeView === "analytics" ? "page" : undefined}
                  onClick={() => navigate("analytics")}
                >
                  <Icon name="chart" />
                  Análisis histórico
                </button>
              </>
            )}
            <button
              className={
                activeView === "account" ? styles.navActive : styles.navItem
              }
              onClick={() => navigate("account")}
              aria-current={activeView === "account" ? "page" : undefined}
            >
              <Icon name="lock" />
              Mi cuenta
            </button>
          </nav>
          <div className={styles.sidebarNote}>
            <Icon name="shield" size={22} />
            <strong>Su espacio de consulta</strong>
            <p>
              Información centralizada para apoyar la debida diligencia de su
              entidad.
            </p>
          </div>
          <div className={styles.profile}>
            <span className={styles.avatar}>
              {usuarioEmail ? usuarioEmail.slice(0, 2).toUpperCase() : "…"}
            </span>
            <div>
              <strong>{clienteNombre || "Cargando entidad…"}</strong>
              <span title={usuarioEmail}>
                {usuarioEmail || "Validando usuario…"}
              </span>
              <small>
                {puedeVerReporte ? "Consultas y reportes" : "Consultas"}
              </small>
            </div>
          </div>
          <button className={styles.signOut} onClick={handleLogout}>
            <Icon name="logout" size={18} />
            Cerrar sesión
          </button>
        </div>
      </aside>
      <div className={styles.workspace}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            Espacio de trabajo <Icon name="chevron" size={13} />
            <strong>{views[activeView].title}</strong>
          </div>
          <div className={styles.topbarEntity}>
            <BrandLogo
              src={logoUrl}
              alt={`Logo de ${clienteNombre || "la entidad"}`}
              className={styles.entityLogo}
            />
            <span>{clienteNombre || "Listas Especiales"}</span>
            <span className={styles.sessionBadge}>
              <i />
              Sesión activa
            </span>
          </div>
        </header>
        <main id="main-content" className={styles.container} tabIndex={-1}>
          {showInactivityWarning && (
            <div className={styles.inactivityWarning} role="alert">
              <Icon name="clock" />
              <div>
                <strong>Su sesión está por cerrarse</strong>
                <p>
                  Quedan 30 segundos por inactividad. Mueva el mouse o presione
                  una tecla para continuar.
                </p>
              </div>
            </div>
          )}
          <div className={styles.pageHeading}>
            <div>
              <p className={styles.eyebrow}>PLATAFORMA DE DEBIDA DILIGENCIA</p>
              <h1>{views[activeView].title}</h1>
              <p>{views[activeView].description}</p>
            </div>
            <span className={styles.dateLabel}>
              <Icon name="clock" size={16} />
              {fechaActual}
            </span>
          </div>
          {activeView === "account" ? (
            <ChangePassword />
          ) : activeView === "report" && puedeVerReporte ? (
            <ReportPage
              cliente={clienteCodigo}
              logoUrl={logoUrl}
              clienteNombre={clienteNombre}
              puedeVerReporte={puedeVerReporte}
              onOpenAnalytics={() => navigate("analytics")}
            />
          ) : activeView === "analytics" && puedeVerReporte ? (
            <ClientAnalyticsPage
              cliente={clienteCodigo}
              clienteNombre={clienteNombre}
              onBackToReport={() => navigate("report")}
            />
          ) : activeView === "coverage" ? (
            <GlobalSummaryDisplay
              summary={globalSummary}
              total={globalTotal}
              loading={globalLoading}
              error={globalError}
              lastUpdateDate={globalLastUpdateDate}
            />
          ) : (
            <>
              <div className={styles.statGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>
                    <Icon name="database" />
                  </span>
                  <span>Registros en la base</span>
                  <strong>
                    {globalLoading
                      ? "—"
                      : globalError
                        ? "N/D"
                        : number(globalTotal)}
                  </strong>
                  <small>
                    {globalLoading
                      ? "Cargando cobertura"
                      : globalError
                        ? "Base no disponible"
                        : number(globalSummary.length) + " listas disponibles"}
                  </small>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>
                    <Icon name="search" />
                  </span>
                  <span>Mis consultas del mes</span>
                  <strong>{number(consultasMesActual)}</strong>
                  <small>Actividad de su usuario</small>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statIcon}>
                    <Icon name="clock" />
                  </span>
                  <span>Última consulta registrada</span>
                  <strong className={styles.statDate}>
                    {ultimaConsulta || "Sin actividad"}
                  </strong>
                  <small>Registro de su usuario</small>
                </div>
              </div>
              <section
                className={styles.searchPanel}
                aria-labelledby="search-heading"
              >
                <div className={styles.panelHeading}>
                  <div>
                    <span className={styles.eyebrow}>CONSULTA INDIVIDUAL</span>
                    <h2 id="search-heading">¿A quién desea consultar?</h2>
                    <p>
                      Ingrese un nombre, apellido o denominación para buscar
                      coincidencias.
                    </p>
                  </div>
                  <span className={styles.panelEmblem}>
                    <Icon name="search" size={28} />
                  </span>
                </div>
                <form onSubmit={handleSearch} className={styles.form}>
                  <label className={styles.searchField} htmlFor="searchTerm">
                    <Icon name="search" />
                    <span className={styles.srOnly}>
                      Nombre, apellido o denominación
                    </span>
                    <input
                      ref={searchRef}
                      id="searchTerm"
                      type="search"
                      value={term}
                      onChange={(e) => setTerm(e.target.value)}
                      placeholder="Escriba un nombre o denominación…"
                      autoComplete="off"
                      disabled={loading || pendingRegister}
                    />
                  </label>
                  <button
                    type="submit"
                    className={styles.searchButton}
                    disabled={
                      loading ||
                      pendingRegister ||
                      criterioActual === "" ||
                      !usuarioEmail
                    }
                  >
                    {loading ? "Consultando…" : "Buscar coincidencias"}
                    <Icon name="arrow" size={17} />
                  </button>
                </form>
                <div className={styles.searchMeta}>
                  <span>
                    <Icon name="clock" size={14} />
                    Actualización de la base:{" "}
                    <strong>{globalLastUpdateDate || "Cargando…"}</strong>
                  </span>
                  <button
                    type="button"
                    className={styles.textButton}
                    onClick={() => navigate("coverage")}
                  >
                    Ver cobertura
                    <Icon name="arrow" size={14} />
                  </button>
                </div>
              </section>
              {loading ? (
                <div className={styles.emptyState} role="status">
                  <span className={styles.spinner} />
                  <h3>Consultando listas especiales</h3>
                  <p>Estamos buscando coincidencias para “{submittedTerm}”.</p>
                </div>
              ) : error ? (
                <div className={styles.error} role="alert">
                  {error}
                </div>
              ) : submittedTerm ? (
                <section
                  className={styles.resultsSection}
                  aria-label="Resultados de la consulta"
                >
                  <div className={styles.resultHeading}>
                    <div>
                      <p className={styles.eyebrow}>RESULTADO DE LA CONSULTA</p>
                      <h2>
                        {number(totalCoincidencias)}{" "}
                        {totalCoincidencias === 1
                          ? "coincidencia"
                          : "coincidencias"}
                      </h2>
                      <p>
                        Criterio consultado: <strong>{submittedTerm}</strong>
                      </p>
                    </div>
                    <span className={styles.resultBadge}>
                      {Object.keys(summaryData).length} listas con resultados
                    </span>
                  </div>
                  <PrintSearchSummary
                    summary={globalSummary}
                    matches={summaryData}
                    loading={globalLoading}
                    error={globalError}
                    lastUpdateDate={globalLastUpdateDate}
                    clienteNombre={clienteNombre}
                    usuarioEmail={usuarioEmail}
                    logoUrl={logoUrl}
                  />
                  {results.length > 0 ? (
                    <SearchResultsTable results={results} />
                  ) : (
                    <div className={styles.emptyState}>
                      <span className={styles.emptyIcon}>
                        <Icon name="check" size={28} />
                      </span>
                      <h3>Sin coincidencias</h3>
                      <p>
                        No se encontraron registros para el criterio consultado.
                      </p>
                      <button
                        className={styles.textButton}
                        onClick={() => searchRef.current?.focus()}
                      >
                        Consultar otro nombre
                        <Icon name="arrow" size={15} />
                      </button>
                    </div>
                  )}
                </section>
              ) : (
                <section className={styles.emptyState}>
                  <span className={styles.emptyIcon}>
                    <Icon name="search" size={29} />
                  </span>
                  <h3>Su próxima consulta empieza aquí</h3>
                  <p>
                    Los resultados mostrarán las listas relacionadas,
                    <br />
                    el detalle de cada registro y su relevancia.
                  </p>
                  <div className={styles.emptySteps}>
                    <span>01 · Ingrese un criterio</span>
                    <span>02 · Revise coincidencias</span>
                    <span>03 · Consulte el detalle</span>
                  </div>
                </section>
              )}
            </>
          )}
          <footer className={styles.workspaceFooter}>
            <span>Listas Especiales · Información para decidir</span>
            <span>
              <Icon name="lock" size={13} />
              Acceso institucional
            </span>
          </footer>
        </main>
      </div>
    </div>
  );
}
