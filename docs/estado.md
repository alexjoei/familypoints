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

La migración `202609290007_undo_and_settings.sql` se aplicó en Supabase con resultado correcto. En local pasaron 55 pruebas, TypeScript, lint, 9 recorridos web y export web/Android. El APK 0.1.7/versionCode 9 [terminó en EAS](https://expo.dev/accounts/alexjoei/projects/family-points/builds/ff1f1b3e-d790-413e-8e72-f8be5e2650bf), se descargó y se verificó estructuralmente. Falta instalarlo en Android físico. [Descarga](apk-prueba.md).

## Cambios del 29 de septiembre — 0.1.8

La pestaña pasa a llamarse «Configuración». Se retira Cool: quedan Pop, Calma y Noche; las preferencias antiguas de Club o Cool vuelven a Pop. Todos los miembros pueden añadir o quitar categorías y gestionar las sugerencias, tanto en la demo como en el grupo real. Quitar miembros continúa reservado al creador. La migración `202609290008_shared_categories.sql` actualiza esa autorización en Supabase.

## Cambios del 29 de septiembre — 0.1.9

Las migraciones 008 y 009 se aplicaron en el proyecto Supabase real. Se comprobó añadir, quitar y renombrar una categoría, así como añadir y quitar una sugerencia, con la identidad de un miembro no creador dentro de transacciones revertidas; consultas posteriores confirmaron que no quedaron datos de prueba. Al renombrar una categoría se actualizan sus sugerencias. La pestaña «Configuración» tiene más espacio en móviles estrechos. El canje conserva la aprobación del grupo: reserva puntos al solicitarlo y los descuenta al aprobarse; el texto ahora lo explica.

## Cambios del 29 de septiembre — 0.1.10

Categorías y sugerencias aparecen en bloques separados, cada uno con su botón «Añadir» encima de la lista. Se eliminan los controles de edición de esta pantalla y el término «plantilla». Cada fila tiene una «×» accesible que quita el elemento de inmediato. Quitar una categoría quita también sus sugerencias en la misma operación; las aportaciones antiguas permanecen en el historial. La migración `202609290010_simple_categories.sql` lleva ese comportamiento al grupo conectado. Se añadió un recorrido web que toca las «×» con un miembro no creador y comprueba el resultado.

## Cambios del 29 de septiembre — 0.1.11

La migración 010 se aplicó en Supabase. Una transacción con la identidad de un miembro no creador confirmó que puede añadir categoría y sugerencia y que quitar la categoría elimina ambas; se revirtió sin dejar datos de prueba.

Se añadieron avisos para solicitudes que necesitan revisión, ajustes y decisiones sobre aportaciones o canjes, además de cambios del grupo opcionales. Cada persona puede elegir esos tres tipos por separado en Configuración; sus preferencias se guardan en el dispositivo por cuenta. Un aviso visible en cualquier pantalla enlaza al detalle de la solicitud. En Android, con permiso del sistema, también se muestra una notificación local cuando la app detecta un evento mientras está activa. El historial se comprueba cada 15 segundos y al volver a abrir la app. El envío push con la app cerrada sigue pendiente de credenciales FCM y de un servicio de envío: esta versión no promete avisos en segundo plano.

TypeScript, lint, 56 pruebas y 11 recorridos web correctos. Expo Doctor: 21/21. Falta verificar los avisos del sistema y la instalación del APK en Android físico.
