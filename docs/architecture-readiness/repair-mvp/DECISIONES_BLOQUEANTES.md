# Decisiones bloqueantes

## Consolidación posterior

El [inventario de cierre de bloqueantes](../blocker-closure/INVENTARIO_DE_BLOQUEANTES.md) normaliza esta matriz y las demás fuentes de arquitectura/dominio en 82 decisiones, con hitos H0–H5, dependencias, responsables y evidencia de cierre. `B-01`, normalizada como `DEC-002`, quedó cerrada por decisión del Responsable de Producto el 2026-07-21; el resto conserva el estado indicado.

## Matriz de decisiones

| ID | Decisión | Momento que bloquea | Cierre mínimo | Clasificación |
| --- | --- | --- | --- | --- |
| B-01 | Alcance exacto de R0 | Cerrada para alcance el 2026-07-21 | Fundación ejecutable, inclusiones, exclusiones y demostración aprobadas por Responsable de Producto | PB cerrada |
| B-02 | Término Orden de Servicio vs Orden de Reparación | Bloquea primera rebanada | Término oficial y alias documentados | PB |
| B-03 | Alcance de unicidad del folio | Bloquea primera rebanada | Tenant/sucursal/global decidido | PB |
| B-04 | Modelo multitenant de datos | Decisión aceptada; bloquea aplicar/probar | ADR-004 aplicado con evidencia de aislamiento | PB |
| B-05 | Contexto operativo y sucursal activa | Decisión aceptada; bloquea aplicar/probar | ADR-010 aplicado con ausencia/conflicto seguros | PB |
| B-06 | Política efectiva/herencia | Bloquea primera rebanada | Defaults, tenant, sucursal y versión acordados | PB |
| B-07 | Agregado raíz de Orden | Bloquea primer cambio de dominio | Coordinador y límites aprobados | PB |
| B-08 | Separación de Cotización | Bloquea R3 | Identidad, versión, obsolescencia y decisión definidos | PB |
| B-09 | Pagos básicos | Bloquea R5 | Movimiento, moneda, reverso y saldo definidos | PB |
| B-10 | Estados mínimos | Bloquea primera rebanada | Catálogo y transiciones mínimas aprobados | PB |
| B-11 | Ubicaciones mínimas | Bloquea R2 | Catálogo, movimiento y relación con estado definidos | PB |
| B-12 | Fin de custodia | Bloquea R5 | Únicamente entrega válida y correcciones definidas | PB |
| B-13 | Segunda revisión obligatoria | Bloquea R4 | Criterios, rol, repetición y excepción definidos | PB |
| B-14 | Identidad y PIN | Decisión conceptual aceptada; bloquea aplicar/probar | ADR-011 aplicado con protección técnica, revocación y pruebas | PB |
| B-15 | Roles y permisos mínimos | Decisión conceptual aceptada; bloquea componer/aplicar/probar | ADR-012 aplicado y matriz mínima por capacidad/alcance para la rebanada | PB |
| B-16 | Estrategia de archivos | Bloquea evidencia en R1 | Clasificación, límites, acceso y retención | PB |
| B-17 | Zona horaria | Bloquea primera rebanada | Fuente, almacenamiento conceptual y presentación acordados | PB |
| B-18 | Concurrencia de folios | Bloquea R1 | Reserva/unicidad e idempotencia probadas | PB |
| B-19 | Entrega idempotente | Bloquea R5 | Identidad de intención, reintento y doble entrega definidos | PB |
| B-20 | Precio histórico y autorización | Bloquea R3 | Versiones, conceptos, total y reemplazo definidos | PB |
| B-21 | Autorización organizacional | Bloquea el primer cambio de implementación de R0 | Responsable de Producto autoriza implementación | RP |
| B-22 | Base técnica | Bloquea el primer cambio de implementación de R0 | ADRs necesarios aceptados, no sólo propuestos | ADR |
| B-23 | Modelo de amenazas | Bloquea la primera funcionalidad ejecutable de R0 | Tenancy, identidad/PIN, archivos e integración cubiertos | RP |
| B-24 | PBI listo | Bloquea cada rebanada | DoR, aceptación, pruebas negativas y trazabilidad | RP |

## Antes de producción

**[RP]** Deben cerrarse pruebas de aislamiento y seguridad, política de archivos, copias/restauración, observabilidad/procedimientos operativos, SLOs/carga, retención y aceptación de riesgos residuales.

## Regla

**[DAR]** Un bloqueante se cierra con decisión registrada y criterios verificables, no con acuerdo verbal ni con una implementación que lo presuponga.

## ADR candidatos

| Candidato | Momento | Clasificación |
| --- | --- | --- |
| Monolito modular inicial | Aceptado en ADR-002 el 2026-07-21; ya no bloquea | ADR |
| Estrategia multitenant | Aceptada en ADR-004 el 2026-07-21; falta aplicar y probar | ADR |
| Contexto operativo por estación | Aceptado en ADR-010 el 2026-07-21; ya no bloquea conceptualmente | ADR |
| Alcance y concurrencia de folio | Antes de R1 | ADR |
| Identidad, PIN y sesión operativa | Aceptado en ADR-011 el 2026-07-21; falta aplicar y probar | ADR |
| Roles, capacidades y autorización contextual | Aceptado en ADR-012 el 2026-07-21; faltan composición por rebanada, aplicación y pruebas | ADR |
| Acciones sensibles y autorización reforzada | Aceptado en ADR-013 el 2026-07-21; faltan clasificación por rebanada, mecanismo, aplicación y pruebas | ADR |
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

**[ADR]** Este paquete no crea ADRs. ADR-001, ADR-002, ADR-004 y ADR-010 a ADR-013 fueron aceptados posteriormente usando su evidencia; los candidatos restantes se registrarán como `Proposed` antes de cualquier aceptación.
