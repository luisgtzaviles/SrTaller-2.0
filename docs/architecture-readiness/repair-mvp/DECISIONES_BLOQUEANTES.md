# Decisiones bloqueantes

## Matriz de decisiones

| ID | Decisión | Momento que bloquea | Cierre mínimo | Clasificación |
| --- | --- | --- | --- | --- |
| B-01 | Alcance exacto del MVP | Bloquea primer cambio de código | Flujo/capacidades aprobados por Responsable de Producto | PB |
| B-02 | Término Orden de Servicio vs Orden de Reparación | Bloquea primera rebanada | Término oficial y alias documentados | PB |
| B-03 | Alcance de unicidad del folio | Bloquea primera rebanada | Tenant/sucursal/global decidido | PB |
| B-04 | Modelo multitenant de datos | Bloquea primer cambio de código | Contexto y defensa de aislamiento aceptados | PB |
| B-05 | Sucursal activa | Bloquea primer cambio de código | Resolución, cambio y alcance definidos | PB |
| B-06 | Política efectiva/herencia | Bloquea primera rebanada | Defaults, tenant, sucursal y versión acordados | PB |
| B-07 | Agregado raíz de Orden | Bloquea primer cambio de dominio | Coordinador y límites aprobados | PB |
| B-08 | Separación de Cotización | Bloquea R3 | Identidad, versión, obsolescencia y decisión definidos | PB |
| B-09 | Pagos básicos | Bloquea R5 | Movimiento, moneda, reverso y saldo definidos | PB |
| B-10 | Estados mínimos | Bloquea primera rebanada | Catálogo y transiciones mínimas aprobados | PB |
| B-11 | Ubicaciones mínimas | Bloquea R2 | Catálogo, movimiento y relación con estado definidos | PB |
| B-12 | Fin de custodia | Bloquea R5 | Únicamente entrega válida y correcciones definidas | PB |
| B-13 | Segunda revisión obligatoria | Bloquea R4 | Criterios, rol, repetición y excepción definidos | PB |
| B-14 | Identidad y PIN | Bloquea primer cambio de código | Sesión, PIN, inactividad, revocación y atribución aceptados | PB |
| B-15 | Roles y permisos mínimos | Bloquea primer cambio de código | Matriz por capacidad/alcance | PB |
| B-16 | Estrategia de archivos | Bloquea evidencia en R1 | Clasificación, límites, acceso y retención | PB |
| B-17 | Zona horaria | Bloquea primera rebanada | Fuente, almacenamiento conceptual y presentación acordados | PB |
| B-18 | Concurrencia de folios | Bloquea R1 | Reserva/unicidad e idempotencia probadas | PB |
| B-19 | Entrega idempotente | Bloquea R5 | Identidad de intención, reintento y doble entrega definidos | PB |
| B-20 | Precio histórico y autorización | Bloquea R3 | Versiones, conceptos, total y reemplazo definidos | PB |
| B-21 | Autorización organizacional | Bloquea primer cambio de código | Responsable de Producto autoriza implementación | RP |
| B-22 | Base técnica | Bloquea primer cambio de código | ADRs necesarios aceptados, no sólo propuestos | ADR |
| B-23 | Modelo de amenazas | Bloquea primer cambio funcional | Tenancy, identidad/PIN, archivos e integración cubiertos | RP |
| B-24 | PBI listo | Bloquea cada rebanada | DoR, aceptación, pruebas negativas y trazabilidad | RP |

## Antes de producción

**[RP]** Deben cerrarse pruebas de aislamiento y seguridad, política de archivos, copias/restauración, observabilidad/procedimientos operativos, SLOs/carga, retención y aceptación de riesgos residuales.

## Regla

**[DAR]** Un bloqueante se cierra con decisión registrada y criterios verificables, no con acuerdo verbal ni con una implementación que lo presuponga.

## ADR candidatos

| Candidato | Momento | Clasificación |
| --- | --- | --- |
| Monolito modular inicial | Antes del primer cambio de código | ADR |
| Estrategia multitenant | Antes de persistencia | ADR |
| Alcance y concurrencia de folio | Antes de R1 | ADR |
| Identidad, PIN y sesión operativa | Antes de R0 | ADR |
| Política efectiva e instantáneas | Antes de R1 | ADR |
| Estrategia de archivos | Antes de evidencia | ADR |
| Uso/publicación de eventos internos | Antes de efectos asíncronos | ADR |
| Manejo de dinero | Antes de R3/R5 | ADR |
| Estados y ubicaciones | Antes de R1/R2 | ADR |
| Consistencia de entrega | Antes de R5 | ADR |
| Separación de Cotización | Antes de R3 | ADR |
| Zona horaria | Antes de R1 | ADR |
| Auditoría y retención | Antes de producción | ADR |
| Núcleo compartido mínimo | Antes de introducirlo | ADR |

**[ADR]** No se crean ADRs en este paquete. Todos los candidatos se registrarían como `Proposed` conforme al proceso vigente antes de cualquier aceptación.
