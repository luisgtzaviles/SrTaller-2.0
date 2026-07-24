# Revisión formal de DEC-063

## 1. Estado inicial

- **Decisión revisada:** [DEC-063 — Definition of Done por tipo de trabajo y
  riesgo](DECISION_PROPOSAL.md).
- **Estado recibido:** `Ready for formal decision — Proposal Complete /
  Approval Pending`.
- **Fecha de revisión:** 2026-07-24.
- **Autoridad:** Responsable del Proyecto.
- **DEC-005:** `Accepted — Materialized / Formally Verified`.
- **DEC-044:** `Accepted`.
- **DEC-049:** `Accepted`.
- **DEC-051:** `Accepted with conditions`; DEC051-C01 a DEC051-C10 `Pending`.
- **H0 recibido:** siete cerrados y dos abiertos.
- **R0:** no autorizado.
- **Sprint 00:** abierto.
- **VC-024:** `Pending`.

El expediente se recibió con cambios locales preexistentes. La revisión los
preserva mediante inventario y huellas SHA-256; no los considera evidencia de
materialización de DEC-063.

## 2. Metodología

La revisión:

1. leyó la propuesta y verificó sus 48 secciones;
2. contrastó el contrato con DEC-004, DEC-005, DEC-044, DEC-049, DEC-051,
   ADR-004 y ADR-010 a ADR-013;
3. contrastó Definition of Ready, Definition of Done, workflow, release,
   templates, readiness de R0, Sprint 00 y blocker closure;
4. evaluó por separado Arquitectura, Ingeniería, Seguridad, Operaciones y
   Calidad;
5. distinguió aceptación documental, materialización, verificación formal,
   `Done`, `Released` y `Closed`;
6. validó que las ocho condiciones posteriores permanezcan `Pending`;
7. trató ambigüedad de alcance, riesgo o evidencia como fail-closed;
8. no infirió implementación, CI, protección de rama ni VC-024.

Cada disciplina usa exclusivamente `PASS`, `PASS WITH CONDITIONS` o `FAIL`.
Las condiciones registran materialización futura; no reducen el contrato
aceptado.

## 3. Revisión de Arquitectura

**Resultado: PASS WITH CONDITIONS.**

Arquitectura aprueba la Opción B. La base común más checklists por tipo y
riesgo conserva una semántica única sin forzar un proceso idéntico para
artefactos distintos. Los trece estados tienen criterios de salida y no
colapsan aprobación, implementación, evidencia o despliegue.

DEC-063 consume decisiones aceptadas sin redefinirlas: DEC-004 sigue siendo
dueña de toolchain y VC-024; DEC-005 de fronteras; DEC-044 de errores; DEC-049
de persistencia; DEC-051 de pruebas y CI; ADR-004/010–013 de aislamiento,
contexto, identidad y autorización.

No existe contradicción material. La deriva previa entre `Done` y despliegue
se resuelve al declarar `Released` como estado separado. La conformidad queda
condicionada a DEC063-C01, C02, C03 y C04.

## 4. Revisión de Ingeniería

**Resultado: PASS WITH CONDITIONS.**

Ingeniería aprueba un contrato pequeño en su núcleo y extensible por tipo. Los
checklists de PBI, código, revisión y Git son aplicables sin seleccionar
frameworks ni herramientas nuevas. El contrato admite trabajo `Done` sin
commit o release cuando el alcance lo prohíbe, siempre que se reporte.

Los gates técnicos se delegan a DEC-051 y `pnpm run verify`; DEC-063 no duplica
comandos ni introduce dependencias. Persistencia y migraciones mantienen las
autoridades de DEC-049 y DEC-050.

La conformidad queda condicionada a DEC063-C01, C02, C04 y C05. Ningún
template, validador o workflow está materializado hoy.

## 5. Revisión de Seguridad

**Resultado: PASS WITH CONDITIONS.**

Seguridad confirma que riesgo ambiguo falla cerrado y que tenant, auth,
capacidades, PIN, sesión, acciones sensibles, persistencia, secretos y
contratos públicos son riesgo alto. La evidencia exige casos negativos,
anti-enumeración, mínimo privilegio y sanitización.

Los waivers no son implícitos, permanentes ni autoaprobados. Un defecto crítico
de aislamiento, auth o integridad impide `Done`; un `N/A` requiere
justificación y revisión. Logs y manifests excluyen secretos y datos reales.

