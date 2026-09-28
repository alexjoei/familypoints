# APK de prueba — 28 de septiembre de 2026

Family Points 0.1.2, Android versionCode 3, paquete `app.familypoints.mobile`. Misma firma que las versiones anteriores; instalar como actualización. Incluye demo de pareja Alex y Sam y Google conectado a Supabase.

- [Descargar APK](https://expo.dev/artifacts/eas/gQB6TfohJGUTldRl2NwnsDze3BqnOCNyuLqIobItmho.apk)
- [Build finalizado en Expo](https://expo.dev/accounts/alexjoei/projects/family-points/builds/f6d29cb5-3ce9-4039-89f2-c8467003640c)
- Commit compilado: `69a936cdb2100615512bd66708947e24723c1604`.
- Copia local: `artifacts/family-points-0.1.2.apk` (98.356.012 bytes).
- SHA256: `F9D14A89B65E27F5CBEC536EE6822A8F39C2DE8A114C2FDFD929A53C717D9F00`.
- GitHub Actions: comprobaciones correctas para el commit compilado.

Abrir el enlace desde Android, descargar y abrir el archivo. Si Android lo solicita, permitir a ese navegador instalar aplicaciones. No necesita Expo Go ni servidor local.

## Probar entre dos

1. Entrar con Google en ambos móviles con cuentas distintas.
2. Uno crea el grupo y comparte el código; el otro se une.
3. Sumar puntos en un móvil, aceptar en el otro y comprobar puntos acumulados e historial.
4. Crear un canje acordado, aprobarlo y canjear puntos; revisar el saldo.
5. Cerrar/reabrir la app y cerrar sesión/entrar otra vez. Comprobar también la cancelación de Google.

La opción **Probar con una pareja de ejemplo** sigue funcionando sin cuenta. Sus datos son locales y no se sincronizan ni se convierten en un grupo real.

## Verificación

EAS FINISHED, APK descargado y presencia de manifiesto Android, código DEX y bundle integrado comprobada. TypeScript, lint, 45 pruebas y 6 recorridos web correctos. Google real verificado en Chrome: acceso, retorno, persistencia y cierre de sesión. Falta instalación y retorno OAuth en Android físico y prueba de sincronización entre dos cuentas/dispositivos.

Enlace enviado al chat de WhatsApp **alex propio**. El adjunto directo fue bloqueado por el permiso de archivos locales de la extensión de Chrome; se entregó el enlace de descarga.

## Recompilar

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npx eas-cli@latest build --platform android --profile preview --clear-cache
```

Las variables públicas de Supabase están en EAS preview. El secreto OAuth solo está en Supabase. Mantener la firma Android del proyecto para actualizar instalaciones existentes. No se ha enviado a Google Play ni contratado un plan nuevo.
