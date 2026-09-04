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

No hubo deploy, cambio de Preview, PostgreSQL remoto, DNS, secretos ni
infraestructura. Este directorio no declara Owner Acceptance ni cierre `Done`.
