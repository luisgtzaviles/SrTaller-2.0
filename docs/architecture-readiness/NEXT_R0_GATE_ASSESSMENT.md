# Evaluación del siguiente gate de R0

## Resultado

**PASS — NEXT R0 GATE IDENTIFIED**

El inicio de R0 no está bloqueado por un único elemento. La documentación
vigente define un **gate compuesto**:

- para el primer cambio funcional, deben cerrarse los remanentes H0, cerrar
  Sprint 00 o su gate sucesor y existir autorización organizacional explícita;
- para declarar R0 listo para programación, además deben cerrarse los H1
  aplicables y satisfacerse el criterio de inicio;
- para CI, merge, `Done`, deploy y release existen gates adicionales que no
  deben confundirse con autorización para escribir código local.

DEC-005 quedó `Accepted — Materialized / Formally Verified` tras la
[sexta verificación formal](dec-005-materialization/FORMAL_VERIFICATION_6.md),
con `PASS` global y `PASS` para DEC005-C01 a C05. La selección define
agrupación, ownership y reglas de dependencia. Su
[PBI-022](../backlog/pbis/PBI-022.md) está `Done`; no autoriza lógica funcional.
DEC-049 quedó
[**Accepted**](../decisions/dec-049-persistence-ownership/DECISION_PROPOSAL.md)
el 2026-07-24 por el Responsable del Proyecto, con DEC049-C01 a C08 vigentes y
pendientes para la futura materialización.
[DEC-044 — estrategia de errores](../decisions/dec-044-error-strategy/FORMAL_REVIEW.md)
quedó `Accepted` el 2026-07-24 por el Responsable del Proyecto después de cinco
revisiones `PASS WITH CONDITIONS`; DEC044-C01 a C08 permanecen pendientes.
[DEC-051 — estrategia de pruebas, CI y gates
ejecutables](../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md) quedó
`Accepted` el 2026-07-24 por el Responsable del Proyecto después de cinco
revisiones `PASS WITH CONDITIONS`; DEC051-C01 a C10 y VC-024 permanecen
pendientes. [DEC-063 — Definition of
Done](../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md) quedó
`Accepted with conditions` el mismo día tras cinco revisiones
`PASS WITH CONDITIONS`; DEC063-C01 a C08 permanecen `Pending`.

Esta actualización registra el dictamen de DEC-063. H0 queda en **8 cerrados /
1 abierto** y su único remanente es VC-024. No cierra Sprint 00, no materializa
condiciones y no autoriza R0.

## Alcance y regla de autoridad

La evaluación usa como registro de estados el [inventario de
bloqueantes](blocker-closure/INVENTARIO_DE_BLOQUEANTES.md), como secuencia el
[plan de cierre](blocker-closure/PLAN_DE_CIERRE.md) y la [secuencia de
decisiones](blocker-closure/SECUENCIA_DE_DECISIONES.md), y como evidencia actual
de DEC-004 los [resultados Docker](dec-004-linux-verification/DOCKER_RESULTS.md)
y su [matriz VC](dec-004-linux-verification/DOCKER_VC_RESULTS.md). Los documentos
históricos se usan como trazabilidad, no para revertir hechos posteriores.

La expresión “iniciar R0” se desambigua conforme a los hitos documentados:

| Umbral | Condición documental | Efecto actual |
| --- | --- | --- |
| Continuar gobierno y diseño | Trabajo reversible y no ejecutable | Permitido |
| Continuar baseline técnica acotada | Autorización específica del PBI técnico | DEC-004 ya fue materializada dentro de ese permiso; no habilita funcionalidad |
| Primer cambio funcional de R0 | H0 cerrado, PBI trazado y autorización explícita | Bloqueado |
| R0 listo para programación | H0 + H1 aplicables y todos los [criterios de inicio](repair-mvp/CRITERIOS_DE_INICIO_DE_IMPLEMENTACION.md) | Bloqueado |
| Merge/`Done` verificable | Estrategia de pruebas, gates y DoD aceptados; controles aplicables materializados | Bloqueado para cambios funcionales |
| Deploy/release | Evidencia de calidad, seguridad, migración y operación del hito | No autorizado |

