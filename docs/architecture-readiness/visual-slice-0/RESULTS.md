# VS0 — Resultados de implementación y handoff

## Dictamen

**CONDITIONAL PASS — VS0 VPS READY / EXTERNAL ACCESS BLOCKED**

La vertical completa está implementada, desplegada y validada en el loopback de
un VPS dedicado de preview. El acceso externo permanece bloqueado porque el
hostname de desarrollo es `TBD`; Caddy está deshabilitado para no publicar sin
HTTPS y Basic Auth.

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
| Deploy por SHA y smoke remoto sobre loopback | PASS |
| Smoke HTTPS y revisión visual externa | Bloqueados por hostname/DNS `TBD` |

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

- **Proveedor/host:** Hetzner, `srtaller-preview-01`, Ubuntu 24.04 LTS x86_64,
  zona `hel1-dc2` / región `eu-central`.
- **IPv4:** `204.168.203.127`; VPS exclusivo de desarrollo, separado de SR
  Taller 1.0, staging y producción.
- **Snapshot base:** `ubuntu24-hardened-clean`.
- **Runtime:** Node.js `24.18.0`, pnpm `11.15.1`, PostgreSQL `18.4` y Caddy
  `2.11.4` instalado.
- **Release activo:** `6ddc5a1aab2e36765385cadc3ffb80ae7a870108`.
- **SHA-256:**
  `c40531fa179a4f5a00fb9d3a151b2cb4471dfb02353dcb0de3655a105efa73ad`.
- **Proceso:** `srtaller-preview.service` habilitado y activo como usuario no
  privilegiado; Node escucha sólo en `127.0.0.1:3100`.
- **Datos:** tres migraciones aplicadas; seed sintético con un tenant, sucursal,
  estación y binding; smoke creó una reparación sintética con dos eventos de
  historial.
- **Seguridad:** SSH root y password bloqueados; UFW permite únicamente
  22/80/443; PostgreSQL escucha sólo en loopback; `.env` externo con modo
  `0640`; Caddy está deshabilitado y no hay aplicación publicada sin control de
  acceso.
- **Bloqueo restante:** hostname/DNS de preview `TBD`. Sin ese dato no se
  configura Caddy, certificado HTTPS, Basic Auth ni URL navegable externa.

El rollback de aplicación permanece pendiente porque todavía no existe un
release funcional anterior. El intento incompleto anterior se conservó en
cuarentena y no se presentó como candidato válido de rollback.

## Seguridad y alcance preservados

- sólo se usaron fixtures y datos sintéticos de preview;
- no se implementaron usuarios, PIN, sesiones, roles, pagos, caja, inventario,
  WhatsApp, RLS ni integraciones productivas;
- no se tocaron PBI-025–PBI-029, R1, producción ni `main`;
- PR #3 no fue aprobado, modificado ni mergeado;
- DEC-051 C02 continúa pendiente;
- no se imprimieron ni almacenaron secretos.

## Handoff operativo

La siguiente acción requiere definir el hostname/subdominio dedicado de
preview y crear su registro DNS hacia el VPS. Después se debe configurar Caddy
con credenciales externas a Git, validar HTTPS y Basic Auth, ejecutar el smoke
externo y realizar QA visual con datos sintéticos. Hasta entonces el estado
permanece `CONDITIONAL PASS — VS0 VPS READY / EXTERNAL ACCESS BLOCKED`.
