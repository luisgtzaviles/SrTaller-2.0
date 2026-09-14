# Development Workflow Phase 1 — Technical Change

## Estado y autoridad

- **Estado:** Implementation complete — local integration verification in
  progress; PR/CI/review/merge pending.
- **Autoridad:** WF-001–WF-010 en
  [Development Workflow Efficiency Decisions](DEVELOPMENT_WORKFLOW_EFFICIENCY_DECISIONS.md).
- **Tipo:** Governance / CI / developer tooling.
- **Riesgo:** Alto; cambia el mecanismo que produce evidencia bloqueante.
- **Owner:** Product Owner.
- **Commit/PR:** TBD.

## Objetivo observable

Reducir duplicación sin perder señal mediante DOCS_ONLY fail-closed, stages
CI atómicos, preflight local no destructivo, migration-state snapshot,
métricas y mecanismos shadow de riesgo/tree identity.

## Alcance

- materializar WF-001 a WF-010;
- preservar VC-024 y comparison exacta para pipeline full;
- mantener exact-main full durante el piloto salvo la ruta `DOCS_ONLY`
  autorizada independientemente por WF-002;
- producir evidencia sanitizada y contratos negativos;
- actualizar las autoridades de delivery afectadas.

## Exclusiones

- PBI-041 y todo cambio de producto;
- migraciones de base de datos;
- deploy o acceso/mutación de Preview;
- Production;
- branch protection;
- activación del clasificador general para omitir gates;
- reducción de exact-main.

## Criterios de aceptación

1. Un delta permitido inequívocamente documental selecciona DOCS_ONLY.
2. Tests, workflows, scripts, config, assets/runtime, executable evidence,
   policies y unknown seleccionan full.
3. Un delta mixto selecciona full.
4. La ruta DOCS_ONLY valida whitespace, links, estructura, policy consistency,
   secrets y fingerprint sin instalar/levantar PostgreSQL.
5. Cada leg full ejecuta cada stage base material una sola vez y conserva dos
   legs independientes más comparison exacta.
6. Development Preflight no muta Git, procesos, puertos, DB ni fixtures.
7. Migration snapshot valida hashes, orden, duplicados, 24 h de freshness y
   conflictos conocidos sin usar secretos/datos de negocio.
8. Métricas registran stage, duración, resultado y finding técnico sanitizado.
9. Risk classification y verified-tree attestation se generan en shadow mode;
   no cambian gates ni exact-main fuera de la excepción `DOCS_ONLY`.
10. Hotfix de migration siempre recomienda/ejecuta full exact-main durante el
    piloto.

## Gates esperados

- tests focalizados de classifier, docs gate, preflight, snapshot, metrics y
  attestation;
- architecture, typecheck, build y suite completa;
- mutation/negative fixtures para toda regla fail-closed;
- `verify:full` por tratarse de CI infrastructure de riesgo alto;
- revisión independiente antes de cualquier integración.

## Evidencia

| Evidencia | Estado |
| --- | --- |
| Auditoría medida | PASS — `f565a94` |
| Decisiones Owner | WF-001–WF-010 accepted |
| Implementación | Complete on local branch |
| Evidencia local | [Implementation Evidence](../quality/evidence/workflow-phase-1/IMPLEMENTATION_EVIDENCE.md) |
| Development Preflight real | PASS — no destructivo; 62/62 journal y fixtures disponibles |
| Preview migration pre-merge | Advisory `UNKNOWN`; snapshot `NOT_CAPTURED`, compatibility no afirmada |
| Full verification | Primera campaña 13/13 PASS; final policy reconciliation campaign pending |
| CI | Not run |
| Independent review | Pending |
| Merge / deploy | Not authorized |

## Riesgos

- falso DOCS_ONLY por allowlist incompleta;
- datos incidentales vuelven evidence no determinista;
- preflight muta estado por accidente;
- snapshot stale se presenta como autoridad;
- shadow output se usa informalmente para saltar exact-main.

Cada riesgo falla cerrado y tiene una prueba negativa obligatoria.

## Operación del migration snapshot

El archivo inicial
[`preview-migration-state.snapshot.json`](../operations/preview-migration-state.snapshot.json)
declara `NOT_CAPTURED`. No se rellena desde memoria, source local o una lista
inventada. Un operador con autoridad obtiene un export read-only del journal
real con `environment: preview`, `source: authorized-real-journal-read` y
`names`; después ejecuta:

```sh
./scripts/pnpm-governed exec node scripts/capture-preview-migration-state.mjs \
  --journal-input /ruta/fuera-del-repo/preview-journal.json \
  --output docs/operations/preview-migration-state.snapshot.json \
  --release-sha <SHA_COMPLETO_SERVIDO> \
  --captured-at <INSTANTE_UTC>
```

El comando obtiene los hashes desde el Git tree exacto del release, rechaza
IDs duplicados/orden inválido y sustituye únicamente el placeholder. Para
reemplazar un snapshot ya capturado exige `--replace-existing`. Esto no concede
autoridad de acceso remoto ni deploy.

La comprobación pre-merge es:

```sh
./scripts/pnpm-governed run verify:preview-migrations -- --phase pre-merge
```

Pre-deploy usa `--phase pre-deploy` después de obtener el journal real vigente;
`NOT_CAPTURED`, stale o conflicto son bloqueantes en esa fase.
