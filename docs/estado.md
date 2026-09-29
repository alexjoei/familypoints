# Entrega de desarrollo — 26 de septiembre de 2026

Última entrega: APK 0.1.1 (versionCode 2) generado desde `40c07e0`, subido a GitHub y comprobado por CI. Incorpora el flujo claro de sumar, aceptar y canjear puntos. [Descarga actualizada](apk-prueba.md).

Actualización del 27 de septiembre: APK Android 0.1.0 firmado y generado con EAS. [Descarga e instrucciones](apk-prueba.md). Pendiente instalarlo y probarlo en un móvil físico. Proyecto EAS y firma Android configurados; Supabase y Google siguen pendientes.

## Disponible ahora

Demo local funcional con interfaz móvil cálida, icono propio, español/inglés y humor opcional. Recorrido completo de aportación, aprobación, saldo, recompensa y canje. Ajustes, rechazos, reenvíos y detalle de revisiones. Plantillas y categorías administrables. Persistencia local.

Cliente conectado preparado para correo, recuperación y Google PKCE; crear/unirse a grupos, varias pertenencias y compartir/renovar invitaciones. SQL de Supabase con autorización, RLS, bloqueo de grupo, reserva de saldo y reintentos idempotentes.

Los controles de cambiar persona existen solo en la demo. El modo conectado depende de usuarios reales y no suplanta identidades.

## Comprobaciones realizadas

- TypeScript y ESLint.
- 45 pruebas: reglas TypeScript, SQL real con PGlite, estados de lectura, callbacks OAuth y compatibilidad de dependencias.
- 6 recorridos Playwright: flujo completo hasta canje aprobado, persistencia/idioma, tamaño móvil/escritorio, ajuste con historial de revisiones, botón global, estilos persistentes y estados individuales de lectura/voto.
- Compilación web y exportación de bundles iOS/Android.
- Expo Doctor: 21 comprobaciones correctas.
- Auditoría npm sin vulnerabilidades tras corregir dependencias transitivas; adaptador documentado en `vendor/decode-uri-component`.
- Capturas inspeccionadas visualmente; navegación y textos adaptados a 360/390 píxeles.

Google OAuth real verificado en web: acceso con la cuenta del propietario, retorno a onboarding, persistencia tras recarga y cierre de sesión. Estas comprobaciones no certifican el retorno OAuth nativo ni concurrencia distribuida entre dispositivos.

## Para la siguiente sesión

1. Instalar el nuevo APK conectado y comprobar Google en Android.
2. Configurar envío de correos para ampliar las pruebas de correo/contraseña.
3. Probar con varias cuentas y dispositivos reales.
4. Resolver los acuerdos pendientes:
   - Qué ocurre al abandonar/expulsar un miembro durante una votación.
   - Cómo rectificar una aportación aprobada cuyos puntos ya se gastaron.
   - Qué conservar/anonymizar al eliminar una cuenta, y quién administra si sale el creador.
5. Preparar Apple y requisitos de tiendas; confirmar cuentas, identificadores y tasas.

No se han implementado bajas, expulsiones, rectificaciones posteriores a aprobación, autovalidación excepcional ni eliminación de cuenta: requieren cerrar las reglas anteriores. Tampoco hay cambios libres de umbral de mayoría.

## Limitaciones técnicas conocidas

- Snapshots completos sin paginación: pensado para grupos pequeños durante la prueba.
- Refresco cada 15 segundos y manual; sin Realtime ni notificaciones push.
- Preferencias locales; contenido escrito por usuarios no se traduce.
- PKCE exige abrir confirmación/recuperación en el dispositivo que inició el flujo.
- La demo guarda datos solo en este dispositivo; no se sincroniza ni se convierte en grupo real.
- El servidor de preview local no es un despliegue público.
- Se requiere verificar autenticación y almacenamiento seguro en dispositivos reales antes de distribuir.

## Monetización

Sigue gratis, sin anuncios ni cobros implementados. Ideas futuras: automatizaciones, estadísticas y personalización por grupo; mantener gratuito el flujo básico. No se necesita decidir precios para la prueba inicial.

## 28 de septiembre: demo de pareja y preparación de Google

Demo Alex y Sam, una aceptación ajena. Se usa una clave local nueva `fp.demo.couple.v2`; la demo anterior se conserva almacenada pero deja de cargarse. Las cuentas y grupos reales no se modifican.

