export const PASSWORD_MIN_LENGTH = 10;
export function validateNewPassword(password, confirmation) {
  if (password.length < PASSWORD_MIN_LENGTH)
    return "Use una contraseña de al menos 10 caracteres.";
  if (password.length > 128)
    return "Use una contraseña de hasta 128 caracteres.";
  if (password !== confirmation) return "Las contraseñas no coinciden.";
  return "";
}
export function authErrorMessage(error, fallback) {
  if (
    error?.status === 429 ||
    ["over_request_rate_limit", "over_email_send_rate_limit"].includes(
      error?.code,
    )
  )
    return "Ha realizado varios intentos. Espere unos minutos antes de volver a intentar.";
  if (["otp_expired", "otp_disabled"].includes(error?.code))
    return "El código es inválido o ha vencido. Solicite uno nuevo.";
  if (error?.code === "weak_password")
    return "Elija una contraseña más segura, distinta de contraseñas comunes.";
  if (error?.code === "same_password")
    return "La nueva contraseña debe ser distinta de la anterior.";
  return fallback;
}
