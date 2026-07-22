# Estado de preparación arquitectónica

## Veredicto

**Preparado con bloqueantes.**

No es **No preparado** porque el dominio ya aporta flujo, lenguaje, invariantes, candidatos a contextos, agregados, comandos, eventos y decisiones abiertas. No es **Parcialmente preparado** porque el mínimo vendible y sus dependencias pueden delimitarse sin inventar el negocio. No alcanza **Preparado para una primera rebanada vertical** porque faltan autorización de producto y decisiones mínimas que condicionan cualquier código seguro. Tampoco alcanza **Preparado para implementación completa del MVP** porque los contratos operativos de varias etapas siguen pendientes.

## Evaluación por dimensión

| Dimensión | Evidencia disponible | Estado | Clasificación |
| --- | --- | --- | --- |
| Alcance | Flujo operativo y capacidades del núcleo documentados | Suficiente para delimitar | RP |
| Lenguaje | Lenguaje ubicuo y modelo integrado trazables | Suficiente, sujeto a validación | RDD |
| Invariantes | Custodia, autorización, calidad, pagos y entrega documentados | Suficiente para diseño inicial | RDD |
| Fronteras | Contextos candidatos y propiedad disponibles | Proponibles, no aprobados | DAP |
| Agregados | Candidatos y tensiones explícitas | Proponibles por rebanada | DAP |
| Tenancy/contexto | ADR-004/010 fijan aislamiento, propiedad y contexto por estación | Aplicación y pruebas bloqueantes | PB |
| Identidad | ADR-011 fija usuario por tenant, PIN contextual, sesión y atribución mínima | Mecanismos técnicos y pruebas bloqueantes | PB |
| Permisos | Acciones sensibles reconocidas | Matriz y alcances pendientes | PB |
| Consistencia | Invariantes permiten separar transacciones y sagas | Estrategia propuesta | DAR |
| Configuración | Necesidad de políticas versionadas identificada | Precedencia y alcance pendientes | PB |
| Integraciones | Puertos y anticorrupción conceptuales | Proveedores diferibles | DD |
| Riesgos | Riesgos de aislamiento, concurrencia y custodia identificados | Gestionables con criterios de paso | R |
| ADRs | ADR-002, ADR-004, ADR-010 y ADR-011 aceptados; ADR-001, ADR-003 y ADR-005 a ADR-009 siguen propuestos | Forma, tenancy, contexto e identidad/sesión definidos; conjunto tecnológico aún bloqueante | PB |
| Autorización | Sprint 00 no está cerrado y no autoriza prototipos | Bloqueante organizacional | PB |

## Qué sí puede comenzar

- **[DAR]** Validación dirigida de las fronteras, contratos de negocio y decisiones bloqueantes.
- **[DAR]** Preparación de ADRs y PBIs con criterios de aceptación, pruebas negativas y trazabilidad.
- **[DAR]** Refinamiento de la primera rebanada sin crear estructura base ni código ejecutable.
- **[RDD]** Ejemplos de aceptación basados en escenarios del modelo integrado.

## Qué no puede comenzar

- **[RP]** Implementación funcional sin autorización explícita y sin cumplir Definition of Ready.
- **[R]** Persistencia multitenant antes de aplicar y probar el contexto e identidad/sesión aceptados, el alcance técnico y el aislamiento.
- **[R]** Flujos sensibles antes de acordar permisos, atribución y evidencia.
- **[ADR]** Fijar lenguaje, frameworks, base de datos, monorepo o despliegue como hechos aprobados.

## Condición de promoción

El estado puede cambiar a **Preparado para una primera rebanada vertical** cuando todos los bloqueantes de categoría “antes de cualquier código” estén cerrados, exista un PBI listo y el Responsable de Producto autorice expresamente su implementación. La preparación completa exige además cerrar las decisiones de cada etapa comercial, técnica, de calidad, pago y entrega.
