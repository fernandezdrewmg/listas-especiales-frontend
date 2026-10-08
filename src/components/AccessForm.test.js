import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccessForm from "./AccessForm";
import ChangePassword from "./ChangePassword";
import { accessClient, supabase } from "../supabaseClient";
jest.mock("../supabaseClient", () => ({
  supabase: {
    rpc: jest.fn(),
    auth: {
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
      updateUser: jest.fn(),
    },
  },
  accessClient: {
    auth: {
      signOut: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      verifyOtp: jest.fn(),
      updateUser: jest.fn(),
      resend: jest.fn(),
    },
  },
}));
beforeEach(() => {
  jest.clearAllMocks();
  supabase.rpc.mockResolvedValue({
    data: { activationEnabled: true, recoveryEnabled: true },
  });
  supabase.auth.signInWithPassword.mockResolvedValue({
    data: { user: { id: "user-1" } },
  });
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { id: "user-1", email: "persona@example.com" } },
  });
  supabase.auth.updateUser.mockResolvedValue({ error: null });
  accessClient.auth.signOut.mockResolvedValue({ error: null });
  accessClient.auth.signUp.mockResolvedValue({
    data: { user: { id: "user-1" }, session: null },
    error: null,
  });
  accessClient.auth.resetPasswordForEmail.mockResolvedValue({ error: null });
  accessClient.auth.verifyOtp.mockResolvedValue({
    data: { session: { user: { id: "user-1" } } },
    error: null,
  });
  accessClient.auth.updateUser.mockResolvedValue({ error: null });
});
const fill = (label, value) =>
  fireEvent.change(screen.getByLabelText(label, { exact: true }), {
    target: { value },
  });
const newPasswords = () => {
  fill("Nueva contraseña", "Frase privada 2026!");
  fill("Confirmar nueva contraseña", "Frase privada 2026!");
};
async function activate() {
  fireEvent.click(screen.getByRole("button", { name: "Primer acceso" }));
  await screen.findByRole("heading", { name: "Active su cuenta" });
  fill("Correo electrónico", "Persona@example.com");
  newPasswords();
  fireEvent.click(
    screen.getByRole("button", { name: "Crear cuenta y enviar código" }),
  );
}
async function recover() {
  fireEvent.click(screen.getByRole("button", { name: "Olvidé mi contraseña" }));
  await screen.findByRole("heading", { name: "Recupere su acceso" });
  fill("Correo electrónico", "persona@example.com");
  fireEvent.click(
    screen.getByRole("button", { name: "Enviar código de recuperación" }),
  );
  await screen.findByLabelText("Código de verificación");
}

