import { useState, useRef } from "react";
import { supabase } from "../supabaseClient";
import PasswordFields from "./PasswordFields";
import { validateNewPassword, authErrorMessage } from "../auth/passwords";
import styles from "./LoginPage.module.css";
export default function RecoveryPasswordForm({ onComplete }) {
  const [password, setPassword] = useState(""),
    [confirmation, setConfirmation] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const pending = useRef(false);
  const submit = async (e) => {
    e.preventDefault();
    if (pending.current) return;
    setError("");
    const invalid = validateNewPassword(password, confirmation);
    if (invalid) {
      setError(invalid);
      return;
    }
    pending.current = true;
    setBusy(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });
      if (updateError)
        throw new Error(
          authErrorMessage(
            updateError,
            "El enlace ha vencido o no es válido. Solicite otro código de recuperación.",
          ),
        );
      setPassword("");
      setConfirmation("");
      await onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      pending.current = false;
      setBusy(false);
    }
  };
  return (
    <>
      <h2>Elija su nueva contraseña</h2>
      <p className={styles.accessIntro}>
        Complete la recuperación antes de volver a ingresar.
      </p>
      {error && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}
      <form onSubmit={submit}>
        <PasswordFields
          password={password}
          setPassword={setPassword}
          confirmation={confirmation}
          setConfirmation={setConfirmation}
          disabled={busy}
        />
        <button className={styles.submit} disabled={busy}>
          {busy ? "Guardando…" : "Guardar contraseña y volver al ingreso"}
        </button>
      </form>
      <div className={styles.accessActions}>
        <button disabled={busy} onClick={onComplete}>
          Cancelar y volver al ingreso
        </button>
      </div>
    </>
  );
}
