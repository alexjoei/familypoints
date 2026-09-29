# APK de prueba — 29 de septiembre de 2026

La versión **0.1.13** (Android versionCode 16, `app.familypoints.mobile`) está lista para instalar. Se compiló desde `64baaea` con la firma Android existente e incluye la configuración Firebase necesaria para recibir avisos push en segundo plano.

- [Descargar APK 0.1.13](https://expo.dev/artifacts/eas/mdTlCTupqOzR39gq-cQv5zHso9AYVygkHqfM87i_f4U.apk)
- [Build finalizado en Expo](https://expo.dev/accounts/alexjoei/projects/family-points/builds/07c5caff-1266-4e46-9ceb-27db3bdc82df)
- Copia local: `artifacts/family-points-0.1.13.apk` (107.964.762 bytes, ignorada por Git).
- SHA256: `77A30A8E815DBE5A2C7EAE9156FAD7E7C0236F4FE1DC194D8CF2E1ACEDD7C7EE`.

Abre el enlace desde Android, descarga e instala el archivo. Puedes actualizar la versión anterior. No hace falta Expo Go ni servidor local.

## Prueba decisiva de notificaciones

1. Instala **0.1.13** en dos Android, cada uno con una cuenta real distinta del mismo grupo. La demo local no sirve para esta prueba.
2. En el móvil que recibirá el aviso, abre Configuración, activa los avisos y permite las notificaciones del sistema. Deja la app cerrada o en segundo plano; no uses «Forzar detención» de Android.
3. Desde la otra cuenta, solicita sumar puntos. El receptor debería recibir un aviso del sistema sin abrir Family Points. Después prueba aceptar/rechazar para comprobar el aviso inverso.
4. Si no llega, anota la hora aproximada, qué cuenta actuó, cuál debía recibirlo y si al abrir la app aparece la solicitud. No compartas tokens ni credenciales por el chat. Revisar entonces `fp_push_tokens`, la función Edge `notify-activity` y los tickets/receipts de Expo.

La entrega con la app cerrada **todavía necesita esta prueba física**. EAS confirma que el APK compila, la clave FCM V1 está cargada y la función Edge está desplegada; eso por sí solo no demuestra entrega al dispositivo. iOS sigue pendiente de configurar APNs.

## Verificación y recompilación

TypeScript, lint y 59 pruebas pasan. EAS confirmó `FINISHED` y el APK descargado superó la prueba de integridad ZIP. El build preview incrementa `versionCode` automáticamente y toma las variables públicas de Supabase de EAS:

```cmd
set NODE_USE_SYSTEM_CA=1
set NODE_OPTIONS=--use-system-ca
npx eas-cli@latest build --platform android --profile preview --non-interactive --no-wait
```

Antes de cada push, actualizar `docs/handoff.md` con cambios, despliegues, build y pendientes.
