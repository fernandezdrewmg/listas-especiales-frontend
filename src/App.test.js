// src/App.test.js
import { render, screen } from "@testing-library/react";
import App from "./App";

jest.mock("./supabaseClient", () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: jest.fn(() => ({
        data: {
          subscription: {
            unsubscribe: jest.fn(),
          },
        },
      })),
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: jest.fn(() => ({
          data: { publicUrl: "" },
        })),
      })),
    },
  },
}));

test("muestra la pantalla de validación de sesión al iniciar la aplicación", () => {
  render(<App />);

  const loadingText = screen.getByText(/validando sesión/i);

  expect(loadingText).toBeInTheDocument();
});