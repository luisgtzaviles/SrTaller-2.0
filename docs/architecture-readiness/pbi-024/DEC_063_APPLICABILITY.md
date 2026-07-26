# Aplicabilidad de DEC-063

## Tipo y riesgo

- tipo: PBI técnico, persistencia, seguridad y contexto;
- riesgo: **alto**, por el mayor riesgo aplicable;
- estado de esta entrega: refinamiento documental;
- estado futuro máximo sin revisión: ninguno; no existe autorización
  implícita.

## Condiciones

| Condición | Aplicabilidad | Estado | Tratamiento |
| --- | --- | --- | --- |
| C01 — templates | satisfecha históricamente | `Satisfied` | se usa base + tipo/riesgo |
| C02 — clasificación fail-closed | directa | `Pending`; expediente listo para ratificación | [RISK_ASSESSMENT.md](RISK_ASSESSMENT.md) |
| C03 — manifest | satisfecha históricamente | `Satisfied` | formato esperado definido |
| C04 — DoD/CI | satisfecha históricamente | `Satisfied` | no se reduce pipeline |
| C05 — persistencia/migración | directa | `Pending` | checklist futuro completo |
| C06 — seguridad | directa | `Pending` | checklist futuro completo |
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

- [ ] owner/scope/registry actualizados;
- [ ] migration ID/orden/manifest;
- [ ] `up`, `down` o recovery;
- [ ] PostgreSQL 18.4;
- [ ] FK/unique/check/nullability;
- [ ] binding único e historia;
- [ ] rollback/same connection;
- [ ] CAS y concurrencia;
- [ ] error translation;
- [ ] cleanup;
- [ ] revisión Ingeniería/Operaciones.

## C06 — seguridad

- [ ] threat boundary y evidence source;
- [ ] server-side only;
- [ ] fail-closed;
- [ ] AD-01–AD-20 y subcasos inequívocos;
- [ ] no cross-tenant/cross-branch;
- [ ] anti-enumeración;
- [ ] no credential/secret/PII/SQL;
- [ ] mínimo privilegio y cero administración pública;
- [ ] 25 mutaciones críticas;
- [ ] revisión Seguridad/Calidad;
- [ ] riesgo residual.

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
