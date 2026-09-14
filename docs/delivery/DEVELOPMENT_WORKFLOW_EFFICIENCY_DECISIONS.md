# Development Workflow Efficiency Decisions

## Estado del documento

- **Estado:** Accepted — materialization authorized.
- **Fecha:** 2026-09-14.
- **Autoridad:** Product Owner.
- **Origen:**
  [Development Workflow Efficiency Audit](DEVELOPMENT_WORKFLOW_EFFICIENCY_AUDIT.md).
- **Alcance:** workflow de desarrollo, evidencia, CI y preflights.
- **Exclusiones:** producto, PBI-041, Production, deploy y reducción inmediata
  de exact-main.
- **Próxima revisión:** al terminar el tercer PBI implementado del piloto y
  cuando estén cubiertos UI/application, persistence/migration y
  authorization/security o riesgo transversal.

El avance del piloto se registra en
[Workflow Shadow Pilot](WORKFLOW_SHADOW_PILOT.md); comienza en `0/3` después de
integrar esta materialización y no cuenta trabajo histórico retroactivamente.

## Decisiones aceptadas

### WF-001 — Conservative Optimized

Se adopta Fase 1 / Option A. Durante iteraciones se usan gates focalizados y en
functional freeze se ejecuta un full local autoritativo. PR CI conserva sus dos
legs Linux independientes y comparison exacta. Preview conserva sus pruebas
específicas.

### WF-002 — DOCS_ONLY fail-closed

Se implementa un gate especializado únicamente para documentación
inequívocamente no ejecutable. Ante duda, path desconocido o delta mixto se
ejecuta el pipeline completo.

Nunca son DOCS_ONLY:

- tests;
- workflows;
- policies ejecutables;
- scripts;
- configuración;
- assets/runtime;
- evidencia ejecutable.

### WF-003 — Development Preflight

Se crea un preflight unificado y no destructivo que detecta temprano
branch/SHA/runtime stale, toolchain, puertos/procesos, migraciones duplicadas,
journal local, provenance y disponibilidad de fixtures. No inicia, detiene,
resetea, migra ni siembra recursos. Toda destrucción conserva autoridad
explícita separada.

### WF-004 — Preview migration-state snapshot

Se crea un snapshot gobernado sin secretos ni datos de negocio. Freshness
inicial: 24 horas. Un snapshot stale no demuestra compatibilidad.

### WF-005 — Métricas y findings

Los gates registran tiempo y findings técnicos en evidencia sanitizada. No se
registran secretos, credenciales, datos de negocio, PID, puertos efímeros ni
otros valores que destruyan comparabilidad.

### WF-006 — Risk classifier shadow-only

El clasificador general corre en shadow mode durante los próximos tres PBIs
implementados. Debe observar al menos:

1. un PBI principalmente UI/application;
2. un PBI con persistencia/migraciones;
3. un PBI con authorization/security o riesgo transversal.

Si tres PBIs no cubren los perfiles, el piloto se extiende. Durante el piloto
la clasificación no omite ningún gate excepto la ruta DOCS_ONLY aprobada
independientemente por WF-002.

### WF-007 — Verified-tree attestation shadow-only

Se diseña y materializa una atestación verificable de tree, toolchain,
workflow, migration manifest, artefacto y evidencia. Durante el piloto sólo
informa equivalencia: no reduce exact-main.

### WF-008 — Migration hotfix

Todo hotfix de migración conserva full exact-main durante todo el piloto,
incluso cuando exista una atestación de tree equivalente.

### WF-009 — Autoridad de migration state

- **Pre-merge:** snapshot advisory normalmente; bloqueante si demuestra un
  conflicto conocido y material.
- **Pre-deploy:** comparación contra el journal real de Preview, autoritativa y
  bloqueante.

### WF-010 — Objetivos de observabilidad

- cierre normal: menos de 45 minutos;
- DOCS_ONLY: menos de 10 minutos;
- defecto real: remediation time registrado por separado.

Son objetivos, no SLA, waiver ni autoridad para omitir gates.

## Invariantes

1. VC-024 continúa comparando dos ejecuciones Linux independientes cuando se
   ejecuta el pipeline completo.
2. Caches de dependencias no sustituyen resultados independientes.
3. Comparison permanece exacta.
4. Independent review conserva su autoridad.
5. El clasificador general y la tree attestation no reducen exact-main durante
   el piloto; sólo `DOCS_ONLY` puede usar su gate especializado independiente.
6. Preview sigue siendo autoridad de su runtime y journal reales.
7. Toda clasificación desconocida escala a full.
8. Ninguna decisión autoriza PBI, merge, deploy o Production por inferencia.

## Estado de materialización

La aceptación autoriza implementación en una rama técnica separada. Cada
mecanismo requiere pruebas positivas, negativas, de frontera y fallo según su
riesgo. El workflow vigente no cambia hasta que el candidato sea revisado e
integrado mediante su autoridad normal.
