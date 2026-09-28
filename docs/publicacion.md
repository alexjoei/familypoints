# Conectar y publicar Family Points

## Lo que está y lo que falta

La app y las migraciones están implementadas. El proyecto EAS está vinculado a `@alexjoei/family-points`, con credenciales Android gestionadas por Expo para generar APK de prueba. No se ha desplegado el backend ni probado OAuth real. La demo funciona sin configuración externa.

## 1. Supabase

1. Crear un proyecto gratuito en la cuenta del propietario.
2. Ejecutar en orden las migraciones `202609260001_initial.sql` y `202609260002_seen_receipts.sql` de `supabase/migrations/` en el SQL Editor. Si la primera ya está aplicada, ejecutar solo la segunda. Las pruebas locales aplican ambas. La segunda añade los estados de lectura por miembro.
3. En Auth, habilitar correo/contraseña y confirmación de correo; fijar un mínimo de 8 caracteres para las contraseñas.
4. Copiar `.env.example` a `.env`.
5. Completar:

```dotenv
EXPO_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=TU-CLAVE-PUBLICA
```

La clave pública se entrega a los clientes por diseño; la protección reside en RLS y las funciones. No introducir aquí claves administrativas, contraseñas de base de datos ni secretos OAuth.

6. En Auth > URL Configuration, añadir los retornos exactos que se vayan a usar:
   - Desarrollo móvil/producción con esquema: `familypoints://auth/callback`.
   - Desarrollo web habitual: `http://localhost:8081/auth/callback`.
   - Preview local: `http://127.0.0.1:4173/auth/callback`.
   - Cuando exista un dominio web, añadir su URL HTTPS específica.
7. Configurar SMTP para confirmaciones y recuperación. Antes de elegir proveedor, comprobar su plan gratuito, cuotas y necesidad de dominio. El envío incluido de desarrollo no debe darse por suficiente para usuarios reales.
8. Reiniciar el servidor o recompilar después de cambiar variables públicas: Expo las incorpora al bundle.

## 2. Google

1. Crear el proyecto OAuth y la pantalla de consentimiento en Google Cloud, en una cuenta del propietario.
2. Crear un cliente OAuth **Web** para el flujo navegador -> Supabase -> app.
3. Copiar a las URI de redirección autorizadas de Google el callback exacto mostrado por Supabase, normalmente `https://TU-PROYECTO.supabase.co/auth/v1/callback`. No confundirlo con el retorno propio de la app.
4. Guardar ID y secreto de Google en el proveedor Google de Supabase.
5. Configurar usuarios de prueba mientras la pantalla de consentimiento esté en modo prueba.
6. La app pide solo `openid email profile`, sin permisos de Drive, contactos ni otros servicios.
7. Probar acceso, cancelación, errores, sesión persistente y cierre en cada plataforma.

La implementación usa PKCE y navegador del sistema. En móvil intercambia el código al volver por el esquema de la app; en web Supabase gestiona el callback. No usar Expo Go como prueba concluyente de este retorno: utilizar un build de desarrollo.

