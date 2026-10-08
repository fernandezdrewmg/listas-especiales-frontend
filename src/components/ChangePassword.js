import { useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import { validateNewPassword, authErrorMessage } from "../auth/passwords";
import PasswordFields from "./PasswordFields";
import styles from "./LoginPage.module.css";
export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const pending = useRef(false);
  const submit = async (e) => {
    e.preventDefault();
    if (pending.current) return;
    setError("");
    setNotice("");
    const invalid = validateNewPassword(password, confirmation);
    if (invalid) {
      setError(invalid);
      return;
    }
    if (current === password) {
      setError("Elija una contraseña distinta de la actual.");
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      const { data: currentUser, error: userError } =
        await supabase.auth.getUser();
      if (userError || !currentUser?.user?.email)
        throw new Error("La sesión ha vencido. Vuelva a ingresar.");
      const { data: verified, error: verifyError } =
        await supabase.auth.signInWithPassword({
          email: currentUser.user.email,
          password: current,
        });
      if (verifyError || verified?.user?.id !== currentUser.user.id)
        throw new Error(
          authErrorMessage(
            verifyError,
            "La contraseña actual es incorrecta. Si no la recuerda, contacte al administrador o recupérela desde el ingreso.",
          ),
        );
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError)
        throw new Error(
          authErrorMessage(
            updateError,
            "No se pudo actualizar la contraseña. Contacte al administrador.",
          ),
        );
      setCurrent("");
      setPassword("");
      setConfirmation("");
      setNotice("Su contraseña fue actualizada correctamente.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      pending.current = false;
    }
  };
  return (
    <section
      className={styles.accessCard + " " + styles.accountCard}
      aria-label="Cambiar contraseña"
    >
      <h2>Cambiar contraseña</h2>
      <p className={styles.accessIntro}>
        Confirme su contraseña actual y elija una nueva.
      </p>
      {error && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className={styles.success}>
          {notice}
        </div>
      )}
      <form onSubmit={submit}>
        <label htmlFor="current-password">Contraseña actual</label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          required
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          disabled={busy}
        />
        <PasswordFields
          password={password}
          setPassword={setPassword}
          confirmation={confirmation}
          setConfirmation={setConfirmation}
          disabled={busy}
          prefix="account"
        />
        <button className={styles.submit} disabled={busy}>
          {busy ? "Actualizando…" : "Actualizar contraseña"}
        </button>
      </form>
    </section>
  );
}