45 pruebas locales y 6 recorridos web correctos. Se conserva cobertura de mayorías para grupos de más de dos. Retorno Google probado con callbacks concurrentes y reintento tras error. `npm run check:auth` confirma Supabase accesible y Google habilitado. El APK 0.1.1 no contiene estos cambios. No se han activado pagos; demo y login permanecen gratuitos.

Configuración externa del 28 de septiembre: proyecto Supabase qvrfzvsciconvswrjbhy creado en Irlanda (Free). Ambas migraciones aplicadas mediante SQL Editor en una transacción; seis tablas verificadas con RLS activo. URL y clave pública configuradas en .env (excluido de Git) y EAS preview. Google Cloud familypoints-510007: cliente Web Family Points Supabase creado y conectado al proveedor Google. Secreto guardado únicamente en Supabase, nunca en el repositorio ni APK. Retornos permitidos: familypoints://auth/callback, http://127.0.0.1:4173/auth/callback y http://localhost:8081/auth/callback. No volver a ejecutar las migraciones iniciales sobre este proyecto.

APK 0.1.2 (versionCode 3) finalizado en EAS, descargado y verificado estructuralmente. Véase docs/apk-prueba.md para descarga y prueba en dos móviles.

## 28 de septiembre: saldos, fotos y nuevo aspecto

En Grupo se ven los miembros con sus puntos acumulados. Los canjes pueden dejar hasta 100 puntos negativos por defecto; cambiar el límite entre 0 y 100 requiere propuesta y mayoría ajena. Las categorías iniciales se redujeron a cuatro, se eligieron sugerencias más cortas y el formulario de aportación usa categoría desplegable e ideas plegadas. Se añadió una foto opcional, comprimida a JPEG, con almacenamiento privado para miembros del grupo. El tema Pop es el predeterminado y Club ofrece un aspecto más atrevido.

Migraciones `202609280004_debt_limit.sql` y `202609280005_contribution_photos.sql` aplicadas en Supabase y confirmadas por el editor SQL. Los commits `e925fab` y `756f884` están publicados en `main`. TypeScript, lint, 48 pruebas de reglas y base de datos, 9 recorridos web (incluida foto), export web/Android y Expo Doctor 21/21 correctos. El APK 0.1.5 se canceló para incorporar el siguiente feedback; la subida de fotos y Google nativo aún necesitan prueba en un Android físico. Google nativo permanece desactivado hasta registrar el cliente OAuth Android.

## Versión 0.1.6: acuerdos simples para pareja

Cuando solo vota la pareja, si propone otra cantidad y quien pidió los puntos la acepta, la aportación queda aprobada en ese momento. En grupos mayores siguen haciendo falta nuevos votos. La interfaz habla de «tu pareja» y oculta el recuento de mayoría y el número de revisión en la vista corriente. La fecha se elige en un calendario, con «Hoy» por defecto. Inicio e Historial muestran cada aportación como un movimiento con sus pasos desplegables.

El saldo negativo pasa a estar desactivado al crear un grupo. Ambos pueden acordar un límite de hasta 100 puntos desde Grupo; los grupos anteriores sin una votación explícita se reajustan a 0 al aplicar la migración 006. La demo local antigua también adopta ese valor si no tenía acuerdo aprobado. La migración `202609280006_couple_flow.sql` se aplicó en Supabase con resultado correcto. El build 0.1.5 anterior se canceló; el APK 0.1.6 (versionCode 8) está en EAS: https://expo.dev/accounts/alexjoei/projects/family-points/builds/b86ca8af-2c75-46b3-bb52-7cd4ba17fa41 .
## Cambios del 29 de septiembre — 0.1.7

Rechazar requiere confirmación y permite un motivo breve. Quien rechazó puede deshacerlo; el rechazo y su revocación permanecen visibles en el historial. La pantalla se titula «Solicitudes pendientes». «Configuración de grupo» abre con nombre, miembros y puntos, seguido por compartir código, estilo, acuerdos, preferencias, categorías y sugerencias, cambio de grupo y cierre de sesión. Solo quien creó el grupo puede quitar miembros; las solicitudes pendientes deben resolverse antes. También puede añadir o quitar categorías y sugerencias. El tema Club se sustituye por Cool, azul eléctrico inspirado en la referencia del usuario; las preferencias Club guardadas se migran a Cool.

La migración `202609290007_undo_and_settings.sql` contiene las reglas del backend. En local pasaron 55 pruebas, TypeScript, lint y 9 recorridos web. Falta aplicar la migración al Supabase real, compilar el APK 0.1.7 e instalarlo en Android físico. El APK 0.1.6 terminó, pero no contiene estos cambios.
