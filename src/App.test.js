import { render, screen } from "@testing-library/react";
import App from "./App";
import { supabase, accessClient } from "./supabaseClient";

jest.mock("./supabaseClient", () => ({
  accessClient: {
    auth: { signOut: jest.fn().mockResolvedValue({ error: null }) },
  },
  supabase: {
    auth: {
      getSession: jest.fn(),
      onAuthStateChange: jest.fn(),
      signOut: jest.fn(),
    },
    storage: { from: jest.fn() },
  },
}));

beforeEach(() => {
  window.sessionStorage.clear();
  accessClient.auth.signOut.mockResolvedValue({ error: null });
  supabase.auth.getSession.mockResolvedValue({
    data: { session: null },
    error: null,
  });
  supabase.auth.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: jest.fn() } },
  });
  supabase.storage.from.mockReturnValue({
    getPublicUrl: () => ({ data: { publicUrl: "" } }),
  });
});

test("valida la sesión y muestra el acceso cuando no existe una sesión", async () => {
  render(<App />);
  expect(screen.getByText(/validando sesión/i)).toBeInTheDocument();
  expect(
    await screen.findByRole("heading", { name: "Bienvenido de nuevo" }),
  ).toBeInTheDocument();
});

test("un enlace de recuperación muestra el formulario antes del espacio de consultas", async () => {
  window.sessionStorage.setItem("listas-recovery", "true");
  supabase.auth.getSession.mockResolvedValue({
    data: { session: { user: { id: "u" } } },
  });
  render(<App />);
  expect(
    await screen.findByRole("heading", { name: "Elija su nueva contraseña" }),
  ).toBeInTheDocument();
  expect(screen.queryByText("Consultas")).not.toBeInTheDocument();
});