La conformidad queda condicionada a DEC063-C02, C03, C06 y C08.

## 6. Revisión de Operaciones

**Resultado: PASS WITH CONDITIONS.**

Operaciones confirma la separación entre `Done` y `Released`. Un release exige
artefacto, entorno, autorización, recuperación, identidad, smoke y evidencia;
un deploy no validado no es `Released`. Hotfix conserva gates o un waiver
temporal explícito y exige reconciliación.

Persistencia y migraciones requieren PostgreSQL gobernado, recuperación,
concurrencia y evidencia. El manifest futuro debe registrar toolchain,
comandos, exit codes, hashes y resultados sanitizados.

La conformidad queda condicionada a DEC063-C03, C04, C05, C07 y C08.

## 7. Revisión de Calidad

**Resultado: PASS WITH CONDITIONS.**

Calidad confirma que cada criterio es observable y que la evidencia acompaña
al resultado. Defectos bloqueantes impiden `Done`; flakiness no se convierte
en verde por retry; cuarentena exige owner, expiración y evidencia alternativa.

La clasificación bajo/medio/alto gobierna profundidad sin sustituir el
checklist de tipo. Las condiciones aceptadas conservan ID, owner, momento,
evidencia, dependencia, estado y criterio de cumplimiento.

La conformidad queda condicionada a DEC063-C01, C02, C03, C04 y C08.

## 8. Estrategia seleccionada

Se acepta la **Opción B — base común más checklist por tipo y riesgo**.

No se acepta una lista universal ni el juicio unilateral del owner. El
contrato más específico y de mayor riesgo prevalece; toda ambigüedad falla
cerrado.

## 9. Estados

La revisión confirma como normativos:

`Proposed`, `Ready for formal decision`, `Accepted`, `Ready`, `In progress`,
`In review`, `Materialized`, `Formally Verified`, `Done`, `Released`, `Closed`,
`Rejected` y `Blocked`.

La separación es suficiente y compatible con los expedientes existentes.

## 10. Definition of Ready

La DoR exige objetivo, alcance, exclusiones, owner, dependencias, criterios,
riesgo, decisiones, evidencia y gates. Una pregunta que cambie alcance,
modelo o riesgo impide `Ready`.

**Dictamen:** PASS WITH CONDITIONS; C01 y C02 materializarán su consumo.

## 11. Base común

Objetivo, alcance, criterios, artefactos, decisiones, revisión, gates,
evidencia, secretos, documentación, Git y siguiente acción forman una base
completa sin ser desproporcionada.

**Dictamen:** PASS WITH CONDITIONS; C01 materializará templates.

## 12. Riesgo

La escala bajo/medio/alto es suficiente. La combinación adopta el nivel mayor
y todo vacío se clasifica alto.

**Dictamen:** PASS WITH CONDITIONS; C02 materializará la matriz.

## 13. Documentación

El checklist distingue autoridad, fuentes, estado, matrices vivas y
validaciones. Documentar no materializa.

**Dictamen:** PASS.

## 14. Decisiones

`Accepted`, `Materialized` y `Formally Verified` están separados. Condiciones
posteriores no permiten afirmar cumplimiento.

**Dictamen:** PASS.

## 15. PBI y código

Los contratos cubren DoR, criterios, implementación, pruebas, revisión, gates,
errores, dependencias, secretos y documentación. Un PBI puede estar `Done` sin
estar `Released`.

**Dictamen:** PASS WITH CONDITIONS; C01/C04.

## 16. Persistencia y migraciones

Ownership, aislamiento, PostgreSQL real, constraints, transacciones,
concurrencia y recuperación están cubiertos sin seleccionar herramienta.

**Dictamen:** PASS WITH CONDITIONS; C05 y DEC-050.

## 17. Seguridad y errores

Los casos negativos, fail-closed, anti-enumeración y mínimo privilegio son
obligatorios. DEC-044 conserva el catálogo y mappings.

**Dictamen:** PASS WITH CONDITIONS; C06.

## 18. Pruebas y CI

DEC-051 conserva autoridad. DEC-063 traduce sus gates a criterios de salida y
declara que CI no existe sólo por aceptar este documento.

**Dictamen:** PASS WITH CONDITIONS; C04 y condiciones DEC-051.

