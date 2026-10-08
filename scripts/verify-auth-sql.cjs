// Comprueba el registro restringido en PostgreSQL local en memoria, sin datos reales.
const fs = require("node:fs"),
  path = require("node:path"),
  assert = require("node:assert/strict");
const location = process.env.PATH.split(path.delimiter)
  .map((p) => path.resolve(p, "..", "@electric-sql", "pglite"))
  .find((p) => fs.existsSync(p));
if (!location)
  throw Error(
    "Ejecutar con npm exec --package=@electric-sql/pglite -- node scripts/verify-auth-sql.cjs",
  );
const { PGlite } = require(location);
(async () => {
  const db = new PGlite();
  await db.exec(
    'create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key default gen_random_uuid(),email text unique); create table public.usuarios(email text,cliente text,"Reporte" text);',
  );
  await db.exec(
    "insert into public.usuarios values ('Autorizado@example.com','Entidad','sí'),('duplicado@example.com','Entidad','no'),('DUPLICADO@example.com','Otra entidad','sí'); insert into auth.users(email) values('existente@example.com');",
  );
  await db.exec(
    fs.readFileSync(
      path.resolve(
        __dirname,
        "../supabase/migrations/202610080001_access_registration.sql",
      ),
      "utf8",
    ),
  );
  await assert.rejects(
    db.exec("insert into auth.users(email) values('ajeno@example.com')"),
    /Registro no autorizado/,
  );
  await assert.rejects(
    db.exec("insert into auth.users(email) values('duplicado@example.com')"),
    /Registro no autorizado/,
  );
  await assert.rejects(
    db.exec("insert into auth.users(email) values(null)"),
    /Registro no autorizado/,
  );
  await db.exec(
    "insert into auth.users(email) values('autorizado@example.com')",
  );
  assert.equal(
    (await db.query("select count(*)::int n from auth.users")).rows[0].n,
    2,
  );
  assert.equal(
    (
      await db.query(
        "select \"Reporte\" from public.usuarios where email='Autorizado@example.com'",
      )
    ).rows[0].Reporte,
    "sí",
  );
  await db.exec("set role anon");
  assert.equal(
    (await db.query("select public.listas_auth_configuration() c")).rows[0].c
      .activationEnabled,
    false,
  );
  await assert.rejects(
    db.exec(
      "update listas_private.access_configuration set email_flows_enabled=true",
    ),
    /permission denied/,
  );
  await db.exec("reset role");
  await db.exec(
    "update listas_private.access_configuration set email_flows_enabled=true",
  );
  assert.equal(
    (await db.query("select public.listas_auth_configuration() c")).rows[0].c
      .activationEnabled,
    true,
  );
  await db.exec(
    "alter table auth.users disable trigger listas_require_registered_user",
  );
  assert.equal(
    (await db.query("select public.listas_auth_configuration() c")).rows[0].c
      .activationEnabled,
    false,
  );
  await db.close();
  console.log(
    "OK: correos autorizados, rechazo de desconocidos/duplicados, conservación de perfiles y permisos, configuración privada y guardia de activación.",
  );
})().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
