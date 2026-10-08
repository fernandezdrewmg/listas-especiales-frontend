-- Ejecutar únicamente después de configurar y probar SMTP y las plantillas.
update listas_private.access_configuration set email_flows_enabled=true where id=true;
select public.listas_auth_configuration();
