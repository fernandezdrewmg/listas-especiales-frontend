import { render, screen } from "@testing-library/react";
import WorkspaceGate from "./WorkspaceGate";
import { supabase } from "../supabaseClient";
jest.mock("./SearchPage", () => () => <div>Espacio autorizado</div>);
jest.mock("../supabaseClient", () => ({
  supabase: { auth: { getUser: jest.fn() }, from: jest.fn() },
}));
let pattern, single;
beforeEach(() => {
  jest.clearAllMocks();
  pattern = jest.fn();
  single = jest.fn();
  pattern.mockReturnValue({ single });
  supabase.from.mockReturnValue({ select: () => ({ ilike: pattern }) });
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { email: "persona_test@example.com" } },
  });
});
test("un usuario sin perfil no entra al espacio privado", async () => {
  single.mockResolvedValue({ data: null, error: { code: "PGRST116" } });
  render(<WorkspaceGate />);
  expect(await screen.findByText("Acceso no disponible")).toBeInTheDocument();
  expect(screen.queryByText("Espacio autorizado")).not.toBeInTheDocument();
});
test("requiere un perfil único y escapa comodines del correo", async () => {
  single.mockResolvedValue({ data: { cliente: "Entidad" }, error: null });
  render(<WorkspaceGate />);
  expect(await screen.findByText("Espacio autorizado")).toBeInTheDocument();
  expect(pattern).toHaveBeenCalledWith("email", "persona\\_test@example.com");
});
