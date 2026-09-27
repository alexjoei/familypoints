# APK de prueba — 27 de septiembre de 2026

Family Points 0.1.0, Android versionCode 1, paquete `app.familypoints.mobile`.

- [Descargar APK](https://expo.dev/artifacts/eas/wR9B5gvNT7yF6Db5CFAULLc8aLQMPg5g9b3ftnCi3cg.apk)
- [Build finalizado en Expo](https://expo.dev/accounts/alexjoei/projects/family-points/builds/ee3e1a72-f164-4813-a63e-27bd0e9a646b)
- Copia local: `artifacts/family-points-0.1.0.apk` (98.345.212 bytes).

Abrir el enlace desde Android, descargar y abrir el archivo. Si Android lo solicita, permitir a ese navegador instalar aplicaciones. Abrir Family Points y pulsar **Probar con un grupo de ejemplo**. No necesita Expo Go ni un servidor local. La demo guarda los datos en el dispositivo; Google y la sincronización real aún no están configurados.

Se ha comprobado el estado FINISHED de EAS, descargado el archivo y verificado que contiene manifiesto Android, código DEX y bundle integrado. TypeScript, lint y 43 pruebas pasan. Falta la prueba de instalación y uso en un dispositivo físico.

Para repetir la compilación desde este repositorio todavía sin commits:

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
$env:EAS_NO_VCS = '1'
npx eas-cli@latest build --platform android --profile preview
```

Expo conserva la firma Android del proyecto. Mantenerla para actualizar instalaciones existentes. No se ha enviado a Google Play ni contratado un plan nuevo.
