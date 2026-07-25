# Estado de preparación arquitectónica

## Veredicto

**Authorization Review Ready / R0 no autorizado.**

No es **No preparado** porque el dominio ya aporta flujo, lenguaje, invariantes,
candidatos a contextos, agregados, comandos, eventos y decisiones abiertas. No
es **Parcialmente preparado** porque el mínimo vendible y sus dependencias
pueden delimitarse sin inventar el negocio. El Responsable de Producto aprobó
el alcance y contrato de salida de R0 el 2026-07-21 y registró el 2026-07-24 una
autorización condicional: sólo entra en vigor después del cierre documental de
Sprint 00, un PBI R0 `Ready` y la revisión final. PBI-023 satisface
documentalmente DoR, pero Sprint 00 y la revisión siguen abiertos. Tampoco
alcanza **Preparado para implementación completa del MVP** porque los contratos
H1 deben resolverse por trigger y los contratos operativos posteriores siguen
pendientes.

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
| ADRs | ADR-001 a ADR-005 y ADR-009 a ADR-013 aceptados; DEC-004/VC-024 `Closed / PASS`; DEC-005 materializada y formalmente verificada; DEC-044/049/051/063 aceptadas; ADR-006 a ADR-008 siguen propuestos | Plataforma, organización, errores, persistencia, pruebas y DoD están aceptadas; H0 está completo; condiciones restantes y H1 siguen bloqueando código funcional | PB |
| Autorización | B-21 tiene autorización condicional atribuible; Sprint 00 y la revisión final siguen abiertos | Condición satisfecha, efectividad pendiente | PB |

## Qué sí puede comenzar

- **[DAR]** Validación dirigida de las fronteras, contratos de negocio y decisiones bloqueantes.
- **[DAR]** Preparación de ADRs y PBIs con criterios de aceptación, pruebas negativas y trazabilidad.
- **[DAR]** Resolver los contratos transversales H1 bajo sus autoridades
  propias, sin inferir autorización funcional a partir del cierre de VC-024.
- **[DAR]** Refinamiento técnico de R0 contra su alcance aprobado, sin inferir ejecución de los PBIs técnicos.
- **[RDD]** Ejemplos de aceptación basados en escenarios del modelo integrado.

## Qué no puede comenzar

- **[RP]** Implementación funcional antes de que la autorización condicional
  entre en vigor mediante cierre de Sprint 00, PBI `Ready` y revisión final.
- **[R]** Persistencia multitenant antes de aplicar y probar el contexto e identidad/sesión aceptados, el alcance técnico y el aislamiento.
- **[R]** Flujos sensibles antes de clasificar la acción y aplicar/probar el control, atribución y evidencia de ADR-013.
- **[ADR]** Introducir frameworks, workspaces, gestores, orquestación o despliegue fuera de las decisiones aceptadas. DEC-004 fija pnpm y el lockfile sin autorizar workspaces; ADR-009 gobierna repositorio/workspaces, ADR-001 lenguaje/runtime y ADR-003 el motor.

## Condición de promoción

El estado puede cambiar a **Preparado para una primera rebanada vertical**
cuando la revisión final confirme el cierre documental de Sprint 00 y el DoR
de PBI-023, haciendo efectiva la autorización condicional sin omitir los gates
H1 incluidos por trigger en ese PBI. Después, R1 sólo puede abrirse tras
demostrar y aceptar formalmente R0.
