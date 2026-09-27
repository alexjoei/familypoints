# Family Points

Una app para reconocer lo que cada persona aporta y disfrutar de recompensas acordadas por el grupo. React Native + Expo 57 + TypeScript + Supabase.

## Estado actual

Hay una demo funcional, persistente en el dispositivo, en español e inglés. Permite alternar entre Alex, Sam y Dani para completar aportaciones, mayoría, ajustes, saldo y canjes. No necesita cuentas ni servicios externos.

También están implementados el cliente de correo/contraseña y Google, las pantallas de grupos/invitaciones y las operaciones PostgreSQL de Supabase. **La autenticación real y la sincronización entre dispositivos aún no se han conectado ni probado**, porque faltan el proyecto Supabase y la configuración OAuth de Google. No es todavía una versión lista para las tiendas.

## Probar ahora

**Android instalable:** [APK de prueba 0.1.1](https://expo.dev/artifacts/eas/vxMX6cq4MUQdkj1eanlpGhoRGIIrY5FLRFn6kaE3vqQ.apk). [Instrucciones y estado de verificación](docs/apk-prueba.md).

Requisitos: Node.js 24 LTS (Expo requiere al menos 22.13) y npm.

```powershell
npm ci
npm run web
```

Pulsa **Probar con un grupo de ejemplo**. Cambia de miembro desde Inicio o Grupo para emitir los votos ajenos. En un grupo de tres, los otros dos deben aprobar.

Para una vista compilada sin servidor de desarrollo:

```powershell
npm run export:web
npm run preview
```

Abre http://127.0.0.1:4173. El servidor escucha solo en tu ordenador. Esta vista usa el mismo código React Native que las aplicaciones móviles.

En esta máquina Windows, si npm devuelve `UNABLE_TO_VERIFY_LEAF_SIGNATURE`, activa los certificados de confianza del sistema **en esa terminal**, antes de instalar:

```powershell
$env:NODE_USE_SYSTEM_CA = '1'
npm ci
```

No hace falta desactivar TLS ni cambiar certificados globales.

## Qué puedes probar

- Aportaciones con categoría, plantilla, puntos, fecha y nota.
- Aprobación y rechazo por mayoría ajena; sin autovotos.
- Propuesta de ajuste, aceptación del autor y nueva votación.
- Reenvío de una aportación rechazada con revisiones anteriores conservadas.
- Saldo individual, reservas y canjes aprobados o rechazados.
- Recompensas nuevas y cambios de coste sometidos a votación.
- Sugerencia de puntos basada en el último valor aprobado de cada plantilla.
- Historial por miembro/tipo y detalle de cada propuesta.
- Categorías y plantillas editables por quien administra.
- Español/inglés y humor desactivable.
- Botón + centrado abajo en todas las pantallas del grupo: Añadir Family Points.
- Botín individual y Canjear Family Points, con textos más informales.
- Estilos Pop, Calma y Noche, elegibles en Grupo y guardados en el dispositivo.
- Estado de cada votante: pendiente, visto sin votar, aprobado o rechazado. Abrir el detalle marca la revisión como vista; aparecer en la lista no lo hace.

La demo mantiene sus cambios al recargar; hay que volver a entrar en ella desde la bienvenida. Los nombres y textos escritos por los miembros no se traducen automáticamente.

## Verificación

```powershell
npm run check
npm run export:web
npx playwright install chromium
npm run test:e2e
npx expo-doctor
```

- `check`: TypeScript, ESLint y pruebas de reglas, base de datos y compatibilidad.
- PostgreSQL se prueba localmente mediante PGlite; no usa cuentas ni datos reales.
- Playwright recorre creación, votación, canje completo, persistencia, idioma y revisiones.
- Capturas de interfaz en `artifacts/`; trazas de fallos en `test-results/`.
- CI preparada en `.github/workflows/check.yml`, sin despliegues automáticos.

## Móvil

Para explorar la demo en Expo Go compatible con SDK 57:

```powershell
npx expo start --go
```

Para Google y enlaces con el esquema propio se necesita un build de desarrollo. Véase [publicación](docs/publicacion.md). Se han generado bundles JavaScript/Hermes para iOS y Android; eso **no equivale** a instalar y probar un binario en un dispositivo.

## Conectar cuentas reales

Copia `.env.example` a `.env`, configura el proyecto y ejecuta la migración siguiendo [la guía de conexión](docs/publicacion.md). Reinicia Expo después de cambiar variables.

Nunca pongas el secreto de Google ni la clave `service_role` en la app. Solo se admiten la URL y la clave pública de Supabase.

## Documentación

- [Producto y decisiones](docs/producto.md)
- [Arquitectura](docs/arquitectura.md)
- [Configuración y publicación](docs/publicacion.md)
- [Estado de entrega y próximos pasos](docs/estado.md)
- [Adaptador temporal de dependencias](vendor/decode-uri-component/README.md)

La app sigue siendo gratuita. Ideas premium aparcadas: automatizaciones, estadísticas y personalización por grupo.

La licencia del código inicial de Expo se conserva en `docs/licenses/expo-template.LICENSE`. No se ha tomado una decisión de licencia para el producto Family Points.
