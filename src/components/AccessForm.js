import { useEffect, useRef, useState } from "react";
import { accessClient, supabase } from "../supabaseClient";
import PasswordFields from "./PasswordFields";
import Icon from "./Icon";
import { validateNewPassword, authErrorMessage } from "../auth/passwords";
import styles from "./LoginPage.module.css";

const titles = {
  login: "Bienvenido de nuevo",
  activate: "Active su cuenta",
  signupCode: "Verifique su correo",
  recover: "Recupere su acceso",
  recoveryCode: "Verifique su correo",
  reset: "Elija su nueva contraseña",
};
export default function AccessForm({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [token, setToken] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const pending = useRef(false);
  const heading = useRef(null);
  const normalizedEmail = email.trim().toLowerCase();
  useEffect(() => {
    if (mode !== "login") heading.current?.focus();
  }, [mode]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);
  useEffect(
    () => () => {
      accessClient.auth.signOut({ scope: "local" }).catch(() => {});
    },
    [],
  );

  const switchMode = async (next) => {
    if (pending.current) return;
    setError("");
    setNotice("");
    setPassword("");
    setConfirmation("");
    setToken("");
    setVisible(false);
    await accessClient.auth.signOut({ scope: "local" });
    setMode(next);
  };
  const requireFeature = async (feature) => {
    const { data, error: configError } = await supabase.rpc(
      "listas_auth_configuration",
    );
    if (configError || data?.[feature] !== true)
      throw new Error(
        "Este servicio todavía no está habilitado. Contacte al administrador.",
      );
  };
  const sendRecovery = async () => {
    await requireFeature("recoveryEnabled");
    const { error: requestError } =
      await accessClient.auth.resetPasswordForEmail(normalizedEmail);
    if (requestError)
      throw new Error(
        authErrorMessage(
          requestError,
          "No fue posible enviar el código. Intente más tarde o contacte al administrador.",
        ),
      );
    setMode("recoveryCode");
    setCooldown(60);
    setNotice(
      "Si el correo corresponde a una cuenta, recibirá un código. Revise también la carpeta de spam.",
    );
  };
  const submit = async (e) => {
    e.preventDefault();
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (mode === "login") {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (authError)
          throw new Error(
            authErrorMessage(
              authError,
              "Correo o contraseña incorrectos. Si olvidó su contraseña, use la opción de recuperación o contacte al administrador.",
            ),
          );
        setPassword("");
        await onLogin?.();
      } else if (mode === "activate") {
        const invalid = validateNewPassword(password, confirmation);
        if (invalid) throw new Error(invalid);
        await requireFeature("activationEnabled");
        const { data, error: signupError } = await accessClient.auth.signUp({
          email: normalizedEmail,
          password,
        });
        setPassword("");
        setConfirmation("");
        if (signupError)
          throw new Error(
            authErrorMessage(
              signupError,
              "No fue posible activar la cuenta. Verifique que su administrador haya registrado el correo; si ya tiene cuenta, ingrese o recupere su contraseña.",
            ),
          );
        if (data?.session) {
          await accessClient.auth.signOut({ scope: "local" });
          throw new Error(
            "La verificación por correo requiere configuración del administrador.",
          );
        }
        setMode("signupCode");
        setCooldown(60);
        setNotice(
          "Si su correo está autorizado, recibirá un código. Si ya tiene una cuenta, vuelva a ingresar o recupere su contraseña.",
        );
      } else if (mode === "recover") {
        await sendRecovery();
      } else if (mode === "signupCode" || mode === "recoveryCode") {
        if (!/^\d{6,10}$/.test(token.trim()))
          throw new Error("Ingrese el código numérico recibido por correo.");
        const { data, error: verifyError } = await accessClient.auth.verifyOtp({
          email: normalizedEmail,
          token: token.trim(),
          type: mode === "signupCode" ? "signup" : "recovery",
        });
        if (verifyError || !data?.session)
          throw new Error(
            authErrorMessage(
              verifyError,
              "El código es inválido o ha vencido. Solicite uno nuevo.",
            ),
          );
        setToken("");
        if (mode === "signupCode") {
          await accessClient.auth.signOut({ scope: "local" });
          setMode("login");
          setNotice(
            "Su cuenta está activada. Ingrese con la contraseña que eligió.",
          );
        } else setMode("reset");
      } else if (mode === "reset") {
        const invalid = validateNewPassword(password, confirmation);
        if (invalid) throw new Error(invalid);
        const { error: updateError } = await accessClient.auth.updateUser({
          password,
        });
        if (updateError)
          throw new Error(
            authErrorMessage(
              updateError,
              "No se pudo cambiar la contraseña. Solicite otro código o contacte al administrador.",
            ),
          );
        await accessClient.auth.signOut({ scope: "local" });
        setPassword("");
        setConfirmation("");
        setMode("login");
        setNotice("Contraseña actualizada. Ingrese con su nueva contraseña.");
      }
    } catch (err) {
      setError(
        err.message ||
          "No fue posible completar la solicitud. Contacte al administrador.",
      );
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const resend = async () => {
    if (pending.current || cooldown) return;
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      if (mode === "recoveryCode") await sendRecovery();
      else {
        await requireFeature("activationEnabled");
        const { error: resendError } = await accessClient.auth.resend({
          type: "signup",
          email: normalizedEmail,
        });
        if (resendError)
          throw new Error(
            authErrorMessage(
              resendError,
              "No se pudo reenviar el código. Contacte al administrador.",
            ),
          );
        setCooldown(60);
        setNotice("Si corresponde, recibirá un nuevo código de activación.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  const isCode = mode === "signupCode" || mode === "recoveryCode";
  const labels = {
    login: "Ingresar a la plataforma",
    activate: "Crear cuenta y enviar código",
    recover: "Enviar código de recuperación",
    signupCode: "Activar cuenta",
    recoveryCode: "Verificar código",
    reset: "Guardar nueva contraseña",
  };
  return (
    <>
      <h2 ref={heading} tabIndex={-1}>
        {titles[mode]}
      </h2>
      <p className={styles.accessIntro}>
        {mode === "login"
          ? "Ingrese a su espacio de trabajo."
          : mode === "activate"
            ? "Utilice el correo registrado por su administrador y elija su contraseña."
            : isCode
              ? "Ingrese el código recibido en " + normalizedEmail + "."
              : mode === "reset"
                ? "La contraseña se actualizará para su cuenta."
                : "Le enviaremos un código para establecer otra contraseña."}
      </p>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      {notice && (
        <div className={styles.success} role="status">
          {notice}
        </div>
      )}
      <form onSubmit={submit}>
        {["login", "activate", "recover"].includes(mode) && (
          <>
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="username"
              placeholder="usuario@entidad.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={busy}
            />
          </>
        )}
        {mode === "login" && (
          <>
            <label htmlFor="password">Contraseña</label>
            <div className={styles.passwordField}>
              <input
                id="password"
                type={visible ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={busy}
                placeholder="Ingrese su contraseña"
              />
              <button
                type="button"
                onClick={() => setVisible(!visible)}
                disabled={busy}
                aria-label={
                  visible ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={visible}
              >
                <Icon name="eye" size={19} />
              </button>
            </div>
          </>
        )}
        {(mode === "activate" || mode === "reset") && (
          <PasswordFields
            password={password}
            setPassword={setPassword}
            confirmation={confirmation}
            setConfirmation={setConfirmation}
            disabled={busy}
          />
        )}
        {isCode && (
          <>
            <label htmlFor="email-code">Código de verificación</label>
            <input
              id="email-code"
              className={styles.codeInput}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              minLength={6}
              maxLength={10}
              required
              value={token}
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
              disabled={busy}
            />
          </>
        )}
        <button type="submit" disabled={busy} className={styles.submit}>
          {busy ? "Procesando…" : labels[mode]}
          <Icon name="arrow" size={18} />
        </button>
      </form>
      <div className={styles.accessActions}>
        {mode === "login" ? (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => switchMode("activate")}
            >
              Primer acceso
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => switchMode("recover")}
            >
              Olvidé mi contraseña
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => switchMode("login")}
            >
              Volver al ingreso
            </button>
            {isCode && (
              <button
                type="button"
                disabled={busy || cooldown > 0}
                onClick={resend}
              >
                {cooldown
                  ? "Reenviar en " + cooldown + " s"
                  : "Reenviar código"}
              </button>
            )}
          </>
        )}
      </div>
      <p className={styles.supportHint}>
        Si no puede acceder a su correo o necesita ayuda, contacte al
        administrador de su entidad.
      </p>
    </>
  );
}
