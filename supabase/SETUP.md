# Activación del acceso y correo

La aplicación conserva el login con contraseña existente. Los nuevos botones de activación y recuperación permanecen bloqueados hasta que el servidor informe que está preparado. No contiene claves SMTP ni claves administrativas.

## 1. Revisar estructura

Ejecutar primero preflight.sql en el SQL Editor del proyecto wncyqrhmcvgssehcufpb. Revisar: email único sin duplicados al normalizar mayúsculas/espacios; campos obligatorios y claves foráneas de usuarios que pudieran impedir crear el registro antes de Authentication; permisos RLS de usuarios, búsquedas, reportes y las funciones de búsqueda. Los usuarios normales no deben poder modificar cliente ni Reporte. La validación de perfil de la interfaz no sustituye RLS.

No modificar automáticamente políticas desconocidas: conservar los permisos actuales y revisar los resultados antes de aplicar la migración.

## 2. Configurar Gmail en Authentication → SMTP

Remitente y usuario: mario.guillermo.fernandez.drew@gmail.com.
Nombre: Listas Especiales. Host: smtp.gmail.com. Puerto: 465.
Introducir directamente la contraseña de aplicación generada en Google, sin espacios; no usar la contraseña personal de Gmail ni guardarla en este repositorio.

## 3. Instalar validación antes de habilitar registros

Ejecutar migrations/202610080001_access_registration.sql.
El trigger permite crear Authentication solo cuando existe exactamente un registro de usuarios con ese correo. No crea perfiles, asigna roles ni cambia usuarios existentes. Incluye altas administrativas: primero cargar usuarios, después crear Authentication.

## 4. Configurar Authentication

- Activar confirmación de correo (Confirm email).
- Habilitar creación de usuarios (Allow new users to sign up) solamente después de instalar la validación.
- Configurar contraseña mínima de 10 caracteres y vencimiento del código de correo en 600 segundos.
- Plantilla Confirm signup: copiar templates/confirmation.html.
- Plantilla Reset password: copiar templates/recovery.html.
- Usar códigos numéricos de entre 6 y 10 dígitos. Las plantillas incluyen {{ .Token }}.
- Site URL: URL pública real de Netlify. Autorizar esa URL como redirección. No se conoce todavía en este repositorio.

## 5. Comprobar y habilitar

Verificar el envío a una cuenta controlada por el administrador y autorizada para la prueba. No enviar invitaciones masivas. Comprobar que un correo no registrado no puede crear Authentication. Después ejecutar enable-email-flows.sql.

Probar: activación con un usuario nuevo autorizado; código vencido; reenvío; recuperación; cambio de contraseña actual; login de usuarios existentes; roles de consultas y reportes. No recrear usuarios existentes para cambiar su contraseña.

## Operación habitual

El administrador carga email, cliente, logo_cliente y Reporte en usuarios. El usuario elige Primer acceso en el login, establece su contraseña y confirma el código enviado a su correo. Authentication inicia la creación al solicitar la activación; la cuenta queda pendiente hasta verificar el código. Los códigos y la verificación se completan en el mismo formulario. La recuperación usa una sesión temporal aislada: no abre consultas antes de guardar la nueva contraseña.

Para suspender temporalmente los flujos por correo, ejecutar: update listas_private.access_configuration set email_flows_enabled=false where id=true. Esto conserva las cuentas y el login normal.