Referencias: [Google en Supabase](https://supabase.com/docs/guides/auth/social-login/auth-google), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [Expo AuthSession](https://docs.expo.dev/versions/latest/sdk/auth-session/).

## 3. Desarrollo móvil y builds

El identificador Android del APK de prueba es `app.familypoints.mobile`. Confirmar disponibilidad y titularidad antes del primer build de tienda. EAS está vinculado a `@alexjoei/family-points`; conservar su firma Android para actualizar instalaciones existentes.

Con una cuenta Expo del propietario, enlazar el proyecto y usar los perfiles de `eas.json`:

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development --platform ios
```

El inicio de sesión y la vinculación EAS ya se han realizado. Los builds de desarrollo anteriores no se han ejecutado; la prueba Android usa el perfil `preview`. iOS requiere las credenciales correspondientes de Apple.

Para un Android instalable de prueba:

```powershell
npx eas-cli@latest build --profile preview --platform android
```

Para tienda, una vez completadas las condiciones de publicación:

```powershell
npx eas-cli@latest build --profile production --platform all
```

No ejecutar envío a tiendas automáticamente. Verificar también las variables públicas en el entorno EAS elegido; `.env` no se incluye en Git. El binario debe apuntar al proyecto correcto.

## 4. Prueba real mínima

- Dos cuentas en dos dispositivos: crear grupo, obtener invitación, unirse y registrar aportación.
- Tres cuentas: comprobar que una aprobación no basta y dos sí.
- Intentar autovoto, doble voto, voto de revisión antigua y acceso a otro grupo.
- Cambiar puntos, aceptar como autor y votar de nuevo.
- Canjes simultáneos con saldo limitado; comprobar reserva y liberación.
- Regresar desde Google en app abierta y cerrada; cancelar el proveedor.
- Confirmar correo y recuperar contraseña abriendo el enlace en el mismo dispositivo que inició el flujo PKCE.
- Verificar enlaces de invitación y código manual, incluidos los caducados.
- Probar teclado, lector de pantalla, tamaño de fuente y zonas seguras en iOS/Android.

## 5. Antes de App Store / Google Play

- Añadir Sign in with Apple en iOS, según lo ya acordado. Google + correo ahora; Apple antes de publicar. [Regla 4.8](https://developer.apple.com/app-store/review/guidelines/#login-services).
- Acordar e implementar eliminación de cuenta y el tratamiento de su historial compartido.
- Resolver bajas/expulsiones y rectificaciones de puntos ya gastados.
- Política de privacidad real, contacto de soporte y declaraciones de datos en tiendas.
- Revisar si las categorías de cuidado pueden contener datos sensibles; evitar pedir información innecesaria.
- Definir edad objetivo antes de permitir cuentas de menores; no se ha implementado un sistema específico para menores.
- Revisar iconos/fichas/capturas ES/EN y pruebas de distribución vigentes.
- Confirmar credenciales, identificadores finales y coste antes de enviar.

## Coste

No se ha contratado ni activado ningún plan de pago.

Expo y Supabase tienen niveles gratuitos con límites; Supabase pausa proyectos gratuitos tras una semana de inactividad. Publicación estándar consultada: Apple 99 USD/año o importe local; Google Play 25 USD una vez. Revalidar las condiciones al publicar; determinadas cuentas personales de Google requieren pruebas previas.

Fuentes: [Expo](https://docs.expo.dev/billing/plans/), [Supabase](https://supabase.com/pricing), [Apple](https://developer.apple.com/support/compare-memberships/), [Google Play](https://support.google.com/googleplay/android-developer/answer/6112435).

No hay anuncios, compras ni SDK de seguimiento publicitario.

## Comprobar Google antes del siguiente APK

1. Configurar las dos variables públicas de `.env.example` en `.env`.
2. Aplicar ambas migraciones SQL al proyecto Supabase.
3. Configurar un cliente OAuth Web de Google con el callback HTTPS que muestra el proveedor Google de Supabase. Guardar ID y secreto en Supabase, nunca en la app. Solo se solicitan openid, email y profile; estos permisos básicos están exceptuados de la lista de usuarios de prueba ([Google](https://support.google.com/cloud/answer/15549945?hl=en)).
4. Permitir `familypoints://auth/callback` en las redirecciones de Supabase.
5. Ejecutar `npm run check:auth`: comprueba conectividad y proveedor Google habilitado, sin mostrar claves. No sustituye al login real.
6. Añadir `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` al entorno `preview` de EAS y recompilar. Los APK antiguos no reciben esta configuración automáticamente.
7. En dos móviles, entrar con Google con cuentas diferentes, crear un grupo e invitar a la otra persona; sumar, aceptar y canjear. Cerrar y reabrir la app, cerrar sesión, cancelar Google y volver a entrar.

El 28 de septiembre se conectaron Supabase y Google, se aplicaron ambas migraciones y se configuraron `.env` y las variables públicas de EAS preview. Acceso real, retorno, persistencia y cierre de sesión verificados en Chrome local. Pendiente prueba de Android y dos cuentas en móviles. El retorno usa PKCE con navegador del sistema, selección de cuenta y un único intercambio compartido entre callbacks concurrentes de Android. Google permanece en Testing; no se ha publicado en tiendas ni contratado un plan de pago.

Al cambiar variables públicas, limpiar la caché del bundle: `npm run export:web -- --clear`. Para el APK usar `npx eas-cli@latest build --profile preview --platform android --clear-cache`.
