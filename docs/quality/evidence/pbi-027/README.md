# PBI-027 — Evidence

## Alcance verificado

- Migración aditiva `20260904120000_stations_add_branch_timezone`.
- `branches.time_zone` no nulo con fallback histórico IANA
  `America/Hermosillo` para legacy/bootstrap gobernado.
- Contrato `stations` con IANA explícita para crear y actualizar una Branch;
  rechaza offsets fijos.
- Presentación de un instante por zona de Branch sin mutar el instante
  autoritativo.
- Aislamiento tenant/branch durante el cambio de zona.

## Evidencia local (2026-09-04)

| Comprobación | Resultado |
|---|---|
| Node / pnpm | PASS — 24.18.0 / 11.15.1 |
| Typecheck | PASS |
| Build | PASS |
| Pruebas unitarias focalizadas | PASS — parser IANA, offset fijo, borde de día, multibranch e inmutabilidad de instante |
| PostgreSQL local | PASS — 18.4; migración y seed sintético aplicados |
| PostgreSQL efímero | PASS — migraciones, scope y cadena Repairs (`runs=1`) |
| Arquitectura de esquema | PASS |
| CI autoritativo del candidato | PASS — run `33914277031`; `run-1`, `run-2` y `comparison` GREEN sobre `239c2c9996c1159aa52985e189d3add5e00545e6` |
| Merge funcional | PASS — PR #19 integrado mediante `4d54f84e8ad4b16b2889a555f7fc75975c6ddc68` |
| CI autoritativo de `main` | PASS — run `33944664589`; `run-1`, `run-2` y `comparison` GREEN sobre el merge SHA exacto |
| Owner Acceptance | APPROVED — PBI-027 aceptado funcionalmente; `Released: NO` |

No hubo deploy, cambio de Preview, PostgreSQL remoto, DNS, secretos ni
infraestructura. El [cierre canónico](./CLOSURE_CANDIDATE.md) enlaza la
aceptación Owner, el merge y el CI de `main`; PBI-027 está `Done` y no está
`Released`.
