# APK de prueba — 28 de septiembre de 2026

La versión **0.1.7** (Android versionCode 9, `app.familypoints.mobile`) [se está compilando en EAS](https://expo.dev/accounts/alexjoei/projects/family-points/builds/ff1f1b3e-d790-413e-8e72-f8be5e2650bf). Se compila desde el commit `c8a2a52`. Publicaremos aquí el enlace directo cuando EAS entregue y verifiquemos el APK.

El [APK 0.1.6](https://expo.dev/artifacts/eas/g1NQsBQJ58CK8TYr-U5YtIWHgGccXR76vnnLsHFfZqA.apk) está disponible, pero **no incluye** el nuevo rechazo reversible, Configuración de grupo ni el estilo Cool.

## Qué probar en 0.1.7

1. Instalar el APK en dos Android y entrar con cuentas de Google distintas.
2. Crear una pareja, compartir el código e introducirlo en el segundo móvil.
3. Sumar puntos en un móvil. En el otro, aceptar, rechazar o proponer otra cantidad. Si quien sumó acepta el ajuste, los puntos deben quedar aprobados sin otro paso.
4. Revisar el saldo individual y el historial agrupado. Probar el selector de fecha y una foto opcional.
5. Crear y aprobar un canje. El saldo negativo empieza desactivado; solo se habilita si ambos aprueban un límite en Grupo.
6. Cerrar y abrir la app para comprobar que conserva la sesión y los datos.
7. Rechazar con motivo, abrir el detalle y deshacer el rechazo. Revisar el registro y volver a votar.
8. En Configuración de grupo, probar Cool, añadir/quitar una sugerencia y una categoría. El creador puede quitar un miembro cuando no queden solicitudes pendientes.

La demo de pareja funciona sin cuenta, pero sus datos son locales y no se sincronizan. El acceso Google de este APK sigue usando la página alojada de Supabase: Google nativo Android está desactivado hasta configurar y verificar el cliente OAuth Android. La instalación, el retorno de Google y la sincronización entre dos dispositivos físicos aún requieren prueba.

## Verificación del código

55 pruebas, TypeScript, lint, nueve recorridos web, export web y Android correctos. La migración `202609290007_undo_and_settings.sql` se aplicó en Supabase con resultado correcto. Falta la verificación estructural del APK cuando EAS finalice.

## Recompilar

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npx eas-cli@latest build --platform android --profile preview --clear-cache
```

Las variables públicas de Supabase están en EAS preview. El secreto OAuth solo está en Supabase. Conservar la firma Android del proyecto permite instalar nuevas versiones como actualización. No se ha enviado a Google Play ni contratado un plan nuevo.
