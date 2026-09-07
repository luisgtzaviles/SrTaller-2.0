# PBI-034 — Verificación acotada de DEC-005 Option A

## Estado

- **PBI:** PBI-034 — Operational Session.
- **Estado del PBI:** `Done`; `Released: NO`.
- **Corte histórico verificado:** DEC-005 Option A se materializó para PBI-034
  mediante policy v4.
- **Resultado del corte PBI-034:** contrato, inspección estática y ejecución
  local reconciliados; checker, 188 fixtures y 53 mutaciones controladas de
  producto `PASS`; candidate, merge funcional, cierre y exact-main CI GREEN.
- **Cierre post-merge:** PR #34, merge
  `54ddc251cda8ec7465b7913786c647f8d3ccbeac`; CI exacto `34153470560`,
  run-1/run-2/comparison `SUCCESS`.
- **G3:** `PASS` efectivo conforme a la semántica post-merge.

Este documento conserva la verificación exacta de la materialización v4 de
PBI-034. La policy vigente es v5 y agrega la composición acotada de PBI-026;
esa ampliación se verifica por separado. Este documento no autoriza el cierre
de PBI-026, release ni deploy.

## Autoridad y límite

La autoridad Owner para PBI-034 permite Option A sólo como composición runtime
dirigida sobre aristas existentes y contratos públicos. No concede una
excepción general a DEC-005, no transfiere ownership y no autoriza efectos de
negocio. La autorización contextual deny-by-default pertenece a PBI-026, que
ahora está `In progress` con DoR y Owner Start propios; quedó fuera del alcance
de la autorización y verificación histórica de PBI-034.

## Registro materializado

En el corte exacto de PBI-034, `architecture/dec-005-policy.json` usaba policy
v4 y registraba exactamente dos aristas dirigidas con cuatro bindings
públicos:

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
continúa siendo el composition root exterior. En ese corte histórico no se
registraba una tercera arista de composición dirigida.

La policy vigente v5 preserva esas dos aristas y agrega exclusivamente
`repairs -> access` para PBI-026 mediante token e interfaz públicos. Su alcance
y evidencia están documentados en
[PBI-026 Option A Verification](PBI_026_OPTION_A_VERIFICATION.md).

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

| Superficie | Hecho verificado en el candidato exacto | Ejecución |
|---|---|---|
| `architecture/dec-005-policy.json` | corte PBI-034: policy v4, dos aristas y cuatro bindings dirigidos presentes | PASS |
| `scripts/lib/architecture-checker.mjs` | enforcement de composición dirigida presente | PASS |
| `src/modules/access/access.module.ts` | imports e inyección consumidora presentes | PASS |
| `src/modules/stations/{index.ts,stations.module.ts}` | contrato, token, binding y export presentes | PASS |
| `src/modules/users/{index.ts,users.module.ts}` | contrato, token, binding y export presentes | PASS |
| fixtures y mutaciones DEC-005 | 188 fixtures y 53 mutaciones controladas de producto | PASS |

Los resultados anteriores pertenecen al candidato exacto PBI-034 integrado.
La policy v5 vigente y su tercera arista tienen su propia verificación PBI-026;
cambiar un archivo relevante obliga a reejecutar la suite sobre el nuevo SHA.
CI y focused review permanecen como gates separados.

## Evidencia exacta satisfecha

- SHA final del candidato y diff fijado;
- checker y suites de arquitectura ejecutados sobre ese SHA;
- fixtures/mutaciones de Option A verdes sin desactivar reglas;
- typecheck, build y pruebas PBI-034 materiales reconciliadas;
- focused Critical-risk review sin hallazgos BLOCKER/HIGH/MEDIUM abiertos;
- CI del candidato con run-1, run-2 y comparison GREEN.

Candidate y exact-main CI, focused review, merge funcional, Owner Acceptance y
cierre post-merge de PBI-034 están completos. La verificación arquitectónica
no autoriza por sí sola el cierre de PBI-026, release ni deploy.

## Trazabilidad

- [DEC-005](../../decisions/dec-005-modular-monolith-organization/DECISION_PROPOSAL.md)
- [Reglas materializadas](ARCHITECTURE_RULES.md)
- [Grafo materializado](DEPENDENCY_GRAPH.md)
- [Fixtures y mutaciones](FIXTURES.md)
- [Implementación DEC-005](IMPLEMENTATION.md)
- [Evidencia PBI-034](../../quality/evidence/pbi-034/README.md)

## Próxima revisión

Al modificar policy, checker, grafo, módulos, tokens, bindings, exports,
fixtures o mutaciones de Option A.
