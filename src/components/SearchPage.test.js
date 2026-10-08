import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import SearchPage from "./SearchPage";
import { supabase } from "../supabaseClient";

jest.mock("./GlobalSummaryDisplay", () => () => (
  <div>Cobertura disponible</div>
));
jest.mock("./ReportPage", () => () => <div>Vista autorizada de reportes</div>);
jest.mock("./ClientAnalyticsPage", () => () => (
  <div>Vista autorizada de análisis</div>
));
jest.mock("../supabaseClient", () => ({
  supabase: {
    auth: { getUser: jest.fn(), signOut: jest.fn() },
    from: jest.fn(),
    rpc: jest.fn(),
    storage: {
      from: jest.fn(() => ({
        getPublicUrl: () => ({ data: { publicUrl: "" } }),
      })),
    },
  },
}));

let permission;
let insert;
const records = [
  {
    nombre_completo: "Persona de prueba A",
    codigo: "PEP",
    relevancia: 3,
    campo_coincidencia: "ambos",
  },
  {
    nombre_completo: "Persona de prueba B",
    codigo: "ONU",
    relevancia: 1,
    campo_coincidencia: "alias",
  },
];
beforeEach(() => {
  jest.clearAllMocks();
  permission = "no";
  insert = jest.fn().mockResolvedValue({ error: null });
  supabase.auth.getUser.mockResolvedValue({
    data: { user: { email: "usuario@example.com" } },
  });
  supabase.from.mockImplementation((table) => {
    if (table === "usuarios")
      return {
        select: () => ({
          ilike: () => ({
            single: async () => ({
              data: { cliente: "Entidad de prueba", Reporte: permission },
              error: null,
            }),
          }),
        }),
      };
    const q = {
      select: () => q,
      eq: () => q,
      gte: () => q,
      lte: () => q,
      order: async () => ({ data: [], error: null }),
      insert,
    };
    return q;
  });
  supabase.rpc.mockImplementation(async (name) => ({
    data:
      name === "buscar_nombres"
        ? records
        : name === "obtener_ultima_fecha_reporte_global"
          ? "2026-10-08"
          : [{ codigo: "PEP", count: 100 }],
    error: null,
  }));
});
const start = async () => {
  render(<SearchPage onLogout={jest.fn()} />);
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Buscar coincidencias" }),
    ).toBeDisabled(),
  );
  await screen.findByText("usuario@example.com");
};

test("el perfil de consultas accede a cobertura pero no a reportes ni análisis", async () => {
  await start();
  expect(
    screen.queryByRole("button", { name: "Reportes", exact: true }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Análisis histórico", exact: true }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Cobertura de listas" }));
  expect(screen.getByText("Cobertura disponible")).toBeInTheDocument();
});

test.each(["si", "sí", "SI"])(
  "el permiso Reporte=%s conserva ambos accesos",
  async (value) => {
    permission = value;
    await start();
    fireEvent.click(
      await screen.findByRole("button", { name: "Reportes", exact: true }),
    );
    expect(
      screen.getByText("Vista autorizada de reportes"),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "Análisis histórico", exact: true }),
    );
    expect(
      screen.getByText("Vista autorizada de análisis"),
    ).toBeInTheDocument();
  },
);

test("no anuncia cero coincidencias antes de consultar y mantiene el criterio consultado al editar", async () => {
  await start();
  const input = screen.getByRole("searchbox");
  fireEvent.change(input, { target: { value: "Persona" } });
  expect(screen.queryByText("Sin coincidencias")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Buscar coincidencias" }));
  await screen.findByText("Persona de prueba A");
  await waitFor(() => expect(input).not.toBeDisabled());
  expect(insert).toHaveBeenCalledTimes(1);
  expect(insert.mock.calls[0][0][0]).toMatchObject({
    criterio: "Persona",
    cantidad_resultados: 2,
  });
  fireEvent.change(input, { target: { value: "Otro criterio" } });
  const resultRegion = screen.getByRole("region", {
    name: "Resultados de la consulta",
  });
  expect(
    within(resultRegion).getByText("Persona", { exact: true }),
  ).toBeInTheDocument();
  expect(insert).toHaveBeenCalledTimes(1);
});

test("filtrar por lista y relevancia no ejecuta otra búsqueda ni altera el historial", async () => {
  await start();
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "Persona" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Buscar coincidencias" }));
  await screen.findByText("Persona de prueba A");
  fireEvent.change(screen.getByLabelText("Código / Lista"), {
    target: { value: "PEP" },
  });
  expect(screen.queryByText("Persona de prueba B")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Relevancia"), {
    target: { value: "1" },
  });
  expect(screen.queryByText("Persona de prueba A")).not.toBeInTheDocument();
  expect(
    screen.getByText(/No hay coincidencias para estos filtros/),
  ).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Restablecer" }));
  expect(screen.getByText("Persona de prueba B")).toBeInTheDocument();
  expect(
    supabase.rpc.mock.calls.filter(([name]) => name === "buscar_nombres"),
  ).toHaveLength(1);
  expect(insert).toHaveBeenCalledTimes(1);
});

test("una consulta fallida muestra error y no se presenta ni registra como cero coincidencias", async () => {
  const errorLog = jest.spyOn(console, "error").mockImplementation(() => {});
  supabase.rpc.mockImplementation(async (name) =>
    name === "buscar_nombres"
      ? { data: null, error: { message: "Error de prueba" } }
      : { data: [], error: null },
  );
  await start();
  fireEvent.change(screen.getByRole("searchbox"), {
    target: { value: "Persona" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Buscar coincidencias" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "No se pudo completar la consulta",
  );
  expect(screen.queryByText("Sin coincidencias")).not.toBeInTheDocument();
  expect(insert).not.toHaveBeenCalled();
  errorLog.mockRestore();
});
