# PBI-034 — Verificación acotada de DEC-005 Option A

## Estado

- **PBI:** PBI-034 — Operational Session.
- **Estado del PBI:** `In review`; candidato de integración no integrado ni
  `Done`.
- **Decisión materializada:** DEC-005 Option A mediante policy v4.
- **Resultado de este documento:** contrato, inspección estática y ejecución
  local reconciliados; checker, 188 fixtures y 53 mutaciones controladas de
  producto `PASS`. SHA final y CI del candidato permanecen `Pending`.
- **G3:** `Pending`.

Este documento no reemplaza una focused Critical-risk review ni convierte los
resultados locales en un SHA, PR o run de CI todavía inexistentes.

## Autoridad y límite

La autoridad Owner para PBI-034 permite Option A sólo como composición runtime
dirigida sobre aristas existentes y contratos públicos. No concede una
excepción general a DEC-005, no transfiere ownership y no autoriza efectos de
negocio. La autorización contextual deny-by-default pertenece a PBI-026, que
permanece no iniciado.

## Registro materializado

`architecture/dec-005-policy.json` usa policy v4 y registra exactamente dos
aristas dirigidas con cuatro bindings públicos:

| Consumidor | Productor | Módulo importado | Token público | Contrato público |
|---|---|---|---|---|
| `access` | `stations` | `StationsModule` | `TRUSTED_STATION_CONTEXT_RESOLVER` | `TrustedStationContextResolver` |
| `access` | `stations` | `StationsModule` | `TRUSTED_STATION_ADMISSION_VALIDATOR` | `TrustedStationAdmissionValidator` |
| `access` | `users` | `UsersModule` | `AUTHENTICATION_USER_READER` | `AuthenticationUserReader` |
| `access` | `users` | `UsersModule` | `AUTHENTICATION_USER_ADMISSION_VALIDATOR` | `AuthenticationUserAdmissionValidator` |

`AccessModule` importa las dos clases de módulo por specifiers estáticos y
consume tokens/interfaces desde el `index.ts` público de cada productor. Los
validadores se incorporan a una misma transacción por contexto opaco, bloquean
y validan sólo filas del owner y exponen snapshots monotónicos, sin filtrar
tablas ni driver. `StationsModule` y `UsersModule` conservan sus bindings y
exports; `AppModule`
continúa siendo el composition root exterior. No se registra una tercera
arista de composición dirigida.

## Invariantes fail-closed

La verificación final debe demostrar conjuntamente que:

1. cada dependencia dirigida ya existe en el grafo acíclico aprobado;
2. consumer, producer, archivos, clases y specifiers coinciden exactamente
   con el registro;
3. el import de módulo es nombrado, estático, directo y sin alias;
4. `@Module({ imports: [...] })` es literal, único y contiene la composición
   registrada;
5. token e interfaz provienen exclusivamente de la superficie pública del
   productor;
6. cada token tiene un binding/export productor y una inyección consumidora
   únicos;
7. deep imports, infrastructure/repositories ajenos, dirección inversa,
   ciclos, `forwardRef`, `ModuleRef`, `@Global`, namespace y carga dinámica
   siguen rechazados;
8. una arista presente sólo en el grafo no autoriza composición runtime.

## Superficies inspeccionadas

| Superficie | Hecho observado en el working tree | Ejecución local |
|---|---|---|
| `architecture/dec-005-policy.json` | policy v4, dos aristas y cuatro bindings dirigidos presentes | PASS |
| `scripts/lib/architecture-checker.mjs` | enforcement de composición dirigida presente | PASS |
| `src/modules/access/access.module.ts` | imports e inyección consumidora presentes | PASS |
| `src/modules/stations/{index.ts,stations.module.ts}` | contrato, token, binding y export presentes | PASS |
| `src/modules/users/{index.ts,users.module.ts}` | contrato, token, binding y export presentes | PASS |
| fixtures y mutaciones DEC-005 | 188 fixtures y 53 mutaciones controladas de producto | PASS |

Los resultados anteriores pertenecen al working tree verificado; cambiar un
archivo relevante obliga a reejecutarlos sobre el nuevo SHA. El CI exacto y
la focused review siguen siendo gates separados.

## Evidencia requerida antes de Owner Review

- SHA final del candidato y diff fijado;
- checker y suites de arquitectura ejecutados sobre ese SHA;
- fixtures/mutaciones de Option A verdes sin desactivar reglas;
- typecheck, build y pruebas PBI-034 materiales reconciliadas;
- focused Critical-risk review sin hallazgos BLOCKER/HIGH/MEDIUM abiertos;
- CI del candidato con run-1, run-2 y comparison GREEN.

Hasta entonces, el candidato conserva integración `Pending`. El PASS local no
autoriza merge, `Done`, G3 `PASS`, PBI-026, release ni deploy.

## Trazabilidad

- [DEC-005](../../decisions/dec-005-modular-monolith-organization/DECISION_PROPOSAL.md)
- [Reglas materializadas](ARCHITECTURE_RULES.md)
- [Grafo materializado](DEPENDENCY_GRAPH.md)
- [Fixtures y mutaciones](FIXTURES.md)
- [Implementación DEC-005](IMPLEMENTATION.md)
- [Evidencia PBI-034](../../quality/evidence/pbi-034/README.md)

## Próxima revisión

Al fijar el SHA final o modificar policy, checker, grafo, módulos, tokens,
bindings, exports, fixtures o mutaciones de Option A.
