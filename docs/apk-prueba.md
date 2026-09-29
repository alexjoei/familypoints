# APK de prueba — 29 de septiembre de 2026

La versión **0.1.8** (Android versionCode 10, `app.familypoints.mobile`) está lista para instalar. Se compiló desde el commit `0751b96` con la misma firma Android de las versiones anteriores.

- [Descargar APK 0.1.8](https://expo.dev/artifacts/eas/nCn68igfebsC0X4NcN50YHSDpJYFts0yGRU4jSyv38s.apk)
- [Build finalizado en Expo](https://expo.dev/accounts/alexjoei/projects/family-points/builds/ef24ea10-bf55-4a65-8d3b-5693bf1fa018)
- Copia local: `artifacts/family-points-0.1.8.apk` (106.983.844 bytes).
- SHA256: `942DF908A36157D2AE8BF9F23866F42FBF5C8EFDE010A9DCBD2A364C051AB2A0`.

Abre el enlace desde Android, descarga el archivo y ábrelo. Si Android lo pide, permite a ese navegador instalar aplicaciones. No hace falta Expo Go ni el servidor local.

## Qué probar en 0.1.8

1. Instalar el APK en dos Android y entrar con cuentas de Google distintas.
2. Crear una pareja, compartir el código e introducirlo en el segundo móvil.
3. Sumar puntos en un móvil. En el otro, aceptar, rechazar o proponer otra cantidad. Si quien sumó acepta el ajuste, los puntos deben quedar aprobados sin otro paso.
4. Revisar el saldo individual y el historial agrupado. Probar el selector de fecha y una foto opcional.
5. Crear y aprobar un canje. El saldo negativo empieza desactivado; solo se habilita si ambos aprueban un límite en Grupo.
6. Cerrar y abrir la app para comprobar que conserva la sesión y los datos.
7. Rechazar con motivo, abrir el detalle y deshacer el rechazo. Revisar el registro y volver a votar.
8. En Configuración, probar Pop, Calma y Noche. Desde cada móvil, añadir o quitar una categoría y una sugerencia. El creador puede quitar un miembro cuando no queden solicitudes pendientes.

La demo de pareja funciona sin cuenta, pero sus datos son locales y no se sincronizan. El acceso Google de este APK sigue usando la página alojada de Supabase: Google nativo Android está desactivado hasta configurar y verificar el cliente OAuth Android. La instalación, el retorno de Google y la sincronización entre dos dispositivos físicos aún requieren prueba.

## Verificación del código

55 pruebas, TypeScript, lint y diez recorridos web correctos. La migración anterior `202609290007_undo_and_settings.sql` se aplicó en Supabase. La nueva `202609290008_shared_categories.sql` está preparada y pendiente de ejecutar en Supabase; hasta entonces, los cambios de categorías y sugerencias por miembros no creadores funcionan en la demo, pero el servidor del grupo conectado los rechazará. EAS terminó y el APK descargado superó la comprobación ZIP, manifiesto Android, código DEX y bundle integrado. Falta la prueba en dispositivos Android físicos.

## Recompilar

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npx eas-cli@latest build --platform android --profile preview --clear-cache
```

Las variables públicas de Supabase están en EAS preview. El secreto OAuth solo está en Supabase. Conservar la firma Android del proyecto permite instalar nuevas versiones como actualización. No se ha enviado a Google Play ni contratado un plan nuevo.