## Estado real de DEC-004

### Lo satisfecho

- La selección está en `Accepted — Selection Approved / Evidence Pending`,
  según el [registro canónico](blocker-closure/DEC-004_BASELINE_TECNICA.md).
- La baseline de Node.js, pnpm, lockfile, ESM/NodeNext, TypeScript, NestJS y
  scripts fue materializada.
- VC-001 a VC-023 tienen resultado técnico `Pass` con autoridad **preliminar —
  emulated linux/amd64**.
- Dos contenedores independientes produjeron inventarios y hashes idénticos.

### Lo pendiente

- Ratificación en Linux `x86_64` nativo con GNU glibc.
- VC-024, que exige repetición CI y depende de DEC-051.
- Revisión suficiente para cambiar el estado de evidencia.
- PBI-021 continúa `Ready`, `Unassigned` y no `Done`.

### Clasificación

DEC-004 es una **dependencia parcialmente satisfecha**, no un bloqueo total. La
evidencia preliminar permite continuar con la siguiente decisión o gate, tal
como ordena el [resultado actual](dec-004-linux-verification/DOCKER_RESULTS.md#next-action).
No obstante, la [política del primer cambio](blocker-closure/BLOQUEANTES_DEL_PRIMER_COMMIT.md)
todavía exige evidencia Linux completa y revisada. Mientras esa política no se
actualice o una autoridad registre una excepción, el remanente de DEC-004 sigue
siendo una condición H0 para autorizar código funcional, además de bloquear su
propia verificación y el `Done` de PBI-021.

VC-024 es directamente un **gate duro sólo para CI** dentro del contrato de
DEC-004. No bloquea el trabajo documental de DEC-005/049/044/051/063. Por sí
solo tampoco explica todo el bloqueo del primer cambio funcional: ese bloqueo
proviene de los demás H0, las condiciones de materialización aplicables y la
autorización organizacional pendiente.

## Inventario de gates

En la matriz, “código técnico” significa nueva estructura o infraestructura de
producto más allá de la baseline acotada ya autorizada; “lógica funcional” no
incluye documentación ni análisis.

| Candidato | Clasificación | Estado y autoridad | Dependencia | Qué impide | Código técnico | Lógica funcional | Merge funcional | Deploy | Acción requerida |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ADR-001/003/005/009 | Dependencia ya satisfecha | `Accepted`; autoridades registradas en el [índice de ADR](../decisions/README.md) | Ninguna pendiente para su decisión | No bloquean por estado; sus condiciones siguen obligatorias | No | No | No | Condicionan | Aplicarlos, no reabrirlos |
| DEC-004 — selección y baseline | Dependencia parcialmente satisfecha | `Accepted — Selection Approved / Evidence Pending`; Arquitectura + Ingeniería, con vistos buenos de Seguridad, Operaciones y Calidad | VC-024 depende de materializar DEC051-C01/C07 | Verificación final de toolchain, PBI-021 `Done` y autorización bajo la redacción H0 vigente | No bloquea su baseline ya autorizada | Sí, junto con los demás H0 | Sí para un candidato funcional conforme al gate vigente | Sí | Ratificación nativa y revisión; VC-024 después de materializar el gate aceptado |
| VC-024 | Gate duro sólo para CI | `Pending`; su contrato pertenece a DEC-004 y su mecanismo a DEC-051 | DEC051-C01/C07 y pipeline materializado | Repetición CI, cierre de evidencia DEC-004 y `Done` de PBI-021 | No en local | No por sí solo | Sí cuando el workflow sea obligatorio | Sí | Ejecutar dos runs equivalentes después de materializar DEC-051, sin seleccionar plataforma aquí |
| DEC-005 | Dependencia satisfecha | `Accepted — Materialized / Formally Verified`; sexta verificación formal `PASS`; PBI-022 `Done` | ADR-002/005/009 y selección de DEC-004 satisfechas | No bloquea DEC-049; sus reglas siguen siendo obligatorias | No | No | No | Condiciona | Aplicarla, no reabrirla ni inferir decisiones de persistencia |
| [DEC-049](../decisions/dec-049-persistence-ownership/FORMAL_REVIEW.md) | Dependencia satisfecha | `Accepted`; 2026-07-24; Responsable del Proyecto; cinco `PASS WITH CONDITIONS`; DEC049-C01 a C08 vigentes y no cumplidas | ADR-002/003/004/005/009, selección DEC-004, DEC-005 verificada y DEC-007 materialmente respondida por ADR-004: satisfechas | Ya no bloquea H0; condiciona la futura materialización y alimenta DEC-050/051 | No sin autorización de materialización | No por estado | No por estado | Condiciona | Aplicar las ocho condiciones; no crear PBI ni materializar por inferencia |
| [DEC-044](../decisions/dec-044-error-strategy/FORMAL_REVIEW.md) | Dependencia satisfecha | `Accepted`; 2026-07-24; Responsable del Proyecto; cinco `PASS WITH CONDITIONS`; DEC044-C01 a C08 vigentes y no cumplidas | Stack aceptado, DEC-005/049 y escenarios de DEC-062: satisfechas | Ya no bloquea H0; sus contratos y condiciones alimentan DEC-051/063 y la futura materialización | No sin autorización de materialización | No por estado | No por estado | Condiciona | Aplicar las ocho condiciones; no materializar ni crear PBI por inferencia |
| [DEC-051](../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md) | Dependencia satisfecha; sus condiciones gobiernan CI | `Accepted`; 2026-07-24; Responsable del Proyecto; cinco `PASS WITH CONDITIONS`; C01 a C10 vigentes y pendientes | DEC-002/062, toolchain DEC-004 y contratos DEC-005/044/049: satisfechas | Ya no bloquea H0 por estado; faltan materialización, protección de `main`, PostgreSQL real y evidencia | No sin autorización de materialización | No por estado | Sí hasta cumplir condiciones aplicables | Sí | Aplicar C01 a C10 sólo con autorización; no inferir VC-024 ni proveedor |
| [DEC-063](../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md) | Dependencia satisfecha; DoD aceptada | `Accepted with conditions`; 2026-07-24; Responsable del Proyecto; cinco `PASS WITH CONDITIONS`; C01 a C08 `Pending` | DEC-004/005/044/049/051 y ADR-004/010–013: satisfechas para la decisión | Ya no bloquea H0 por estado; faltan templates, riesgo, evidencia, CI y checklists especializados | No sin autorización de materialización | No por estado | Sí hasta cumplir condiciones aplicables | Sí | Aplicar C01 a C08 sólo con autorización; no inferir `Done`, `Released` o VC-024 |
| B-21 — autorización organizacional | Gate duro para iniciar R0 | Pendiente; Responsable de Producto | Cierres técnicos y PBI listo | Todo primer cambio funcional de R0 | Sí, salvo permiso técnico acotado | Sí | Sí | Sí | Registrar autorización explícita; no inferirla de aprobaciones anteriores |
| Sprint 00 o gate sucesor | Gate duro para iniciar R0 | Sprint 00 abierto; autoridad de cierre todavía pendiente en su Review | Criterios de salida, revisión y aprobación de Producto | Entrada formal a implementación | Sí | Sí | Sí | Sí | Cerrar Sprint 00 o un gate sucesor con autoridad; no hacerlo en esta evaluación |
| PBI-020 | Riesgo documentado, no bloqueo autónomo | `Draft`; Producto + Arquitectura + Seguridad + Calidad para revisión | Respuestas y cierre documental | Puede canalizar revisión, pero no sustituye decisiones ni autorización | No | No por sí solo | No | No | Mantener abierto hasta completar su propósito o sustituirlo formalmente |
| PBI-021 | Dependencia parcialmente satisfecha | `Ready`, `Unassigned`, no `Done` | Ratificación nativa, VC-024 y revisiones | Cierre de evidencia de DEC-004 | No bloquea otras decisiones | No por sí solo | No para documentación | Sí para afirmar baseline verificada | Completar sólo su evidencia pendiente bajo autoridad |
| [PBI-022](../backlog/pbis/PBI-022.md) | Tarea técnica cerrada | `Done`; evidencia técnica y sexta verificación formal `PASS` | DEC-005 aceptada y baseline DEC-004 | No bloquea DEC-049; no autoriza lógica funcional | No | No | No | No | Conservar evidencia y trazabilidad |
| DEC-006 a DEC-020, DEC-037/038, DEC-045 a DEC-048, DEC-050, DEC-052 y DEC-055 | Gate duro para declarar R0 listo para programación | H1 abiertos o aceptados conceptualmente pero pendientes de aplicación/prueba; autoridades por fila en el inventario | H0 y ADR-004/010/011/012/013 | Aislamiento aplicado, estación/contexto, PIN/sesión, roles, sensibilidad, tiempo, persistencia/migraciones, auditoría, observabilidad, fixtures y secretos | Según capacidad | Sí | Sí | Sí | Resolver por la secuencia H1 después del núcleo H0; no convertirlos en defaults de código |
| H2/H3 | Gate diferido permitido durante R0 | Pendientes para R1/piloto | R0 demostrado y gates propios | R1 y piloto | No para R0 | No para R0 | No para R0 | Sí para sus hitos | Mantener fuera de R0 |
| H4 | Gate duro sólo para producción | Pendiente | Evidencia de piloto y operación | Producción | No para R0 | No para R0 | No necesariamente | Sí | Resolver antes del go/no-go productivo |
| H5 | Gate diferido permitido durante R0 | Diferido por decisión | Señal de negocio o riesgo | Nada del MVP actual | No | No | No | No | No adelantar sin cambio de alcance |

## Qué acepta DEC-051

DEC-051 no es sinónimo de “crear un workflow”. Según el [inventario
oficial](blocker-closure/INVENTARIO_DE_BLOQUEANTES.md) y los [vacíos de
gobierno](dec-004-governance-unblocking/GOVERNANCE_GAPS.md#dec-051--estrategia-de-pruebas),
resuelve documentalmente:

- runner y herramientas por capa;
- comandos/gate canónicos local, PR y merge, con ejecución Linux;
- cobertura o criterios por riesgo;
- integración reproducible con PostgreSQL 18.x;
- suite obligatoria de aislamiento y referencias cross-tenant;
- checker arquitectónico;
- pruebas de migración;
- política de fallos, flakiness y cuarentena;
- evidencia y frecuencia de ejecución.

Su dependencia directa es VC-024. También alimenta DEC-052 y DEC-063 y propone
verificar las reglas aceptadas de DEC-005/049/044 y las que salgan de DEC-050.
Su estado documental H0 está cerrado, pero C01 a C10 no pueden diferirse cuando
su trigger aplique. Sólo puede continuar trabajo técnico con autorización
explícita y alcance acotado. Mientras no se materialice, no existe protección
demostrada de `main` ni evidencia suficiente para VC-024, deploy o `Done`.

DEC-051 recibe los límites aceptados de DEC-005 y DEC-049 y el contrato
aceptado de DEC-044 para cerrar su matriz de errores y no divulgación. No
absorbe VC-001 a VC-023, no escoge una plataforma de CI ni redefine los
escenarios de DEC-062.

## Dependencias y orden recomendado

El orden combina la [secuencia ejecutable](blocker-closure/PLAN_DE_CIERRE.md#secuencia-ejecutable-de-decisiones)
con el [mapa detallado](dec-004-governance-unblocking/DEPENDENCY_MAP.md#tabla-de-dependencias-entre-las-siete-decisiones):

1. Materializar, bajo autorización separada, los prerrequisitos mínimos de
   **VC-024** definidos por DEC-051 y DEC-063.
2. Ejecutar las dos corridas CI equivalentes, revisar su evidencia y cerrar
   **VC-024** sólo mediante dictamen autorizado.
3. **DEC-050**: decidir migraciones después del acceso a datos y coordinar su
   evidencia con DEC-051.
4. Cerrar los H1 aplicables a contexto, identidad, autorización, tiempo,
   auditoría, observabilidad, fixtures y secretos.
5. Satisfacer el PBI funcional/DoR y obtener cierre de Sprint 00 o gate sucesor
   y autorización explícita del Responsable de Producto.

El orden no significa que todos los trabajos sean estrictamente secuenciales.
DEC-049, DEC-044 y DEC-051 ya están aceptadas y sus condiciones siguen pendientes. La
ratificación nativa de DEC-004 puede ejecutarse sin esperar la estrategia
materializada de pruebas; DEC-051 ya incorpora los contratos aceptados.
Ninguno de esos avances debe cerrar por inferencia una decisión dependiente.

## Siguiente gate recomendado

### Identificador y estado

**VC-024 — dos ejecuciones limpias equivalentes en CI de DEC-004**

Estado: **Pending**.

### Autoridad y dependencias

La evidencia depende de una materialización separadamente autorizada de los
prerrequisitos de DEC-051 y DEC-063. Debe conservar toolchain, gates, manifest,
sanitización, equivalencia y dictamen definidos por esas decisiones. Ejecutar
un comando local o aceptar DEC-063 no satisface VC-024.

### Alcance

Preparar la materialización mínima, ejecutar dos corridas Linux equivalentes,
comparar resultados semánticos y someter la evidencia a dictamen. No cerrar
condiciones no demostradas, Sprint 00 ni R0 por inferencia.

## Contradicciones y referencias reconciliadas

No se encontró una contradicción material entre ADR aceptados. Sí existe drift
histórico que debe interpretarse por fecha y autoridad:

| Referencia | Hallazgo | Tratamiento |
| --- | --- | --- |
| [Resultado de materialización](dec-004-materialization/RESULTS.md) | Marca VC-001 a VC-023 como `Blocked` por falta de Linux | Evidencia histórica superada por el PASS técnico preliminar Docker; conserva valor para macOS y sus limitaciones |
| [Secuencia de decisiones](blocker-closure/SECUENCIA_DE_DECISIONES.md) | Antes apuntaba a DEC-063 como siguiente gate | Reconciliada: registra DEC-063 `Accepted` y VC-024 como único H0 |
| [Criterios de inicio](repair-mvp/CRITERIOS_DE_INICIO_DE_IMPLEMENTACION.md#resultado-actual) y [README de cierre](blocker-closure/README.md) | Debían separar selección, materialización y verificación DEC-005 | Reconciliados; mantienen R0 bloqueado por los remanentes reales |
| [Clasificación por hito](blocker-closure/CLASIFICACION_POR_HITO.md) | Contaba DEC-063 entre los remanentes H0 | Reconciliada: DEC-063 está aceptada; H0 queda en ocho cerrados y uno abierto |
| [PBI-021](../backlog/pbis/PBI-021.md) | Sigue `Ready`, `Unassigned`, no `Done` pese a materialización y Docker preliminar | No se cambia por inferencia; ratificación nativa, VC-024 y revisión continúan pendientes |
| H0 frente a H1 | H0 desbloquea primer cambio; H1 precede “R0 listo para programación” | No es contradicción: son umbrales distintos y ambos deben declararse al usar “iniciar R0” |

El drift no autoriza editar los registros fuente dentro de esta evaluación ni
reduce los gates restantes.

## Lo que puede avanzar en paralelo

- ratificación nativa de VC-001 a VC-023 bajo la autorización correspondiente;
- preparación autorizada de las condiciones DEC-051/063 necesarias para
  VC-024, sin declararlas cumplidas;
- refinamiento documental de los H1 y del PBI funcional de R0;
- preparación de la revisión de Sprint 00 o de un gate sucesor.

## Lo que permanece prohibido

- iniciar lógica funcional de R0;
- inferir materialización de DEC-051/063 o cumplimiento de sus condiciones;
- tratar el PASS Docker preliminar como ratificación nativa o `Done`;
- escoger por código ORM, migrador, runner o proveedor de CI, o materializar la
  estructura fuera del PBI autorizado;
- reutilizar SPIKE-009 como scaffold;
- introducir SQL, migraciones, autenticación, multitenancy funcional o datos;
- cerrar Sprint 00, autorizar R0, mergear funcionalidad o desplegar sin las
  autoridades y evidencias de sus gates.

## Siguiente acción exacta

Preparar una autorización separada para materializar los prerrequisitos mínimos
de **VC-024**, ejecutar dos corridas CI equivalentes y someter su evidencia a
dictamen. No marcar condiciones, H0, Sprint 00 ni R0 cumplidos por inferencia.
