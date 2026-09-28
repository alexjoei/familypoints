# Family Points — relevo de trabajo (28 septiembre 2026)

## Objetivo y preferencias vigentes

MVP Expo/React Native para iOS/Android, en español e inglés, gratuito, válido para parejas y otros grupos. Cada persona gana y canjea sus puntos; el resto aprueba por mayoría, sin autovoto; historial visible. Copy cercano: «Sumar puntos», «Aceptar puntos», «Canjear puntos» y «Puntos acumulados». Demo Alex y Sam. Botón `+` centrado y disponible en todas las pantallas de grupo. Temas Pop/Calma/Noche.

Último feedback: el compartir grupo debe aparecer al crearlo y desde Inicio/Grupo, con un código corto y fácil de copiar. En «Unirme al grupo», el teclado no debe tapar el campo y el botón debe activarse al pegar un código. El usuario desconfía del dominio aleatorio de Supabase en Google y **eligió seguir gratis con Google nativo** en Android. Se debe conservar Supabase para sesiones, autorización y datos. La pantalla Google nativa debe evitar mostrar el host aleatorio; el flujo web/iOS puede mantener OAuth hasta que se configure nativo allí.

**WhatsApp:** el usuario prohibió volver a usar el WhatsApp anterior y el chat «alex propio». Solo se puede usar, si el usuario solicita un envío, el WhatsApp abierto en una sesión anónima de Chrome y el contacto exacto «Alex». No reutilizar ningún tab anterior de WhatsApp. No hay una instrucción nueva de enviar este APK por WhatsApp.

**Presupuesto de tokens:** reservar al menos el 20 % sin usar. El usuario lo pidió expresamente.

## Proyecto y comandos

Workspace: `C:\Users\alexj\source\repos\familypoints\familypoints` (PowerShell). `main`, remoto `https://github.com/alexjoei/familypoints.git`. Expo SDK 57, React Native 0.86, npm (`package-lock.json`). AGENTS.md exige leer versión y docs Expo antes de tocar APIs Expo, Expo Router en `src/app`, `npx expo install` para dependencias, lint y typecheck al terminar. Para comandos con red usar `$env:NODE_USE_SYSTEM_CA='1'`. Git push usa `git -c http.sslBackend=schannel push origin main`. Shell sandbox suele exigir `sandbox_permissions:"require_escalated"`.

Comprobación: `npm run check`, `npm run export:web -- --clear`, `npm run test:e2e`, `npm run check:auth`. EAS preview: `npx eas-cli@latest build --platform android --profile preview --non-interactive --no-wait`; usa firma remota existente, incrementa versionCode y produce APK. Nunca editar `ios/` ni `android/` a mano. `.env` contiene solo URL y clave **pública** de Supabase y está ignorado por Git; EAS preview ya tiene ambas variables públicas. No poner secretos OAuth en app, repo ni EAS.

## Estado confirmado y referencias

Código publicado hasta commit `c46f587` (`main`): pantalla Compartir grupo nueva (`src/app/share.tsx`), acceso tras crear grupo y desde Inicio/Grupo, copiar y compartir código; dependencias `expo-clipboard` instaladas; versión app 0.1.3. Antes de las correcciones nuevas, 45 pruebas, typecheck, lint y 6 pruebas web pasaban. Build 0.1.3 `f3b94184-e9d0-4870-bf9a-43ba9cec18d0` se **canceló** porque quedó obsoleto con el feedback nuevo.

Último APK entregado y verificado: 0.1.2, https://expo.dev/artifacts/eas/gQB6TfohJGUTldRl2NwnsDze3BqnOCNyuLqIobItmho.apk . El código actual **no** está en ese APK. No presentarlo como nueva versión.

Supabase Free: ref `qvrfzvsciconvswrjbhy`, URL `https://qvrfzvsciconvswrjbhy.supabase.co`, región Irlanda. Migraciones `202609260001_initial.sql` y `202609260002_seen_receipts.sql` desplegadas previamente mediante SQL Editor; seis tablas con RLS. Google Cloud project `familypoints-510007`, cliente OAuth Web conectado a Supabase; callback HTTPS ya configurado y Google login real verificado en web (acceso, retorno, persistencia, salida). Supabase redirect `familypoints://auth/callback` permitido. El secreto Google está solo en Supabase.

La migración **`202609280003_short_invites.sql` se aplicó en el SQL Editor de Supabase** en una transacción y mostró `Success. No rows returned`. Aún no está versionada/commiteada. Cambia default y rotación de invitaciones a 12 hex minúsculas; `fp_join_group` acepta mayúsculas, espacios y guiones. No volver a aplicarla sin comprobar primero el estado de la base de datos. Los códigos anteriores de 32 caracteres funcionan hasta que su dueño abre Compartir grupo en la versión nueva: entonces se renuevan y los enlaces antiguos quedan invalidados; la rotación se registra en actividad. El backend sigue limitando la lectura del código al propietario.

## Cambios locales sin commit

