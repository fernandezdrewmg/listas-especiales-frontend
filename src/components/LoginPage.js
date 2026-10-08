import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import Icon from "./Icon";
import BrandLogo from "./BrandLogo";
import AccessForm from "./AccessForm";
import RecoveryPasswordForm from "./RecoveryPasswordForm";
import styles from "./LoginPage.module.css";

export default function LoginPage({
  onLogin,
  recoveryMode,
  onPasswordChanged,
}) {
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => {
    const { data } = supabase.storage
      .from("logos_clientes")
      .getPublicUrl("ris3.jpg");
    if (data?.publicUrl) setLogoUrl(data.publicUrl);
  }, []);

  return (
    <div className={styles.root}>
      <aside className={styles.brandPanel}>
        <div className={styles.brand}>
          <span>
            <BrandLogo />
          </span>
          <div>
            <strong>Listas Especiales</strong>
            <small>INTELIGENCIA Y CONTROL</small>
          </div>
        </div>
        <div className={styles.brandContent}>
          <p className={styles.eyebrow}>CLARIDAD PARA CADA DECISIÓN</p>
          <h1>
            Información que
            <br />
            inspira <em>confianza.</em>
          </h1>
          <p className={styles.intro}>
            Un espacio para consultar listas especiales, analizar coincidencias
            y dar seguimiento a la actividad de su entidad.
          </p>
          <div className={styles.illustration} aria-hidden="true">
            <div className={styles.illustrationTop}>
              <span className={styles.miniDots}>
                <i />
                <i />
                <i />
              </span>
              <span>ESPACIO DE CONSULTA</span>
              <Icon name="shield" size={16} />
            </div>
            <div className={styles.mockSearch}>
              <Icon name="search" size={17} />
              <span>Consulta en listas especiales</span>
              <Icon name="arrow" size={16} />
            </div>
            <div className={styles.mockRow}>
              <span className={styles.mockIcon}>
                <Icon name="database" />
              </span>
              <div>
                <strong>Información centralizada</strong>
                <span>Listas y fuentes en un solo lugar</span>
              </div>
              <Icon name="check" size={17} />
            </div>
            <div className={styles.mockRow}>
              <span className={styles.mockIcon}>
                <Icon name="chart" />
              </span>
              <div>
                <strong>Una perspectiva completa</strong>
                <span>Consultas, reportes y seguimiento</span>
              </div>
              <Icon name="check" size={17} />
            </div>
          </div>
          <div className={styles.features}>
            <span>
              <Icon name="check" size={14} />
              Consulta ágil
            </span>
            <span>
              <Icon name="check" size={14} />
              Trazabilidad
            </span>
            <span>
              <Icon name="check" size={14} />
              Acceso por perfil
            </span>
          </div>
        </div>
        <p className={styles.brandFooter}>
          Debida diligencia · Cumplimiento · Control
        </p>
      </aside>
      <main className={styles.accessPanel}>
        <div className={styles.accessCard}>
          <div className={styles.accessBrand}>
            <BrandLogo src={logoUrl} alt="Logo institucional" />
          </div>
          <p className={styles.accessEyebrow}>ACCESO INSTITUCIONAL</p>
          {recoveryMode ? (
            <RecoveryPasswordForm onComplete={onPasswordChanged} />
          ) : (
            <AccessForm onLogin={onLogin} />
          )}
          <div className={styles.securityNote}>
            <Icon name="lock" size={17} />
            <p>
              Acceso exclusivo para usuarios autorizados.
              <br />
              Las opciones disponibles dependen de su perfil.
            </p>
          </div>
        </div>
        <span className={styles.accessFooter}>
          Listas Especiales · Plataforma de consulta
        </span>
      </main>
    </div>
  );
}
