# APK de prueba — 28 de septiembre de 2026

La versión **0.1.6** (Android versionCode 8, `app.familypoints.mobile`) está [en la cola de EAS](https://expo.dev/accounts/alexjoei/projects/family-points/builds/b86ca8af-2c75-46b3-bb52-7cd4ba17fa41). Se compila desde el commit `77dd18cb94e2c63377b5468b96017a18bbf0049f`. Publicaremos aquí el enlace directo cuando EAS entregue y verifiquemos el APK.

El [APK 0.1.4](https://expo.dev/artifacts/eas/DcHWFZWGZnYSoraJKjol8WTKdH7oFbHoOJbQmX8zDeM.apk) es la última descarga disponible, pero **no incluye** las mejoras recientes de pareja, fecha, historial, fotos y saldo negativo acordado.

## Qué probar en 0.1.6

1. Instalar el APK en dos Android y entrar con cuentas de Google distintas.
2. Crear una pareja, compartir el código e introducirlo en el segundo móvil.
3. Sumar puntos en un móvil. En el otro, aceptar, rechazar o proponer otra cantidad. Si quien sumó acepta el ajuste, los puntos deben quedar aprobados sin otro paso.
4. Revisar el saldo individual y el historial agrupado. Probar el selector de fecha y una foto opcional.
5. Crear y aprobar un canje. El saldo negativo empieza desactivado; solo se habilita si ambos aprueban un límite en Grupo.
6. Cerrar y abrir la app para comprobar que conserva la sesión y los datos.

La demo de pareja funciona sin cuenta, pero sus datos son locales y no se sincronizan. El acceso Google de este APK sigue usando la página alojada de Supabase: Google nativo Android está desactivado hasta configurar y verificar el cliente OAuth Android. La instalación, el retorno de Google y la sincronización entre dos dispositivos físicos aún requieren prueba.

## Verificación del código

51 pruebas, TypeScript, lint, nueve recorridos web, export web y Android correctos. La migración `202609280006_couple_flow.sql` se aplicó en Supabase. Falta la verificación estructural del APK cuando EAS finalice.

## Recompilar

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npx eas-cli@latest build --platform android --profile preview --clear-cache
```

Las variables públicas de Supabase están en EAS preview. El secreto OAuth solo está en Supabase. Conservar la firma Android del proyecto permite instalar nuevas versiones como actualización. No se ha enviado a Google Play ni contratado un plan nuevo.
