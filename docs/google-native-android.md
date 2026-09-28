# Google nativo en Android

El código de Android está preparado, pero permanece desactivado hasta registrar el cliente OAuth Android y probarlo en un APK firmado. El APK 0.1.4 usa todavía el acceso de Google alojado de Supabase.

## Paso de Google Cloud

En el proyecto `familypoints-510007`, abre [Credenciales de Google Cloud](https://console.cloud.google.com/apis/credentials?project=familypoints-510007), elige **Crear credenciales → ID de cliente OAuth → Aplicación Android** y usa:

- Nombre: `Family Points Android (EAS preview)`.
- Nombre del paquete: `app.familypoints.mobile`.
- Huella SHA-1 del certificado del APK EAS: `A5:6A:C3:90:BE:1D:D7:64:2A:B2:6A:5F:27:9D:85:A0:2B:0C:12:CB`.

Este cliente Android no necesita un secreto en la app. Se conserva el cliente OAuth **Web** existente, `31631729751-c33sklo13s9o6qhi1f3jeid7gi6217hg.apps.googleusercontent.com`, para obtener el ID token que acepta Supabase. No cambies ni borres el cliente web ni la configuración actual de Supabase. Para una futura publicación en Google Play habrá que añadir también la SHA-1 del certificado de firma de Play si difiere de la de EAS.

## Activación y verificación

Cuando el cliente Android exista, configurar `EXPO_PUBLIC_NATIVE_GOOGLE_ENABLED=true` en el entorno **preview** de EAS y crear un nuevo APK. La variable es pública y solo activa la ruta nativa en Android; web e iOS conservan el flujo anterior. En el teléfono, comprobar que «Continuar con Google» abre el selector de cuentas del sistema, entra o crea la cuenta de Family Points, mantiene la sesión tras reiniciar y permite cerrar sesión y elegir otra cuenta. Probar también la invitación entre dos cuentas reales.

El flujo Android genera 32 bytes aleatorios en cada intento, envía su hash SHA-256 a Google y entrega el valor original a `supabase.auth.signInWithIdToken`. El módulo está en `src/lib/google-native.android.ts`; `src/lib/supabase.ts` crea la sesión. No se debe activar la variable antes del cliente Android: de hacerlo, Google rechazará el acceso en el dispositivo.

Se instala `react-native-nitro-google-signin` y `react-native-nitro-modules` con `npx expo install`. El plugin del paquete no figura en `app.json`: en modo sin Firebase únicamente agrega configuración iOS y exige un cliente iOS que aún no existe. Android usa autolinking y un `webClientId` explícito. **Falta verificar la compilación nativa con EAS y la prueba en un dispositivo Android**; el export del bundle Android no sustituye ambas pruebas.
