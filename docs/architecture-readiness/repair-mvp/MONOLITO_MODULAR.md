# Monolito modular

## Dirección

**[RDD]** [ADR-002](../../decisions/proposed/ADR-002-modular-monolith-first.md), aceptado el 2026-07-21, establece un monolito modular orientado al dominio: un único artefacto/despliegue y una sola aplicación backend iniciales, fronteras lógicas explícitas y una base física con propiedad lógica por módulo.

## Por qué encaja

- **[DAR]** Etapa: el producto todavía valida reglas y necesita cambios coordinados y reversibles.
- **[ST]** Equipo: no hay evidencia de varios equipos autónomos que justifique despliegues independientes.
- **[DAR]** Velocidad y despliegue: una sola unidad reduce coordinación operativa sin renunciar a fronteras.
- **[DAR]** Consistencia: folio, custodia, autorización, pago y entrega pueden usar transacciones locales cuando corresponde.
- **[DAR]** Observabilidad: una correlación común facilita seguir el flujo completo al inicio.
- **[DAR]** Costos: evita red, descubrimiento, colas y operación distribuida prematuros.
- **[DAR]** Evolución: contratos internos y propiedad permiten extraer sólo con evidencia futura.
- **[R]** Un monolito sin módulos degradaría rápidamente en acceso transversal a datos.

## Condiciones mínimas

| Condición | Verificación | Clasificación |
| --- | --- | --- |
| Propiedad | Cada dato mutable tiene un módulo dueño | DAR |
| Encapsulación | Sólo contratos publicados cruzan fronteras | DAR |
| Dependencias | No hay ciclos entre módulos de dominio | DAR |
| Persistencia | No hay escritura directa sobre almacenamiento ajeno | DAR |
| Tenancy | El contexto es obligatorio en toda operación | RDD |
| Pruebas | Invariantes y fronteras tienen pruebas automatizadas | DAR |
| Observabilidad | Logs y métricas identifican módulo y correlación | DAR |

## Qué no implica

- **[ST]** No implica una sola capa ni un único modelo universal.
- **[ST]** No exige una sola base de datos para siempre; esa decisión depende de ADR.
- **[ST]** No implica un solo archivo, una sola tabla, acceso global ni ausencia de fronteras.
- **[ST]** No implica un agregado gigante.
- **[FMVP]** No incluye microservicios ni comunicación distribuida por defecto.
- **[FMVP]** No incluye Event Sourcing.

## Principios de preservación

- **[DAR]** Responsabilidad, lenguaje y datos propietarios explícitos por módulo.
- **[DAR]** Dominio independiente de infraestructura y comunicación interna controlada.
- **[DAR]** Transacciones locales sólo donde una invariante exige consistencia inmediata.
- **[DAR]** Eventos internos sólo cuando reducen acoplamiento; no para esconder transacciones.
- **[DAR]** Sin acceso indiscriminado a datos ajenos, utilidades globales con negocio ni ciclos.
- **[DAR]** Sin módulos vacíos creados sólo para una posibilidad futura.

## Señales para reconsiderar

**[ADR]** Una extracción futura requeriría evidencia de escalado independiente, aislamiento regulatorio, propiedad de equipo, fallos operativos o ciclos de despliegue realmente distintos. El tamaño de una tabla o la preferencia tecnológica no bastan.
