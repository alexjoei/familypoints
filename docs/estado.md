# Entrega de desarrollo — 26 de septiembre de 2026

Última entrega: APK 0.1.1 (versionCode 2) generado desde `40c07e0`, subido a GitHub y comprobado por CI. Incorpora el flujo claro de sumar, aceptar y canjear puntos. [Descarga actualizada](apk-prueba.md).

Actualización del 27 de septiembre: APK Android 0.1.0 firmado y generado con EAS. [Descarga e instrucciones](apk-prueba.md). Pendiente instalarlo y probarlo en un móvil físico. Proyecto EAS y firma Android configurados; Supabase y Google siguen pendientes.

## Disponible ahora

Demo local funcional con interfaz móvil cálida, icono propio, español/inglés y humor opcional. Recorrido completo de aportación, aprobación, saldo, recompensa y canje. Ajustes, rechazos, reenvíos y detalle de revisiones. Plantillas y categorías administrables. Persistencia local.

Cliente conectado preparado para correo, recuperación y Google PKCE; crear/unirse a grupos, varias pertenencias y compartir/renovar invitaciones. SQL de Supabase con autorización, RLS, bloqueo de grupo, reserva de saldo y reintentos idempotentes.

Los controles de cambiar persona existen solo en la demo. El modo conectado depende de usuarios reales y no suplanta identidades.

## Comprobaciones realizadas

- TypeScript y ESLint.
- 43 pruebas: reglas TypeScript, SQL real con PGlite, estados de lectura y compatibilidad de dependencias.
- 6 recorridos Playwright: flujo completo hasta canje aprobado, persistencia/idioma, tamaño móvil/escritorio, ajuste con historial de revisiones, botón global, estilos persistentes y estados individuales de lectura/voto.
- Compilación web y exportación de bundles iOS/Android.
- Expo Doctor: 21 comprobaciones correctas.
- Auditoría npm sin vulnerabilidades tras corregir dependencias transitivas; adaptador documentado en `vendor/decode-uri-component`.
- Capturas inspeccionadas visualmente; navegación y textos adaptados a 360/390 píxeles.

Estas comprobaciones no certifican OAuth real, una instalación nativa firmada ni concurrencia distribuida en Supabase. No hay credenciales externas configuradas.

## Para la siguiente sesión

1. Crear/conectar el proyecto Supabase del propietario y aplicar ambas migraciones en orden.
2. Configurar Google OAuth y el envío de correos.
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
