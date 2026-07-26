# Matriz de trazabilidad

| Requisito | Autoridad | Evidencia | Resultado |
|---|---|---|---|
| versiones exactas | DEC-049/050 C01 | [PACKAGE_METADATA.md](PACKAGE_METADATA.md) | PASS |
| runtime vs dev | DEC-049 | [README.md](README.md) | PASS |
| integridades y fuente | DEC050-C01 | [PACKAGE_METADATA.md](PACKAGE_METADATA.md) | PASS |
| cierre transitivo | supply-chain policy | [DEPENDENCY_GRAPH.md](DEPENDENCY_GRAPH.md) | PASS |
| scripts gobernados | DEC-004 / install policy | [LIFECYCLE_SCRIPTS.md](LIFECYCLE_SCRIPTS.md) | PASS |
| advisories/licencias/capacidades | DEC-049/063 | [SUPPLY_CHAIN_REVIEW.md](SUPPLY_CHAIN_REVIEW.md) | PASS |
| Node 24 / TS6 / ESM / NodeNext | DEC-004 | [COMPATIBILITY.md](COMPATIBILITY.md) | PASS |
| checker fail-closed | DEC-005, D5-R037–D5-R047 | [COMPATIBILITY.md](COMPATIBILITY.md) | PASS |
| doble frozen install | DEC-051/063 | [FROZEN_INSTALL.md](FROZEN_INSTALL.md) | PASS |
| surfaces preservadas | mandato Paso 4 | [FROZEN_INSTALL.md](FROZEN_INSTALL.md) | PASS |
| manifest | DEC063-C03 | [EVIDENCE_MANIFEST.json](EVIDENCE_MANIFEST.json) | PASS local |
| selección de paquetes | DEC050-C01 | expediente completo | `Partial — materialized` |
| conexión/runtime | DEC049/050 | fuera de alcance | Pending |
| migraciones/PostgreSQL CI | DEC050/051 | fuera de alcance | Pending |

## Cadena de gate

`Paso 3 checker PASS → Paso 4 exact dependencies PASS → Paso 5 typed config
pending → connection/transaction pending → migrator/schema pending → PG18 CI
pending`

El PASS de este expediente sólo mueve la cadena al Paso 5.
