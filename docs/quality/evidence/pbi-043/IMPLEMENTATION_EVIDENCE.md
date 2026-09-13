# PBI-043 — Implementation Evidence

## Estado

- **Estado:** candidato integrado, CI autoritativa y Preview PASS; cierre
  documental en curso.
- **Riesgo:** Critical.
- **Rama:** `fix/pbi-043-concurrent-operational-sessions`.
- **Baseline integrada:** `aab27d98db94d850c580f0cac594c1a62c00cc51`.
- **Datos:** fixtures sintéticos locales/bases PostgreSQL efímeras y un User
  QA sintético de Preview, desactivado al terminar la prueba.
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
  agrega índices parciales activos por Station, User y PIN credential. No se
  agregó un índice por StationCredential porque no existe una operación
  productiva que lo justifique.
- El `down` aborta si alguna Station tiene más de una Session activa; no elige
  ni cierra una ganadora.
- Cookies, CSRF, PIN lockout/rate limit, idle 60 minutos, absolute 12 horas,
  contexto server-side y atribución de negocio no cambiaron.

## Matriz COS-01…COS-24

| IDs | Evidencia | Resultado local |
|---|---|---|
| COS-01, 03–05, 14–15 | contratos Application/HTTP con dos cookie jars y Sessions exactas | PASS |
| COS-02, 06–11, 16–17, 19 | PostgreSQL material: concurrencia con locks observados, scope, races, revocación N-session y expiración | PASS |
| COS-12 | PostgreSQL material PIN: contador/cooldown concurrente sin expulsar Session existente | PASS |
| COS-13 | cruce real CSRF de Session A + bearer de Session B: denegado y B permanece activa | PASS |
| COS-18 | dos notas concurrentes desde Sessions de una Station conservan sus SessionId solicitantes | PASS |
| COS-20–22 | fresh, existing, down guard, reconciliación explícita y reapply | PASS |
| COS-23–24 | dos perfiles Google Chrome visibles, misma Station y Users distintos | PASS |

La prueba Chrome ejecutó en orden: login Owner, login QA, reload de ambos,
logout QA, comprobación Owner, relogin QA, switch QA, comprobación Owner y
retorno QA a un User distinto. Al final existían dos perfiles visibles y
autenticados en la misma Station: Owner en `/reparaciones/nueva` y QA en
`/reparaciones`. El runner usa puertos dinámicos, confirma que cada target CDP
pertenece al perfil recién lanzado, valida ruta/heading/estado autenticado del
DOM e inspecciona Console/Network. No persiste request headers/bodies ni
registra PIN, bearer, CSRF, cookies o verificadores. Después del bootstrap se
reinicia la telemetría; sólo se tolera el `404 /favicon.ico` conocido. Cualquier
otro 4xx/5xx queda reducido a status/ruta sanitizados y hace fallar el proof.
Los aborts por navegación se clasifican separadamente de fallos de red reales.

La primera revisión independiente sobre `ae5e9bf` rechazó la evidencia por
barreras no deterministas y cobertura sobredeclarada. La remediación sustituyó
timers por locks PostgreSQL observables, extendió Station/User/PIN revoke a
múltiples Sessions, combinó lockout con resolución de una Session existente,
añadió el cruce CSRF material y probó atribución concurrente. La nueva revisión
debe ejecutarse sobre el SHA candidato final; el hallazgo inicial no se trata
como PASS.

La re-revisión de `b76e75b` cerró seis hallazgos y conservó uno Medium: el gate
Chrome no rechazaba aún errores HTTP 4xx. Se remedió con reset explícito tras
bootstrap, allowlist cerrada de `404 /favicon.ico`, error HTTP sanitizado y
fallo ante cualquier otra respuesta 4xx/5xx o error de Console/Network. La
revisión final sobre `fcf1eba` confirmó esta corrección y cerró sin hallazgos
Critical/High/Medium.

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

La suite Access material verifica dos commits independientes bloqueados
simultáneamente antes de liberarlos, switch/logout con un ganador exacto,
User/Station/credential revocation de todas las Sessions afectadas, restore sin
resurrection, aislamiento Tenant/Branch, expiraciones y rollback guardado con
filas intactas.

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
| `verify:full` | PASS sobre `65cf2da`; 12/12 stages, fingerprint `79a26f64c11090ba6c9ceb9d0887cd36dfa3a7f2410e7ec20be2fcbe03e1be20` |
| Independent Critical review | PASS sobre `65cf2da`; cero hallazgos Critical/High/Medium abiertos |
| PR/CI/merge | PR #47; CI `34729684465` PASS; merge `aab27d9`; exact-main CI `34730090448` PASS |
| Preview | PASS sobre `aab27d9`; Production prohibida |

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
- Los límites ASC-004/005/008 permanecen explícitos aun con CI, merge y
  Preview completos.

## Evidencia de integración y Preview

- Candidato final: `65cf2da6be00f1ea66a68b623ffe245910c30170`.
- PR funcional: [#47](https://github.com/luisgtzaviles/SrTaller-2.0/pull/47),
  mergeado el 2026-09-12 como
  `aab27d98db94d850c580f0cac594c1a62c00cc51`.
- CI candidata `34729684465`: run-1, run-2 y comparison PASS.
- CI exacta de `main` `34730090448`: run-1, run-2 y comparison PASS sobre
  `aab27d98db94d850c580f0cac594c1a62c00cc51`.
- Preview fue desplegado manualmente desde `main`; el container sano usa la
  imagen `sha256:edc538bd5a8abb5a80e20481b71bddb98d35f37c39a97300407314e8fe676ad5`.
- El primer arranque nuevo falló cerrado con
  `DATABASE_RUNTIME_SCHEMA_NOT_READY`; el container previo sano siguió
  sirviendo. Se verificó que la migración del artifact remoto coincidía byte a
  byte con la local, se ejecutó una migración one-shot gobernada y se confirmó
  idempotencia: primera corrida `applied=1`, segunda `applied=0`, ambas
  `pending=0` y manifest
  `0ce8f0411467e5b6f24c9ea4a5453622fc290e8cec75516176a7684358cb1dcb`.
- Provenance compilada: 399 archivos y digest
  `fe60db07047d5abd816cf919de65473dbd4f3c86d7c009d45698af0cd9e54b12`
  tanto en `dist` exact-main como en `/app/dist` del container remoto.
- Health remoto: `/` 200, `/livez` 200, `/readyz` 200 y `/api/unknown` 404.
- El esquema remoto contiene los índices activos por Station, User y PIN
  credential; el unique histórico station-wide ya no existe.
- La prueba alojada con dos perfiles aislados confirmó misma Station, Users y
  Sessions distintas, reload de ambos, logout/relogin/switch de QA sin afectar
  al Owner y cero errores de Console, runtime, red o servidor.
- Para la segunda identidad se creó `Codex QA Preview` mediante la API del
  producto con datos sintéticos. Al terminar quedó inactiva, sus Sessions
  revocadas y los perfiles temporales eliminados; sólo la Session Owner previa
  permaneció activa.
- La ausencia de Price List en `main` se preservó como baseline: PBI-040 sigue
  congelado en `68843baea68a618d0c00748e464b3cd2cffbdab3` y no fue tocado.

## Próxima revisión

Ante cambios posteriores a ADR-014, admission, switch/logout, revocación,
cookies/CSRF o migraciones de `access_operational_sessions`.
