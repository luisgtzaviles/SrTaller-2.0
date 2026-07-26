# Evaluación de riesgo

## Clasificación

**Alto, fail-closed.**

DEC-051 y DEC-063 clasifican como alto todo cambio de tenant/sucursal,
estación, persistencia, transacción, concurrencia, aislamiento o checker. La
ausencia de endpoint no reduce la severidad: un defecto en esta fundación
afectaría todos los consumidores futuros.

## Criterios activados

- aislamiento tenant/sucursal;
- reconocimiento de station;
- persistencia y migración;
- transaction boundary;
- optimistic concurrency;
- revocación;
- anti-enumeración;
- traducción de errores;
- public module contract;
- mutaciones de controles críticos.

## Amenazas y mitigaciones

| Riesgo | Impacto | Mitigación/gate |
| --- | --- | --- |
| input cliente se vuelve autoridad | cruce tenant/branch | recognition port + AD-08/09/12/18 |
| lookup global enumera station | fuga cross-tenant | scope compuesto + 401 uniforme |
| station revocada conserva acceso | acceso no autorizado | no cache + revision + guard |
| relink sobrescribe historia | atribución falsa | tabla bindings append-only |
| race resolve/revoke | efecto con contexto stale | revalidación transaccional |
| dos bindings activos | branch ambigua | unique parcial + invariant test |
| adapter filtra driver | exposición técnica | DEC-044 + mapping estructurado |
| módulo accede tabla ajena | ownership roto | checker DEC-005/049 |
| contexto mutable compartido | contaminación entre operaciones | readonly/freeze + no ALS |
| credential/fingerprint expuesto | suplantación/privacidad | mecanismo diferido PBI-029 |
| lifecycle sin autorización | escalada administrativa | cero wiring mutante hasta PBI-026 |
| evidencia narrativa | falso PASS | manifest, PG real, mutations, double run |

## Revisiones obligatorias

| Disciplina | Debe confirmar |
| --- | --- |
| Producto | lifecycle mínimo, relink explícito, terminalidad de revoke y exclusiones |
| Arquitectura | módulos, public API, ownership, no global context |
| Ingeniería | implementabilidad, migration, CAS, transaction guard |
| Seguridad | recognition boundary, fail-closed, anti-enumeración, secretos |
| Operaciones | PostgreSQL lifecycle, cleanup, artifacts, C02 |
| Calidad | criterios, matriz, mutations, reproducibilidad |

No se atribuye independencia antes de que un revisor distinto del autor emita
dictamen sobre el SHA exacto.

## Gates

- DEC051-C04 y C06 directos;
- DEC063-C02/C05/C06 directos;
- DEC051-C02 bloquea el primer merge funcional;
- DEC051-C05 no se completa porque no existe API;
- DEC063-C07 no se activa porque no hay release;
- C08/waiver no se activa mientras no exista excepción.

## Riesgo residual

Permanece alto hasta que PBI-029 materialice reconocimiento/secretos y PBI-026
componga autoridad administrativa. PBI-024 no oculta ese límite: su salida es
una fundación no invocable como operación de negocio completa.

## Downgrade

No existe downgrade unilateral. Un cambio de alcance o una eliminación de
negativos/mutaciones exige nueva clasificación y revisión. Ambigüedad produce
`Blocked`, no riesgo menor.
