# Family Points

Una app para reconocer lo que cada persona aporta y disfrutar de recompensas acordadas por el grupo. React Native + Expo 57 + TypeScript + Supabase.

## Estado actual

Hay una demo funcional, persistente en el dispositivo, en español e inglés. Permite alternar entre Alex y Sam para completar aportaciones, mayoría, ajustes, saldo y canjes. No necesita cuentas ni servicios externos.

También están implementados el cliente de correo/contraseña y Google, las pantallas de grupos/invitaciones y las operaciones PostgreSQL de Supabase. **Supabase y Google están conectados; el acceso real, retorno, persistencia y cierre de sesión se han verificado en web.** Falta la prueba Android y la sincronización con dos cuentas en dos dispositivos. No es todavía una versión lista para las tiendas.

Al crear un grupo se abre **Compartir grupo** con su código visible. El creador también puede llegar desde Inicio o Grupo, copiar el código o compartirlo con otra app. El invitado entra con Google y usa **Unirme al grupo** con ese código. Los códigos caducan a los siete días y pueden renovarse desde la misma pantalla.

## Probar ahora

**Android instalable:** [APK de prueba 0.1.4](https://expo.dev/artifacts/eas/DcHWFZWGZnYSoraJKjol8WTKdH7oFbHoOJbQmX8zDeM.apk). La versión 0.1.6 está en preparación. [Instrucciones y estado de verificación](docs/apk-prueba.md).

Requisitos: Node.js 24 LTS (Expo requiere al menos 22.13) y npm.

```powershell
npm ci
npm run web
```

Pulsa **Probar con una pareja de ejemplo**. Cambia de miembro desde Inicio o Grupo para emitir los votos ajenos. En la demo de pareja, basta la aceptación de la otra persona. Los grupos reales siguen admitiendo más miembros y mayoría.

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
- Puntos acumulados y Canjear puntos, con textos más informales.
- Estilos Pop (predeterminado), Calma, Noche y Club, elegibles en Grupo y guardados en el dispositivo.
- Saldo de cada miembro en Grupo; saldo negativo desactivado de inicio, con un límite de 0 a 100 activable por acuerdo.
- En una pareja, aceptar los puntos ajustados cierra la aportación sin otro voto; el historial agrupa los pasos de cada solicitud.
- Selector visual de fecha con «Hoy» por defecto.
- Formulario de aportación más corto: categoría desplegable, pocas ideas iniciales y foto opcional de hasta 2 MB, visible solo al grupo.
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

Para Google y enlaces con el esquema propio se necesita un binario propio (por ejemplo el APK preview), no Expo Go. Véase [publicación](docs/publicacion.md). Compilar el binario **no equivale** a instalarlo y probarlo en un dispositivo.

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