test("una contraseña incorrecta nunca crea una cuenta y ofrece ayuda administrativa", async () => {
  supabase.auth.signInWithPassword.mockResolvedValue({
    error: { code: "invalid_credentials" },
  });
  render(<AccessForm />);
  fill("Correo electrónico", "persona@example.com");
  fill("Contraseña", "incorrecta");
  fireEvent.click(
    screen.getByRole("button", { name: "Ingresar a la plataforma" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "contacte al administrador",
  );
  expect(accessClient.auth.signUp).not.toHaveBeenCalled();
});
test("no permite crear cuentas mientras falta configurar el control del servidor", async () => {
  supabase.rpc.mockResolvedValue({ data: null, error: { code: "PGRST202" } });
  render(<AccessForm />);
  await activate();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "todavía no está habilitado",
  );
  expect(accessClient.auth.signUp).not.toHaveBeenCalled();
});
test("activa por código sin abrir una sesión global ni enviar roles desde el navegador", async () => {
  const onLogin = jest.fn();
  render(<AccessForm onLogin={onLogin} />);
  await activate();
  await screen.findByLabelText("Código de verificación");
  expect(accessClient.auth.signUp).toHaveBeenCalledWith({
    email: "persona@example.com",
    password: "Frase privada 2026!",
  });
  expect(onLogin).not.toHaveBeenCalled();
  expect(screen.getByRole("button", { name: /Reenviar en/ })).toBeDisabled();
  fill("Código de verificación", "123456");
  fireEvent.click(screen.getByRole("button", { name: "Activar cuenta" }));
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Su cuenta está activada",
  );
  expect(accessClient.auth.verifyOtp).toHaveBeenCalledWith({
    email: "persona@example.com",
    token: "123456",
    type: "signup",
  });
  expect(onLogin).not.toHaveBeenCalled();
  expect(supabase.auth.signInWithPassword).not.toHaveBeenCalled();
});
test("rechaza una activación si el servidor desactivó la confirmación por correo", async () => {
  accessClient.auth.signUp.mockResolvedValue({
    data: { session: { user: { id: "u" } } },
  });
  render(<AccessForm />);
  await activate();
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "verificación por correo requiere configuración",
  );
  expect(
    screen.queryByLabelText("Código de verificación"),
  ).not.toBeInTheDocument();
});
test("un código vencido no permite establecer contraseña", async () => {
  accessClient.auth.verifyOtp.mockResolvedValue({
    error: { code: "otp_expired" },
  });
  render(<AccessForm />);
  await recover();
  fill("Código de verificación", "123456");
  fireEvent.click(screen.getByRole("button", { name: "Verificar código" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("ha vencido");
  expect(accessClient.auth.updateUser).not.toHaveBeenCalled();
  expect(screen.queryByLabelText("Nueva contraseña")).not.toBeInTheDocument();
});
test("recupera en el mismo formulario con una sesión aislada y exige confirmación de contraseña", async () => {
  render(<AccessForm />);
  await recover();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Si el correo corresponde a una cuenta",
  );
  fill("Código de verificación", "123456");
  fireEvent.click(screen.getByRole("button", { name: "Verificar código" }));
  await screen.findByLabelText("Nueva contraseña");
  expect(accessClient.auth.verifyOtp).toHaveBeenCalledWith({
    email: "persona@example.com",
    token: "123456",
    type: "recovery",
  });
  newPasswords();
  fill("Confirmar nueva contraseña", "Otra contraseña distinta");
  fireEvent.click(
    screen.getByRole("button", { name: "Guardar nueva contraseña" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("no coinciden");
  expect(accessClient.auth.updateUser).not.toHaveBeenCalled();
  fill("Confirmar nueva contraseña", "Frase privada 2026!");
  fireEvent.click(
    screen.getByRole("button", { name: "Guardar nueva contraseña" }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "Contraseña actualizada",
  );
  expect(accessClient.auth.updateUser).toHaveBeenCalledWith({
    password: "Frase privada 2026!",
  });
  expect(supabase.auth.updateUser).not.toHaveBeenCalled();
});
test("dos envíos simultáneos no duplican las solicitudes de recuperación", async () => {
  let finish;
  accessClient.auth.resetPasswordForEmail.mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  render(<AccessForm />);
  fireEvent.click(screen.getByRole("button", { name: "Olvidé mi contraseña" }));
  await screen.findByRole("heading", { name: "Recupere su acceso" });
  fill("Correo electrónico", "persona@example.com");
  const form = screen
    .getByRole("button", { name: "Enviar código de recuperación" })
    .closest("form");
  fireEvent.submit(form);
  fireEvent.submit(form);
  await waitFor(() =>
    expect(accessClient.auth.resetPasswordForEmail).toHaveBeenCalledTimes(1),
  );
  finish({ error: null });
  await screen.findByLabelText("Código de verificación");
});
test("el cambio dentro de la sesión verifica primero la contraseña actual", async () => {
  supabase.auth.signInWithPassword.mockResolvedValue({
    error: { code: "invalid_credentials" },
  });
  render(<ChangePassword />);
  fill("Contraseña actual", "anterior");
  newPasswords();
  fireEvent.click(
    screen.getByRole("button", { name: "Actualizar contraseña" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "contraseña actual es incorrecta",
  );
  expect(supabase.auth.updateUser).not.toHaveBeenCalled();
});
test("el cambio de contraseña conserva la identidad autenticada", async () => {
  render(<ChangePassword />);
  fill("Contraseña actual", "anterior");
  newPasswords();
  fireEvent.click(
    screen.getByRole("button", { name: "Actualizar contraseña" }),
  );
  expect(await screen.findByRole("status")).toHaveTextContent(
    "actualizada correctamente",
  );
  expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
    email: "persona@example.com",
    password: "anterior",
  });
  expect(supabase.auth.updateUser).toHaveBeenCalledWith({
    password: "Frase privada 2026!",
  });
  expect(screen.getByLabelText("Contraseña actual")).toHaveValue("");
});
