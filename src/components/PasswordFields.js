import { useState } from "react";
import Icon from "./Icon";
import styles from "./LoginPage.module.css";
import { PASSWORD_MIN_LENGTH } from "../auth/passwords";
export default function PasswordFields({
  password,
  setPassword,
  confirmation,
  setConfirmation,
  disabled,
  prefix = "new",
}) {
  const [visible, setVisible] = useState(false);
  return (
    <>
      <label htmlFor={prefix + "-password"}>Nueva contraseña</label>
      <div className={styles.passwordField}>
        <input
          id={prefix + "-password"}
          type={visible ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={disabled}
          aria-describedby={prefix + "-hint"}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          disabled={disabled}
          aria-label={
            visible ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"
          }
          aria-pressed={visible}
        >
          <Icon name="eye" size={19} />
        </button>
      </div>
      <p id={prefix + "-hint"} className={styles.fieldHint}>
        Al menos 10 caracteres. Puede utilizar una frase fácil de recordar.
      </p>
      <label htmlFor={prefix + "-confirmation"}>
        Confirmar nueva contraseña
      </label>
      <input
        id={prefix + "-confirmation"}
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        required
        minLength={PASSWORD_MIN_LENGTH}
        maxLength={128}
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        disabled={disabled}
      />
    </>
  );
}
