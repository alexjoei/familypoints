# APK de prueba — 27 de septiembre de 2026

Family Points 0.1.1, Android versionCode 2, paquete `app.familypoints.mobile`. Misma firma que 0.1.0; instalar como actualización. Incluye el nuevo flujo Sumar puntos / Aceptar puntos / Canjear puntos y Puntos acumulados.

- [Descargar APK](https://expo.dev/artifacts/eas/vxMX6cq4MUQdkj1eanlpGhoRGIIrY5FLRFn6kaE3vqQ.apk)
- [Build finalizado en Expo](https://expo.dev/accounts/alexjoei/projects/family-points/builds/667740a8-a24b-4768-b1ad-e179558ee26b)
- Commit del código compilado: `40c07e09002c7ea504f3ce9c8965b912d517e79d`.
- Copia local: `artifacts/family-points-0.1.1.apk` (98.349.120 bytes).
- SHA256: `EB21F87103E18F4333EFFFD52E6622C37997DDA225938A3638FB55083AABE765`.
- GitHub Actions: comprobaciones correctas para el commit compilado.

Abrir el enlace desde Android, descargar y abrir el archivo. Si Android lo solicita, permitir a ese navegador instalar aplicaciones. Abrir Family Points y pulsar **Probar con un grupo de ejemplo**. No necesita Expo Go ni un servidor local. La demo guarda los datos en el dispositivo; Google y la sincronización real aún no están configurados.

Se ha comprobado el estado FINISHED de EAS, descargado el archivo y verificado que contiene manifiesto Android, código DEX y bundle integrado. TypeScript, lint y 43 pruebas pasan. Falta la prueba de instalación y uso en un dispositivo físico.

Para repetir la compilación desde este repositorio:

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npx eas-cli@latest build --platform android --profile preview
```

Expo conserva la firma Android del proyecto. Mantenerla para actualizar instalaciones existentes. No se ha enviado a Google Play ni contratado un plan nuevo.
