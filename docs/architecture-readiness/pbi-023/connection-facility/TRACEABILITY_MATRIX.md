# Trazabilidad de la facility

| Requisito | Autoridad | Implementación/evidencia | Estado |
|---|---|---|---|
| Kysely/pg exactos | DEC049-C01 | lock preservado + connection source | PASS |
| owner/API no global | DEC-005, DEC049-C02/C07 | policy, D5-R038/D5-R045 | PASS |
| pool/lifecycle | DEC-049 §24 | contract, unit y PG suite | PASS facility |
| no driver leak | DEC049-C06/C07 | API exacta + architecture tests | PASS |
| error translation | DEC-044, DEC049-C06 | [ERROR_MAPPING.md](ERROR_MAPPING.md) | PASS connection |
| sanitización | DEC-044, DEC-055 parcial | [SANITIZATION.md](SANITIZATION.md) | PASS sin satisfacer DEC-055 |
| PostgreSQL real | DEC051-C03 | dos runs PG 18.4 | Partial — CI pendiente |
| errores/retry tests | DEC051-C05 | unit + auth/timeout/SSL reales | Partial — API/adapters pendientes |
| boundaries | DEC051-C06/C09 | fixture/mutación D5-R045/R046 | PASS alcance |
| evidencia reproducible | DEC063-C03/C04 | manifest, hashes, comandos | PASS local |
| seguridad/cleanup | DEC063-C06 | redacción, tmpfs, cleanup | PASS alcance |
| no startup migration | DEC-004, DEC050-C08 | hashes + architecture test | PASS |
| transaction runner | DEC049-C04 | fuera de este paso | Pending / gate siguiente |
| migrations/schema | DEC-050 | fuera de este paso | Pending |
