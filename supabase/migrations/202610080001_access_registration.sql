-- Ejecutar como administrador, antes de habilitar registros en Authentication.
-- No crea usuarios, no almacena contraseñas y no cambia Reporte ni cliente.
begin;
create schema if not exists listas_private;
revoke all on schema listas_private from public, anon, authenticated;
create table if not exists listas_private.access_configuration (
  id boolean primary key default true check (id),
  email_flows_enabled boolean not null default false
);
insert into listas_private.access_configuration(id) values(true) on conflict do nothing;
revoke all on listas_private.access_configuration from public, anon, authenticated;
alter table listas_private.access_configuration enable row level security;

create or replace function listas_private.require_registered_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare matches integer;
begin
  select count(*) into matches from public.usuarios
  where lower(btrim(email::text)) = lower(btrim(new.email::text));
  if new.email is null or matches <> 1 then
    raise exception 'Registro no autorizado. Contacte al administrador.' using errcode = 'P0001';
  end if;
  return new;
end;
$$;
revoke all on function listas_private.require_registered_user() from public, anon, authenticated;
drop trigger if exists listas_require_registered_user on auth.users;
create trigger listas_require_registered_user before insert on auth.users
for each row execute function listas_private.require_registered_user();

create or replace function public.listas_auth_configuration()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'activationEnabled', coalesce((select email_flows_enabled from listas_private.access_configuration where id), false)
      and exists (select 1 from pg_catalog.pg_trigger where tgrelid = 'auth.users'::regclass and tgname = 'listas_require_registered_user' and tgenabled in ('O','A')),
    'recoveryEnabled', coalesce((select email_flows_enabled from listas_private.access_configuration where id), false)
  );
$$;
revoke all on function public.listas_auth_configuration() from public;
grant execute on function public.listas_auth_configuration() to anon, authenticated;
notify pgrst, 'reload schema';
commit;