`src/app/index.tsx`: CTA «Unirme con código» visible antes de crear grupo; envía a `/join`. `src/app/join.tsx`: formulario dedicado con código y nombre juntos, `KeyboardAvoidingView`, nombre sugerido de Google/email, botón activado al tener ambos. Lee invitaciones guardadas si no hay código en URL. `src/app/share.tsx`: código visual `XXXX-XXXX-XXXX`, mensaje compartido legible. `src/lib/invitation.ts`: renueva códigos viejos/largos al abrir compartir. `src/state/AppProvider.tsx`: normaliza espacios/guiones/mayúsculas del código. `tests/database.test.ts`: comprueba longitud 12, revocación y unión con código formateado. `e2e/flow.spec.ts`: comprueba pegado de código, activación del botón y persistencia al ir a inicio de sesión. Migración 003 nueva. Versión `app.json` y Ajustes: 0.1.4. `git status --short` para lista exacta.

Comprobado en este turno: `npm run check` (45 unitarias, tipos y lint), `npm run export:web -- --clear`, `npm run test:e2e` (7 pruebas). La prueba real de unión entre dos cuentas y la comprobación visual del teclado en Android siguen pendientes. Revisar navegación tras crear grupo → Compartir grupo y volver a Inicio en el APK. No crear grupos reales de prueba persistentes sin necesidad.

## Google nativo, decisión y bloqueo

Investigación oficial: Supabase aparece como `qvr...supabase.co` porque actúa como intermediario OAuth, gestiona sesiones y protege la BD con RLS. Un subdominio Supabase legible exige plan Pro/Team/Enterprise; dominio propio es add-on de pago. No contratar. [Supabase custom domains](https://supabase.com/docs/guides/platform/custom-domains), [Supabase Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google).

Ruta gratuita elegida: [Expo Google authentication](https://docs.expo.dev/guides/google-authentication/) recomienda `react-native-nitro-google-signin` (Credential Manager Android) frente al SDK antiguo. [Nitro usage](https://react-native-nitro-google-sign-in.github.io/docs/guide/usage/) permite `configure({ webClientId, nonce })`, donde nonce es SHA-256 hex; devolver `idToken`; Supabase `auth.signInWithIdToken({provider:'google',token:idToken,nonce:rawNonce})` valida y crea sesión. Generar nonce aleatorio y hash SHA-256 con `expo-crypto` antes de sign-in. No desactivar comprobaciones nonce. Android requiere cliente OAuth Android con paquete `app.familypoints.mobile` y SHA-1 de la firma APK. SHA-1 extraído del APK 0.1.2: **`A5:6A:C3:90:BE:1D:D7:64:2A:B2:6A:5F:27:9D:85:A0:2B:0C:12:CB`**. El cliente Web ID existente es `31631729751-c33sklo13s9o6qhi1f3jeid7gi6217hg.apps.googleusercontent.com` (público). Ver [Nitro Expo setup](https://react-native-nitro-google-sign-in.github.io/docs/setup/expo/) y [Google Cloud config](https://react-native-nitro-google-sign-in.github.io/docs/setup/google-cloud/). Sin Firebase se puede usar `webClientId` explícito y evitar `google-services.json`; plugin Expo puede requerir `iosUrlScheme` al compilar iOS. Mantener OAuth actual como fallback web/iOS hasta preparar y verificar clientes nativos respectivos. Validar si la biblioteca y su config plugin compilan con Expo57 antes de afirmar completado.

**Bloqueo de herramienta:** al intentar abrir Google Cloud con Computer Use, auto-review primero rechazó el acceso por límite de uso e indicó reintentar después de las 2:47 PM. Un segundo intento tras el reset fue rechazado como riesgo inaceptable y prohibió explícitamente rodear el bloqueo mediante otro navegador, CDP, shell, CLI u otra vía equivalente. No intentarlo de nuevo por una vía alternativa. Si persiste, pedir al usuario que configure el cliente Android con paquete y SHA-1 indicados o que resuelva el acceso. Crear un cliente OAuth Android en la UI implica credenciales persistentes; cumplir la política de confirmación de la herramienta en el momento de guardarlo. El usuario ya eligió Google nativo gratis como dirección de producto. Se instalaron temporalmente `react-native-nitro-google-signin` y Nitro Modules, pero se retiraron: el plugin añadido automáticamente exigía `iosUrlScheme` sin disponer aún de cliente iOS. No entregar un build roto o afirmar que Google nativo está implementado.

## Entrega pendiente

1. Terminar y verificar correcciones de invitación/teclado, incluidas pruebas locales y de BD.
2. Verificar desplegada migración 003 sin repetirla; probar unirse con código de 12 caracteres mediante una cuenta real solo cuando sea viable.
3. Implementar Google nativo Android con nonce, instalar deps vía `npx expo install`, configurar plugin y crear cliente Android en Google Cloud tras reset; comprobar el retorno y sesión. Un fallo de build o del proveedor debe informarse sin presentarlo como terminado.
4. Actualizar docs/estado y publicación, commit/push, crear APK nuevo, descargar y verificar ZIP/manifiesto/bundle. Entregar enlace al usuario en la conversación. **No enviar nada por el WhatsApp anterior.**
5. El usuario debe probar el APK en dos móviles y confirmar si la pantalla Google se ve confiable; explicar cualquier limitación restante.
