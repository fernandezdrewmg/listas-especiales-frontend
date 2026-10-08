/* QA visual e interacción. Todas las peticiones a Supabase se interceptan con datos ficticios. */
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");
const assert = require("node:assert/strict");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const output =
  process.env.UI_OUTPUT_DIR ||
  path.join(require("node:os").tmpdir(), "listas-especiales-ui");
const root = path.resolve(__dirname, "../build");
fs.mkdirSync(output, { recursive: true });
const server = http.createServer((req, res) => {
  let target = path.resolve(
    root,
    "." + decodeURIComponent(req.url.split("?")[0]),
  );
  if (!target.startsWith(root + path.sep) && target !== root) {
    res.writeHead(403).end();
    return;
  }
  if (!fs.existsSync(target) || fs.statSync(target).isDirectory())
    target = path.join(root, "index.html");
  const type = {
    ".html": "text/html",
    ".js": "text/javascript",
    ".css": "text/css",
    ".svg": "image/svg+xml",
    ".png": "image/png",
    ".ico": "image/x-icon",
    ".json": "application/json",
  }[path.extname(target)];
  res.setHeader("Content-Type", type || "application/octet-stream");
  fs.createReadStream(target).pipe(res);
});
const records = [
  {
    nombre_completo: "Persona de demostración A",
    codigo: "PEP",
    relevancia: 3,
    campo_coincidencia: "ambos",
    pais: "Bolivia",
    cargo: "Cargo de demostración",
    entidad: "Entidad de prueba",
    nro_documento: "DEMO-001",
    pep_asociado: "-",
    alias: "Demo A",
  },
  {
    nombre_completo: "Persona de demostración B",
    codigo: "ONU",
    relevancia: 2,
    campo_coincidencia: "nombre",
    pais: "Bolivia",
    nro_documento: "DEMO-002",
  },
  {
    nombre_completo: "Persona de demostración C",
    codigo: "OFAC",
    relevancia: 1,
    campo_coincidencia: "alias",
    pais: "Bolivia",
    nro_documento: "DEMO-003",
  },
];
const summary = [
  "PEP",
  "OFAC",
  "ONU",
  "UE",
  "INTERPOL",
  "PEP RELACIONADOS",
  "LISTAS LOCALES",
  "OTRAS FUENTES",
  "SANCIONES",
].map((codigo, i) => ({
  codigo,
  count: [24580, 18740, 8650, 6920, 4310, 3260, 1750, 950, 410][i],
}));
const history = Array.from({ length: 36 }, (_, i) => ({
  usuario_email: "demo@example.test",
  criterio: "Persona de demostración",
  cantidad_resultados: i % 3,
  fecha: `2026-${String(5 + Math.floor(i / 6)).padStart(2, "0")}-${String((i % 6) + 1).padStart(2, "0")}T15:30:00Z`,
  fuente: i % 3 ? "PEP" : null,
  origen: "WEB",
}));
const user = {
  id: "00000000-0000-4000-8000-000000000001",
  email: "demo@example.test",
  aud: "authenticated",
  role: "authenticated",
  app_metadata: {},
  user_metadata: {},
  created_at: "2026-01-01T00:00:00Z",
};
const jwt = [
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
  Buffer.from(
    JSON.stringify({
      sub: user.id,
      exp: Math.floor(Date.now() / 1000) + 3600,
      role: "authenticated",
    }),
  ).toString("base64url"),
  "test-signature",
].join(".");
async function fixture(page, permission) {
  const writes = [];
  let searchCount = 0;
  await page.route("https://**/*", async (route) => {
    const url = new URL(route.request().url());
    if (!url.hostname.endsWith(".supabase.co")) return route.abort();
    const send = (data, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        body: JSON.stringify(data),
      });
    if (url.pathname.includes("/storage/"))
      return route.fulfill({
        status: 200,
        contentType: url.pathname.endsWith("ris3.jpg")
          ? "image/jpeg"
          : "image/svg+xml",
        body: fs.readFileSync(
          path.resolve(
            __dirname,
            url.pathname.endsWith("ris3.jpg")
              ? "../src/ris3.JPG"
              : "../public/logo.svg",
          ),
        ),
      });
    if (url.pathname.endsWith("/token"))
      return send({
        access_token: jwt,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "test-refresh-token",
        user,
      });
    if (url.pathname.endsWith("/user")) return send(user);
    if (url.pathname.endsWith("/logout")) return send({});
    if (url.pathname.endsWith("/buscar_nombres")) {
      searchCount++;
      return send(records);
    }
    if (url.pathname.endsWith("/obtener_resumen_global_por_codigo"))
      return send(summary);
    if (url.pathname.endsWith("/obtener_ultima_fecha_reporte_global"))
      return send("2026-10-08T12:00:00Z");
    if (url.pathname.endsWith("/usuarios"))
      return send(
        url.searchParams.get("select") === "email"
          ? [{ email: user.email }]
          : {
              cliente: "Entidad de demostración",
              Reporte: permission,
              logo_cliente: "entidad-demo.svg",
            },
      );
    if (
      url.pathname.endsWith("/busquedas") ||
      url.pathname.endsWith("/reportes")
    ) {
      if (route.request().method() === "POST") {
        writes.push({
          table: url.pathname.split("/").pop(),
          data: route.request().postDataJSON(),
        });
        return send(null, 201);
      }
      let selected = history.filter((row) => {
        const dateFilters = url.searchParams.getAll("fecha");
        return dateFilters.every((filter) =>
          filter.startsWith("gte.")
            ? row.fecha >= filter.slice(4)
            : filter.startsWith("lte.")
              ? row.fecha <= filter.slice(4)
              : true,
        );
      });
      if (url.searchParams.get("order")?.includes("desc"))
        selected.sort((a, b) => b.fecha.localeCompare(a.fecha));
      return send(selected);
    }
    throw new Error("Petición inesperada: " + url.pathname);
  });
  return { writes, searches: () => searchCount };
}
async function login(page) {
  await page.getByLabel("Correo electrónico").fill(user.email);
  await page
    .getByLabel("Contraseña", { exact: true })
    .fill("password-for-local-fixture");
  await page.getByRole("button", { name: "Ingresar a la plataforma" }).click();
  await page.getByText(user.email, { exact: true }).waitFor();
}
async function assertLayout(page, label) {
  await page
    .waitForFunction(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1,
      null,
      { timeout: 5000 },
    )
    .catch(() => {});
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  );
  if (overflow) {
    await page.screenshot({
      path: path.join(output, "overflow-mobile.png"),
      fullPage: true,
    });
    console.log(
      await page.evaluate(() =>
        [...document.querySelectorAll("body *")]
          .filter(
            (el) => el.getBoundingClientRect().right > window.innerWidth + 1,
          )
          .slice(0, 20)
          .map((el) => ({
            tag: el.tagName,
            cls: el.className,
            width: el.getBoundingClientRect().width,
            right: el.getBoundingClientRect().right,
          })),
      ),
    );
  }
  assert.equal(overflow, false, "Desbordamiento horizontal: " + label);
}
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = "http://127.0.0.1:" + server.address().port;
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  const errors = [];
  try {
    const page = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    page.on("pageerror", (e) => errors.push(e.message));
    const api = await fixture(page, "sí");
    await page.goto(url);
    await page.getByRole("heading", { name: "Bienvenido de nuevo" }).waitFor();
    await page.screenshot({
      path: path.join(output, "login-desktop.png"),
      fullPage: true,
    });
    assert.equal(
      await page
        .getByAltText("Logo institucional", { exact: true })
        .evaluate((img) => img.complete && img.naturalWidth > 0),
      true,
    );
    await login(page);
    await page.getByRole("button", { name: "Reportes", exact: true }).waitFor();
    await page
      .getByAltText("Logo de Entidad de demostración", { exact: true })
      .waitFor();
    await page.waitForFunction(() => {
      const img = document.querySelector(
        'img[alt="Logo de Entidad de demostración"]',
      );
      return img && img.complete && img.naturalWidth > 0;
    });
    await assertLayout(page, "consultas escritorio");
    await page.screenshot({
      path: path.join(output, "consultas-desktop.png"),
      fullPage: true,
    });
    await page.getByRole("searchbox").fill("Persona de demostración");
    await page.getByRole("button", { name: "Buscar coincidencias" }).click();
    await page.getByText(records[0].nombre_completo, { exact: true }).waitFor();
    await page
      .getByLabel("Código / Lista", { exact: true })
      .selectOption("PEP");
    assert.equal(
      await page.getByText(records[1].nombre_completo, { exact: true }).count(),
      0,
    );
    await page.getByLabel("Relevancia", { exact: true }).selectOption("1");
    await page.getByText(/No hay coincidencias para estos filtros/).waitFor();
    await page.getByRole("button", { name: "Restablecer" }).click();
    await page.getByRole("button", { name: "Vista compacta" }).click();
    assert.equal(api.searches(), 1);
    assert.equal(api.writes.filter((w) => w.table === "busquedas").length, 1);
    await assertLayout(page, "resultados escritorio");
    await page.screenshot({
      path: path.join(output, "resultados-desktop.png"),
      fullPage: true,
    });
    await page
      .getByRole("button", { name: "Cobertura de listas", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Resumen global de la base" })
      .waitFor();
    await page.screenshot({
      path: path.join(output, "cobertura-desktop.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Reportes", exact: true }).click();
    await page.getByRole("button", { name: "Generar reporte" }).click();
    await page.getByRole("button", { name: "Descargar CSV" }).waitFor();
    await page
      .getByRole("cell", { name: "Persona de demostración", exact: true })
      .first()
      .waitFor();
    await assertLayout(page, "reporte escritorio");
    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Descargar CSV" }).click();
    const download = await downloadPromise;
    assert.ok(download.suggestedFilename().endsWith(".csv"));
    await page.screenshot({
      path: path.join(output, "reportes-desktop.png"),
      fullPage: true,
    });
    await page.emulateMedia({ media: "print" });
    assert.equal(await page.locator("aside").isVisible(), false);
    await page.pdf({
      path: path.join(output, "reporte-impresion.pdf"),
      format: "Letter",
    });
    await page.emulateMedia({ media: "screen" });
    await page
      .getByRole("button", { name: "Análisis histórico", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Top 5 usuarios por número de consultas" })
      .waitFor();
    await page.screenshot({
      path: path.join(output, "analisis-desktop.png"),
      fullPage: true,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await assertLayout(page, "análisis móvil");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("button", { name: "Reportes", exact: true }).click();
    await assertLayout(page, "reportes móvil");
    await page.getByRole("button", { name: "Generar reporte" }).click();
    await page
      .getByRole("cell", { name: "Persona de demostración", exact: true })
      .first()
      .waitFor();
    await assertLayout(page, "reporte con datos móvil");
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("button", { name: "Consultas", exact: true }).click();
    await assertLayout(page, "resultados móvil");
    await page.screenshot({
      path: path.join(output, "consultas-mobile.png"),
      fullPage: true,
    });
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await page.getByRole("heading", { name: "Bienvenido de nuevo" }).waitFor();
    await assertLayout(page, "login móvil");
    await page.screenshot({
      path: path.join(output, "login-mobile.png"),
      fullPage: true,
    });
    const restricted = await browser.newPage({
      viewport: { width: 1440, height: 1000 },
    });
    restricted.on("pageerror", (e) => errors.push(e.message));
    await fixture(restricted, "no");
    await restricted.goto(url);
    await login(restricted);
    await restricted
      .getByText("Entidad de demostración", { exact: true })
      .first()
      .waitFor();
    assert.equal(
      await restricted
        .getByRole("button", { name: "Reportes", exact: true })
        .count(),
      0,
    );
    assert.equal(
      await restricted
        .getByRole("button", { name: "Análisis histórico", exact: true })
        .count(),
      0,
    );
    await restricted
      .getByRole("button", { name: "Cobertura de listas", exact: true })
      .click();
    await restricted
      .getByRole("heading", { name: "Resumen global de la base" })
      .waitFor();
    assert.deepEqual(errors, []);
    console.log(
      JSON.stringify(
        {
          result: "OK",
          verified: [
            "login",
            "consulta",
            "filtros",
            "vista compacta",
            "cobertura",
            "reportes",
            "CSV",
            "impresión",
            "análisis",
            "móvil",
            "roles",
            "logout",
          ],
          output,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  server.close();
  process.exitCode = 1;
});
