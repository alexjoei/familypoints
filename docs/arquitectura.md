# Arquitectura

## Base aprobada

React Native, Expo SDK 57, Expo Router y TypeScript. Supabase Auth y PostgreSQL. Correo/contraseña y Google desde el MVP; Apple antes de publicar en iOS. Sin servicios de pago activados.

Se valoraron Flutter y Firebase. Se eligieron Expo y Supabase por una base móvil compartida y un modelo de datos adecuado para grupos, votos e historial.

## Estructura implementada

- `src/app/`: rutas de acceso, invitación, aportación, detalle y cinco pestañas.
- `src/components/ui.tsx`: colores, tipografía, controles accesibles y contenedores.
- `src/domain/model.ts`: reglas puras para la demo y tipos compartidos.
- `src/domain/demo.ts`: catálogo inicial y grupo ficticio.
- `src/state/AppProvider.tsx`: sesión, preferencias, demo, lectura y envío de comandos.
- `src/lib/supabase.ts`: cliente Auth, almacenamiento nativo seguro y Google OAuth PKCE.
- `src/features/`: tarjetas de propuestas y registro de actividad.
- `supabase/migrations/`: tablas, RLS y operaciones atómicas.
- `tests/`: lógica de puntos, integración PostgreSQL y compatibilidad de dependencias.
- `e2e/`: recorridos de navegador en formato móvil.
- `assets/brand.svg`: fuente vectorial del icono; `npm run brand` regenera sus PNG.
- `vendor/decode-uri-component/`: adaptador pequeño para usar el decodificador corregido manteniendo la API CommonJS requerida por Expo Router.

## Dos modos claramente separados

**Demo:** tres miembros ficticios, cambio de actor visible, datos en AsyncStorage, motor TypeScript. Nunca se envía a Supabase ni acredita puntos reales.

**Con cuentas:** sesión real; grupos y operaciones mediante RPC de Supabase. El cliente no envía un actor de confianza ni calcula el saldo definitivo. Las reglas se aplican de nuevo en PostgreSQL. No hay escrituras offline ni aprobaciones optimistas.

El idioma y la preferencia de humor se guardan localmente. Los textos del grupo se conservan como los escriben sus miembros. Los catálogos nuevos se generan en el idioma de creación.

## Datos y consistencia

- `fp_groups`: nombre, administrador, categorías, plantillas e invitación privada.
- `fp_members`: pertenencia y nombre por grupo.
- `fp_proposals`: aportaciones, propuestas de recompensa, cambios de coste y canjes.
- `fp_activity`: eventos ordenados por secuencia, visibles para miembros.
- `fp_commands`: identificadores de petición para reintentos idempotentes.

Cada propuesta contiene en JSONB su revisión, electorado, votos y revisiones anteriores. Esta agrupación mantiene juntos los datos que cambian de forma atómica; los grupos y la pertenencia siguen siendo relaciones con claves foráneas.

El saldo se deriva de aportaciones y canjes aprobados; las solicitudes pendientes de canje constituyen reservas. Las propuestas aprobadas no tienen operación de edición. No hay un saldo duplicado que pueda desincronizarse.

Una operación bloquea la fila del grupo antes de comprobar reservas o cerrar una votación. Así, dos canjes se evalúan secuencialmente contra el saldo disponible. El cliente conserva el identificador de un comando fallido para reintentarlo sin repetir efectos.

El coste de un canje se obtiene de la recompensa en el servidor, ignorando la cifra que envíe el cliente. Las reservas previas conservan su coste cuando se aprueba un nuevo precio.

## Permisos

- Tablas con RLS; sin permisos directos de escritura para usuarios.
- Funciones de escritura comprueban `auth.uid()`, pertenencia y permisos.
- Solo el administrador puede obtener o renovar códigos de invitación.
- El snapshot del grupo nunca incluye el secreto de invitación.
- Las funciones internas de eventos y saldo no se pueden ejecutar desde la API.
- Votos únicos por miembro y revisión; sin autovotos.
- Rechazos, retiradas y ajustes permanecen en el historial.
- Tokens nativos en SecureStore, divididos en bloques; claves privadas nunca en el cliente.

## Actualización y límites actuales

Se actualiza después de cada acción, al volver a la app, mediante gesto de refresco y cada 15 segundos mientras el grupo está abierto. No se ha añadido Realtime; puede valorarse cuando la prueba real lo necesite.

Los snapshots incluyen todo el historial y no están paginados: apropiado para una prueba reducida, pendiente de optimizar antes de grupos con mucha actividad. Los tests PGlite comprueban SQL real, transacciones e idempotencia, pero no sustituyen pruebas de carga con múltiples conexiones a Supabase.

El electorado se fija por revisión. Quien se incorpora participa en nuevas propuestas, no cambia las ya abiertas. No se han implementado bajas/expulsiones ni cambios arbitrarios del umbral.

## Pendiente de decisión

Rectificaciones de aportaciones ya aprobadas (especialmente si se han gastado los puntos), bajas de miembros y efectos sobre solicitudes pendientes. Las operaciones que dependen de esos acuerdos se han dejado fuera, sin inventar una regla.

## Evolución

Primero verificar correo/Google y el flujo entre varias cuentas y móviles reales. Después, cerrar las decisiones de bajas/rectificaciones, eliminar cuentas con una política de conservación acordada y preparar Apple/tiendas. Monetización futura, sin código de pagos: automatizaciones, estadísticas o personalización por grupo.

## Estilos y estados de lectura

Los estilos Pop, Calma y Noche comparten componentes y cambian mediante tokens de color, contraste y forma. La preferencia se guarda localmente, junto al idioma y humor, y no altera reglas ni datos del grupo. El botón global + se muestra dentro del grupo, también en detalle y formularios; pulsarlo dentro del formulario conserva el borrador.

Las lecturas se guardan separadas de los votos en fp_seen_receipts, por grupo, propuesta, revisión y usuario. fp_mark_seen identifica al usuario autenticado y exige pertenencia y derecho a votar. Abrir el detalle marca la revisión como vista; una lista no implica lectura. Una revisión nueva vuelve a pendiente. Leer no suma votos, cambia saldos ni genera actividad de decisión. Los estados usan icono, texto y color semántico independiente del estilo.
