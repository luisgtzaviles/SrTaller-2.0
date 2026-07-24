# Estado de preparación arquitectónica

## Veredicto

**Preparado con bloqueantes.**

No es **No preparado** porque el dominio ya aporta flujo, lenguaje, invariantes, candidatos a contextos, agregados, comandos, eventos y decisiones abiertas. No es **Parcialmente preparado** porque el mínimo vendible y sus dependencias pueden delimitarse sin inventar el negocio. El Responsable de Producto aprobó el alcance y contrato de salida de R0 el 2026-07-21, pero eso no autoriza implementación. No alcanza **Preparado para una primera rebanada vertical** porque faltan la autorización organizacional y decisiones técnicas que condicionan cualquier implementación segura. Tampoco alcanza **Preparado para implementación completa del MVP** porque los contratos operativos de varias etapas siguen pendientes.

## Evaluación por dimensión

| Dimensión | Evidencia disponible | Estado | Clasificación |
| --- | --- | --- | --- |
| Alcance | R0 y sus exclusiones aprobados; flujo R1–R5 documentado | R0 cerrado para Producto; rebanadas posteriores conservan sus gates | RP |
| Lenguaje | Lenguaje ubicuo y modelo integrado trazables | Suficiente, sujeto a validación | RDD |
| Invariantes | Custodia, autorización, calidad, pagos y entrega documentados | Suficiente para diseño inicial | RDD |
| Fronteras | Contextos candidatos disponibles; DEC-005 selecciona la agrupación física inicial | Materialización formalmente verificada; PBI-022 `Done` | PB |
| Agregados | Candidatos y tensiones explícitas | Proponibles por rebanada | DAP |
| Tenancy/contexto | ADR-004/010 fijan aislamiento, propiedad y contexto por estación | Aplicación y pruebas bloqueantes | PB |
| Identidad | ADR-011 fija usuario por tenant, PIN contextual, sesión y atribución mínima | Mecanismos técnicos y pruebas bloqueantes | PB |
| Autorización ordinaria | ADR-012 fija roles tenant-scoped, capacidades, unión, alcance y deny-by-default | Composición por rebanada, aplicación y pruebas bloqueantes | PB |
| Acciones sensibles | ADR-013 fija niveles, reautenticación, segundo aprobador, segregación e invalidación | Clasificación por rebanada, mecanismo, aplicación y pruebas pendientes | PB |
| Consistencia | Invariantes permiten separar transacciones y sagas | Estrategia propuesta | DAR |
| Configuración | Necesidad de políticas versionadas identificada | Precedencia y alcance pendientes | PB |
| Integraciones | Puertos y anticorrupción conceptuales | Proveedores diferibles | DD |
| Riesgos | Riesgos de aislamiento, concurrencia y custodia identificados | Gestionables con criterios de paso | R |
| ADRs | ADR-001 a ADR-005 y ADR-009 a ADR-013 aceptados; DEC-004 tiene VC-024 pendiente; DEC-005 está materializada y formalmente verificada; DEC-044/049/051/063 están aceptadas, con sus condiciones pendientes; ADR-006 a ADR-008 siguen propuestos | Plataforma, organización, errores, persistencia, pruebas y DoD están aceptadas; DEC-044/049/051/063 no están materializadas; VC-024 y los demás H1 siguen bloqueando código funcional | PB |
| Autorización | Producto aprobó alcance/aceptación esperada de R0; Sprint 00 no está cerrado ni existe autorización de implementación | Bloqueante organizacional | PB |

## Qué sí puede comenzar

- **[DAR]** Validación dirigida de las fronteras, contratos de negocio y decisiones bloqueantes.
- **[DAR]** Preparación de ADRs y PBIs con criterios de aceptación, pruebas negativas y trazabilidad.
- **[DAR]** [PBI-021](../../backlog/pbis/PBI-021.md), `Ready` y autorizado para materialización/verificación de DEC-004, sin funcionalidad de producto.
- **[DAR]** Preparar, sólo con autorización separada, los prerrequisitos mínimos
  de VC-024 usando
  [DEC-051](../../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md) y
  [DEC-063](../../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md), sin
  materializar por inferencia ni cumplir DEC051-C01 a C10 o DEC063-C01 a C08.
- **[DAR]** Refinamiento técnico de R0 contra su alcance aprobado, sin inferir ejecución de los PBIs técnicos.
- **[RDD]** Ejemplos de aceptación basados en escenarios del modelo integrado.

## Qué no puede comenzar

- **[RP]** Implementación funcional sin autorización explícita y sin cumplir Definition of Ready.
- **[R]** Persistencia multitenant antes de aplicar y probar el contexto e identidad/sesión aceptados, el alcance técnico y el aislamiento.
- **[R]** Flujos sensibles antes de clasificar la acción y aplicar/probar el control, atribución y evidencia de ADR-013.
- **[ADR]** Introducir frameworks, workspaces, gestores, orquestación o despliegue fuera de las decisiones aceptadas. DEC-004 fija pnpm y el lockfile sin autorizar workspaces; ADR-009 gobierna repositorio/workspaces, ADR-001 lenguaje/runtime y ADR-003 el motor.

## Condición de promoción

El estado puede cambiar a **Preparado para una primera rebanada vertical** cuando todos los bloqueantes anteriores al primer cambio de implementación de R0 estén cerrados, exista un PBI listo y el Responsable de Producto autorice expresamente su implementación. Después, R1 sólo puede abrirse tras demostrar y aceptar formalmente R0. La preparación completa exige además cerrar las decisiones de cada etapa comercial, técnica, de calidad, pago y entrega.
