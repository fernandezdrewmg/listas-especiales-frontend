-- Una única consulta de lectura: esquema y permisos, sin datos personales.
select jsonb_build_object(
 'columns', (select jsonb_agg(to_jsonb(c)) from (select column_name,data_type,is_nullable,column_default from information_schema.columns where table_schema='public' and table_name='usuarios' order by ordinal_position) c),
 'constraints', (select jsonb_agg(to_jsonb(c)) from (select conname,pg_get_constraintdef(oid) definition from pg_constraint where conrelid='public.usuarios'::regclass) c),
 'policies', (select jsonb_agg(to_jsonb(p)) from (select tablename,policyname,roles,cmd,qual,with_check from pg_policies where schemaname='public') p),
 'rls', (select jsonb_agg(to_jsonb(r)) from (select relname,relrowsecurity from pg_class where relnamespace='public'::regnamespace and relkind='r') r),
 'functions', (select jsonb_agg(to_jsonb(f)) from (select proname,prosecdef,proacl from pg_proc where pronamespace='public'::regnamespace and proname in ('buscar_nombres','obtener_resumen_global_por_codigo','obtener_ultima_fecha_reporte_global')) f),
 'duplicateEmails', (select count(*) from (select lower(btrim(email::text)) from public.usuarios group by 1 having count(*)>1) d),
 'untrimmedEmails', (select count(*) from public.usuarios where email::text <> btrim(email::text))
) as inspection;