## 19. Revisión y Git

La revisión registra disciplina, alcance, artefacto, dictamen y condiciones.
Git requiere autorización para acciones externas y preservación de árboles
preexistentes.

**Dictamen:** PASS.

## 20. Release y hotfix

`Released` requiere promoción y validación; no es sinónimo de `Done`. Hotfix no
elimina gates sin waiver y debe reconciliarse.

**Dictamen:** PASS WITH CONDITIONS; C07/C08.

## 21. Spikes

Preguntas, timebox, evidencia reproducible, recomendación, limitaciones y
dictamen quedan cubiertos. Un prototipo no se declara producción.

**Dictamen:** PASS.

## 22. Evidencia

El manifest normativo contiene identidad del trabajo, commit/artefacto,
entorno, toolchain, comando, exit code, resultados, hashes, logs y dictamen.

**Dictamen:** PASS WITH CONDITIONS; C03.

## 23. Defectos y flakiness

No se acepta retry como evidencia verde. Defectos críticos bloquean; defectos
residuales requieren owner y riesgo aceptado.

**Dictamen:** PASS.

## 24. Excepciones y waivers

El contrato exige autoridad, alcance, riesgo, compensación, expiración y
remediación. Prohíbe autoaprobación y excepciones silenciosas.

**Dictamen:** PASS WITH CONDITIONS; C08.

## 25. Condiciones

Se aceptan y permanecen `Pending`:

- DEC063-C01 — templates;
- DEC063-C02 — clasificación de riesgo;
- DEC063-C03 — manifest de evidencia;
- DEC063-C04 — integración CI;
- DEC063-C05 — persistencia/migraciones;
- DEC063-C06 — seguridad;
- DEC063-C07 — release/hotfix;
- DEC063-C08 — excepciones/waivers.

Ninguna fue materializada o formalmente verificada.

## 26. Riesgos residuales

- burocracia por expansión de checklists;
- clasificación permisiva o excesiva;
- consumo inconsistente de templates;
- evidencia narrativa;
- waivers longevos;
- automatización prematura;
- condiciones pendientes sin materialización.

Son riesgos manejables mediante las ocho condiciones y no impiden aceptar el
contrato.

## 27. Registro de autoridad

El Responsable del Proyecto registra explícitamente:

1. **Arquitectura aprueba** DEC-063 con condiciones.
2. **Ingeniería aprueba** DEC-063 con condiciones.
3. **Seguridad está conforme** con DEC-063 con condiciones.
4. **Operaciones está conforme** con DEC-063 con condiciones.
5. **Calidad está conforme** con DEC-063 con condiciones.

No participaron revisores externos. La separación funcional de dictámenes no
se presenta como independencia personal.

## 28. Resultado global

**PASS — DEC-063 ACCEPTED WITH CONDITIONS.**

La propuesta es completa, consistente y suficiente para aceptación documental.
No existe contradicción material con las decisiones aceptadas. Las condiciones
son posteriores, acotadas y verificables; no encubren un vacío del contrato.

## 29. Estado final

- **DEC-063:** `Accepted with conditions`.
- **Fecha:** 2026-07-24.
- **Autoridad:** Responsable del Proyecto.
- **Condiciones:** DEC063-C01 a DEC063-C08 `Pending`.
- **Materialización:** no realizada.
- **Verificación formal de materialización:** no realizada.
- **Referencia autoritativa:** [DECISION_PROPOSAL.md](DECISION_PROPOSAL.md).

## 30. H0, R0, Sprint 00 y VC-024

- H0 pasa de **7 cerrados / 2 abiertos** a **8 cerrados / 1 abierto**.
- El único H0 pendiente es **VC-024** de DEC-004.
- VC-024 permanece `Pending`; no hubo ejecuciones CI.
- R0 permanece **no autorizado**.
- Sprint 00 permanece **abierto**.
- DEC051-C01 a DEC051-C10 permanecen `Pending`.
- DEC063-C01 a DEC063-C08 permanecen `Pending`.

## 31. Siguiente acción

Preparar una autorización separada para materializar los prerrequisitos
mínimos de VC-024 y ejecutar su evidencia. Hasta un dictamen posterior, no se
puede afirmar CI operativo, protección de `main`, cumplimiento de condiciones,
cierre H0 ni autorización de R0.
