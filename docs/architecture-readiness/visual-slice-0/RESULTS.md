# VS0 — Resultados de implementación y handoff

## Dictamen

**CONDITIONAL PASS — VS0 IMPLEMENTED / DEPLOY BLOCKED**

La vertical completa está implementada y validada localmente. El deploy no se
ejecutó porque no existe acceso verificable a un VPS dedicado de preview. Esta
ausencia no autoriza usar staging o producción de SR Taller 1.0.

## Material implementado

- **Rama:** `preview/visual-slice-0`.
- **Implementación:** `35bdc47` (`feat(preview): implement VS0 repair vertical`).
- **Operación:** `328dc58` (`chore(preview): add reproducible deployment tooling`).
- **Web:** React, Vite, TypeScript y React Router bajo `apps/dev-preview-web`.
- **Runtime:** un proceso NestJS sirve el SPA y `/api/preview`.
- **Recorrido:** inicio, listado, alta, detalle, historial y cambio de estado.
- **Persistencia:** una migración owner-scoped crea `preview_repairs` y
  `preview_repair_status_history`.
- **Contexto:** tenant, sucursal y estación se resuelven server-side mediante
  `TrustedStationContext`; el contrato público expone únicamente etiquetas.
- **Concurrencia:** cambio de estado con `expectedRevision` y conflicto CAS.
- **Operación:** artefacto por SHA, Caddy, systemd, backup previo, migración,
  symlink atómico, smoke y rollback bajo `ops/preview/`.

## Validaciones ejecutadas

| Validación | Resultado |
| --- | --- |
| Node.js `24.18.0` / pnpm `11.15.1` | PASS |
| `pnpm install --frozen-lockfile` | PASS |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS |
| `pnpm test` | PASS: 438 tests, 426 pass, 12 skips ordinarios, 0 fail |
| `pnpm run test:architecture` | PASS: 265/265 |
| `pnpm run architecture` | PASS |
| `pnpm run verify` | PASS |
| `pnpm run smoke:start` | PASS |
| `node scripts/test-preview-repair-postgresql.mjs` | PASS con PostgreSQL 18.4; cleanup PASS |
| `pnpm run smoke:preview` contra runtime local | PASS |
| `bash -n ops/preview/*.sh` | PASS |
| `git diff --check` | PASS |
| Revisión visual en navegador | Bloqueada por Chrome connector |
| Deploy y smoke HTTPS remoto | Bloqueados por falta de VPS/canal autorizado |

El runner PostgreSQL usó la imagen fijada por digest
`sha256:d93de42662696f278fb34354b06fdaa90ad7ca3106d6f72fbd01d16da006d2cf`
y verificó migración, aislamiento tenant/branch, atomicidad de creación e
historial, revisión CAS y cleanup sin skips ni fallos.

El smoke HTTP confirmó:

1. shell y fallback de las cuatro rutas SPA;
2. contrato público de contexto sin identificadores operativos;
3. creación, listado, detalle y persistencia tras recarga;
4. transición válida y conflicto `409` ante revisión obsoleta.

## Estado remoto

No se ejecutaron SSH, transferencia, DNS, Caddy, systemd, migraciones remotas,
backup remoto ni smoke HTTPS. Faltan datos operativos no presentes en el
repositorio:

- hostname exclusivo de preview;
- canal SSH/transferencia explícitamente autorizado;
- VPS Ubuntu 24.04 separado de staging y producción;
- secretos y variables DEV_ONLY provisionados fuera de Git;
- Basic Auth y certificado HTTPS activos.

Por lo anterior, no existe todavía URL que el Responsable de Producto pueda
navegar y no corresponde emitir el PASS de deploy.

## Seguridad y alcance preservados

- sólo se usaron fixtures sintéticos y un PostgreSQL efímero local;
- no se implementaron usuarios, PIN, sesiones, roles, pagos, caja, inventario,
  WhatsApp, RLS ni integraciones productivas;
- no se tocaron PBI-025–PBI-029, R1, producción ni `main`;
- PR #3 no fue aprobado, modificado ni mergeado;
- DEC-051 C02 continúa pendiente;
- no se imprimieron ni almacenaron secretos.

## Handoff operativo

La siguiente acción requiere autoridad operativa nueva: provisionar o indicar
el VPS preview dedicado y su canal de acceso. Después se debe empaquetar el SHA
exacto con `ops/preview/package-release.sh`, ejecutar el deploy controlado,
validar HTTPS y Basic Auth, completar el smoke remoto y realizar QA visual con
datos sintéticos. Hasta entonces el estado permanece
`CONDITIONAL PASS — VS0 IMPLEMENTED / DEPLOY BLOCKED`.
