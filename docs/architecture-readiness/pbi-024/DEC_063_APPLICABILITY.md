# Aplicabilidad de DEC-063

## Tipo y riesgo

- tipo: PBI técnico, persistencia, seguridad y contexto;
- riesgo: **alto**, por el mayor riesgo aplicable;
- estado de esta entrega: implementación completa, en revisión;
- estado máximo sin revisión independiente: `In review`; no existe
  autorización implícita de merge.

## Condiciones

| Condición | Aplicabilidad | Estado | Tratamiento |
| --- | --- | --- | --- |
| C01 — templates | satisfecha históricamente | `Satisfied` | se usa base + tipo/riesgo |
| C02 — clasificación fail-closed | directa | PASS material para PBI-024; riesgo alto preservado | [RISK_ASSESSMENT.md](RISK_ASSESSMENT.md) |
| C03 — manifest | satisfecha históricamente | `Satisfied` | formato esperado definido |
| C04 — DoD/CI | satisfecha históricamente | `Satisfied` | no se reduce pipeline |
| C05 — persistencia/migración | directa | PASS material; revisión independiente pendiente | [evidencia](evidence/README.md) |
| C06 — seguridad | directa | PASS material; revisión independiente pendiente | [checklist](evidence/SECURITY_CHECKLIST.md) |
| C07 — release/hotfix | no activada | `Pending` | no release/deploy |
| C08 — waiver | no activada | `Pending` | no existe excepción |

La documentación no satisface C02/C05/C06: sólo define cómo demostrar sus
criterios durante una implementación autorizada.

## Definition of Ready para revisión formal

| Campo | Resultado |
| --- | --- |
| objetivo observable | PASS |
| alcance/exclusiones | PASS |
| owner y reviewers | PASS |
| dependencias | PASS |
| criterios binarios | PASS |
| riesgo alto | PASS |
| decisiones aplicables | PASS |
| evidencia esperada | PASS |
| gates y C02 | PASS |
| estimación | PASS — L |
| preguntas que cambian alcance | ninguna |

Este resultado habilita revisión formal, no el estado DEC-063 `Ready` de
implementación.

## C02 — riesgo

Ambigüedad eleva riesgo. No son razones de downgrade:

- no hay endpoint;
- sólo hay dos tablas;
- los IDs son UUID;
- la lógica es fundacional;
- PostgreSQL CI ya existe.

Revisiones obligatorias: Producto, Arquitectura, Ingeniería, Seguridad,
Operaciones y Calidad. Un revisor independiente debe emitir el dictamen final.

## C05 — persistencia/migración

Antes de considerar el trabajo `Done`:

- [x] owner/scope/registry actualizados;
- [x] migration ID/orden/manifest;
- [x] `up`, `down` o recovery;
- [x] PostgreSQL 18.4;
- [x] FK/unique/check/nullability;
- [x] binding único e historia;
- [x] rollback/same connection;
- [x] CAS y concurrencia;
- [x] error translation;
- [x] cleanup;
- [ ] revisión Ingeniería/Operaciones.

## C06 — seguridad

- [x] threat boundary y evidence source;
- [x] server-side only;
- [x] fail-closed;
- [x] AD-01–AD-20 y subcasos inequívocos;
- [x] no cross-tenant/cross-branch;
- [x] anti-enumeración;
- [x] no credential/secret/PII/SQL;
- [x] mínimo privilegio y cero administración pública;
- [x] 25 mutaciones críticas;
- [ ] revisión Seguridad/Calidad;
- [x] riesgo residual documentado.

## N/A justificados

- UI/visual: no hay frontend;
- HTTP envelope: no hay endpoint, aunque mapping queda trazado;
- release/hotfix: no hay release;
- datos reales: prohibidos;
- RLS: diferida por DEC-049;
- offline: fuera de alcance por ADR-010;
- auth/roles: PBIs 025/026.

## Criterio de Done futuro

PBI-024 sólo podrá quedar `Done` si:

- implementación y evidencia corresponden al mismo SHA;
- todos los criterios aplicables pasan;
- C02 no se usa para un merge no protegido;
- C04/C05/C06 tienen evidencia y autoridad;
- no quedan findings blocker/major;
- `Done` no se presenta como `Released`.
