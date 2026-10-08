import BrandLogo from "./BrandLogo";
import styles from "./SearchPage.module.css";

// La cobertura de la base se imprime completa, incluidas las listas sin coincidencias.
export default function PrintSearchSummary({
  summary,
  matches,
  loading,
  error,
  lastUpdateDate,
  clienteNombre,
  usuarioEmail,
  logoUrl,
}) {
  const formatNumber = (value) => new Intl.NumberFormat("es-BO").format(value);
  const rows = [...(summary || [])].sort((a, b) =>
    String(a.codigo).localeCompare(String(b.codigo), "es"),
  );
  const totalRecords = rows.reduce(
    (sum, row) => sum + Number(row.count || 0),
    0,
  );
  const totalMatches = Object.values(matches || {}).reduce(
    (sum, count) => sum + count,
    0,
  );

  return (
    <section
      className={`${styles.onlyPrint} ${styles.printCoverage}`}
      aria-label="Resumen impreso de listas consultadas"
    >
      <div className={styles.printIdentity}>
        <BrandLogo
          src={logoUrl}
          alt={`Logo de ${clienteNombre || "la entidad"}`}
        />
        <div>
          <strong>{clienteNombre || "Listas Especiales"}</strong>
          <p>Usuario: {usuarioEmail}</p>
        </div>
      </div>
      <h3>Resumen de listas consultadas</h3>
      <p>Actualización de la base: {lastUpdateDate || "No disponible"}.</p>
      {loading || error || rows.length === 0 ? (
        <p>
          {loading
            ? "El resumen de listas todavía se está cargando. Vuelva a imprimir cuando termine la carga."
            : "El resumen de listas no está disponible. No se pudo verificar la cantidad de registros de la base."}
        </p>
      ) : (
        <>
          <table className={styles.printCoverageTable}>
            <thead>
              <tr>
                <th scope="col">Código / Lista</th>
                <th scope="col">Registros en la base</th>
                <th scope="col">Coincidencias de la consulta</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.codigo}>
                  <th scope="row">{row.codigo}</th>
                  <td>{formatNumber(Number(row.count || 0))}</td>
                  <td>
                    {formatNumber(matches?.[String(row.codigo).trim()] || 0)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                <td>{formatNumber(totalRecords)}</td>
                <td>{formatNumber(totalMatches)}</td>
              </tr>
            </tfoot>
          </table>
          <p className={styles.printCoverageNote}>
            Los registros en la base corresponden a la cobertura disponible. Las
            coincidencias corresponden al criterio consultado, antes de aplicar
            filtros de visualización.
          </p>
        </>
      )}
    </section>
  );
}
