# DEC-005 — Resultado y estado vigente

## Resultado del dictamen de selección

**PASS — DEC-005 ACCEPTED / MATERIALIZATION PENDING**

## Estado vigente tras PBI-022 y la sexta reverificación

**Accepted — Materialized / Formally Verified**

La materialización técnica local está documentada en el
[expediente PBI-022](../../architecture-readiness/dec-005-materialization/RESULTS.md).
La
[sexta reverificación formal independiente](../../architecture-readiness/dec-005-materialization/FORMAL_VERIFICATION_6.md)
emitió `PASS — DEC-005 FORMALLY VERIFIED` el 2026-07-23. El dictamen histórico
de selección se conserva y esta promoción no autoriza R0.

## Estado

| Campo | Resultado |
| --- | --- |
| Dictamen | `ACCEPT WITH CONDITIONS` |
| Estado anterior | `Proposed — Formal Review Pending` |
| Estado resultante | `Accepted — Selection Approved / Materialization Pending` |
| Autoridad | Luis Antonio Gutiérrez Avilés |
| Funciones ejercidas | Arquitectura e Ingeniería, evaluadas por separado |
| Revisión adicional | Ninguna registrada |
| Implementación actual | Materialización técnica local ejecutada por PBI-022; sin funcionalidad |
| Enforcement actual | Implementado, remediado y formalmente verificado |
| Verificación formal | `PASS`; DEC005-C01 a DEC005-C05 `PASS`; FV4-001/FV4-002/FV4-003/FV5-001 `CLOSED` |
| Hallazgos nuevos | Ningún hallazgo material ni observación bloqueante |
| R0 | No autorizado |
| Sprint 00 | Abierto |

El estado resultante de la revisión de selección fue `Materialization Pending`.
Después PBI-022 materializó la selección, por lo que el estado vigente usa
`Materialized / Formally Verified`. No se usan `Complete` ni `Closed`.

## Selección aceptada

- estructura híbrida `module-first` con capas internas;
- roots funcional, shared e infraestructura dentro de una app;
- módulos iniciales `tenancy`, `stations` y `access`;
- grafo `access -> stations -> tenancy` y `access -> tenancy`;
- API pública funcional únicamente por `index.ts`;
- imports profundos y ciclos prohibidos;
- dominio/aplicación sin NestJS;
- adapters dentro del módulo owner e infraestructura raíz sólo técnica;
- shared kernel mínimo con admisión acumulativa;
- enforcement local determinista antes de CI;
- excepciones explícitas, temporales y trazables.

La propuesta contiene 36 reglas normativas. D5-R006 y D5-R012 fueron
endurecidas durante la revisión para eliminar excepciones que contradecían la
dirección y visibilidad requeridas.

## Condiciones

| ID | Resumen | Estado actual |
| --- | --- | --- |
| DEC005-C01 | Checker local, casos positivos/negativos, ciclos y limitaciones | PASS formal |
| DEC005-C02 | Sólo paths con contenido autorizado; no módulos vacíos | PASS formal |
| DEC005-C03 | Ownership, API, consumidores y grafo registrados | PASS formal |
| DEC005-C04 | Shared y excepciones gobernados antes de uso | PASS formal |
| DEC005-C05 | PBI sin funcionalidad y gates posteriores preservados | Obligación permanente |

Las obligaciones completas, responsables, momentos, evidencias y consecuencias
están en la [revisión formal](FORMAL_REVIEW.md#condiciones-obligatorias).

## Contradicciones y riesgos

No queda una contradicción material con ADR-002, ADR-005, ADR-009, DEC-002,
DEC-062, DEC-004 o las decisiones de dominio aceptadas. Las ambigüedades
detectadas se corrigieron antes del dictamen.

Persisten riesgos controlados: crecimiento de `access`, expansión de
`infrastructure`/`shared`, cobertura limitada de un checker transitorio,
separación de funciones en un equipo pequeño y descubrimiento posterior de una
frontera distinta. Ninguno impide seleccionar la organización; todos tienen
condición o gate explícito.

## Decisiones diferidas

- DEC-049: datos, repositories, transacciones y acceso PostgreSQL;
- DEC-044: taxonomía y adaptación segura de errores;
- DEC-050: migraciones;
- DEC-051: runner, suites, CI y gates;
- DEC-063: Definition of Done;
- DEC-004: evidencia restante;
- módulos funcionales de R1 y posteriores.

## Autorización concedida

Queda autorizado crear un PBI separado para materializar:

- estructura aprobada sin módulos futuros vacíos;
- registro de ownership y grafo;
- enforcement local y sus casos de prueba arquitectónicos;
- evidencia documental de las condiciones.

La creación del PBI no autoriza su ejecución por inferencia, código funcional,
persistencia ni R0.

## Lo que permanece prohibido

- lógica funcional y módulos de Reparaciones;
- persistencia, SQL, migraciones y datos;
- autenticación, autorización o multitenancy funcional;
- controllers y endpoints funcionales;
- workspaces, packages, microservicios o desplegables adicionales;
- CI o herramientas generales reservadas a DEC-051;
- merge funcional, cierre de Sprint 00, inicio de R0 o deploy.

## Documentos del expediente

- [DECISION_PROPOSAL.md](DECISION_PROPOSAL.md).
- [FORMAL_REVIEW.md](FORMAL_REVIEW.md).
- `RESULTS.md`.

## Validación del dictamen

| Validación | Resultado |
| --- | --- |
| Estructura, unidad y módulos suficientes | PASS |
| Grafo, superficie e imports verificables | PASS |
| Ownership, shared e infraestructura delimitados | PASS |
| NestJS restringido al shell exterior | PASS |
| Enforcement local independiente de CI | PASS |
| Excepciones verificables | PASS |
| Decisiones diferidas preservadas | PASS |
| Autoridad real registrada | PASS |
| Materialización técnica | Ejecutada en PBI-022 y formalmente verificada por `FORMAL_VERIFICATION_6.md` |
| Código funcional | NOT RUN — fuera de alcance y no autorizado |

## Siguiente gate y acción

El siguiente gate de gobierno es **DEC-049 — Repositorios y propiedad
lógica**, ahora `Ready for decision`. La siguiente acción exacta es preparar
su registro de decisión para Arquitectura + Ingeniería, sin introducir
persistencia por inferencia ni resolver DEC-050/051/063.
