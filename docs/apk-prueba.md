# APK de prueba — 29 de septiembre de 2026

La versión **0.1.12** (Android versionCode 15, `app.familypoints.mobile`) está lista para instalar. Se compiló desde el commit `93aa666` con la misma firma Android de las versiones anteriores.

- [Descargar APK 0.1.12](https://expo.dev/artifacts/eas/8BKzA5sXQTP82GN7p2WNuSdlQX_GIfAKR4pa2qsnWbw.apk)
- [Build finalizado en Expo](https://expo.dev/accounts/alexjoei/projects/family-points/builds/56c3ac50-d8a2-4ffc-80d0-ffd155871c4d)
- Copia local: `artifacts/family-points-0.1.12.apk` (107.961.102 bytes).
- SHA256: `0DF6D8C85380AE0E7BA3BEDDF0E2435EB07EEC36DD07FC506BED8F10ADB73664`.

Abre el enlace desde Android, descarga el archivo y ábrelo. Si Android lo pide, permite a ese navegador instalar aplicaciones. No hace falta Expo Go ni el servidor local.

## Qué probar en 0.1.12

1. Instalar el APK y entrar con una cuenta real (no la demo).
2. Activar los avisos en Configuración y comprobar que llega una notificación del sistema cuando **otra persona** actúa en el grupo mientras esta app está cerrada o en segundo plano. Antes de esta versión solo llegaban con la app abierta.
3. Desde el grupo del creador, abrir «Zona de peligro» en Configuración y comprobar el flujo de confirmación al eliminar un grupo; verificar que el resto de miembros pierde el acceso al momento.
4. Probar el nuevo tema Cool en Configuración, junto a Pop, Calma y Noche.
5. Comprobar que el aviso emergente dentro de la app se puede cerrar tocando su × sin fallos, incluso cerca del borde.
6. Recorrido habitual: sumar, aceptar/rechazar, canjear, historial y saldo, para confirmar que nada se rompió.

La demo de pareja funciona sin cuenta, pero sus datos son locales y no se sincronizan. El acceso Google de este APK sigue usando la página alojada de Supabase: Google nativo Android continúa desactivado. Las notificaciones push en iOS no están configuradas (faltan credenciales APNs); en Android deberían funcionar sin pasos adicionales. La prueba en dos dispositivos físicos y con push real aún está pendiente de confirmación del usuario.

## Verificación del código

59 pruebas, TypeScript y lint correctos (ver `docs/estado.md`, entrada del 29 de septiembre sobre notificaciones push, borrar grupo y tema Cool). Migraciones `202609290012_delete_group.sql` y `202609290013_push_notifications.sql` aplicadas en Supabase real; función Edge `notify-activity` desplegada y verificada (responde 401 sin sesión). EAS terminó y el APK descargado superó la comprobación ZIP, manifiesto Android, cinco archivos DEX y bundle integrado. Falta la prueba en dispositivos Android físicos, en particular el push con la app cerrada.

## Recompilar

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npx eas-cli@latest build --platform android --profile preview --clear-cache
```

Las variables públicas de Supabase están en EAS preview. El secreto OAuth solo está en Supabase. Conservar la firma Android del proyecto permite instalar nuevas versiones como actualización. No se ha enviado a Google Play ni contratado un plan nuevo.
