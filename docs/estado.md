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

Migraciones `202609280004_debt_limit.sql` y `202609280005_contribution_photos.sql` aplicadas en Supabase y confirmadas por el editor SQL. Los commits `e925fab` y `756f884` están publicados en `main`. TypeScript, lint, 48 pruebas de reglas y base de datos, 9 recorridos web (incluida foto), export web/Android y Expo Doctor 21/21 correctos. El APK 0.1.5 está en compilación; la subida de fotos y Google nativo aún necesitan prueba en un Android físico. Google nativo permanece desactivado hasta registrar el cliente OAuth Android.
