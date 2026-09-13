# PBI-043 — Implementation Evidence

## Estado

- **Estado:** candidato funcional verificado localmente; integración formal en
  curso.
- **Riesgo:** Critical.
- **Rama:** `fix/pbi-043-concurrent-operational-sessions`.
- **Baseline integrada:** `9ed688566430d12fc52b6d48cdffdea3aba8ef62`.
- **Datos:** exclusivamente fixtures sintéticos locales y bases PostgreSQL
  efímeras.
- **Production:** no desplegada ni autorizada.

## Resultado implementado

- Login con `expectedSessionId=null` inserta una Session independiente sin
  consultar, bloquear ni reemplazar Sessions hermanas de la Station.
- Switch con `expectedSessionId=X` autentica bearer y CSRF, bloquea sólo X y
  reemplaza sólo X dentro de la misma transacción que crea la nueva Session.
- Logout conserva su compare-and-set sobre bearer, CSRF y contexto exactos.
- Access ofrece operaciones internas Tenant-scoped para invalidar una Session
  o las Sessions afectadas por User, Station y versión de PIN credential; no se
  añadió endpoint ni UI administrativa.
- La migración elimina el unique parcial station-wide, conserva PK/verifier y
  agrega índices parciales activos por Station, User, PIN credential y
  StationCredential.
- El `down` aborta si alguna Station tiene más de una Session activa; no elige
  ni cierra una ganadora.
- Cookies, CSRF, PIN lockout/rate limit, idle 60 minutos, absolute 12 horas,
  contexto server-side y atribución de negocio no cambiaron.

## Matriz COS-01…COS-24

| IDs | Evidencia | Resultado local |
|---|---|---|
| COS-01, 03–05, 13–15 | contratos Application/HTTP con dos cookie jars y Sessions exactas | PASS |
| COS-02, 06–11, 16–17, 19 | PostgreSQL material: concurrencia, scope, races, revocación y expiración | PASS |
| COS-12 | PostgreSQL material PIN: contador/cooldown concurrente sin expulsar Session existente | PASS |
| COS-18 | autorización contextual y nota operativa conservan SessionId solicitante | PASS |
| COS-20–22 | fresh, existing, down guard, reconciliación explícita y reapply | PASS |
| COS-23–24 | dos perfiles Google Chrome visibles, misma Station y Users distintos | PASS |

La prueba Chrome ejecutó en orden: login Owner, login QA, reload de ambos,
logout QA, comprobación Owner, relogin QA, switch QA, comprobación Owner y
retorno QA a un User distinto. Al final existían dos perfiles visibles y
autenticados en la misma Station: Owner en `/reparaciones/nueva` y QA en
`/reparaciones`. No se registraron PIN, bearer, CSRF, cookies ni verificadores.

## PostgreSQL material

El runner compuesto se ejecutó dos veces sobre PostgreSQL `18.4`, imagen por
digest, UTC y UTF-8, con base y container nuevos por archivo:

| Propiedad | Resultado |
|---|---|
| Corridas | `2` |
| Tests owner-scoped | `8/8` PASS; cero skips |
| Comparación | `MATCH` |
| Hash material | `a4d67c930d024ec3946ca051d3eb335d51765eda4b6ced8774bc77f50b50a298` |
| Cleanup | PASS; cero containers gobernados residuales |

La suite Access material verifica dos commits independientes simultáneos,
switch/logout con un ganador exacto, User/Station/credential revocation,
restore sin resurrection, aislamiento Tenant/Branch, expiraciones y rollback
guardado con filas intactas.

## Gates locales

| Gate | Resultado |
|---|---|
| Toolchain | Node `24.18.0`; pnpm `11.15.1` |
| `pnpm test` | 805 tests; 786 PASS; 19 skips gobernados; 0 FAIL |
| `pnpm verify` | PASS, incluidos typecheck, build, estructura, arquitectura, configuración externa y UI |
| PostgreSQL owner-scoped `--runs 2` | PASS / MATCH / cleanup PASS |
| Chrome COS-23/COS-24 | PASS, dos perfiles reales, misma Station |
| Runtime local | `/livez` PASS; `/readyz` PASS; 52 migraciones y cero pendientes |
| Baseline Repairs | New Repair y Worklist cargaron con fixtures sintéticos gobernados |
| Price List | no forma parte de `main`; rama PBI-040 preservada sin modificación |
| `verify:full` | pendiente sobre el SHA candidato final |
| Independent Critical review | pendiente |
| PR/CI/merge | pendiente |
| Preview | pendiente; Production prohibida |

## Procedencia y aislamiento local

El volumen local encontrado contenía migraciones WIP de PBI-040 y el migrador
PBI-043 falló cerrado antes de mutarlo. La base se preservó reversiblemente
como `srtaller_pbi040_preserved_20260912`; se creó una nueva
`srtaller_local`, se aplicaron las 52 migraciones del checkout y se ejecutó el
seed oficial. No se copió ni modificó código de PBI-040.

## Riesgos residuales y límites

- No existe todavía Device/Session Admin, límite configurable ni audit global;
  son exclusiones aprobadas ASC-004/005/008.
- Los puertos de invalidación son internos; no amplían autoridad HTTP.
- Rollback después de admitir N Sessions requiere reconciliación explícita y
  debe preferir roll-forward.
- La evidencia local no sustituye CI autoritativa, merge, exact-main ni Preview.

## Evidencia de integración pendiente

Se completará con PR, SHA final, run-1, run-2, comparison, revisión
independiente, merge SHA, exact-main CI y provenance/health/smokes de Preview.

## Próxima revisión

Antes de merge y nuevamente después de validar el SHA integrado en Preview.
