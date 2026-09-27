# Producto y decisiones

## Aprobado con el usuario

- Nombre: Family Points. iOS y Android. Español e inglés.
- Válido para parejas, familias, compañeros de piso, amigos y otros grupos.
- Cada miembro tiene saldo individual por grupo. Aportar suma; canjear resta. Sin transferencias, bote común ni saldo negativo en el MVP.
- Mayoría estricta de los demás miembros; el autor no vota. Grupos de 2/3/4/5 requieren 1/2/2/3 aprobaciones respectivamente.
- Rechazo también por mayoría. Empate o votos insuficientes dejan la solicitud pendiente. El autor puede retirarla.
- Aportaciones pendientes no suman. Rechazadas pueden corregirse y reenviarse.
- Un ajuste necesita aceptación del autor y reinicia los votos sobre el nuevo valor. Los votos anteriores permanecen en el historial.
- Lo aprobado se rectifica de forma visible; no se borra el pasado.
- Cada plantilla empieza con un valor editable. La siguiente aportación sugiere el último valor aprobado para esa plantilla y ese grupo; nunca recalcula aportaciones anteriores.
- Cualquiera propone recompensas. Su activación y cambios de coste requieren aprobación. Aplicar mayoría como regla común.
- Canjes por solicitud y mayoría ajena. Se reservan puntos al solicitar; se descuentan al aprobar y se liberan al rechazar o retirar. Sin seguimiento de disfrute.
- El creador administra miembros, invitaciones, categorías, plantillas y reglas; todos pueden aportar, votar y proponer recompensas.
- Cambios importantes y votos visibles en el historial. Cambios de reglas para solicitudes nuevas.
- Correo y contraseña más Google desde el MVP.
- Gratuito durante la prueba; monetización aplazada. Ningún servicio de pago activado automáticamente.

## Catálogo inicial editable

| Categoría    | Aportación                        | Puntos |
| ------------ | --------------------------------- | -----: |
| Cocinar      | Preparar una cena                 |     15 |
| Limpieza     | Fregar los platos                 |     10 |
| Compra       | Hacer la compra                   |     20 |
| Gestiones    | Resolver una gestión del grupo    |     15 |
| Cuidado      | Encargarse de un cuidado acordado |     20 |
| Organización | Organizar un plan del grupo       |     15 |
| Favores      | Echar una mano                    |     10 |

Recompensas sugeridas: elegir película (30), librarse de cocinar una vez (50), noche libre de responsabilidades acordadas (100). Son ejemplos opcionales, no valores universales. Nombres y categorías del sistema traducidos; contenido del grupo en el idioma que escriban sus miembros.

## Alcance MVP

1. Registro, acceso, recuperación de contraseña, crear grupo y unirse mediante código o enlace.
2. Inicio con saldos, pendientes, actividad y acceso a añadir aportación.
3. Aportación con título, categoría, plantilla opcional, puntos, fecha y nota opcional.
4. Votación, rechazo, ajuste aceptado y reenvío.
5. Recompensas y canjes con reserva de saldo.
6. Historial con filtros básicos y detalle de decisiones.
7. Ajustes de miembros, invitaciones, categorías, plantillas y valores sugeridos.
8. Idiomas español/inglés y humor desactivable.

Fuera: chat, rankings, rachas, recurrencias, estadísticas avanzadas, transferencias, pagos, notificaciones push y funcionamiento offline con escrituras.

## Diseño

Limpio, cálido, adulto. Lenguaje de grupo y aportaciones; sin asumir pareja ni hogar. Humor ligero, opcional, nunca culpabilizador. Información de puntos y decisiones legible y accesible. Ejemplo de estado vacío: «El grupo está en paz. De momento.»

## Pendientes que requieren decisión antes de su implementación

- Resuelto: Google y correo ahora; Apple antes de publicar en iOS.
- Efecto de abandonar o expulsar un miembro sobre solicitudes pendientes: recomendar congelar electorado y regla por revisión, pero acordar antes de implementar bajas.
- Rectificar puntos ya gastados sin permitir saldo negativo: acordar el tratamiento antes de implementar rectificaciones de saldo insuficiente.
- Autovalidación excepcional: desactivada; no implementar interruptor hasta acordar alcance y registro de la excepción.

## Monetización futura

Ideas sin implementar: suscripción por grupo para automatizaciones, estadísticas y personalización; pago puntual por temas. Mantener útil el flujo gratuito y evitar anuncios intrusivos.

## Ajustes de experiencia

Añadir Family Points es la acción global del botón + centrado abajo. El saldo se presenta como botín y la acción de recompensas como Canjear Family Points. Tres estilos gratuitos: Pop (predeterminado), Calma y Noche, elegidos por cada persona en su dispositivo.

En pendientes se muestran los miembros con derecho a voto: reloj pendiente, ojo visto sin votar, check verde aprobado y cruz roja rechazado. Visto significa que abrió el detalle de esa revisión. No equivale a aprobación.

Monetización: estos tres estilos y los estados individuales permanecen gratuitos. Se mantienen para más adelante las ideas de automatizaciones y estadísticas premium por grupo, sin implementar cobros.

## Claridad del flujo — 27 de septiembre de 2026

Esta revisión sustituye la terminología anterior: Sumar puntos, Aceptar puntos, Canjear puntos y Puntos acumulados. Inicio muestra primero saldo y ambas acciones. Puntos acumulados son los ganados menos los canjeados; se indica aparte cuánto está disponible y cuánto reservado. La guía de tres pasos explica la aceptación del grupo.

Las solicitudes pendientes muestran quién quiere sumar o canjear, cuántos puntos y el motivo; distinguen si te toca responder o esperas al grupo. Aceptar, Rechazar y Proponer puntos están antes del detalle de votantes. Los canjes no admiten ajustes porque usan un coste ya acordado. Añadir opción de canje sirve para acordar una nueva opción y no descuenta puntos: esa distinción se explica en pantalla.

Cambios disponibles en el código y preview web. El APK 0.1.0 previamente compartido no incorpora esta revisión; necesita una compilación nueva. Sin cambios en backend, mayorías ni costes. Esta mejora forma parte de la experiencia gratuita.
