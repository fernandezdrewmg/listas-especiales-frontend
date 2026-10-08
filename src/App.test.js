import { render, screen } from "@testing-library/react";
import App from "./App";
import { supabase } from "./supabaseClient";

jest.mock("./supabaseClient", () => ({
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
