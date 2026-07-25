# Trazabilidad del Paso 8

| Requisito | Autoridad | Implementación/evidencia | Estado |
| --- | --- | --- | --- |
| migrador único | DEC-050 C01/C03 | `migration-runner.ts`, `Migrator` | PASS local |
| owner/root | DEC-049 C02, DEC-050 C02/C09 | policy, DIRECTORY/NAMING | PASS runner; schema pendiente |
| discovery/orden | DEC-050 C02/C03 | provider + tests | PASS |
| transacción/fallo | DEC-050 C04 | Kysely default + PG matrix | PASS |
| lock/timeout | DEC-050 C05 | ADVISORY_LOCK + concurrencia | PASS local |
| journal/status | DEC-050 C06 | JOURNAL + status | PASS |
| rollback/down | DEC-050 C07 | DOWN_POLICY + PG matrix | PASS local |
| manifest/drift | DEC-050 C08 | MANIFEST_AND_DRIFT | PASS |
| pruebas | DEC-050 C09, DEC-051 C03 | dos runs PG 18.4 | PASS local; CI pendiente |
| exceptions | DEC-050 C10 | cero excepción/waiver | PASS por no aplicabilidad |
| errores | DEC-044, DEC-049 C06 | ERROR_MAPPING/SANITIZATION | PASS para runner |
| boundaries | DEC-005, DEC-051 C06/C09 | D5-R049 + fixtures/mutación | PASS |
| high risk/cleanup | DEC-063 C02/C05/C06 | matrices, manifest, cleanup | evidencia parcial |
| secretos | DEC-055 parcial | config existente + sanitización | PASS para consumo; provider/rotación pendiente |
| no startup | DEC-050 C08 | assertions AppModule/main + D5-R049 | PASS |
| no schema productivo | alcance Paso 8 | ruta inexistente + fixtures test | PASS |

DEC-049 no cierra aislamiento tenant/adapters. DEC-050 conserva condiciones de
primera migración, CI y operación. DEC-051 C03/C04 y condiciones release de
DEC-063 siguen abiertas.
