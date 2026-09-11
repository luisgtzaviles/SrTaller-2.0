# SR Taller 2.0 — Current State

## Estado del documento

- **Estado:** Snapshot de baseline integrada más PBI-039 en PR #42;
  Authoritative CI `PASS`; revisión independiente `CHANGES REQUIRED` y
  remediación en curso.
- **Baseline Git integrada observada:** `main` y `origin/main` local en
  `94065dfedc55234fd1738a6674289278aa49d224`, merge documental PR #41.
- **Última baseline de producto con CI autoritativo registrada:**
  `5973f355a5e9dfc7ae562a688ded04e7eba8bc34`, run `34280510716`, `SUCCESS`;
  VC-024 run-1, run-2 y comparison verdes.
- **PBI-039 local:** branch `feature/pbi-039-customer-minimum-new-repair` sobre
  `94065dfedc55234fd1738a6674289278aa49d224`, con candidato funcional y de
  infraestructura en `8b1d91efeafe58c7b56e7b7af2a955d39d635c10`;
  `FUNCTIONAL SLICE FROZEN — OWNER ACCEPTED`, Formal UI Verification `PASS` y
  Hardening Batch 1 `PASS` y Full Verification local `PASS` sobre el candidate
  fingerprint registrado. CI / PR Readiness es PASS, el PR #42 está abierto y
  la campaña autoritativa final `34564110272` sobre `f32f41d…` está verde. La
  revisión independiente encontró un finding HIGH de idempotencia Create
  Repair y uno MEDIUM documental; la remediación está autorizada y el
  candidato aún no está integrado.
- **Freshness remota:** `git fetch --prune origin` ejecutado el 2026-09-10;
  `origin/main` observado en `94065dfedc55234fd1738a6674289278aa49d224`.
- **Regla:** este documento describe estado; no autoriza implementación,
  merge, release, deploy, migración ni infraestructura.

## Resumen ejecutivo

La foundation técnica y el Repair Workstream permanecen integrados en `main`.
SPRINT-01 está cerrado; SPRINT-02 sigue activo. PBI-025, PBI-034 y PBI-026
están `Done` y G3/G4 están `PASS`; ninguno está `Released`.

PBI-028 está `Done` tras PR #37 y su cierre documental PR #39: Operational Note obtiene
actor y contexto reales server-side, y su business audit/correlation mínimo es
atómico, append-only y libre de secretos. PR #38 corrigió el único defecto UX
post-integración conocido: el campo PIN controlado ya no pierde foco al cambiar
de estado. Owner Acceptance fue otorgada. PR #39 fue integrado y su CI exacto
de `main` dejó PBI-028 como `Done` y G5 como `PASS`; `Released: NO`.

PBI-037 es el slice de administración Users & Roles autorizado por Owner y
materializado dentro del checkpoint PBI-028. No es un segundo PBI actual ni
tiene un lifecycle `Done` independiente: no reabre PBI-032/PBI-033.

PBI-038 está `Done` efectivo: PR #40 integró la Timezone Foundation en `main`
sin reabrir PBI-027 ni introducir una capacidad de producto distinta. Su
exact-main CI está verde. `Released: NO`; no se autorizó deploy.

PBI-039 — Customer Minimum + New Repair Classic 2.0 / Guided V2 — completó su
construcción Functional First, obtuvo aceptación Owner del slice
congelado, Formal UI Verification `PASS`, Hardening Batch 1 `PASS` y
Authoritative Full Verification local `PASS` y CI / PR Readiness `PASS`. El
candidato está comprometido y publicado. El PR #42 y su CI autoritativa final
están verdes, pero la revisión independiente concluyó `CHANGES REQUIRED`; la
remediación actual no declara merge, release ni deploy.

La campaña autoritativa `local-full-verification-20260911031648-94065dfedc55`
ejecutó los 12 stages de `verify:full` sobre el candidato
`034d3ffec64f5d2fc20d6cfd3cb4a56da6d1e8db7d36a53b23af239846b26948`.
Los fingerprints before/after fueron idénticos, cleanup terminó `PASS` y la
evidencia JSON quedó fuera del repositorio. La reconciliación documental
posterior registra el resultado sin afirmar que ese WIP esté integrado.

La remediación de delivery se comprometió en
`8b1d91efeafe58c7b56e7b7af2a955d39d635c10`. Dos campañas completas sobre ese
SHA —`local-full-verification-20260911034235-8b1d91efeafe` y
`local-full-verification-20260911034650-8b1d91efeafe`— terminaron 12/12 PASS con
la misma huella `d8737807d57fc76c91efafa3176581b3406c0930b79a4243ab57f100697c2f14`.
El PR #42 ejecutó primero la campaña autoritativa `34562890493` sobre head
`80c49150b24ec027be03dc1e5c1d104a286dd672`. La reconciliación documental
posterior quedó validada por la campaña final `34564110272` sobre head
`f32f41dfc5ef8b78b6954c4829d5b286bc359add` y merge ref
`7944f73206dc1f236fa599461728aa00249d8df9`: run-1, run-2 y comparison
terminaron `SUCCESS`. La revisión independiente de ese head quedó registrada
como `CHANGES REQUIRED`; no se reutilizará esa CI para el candidato remediado.

## Git y CI

| Hecho | Estado |
|---|---|
| Baseline Git integrada observada | `main` / `origin/main` local en `94065dfedc55234fd1738a6674289278aa49d224` |
| Última baseline de producto con CI registrada | `5973f355a5e9dfc7ae562a688ded04e7eba8bc34` |
| Branch PBI-039 | `feature/pbi-039-customer-minimum-new-repair` |
| Divergencia branch / `origin/main` antes de remediación | `0/4`; PR head `f32f41dfc5ef8b78b6954c4829d5b286bc359add` |
| Working tree pre-remediación | 92 tracked modificados + 105 untracked = 197 entradas al inicio del checkpoint |
| Working tree durante la campaña | 98 tracked modificados + 115 untracked = 213 entradas; fingerprint autoritativo `034d3ffe…` |
| Delta posterior a la campaña | Sólo `PBI-039.md`, `ACTIVE_CHECKLIST.md` y `CURRENT_STATE.md` para registrar el dictamen; ninguna fuente de producto, test, migración o infraestructura cambió después del PASS |
| Escala observada antes del cierre documental | tracked `+9,530/-621`; untracked `11,164` líneas |
| Candidato coherente verificado | `8b1d91efeafe58c7b56e7b7af2a955d39d635c10`; árbol limpio, 0 tracked pendientes, 0 untracked |
| Full Verification del candidato Git | Dos campañas 12/12 PASS; fingerprint `d8737807…` idéntico before/after |
| Cobertura CI PBI-039 preparada | Customer phone + User preferences en run-1/run-2, schema evidence 3 y comparación semántica fail-closed |
| PR PBI-039 | [#42](https://github.com/luisgtzaviles/SrTaller-2.0/pull/42), abierto contra `main`, mergeable |
| CI PBI-039 final antes de review | Run `34564110272` SUCCESS sobre `f32f41d…`; run-1 `103152586085`, run-2 `103152585891`, comparison `103156077697` |
| Independent review | `CHANGES REQUIRED` sobre `f32f41d…`: HIGH idempotencia Create Repair + MEDIUM documentación viva |
| Review remediation | En curso; la evidencia anterior no valida el nuevo candidato hasta completar Full Verification y CI exacta |
| Migraciones locales | 51 archivos / 51 aplicadas / 0 pendientes / 0 huérfanas / 0 timestamps duplicados; 20 introducidas por PBI-039 |
| Toolchain | Node `24.18.0` y pnpm `11.15.1`; `scripts/pnpm-governed` resuelve los pins del repositorio y rechaza/bypassea el Node ambiental `25.9.0` |
| PR #37 funcional | merge ordinario `ab8e8ba9a1274030e27ad920d61c66ed461bf122` |
| CI exacta de PR #37 en `main` | `34193770228` SUCCESS; run-1/run-2/comparison GREEN |
| PR #38 remediación PIN focus | merge ordinario `a9bb0744ebf8b32b91a9ddf90f67570830182afc` |
| CI exacta de PR #38 en `main` | `34197268832` SUCCESS; run-1/run-2/comparison GREEN |
| PR #39 cierre canónico PBI-028 | merge ordinario `2b712fc3a3842f197324e8870011bf170846ddb8` |
| CI exacta de PR #39 en `main` | `34249869167` SUCCESS; run-1/run-2/comparison GREEN |
| PR #40 Timezone Foundation | merge ordinario `5973f355a5e9dfc7ae562a688ded04e7eba8bc34` del candidato `798e0060e910562cd227824be8949876725a5ee4` |
| CI exacta de PR #40 en `main` | `34280510716` SUCCESS; run-1 `102243846790`, run-2 `102243847051` y comparison `102247925801` GREEN |

## Capacidades integradas relevantes

- Trusted Station Context, Users, Roles, catálogo de capabilities, PIN,
  Operational Session y autorización contextual server-side.
- Repairs Worklist/Detail y Operational Note append-only.
- `repairs.add_note` deriva actor, Tenant, Branch, Station y Session de la
  autoridad server-side; timeline y business audit se confirman en la misma
  transacción.
- Correlation UUID es generado por servidor en éxitos y errores; permanece
  separado de `clientRequestId` y no es elegido por frontend.
- Configuración → Roles y Usuarios permite administración local de Roles,
  Users, lifecycle y PIN sin permisos directos por User ni PIN plaintext.

## PBI-039 — PR review remediation

El WIP local materializa Customer Minimum, New Repair Classic/Guided,
preferencia personal, policy Branch, catálogos de Risks/Device Types/Brands/
Models/Problem Categories, normalización, autorización contextual, create
idempotente, post-create y las superficies actuales de Repair Detail. El Owner
aceptó el comportamiento y la arquitectura de información actuales. Repair
Detail Evidence permanece read-only y suficiente para este PBI; Basic
Operational Evidence y la funcionalidad comercial de Conceptos están
explícitamente diferidas.

Formal UI Verification terminó en `PASS — READY FOR HARDENING`. Hardening Batch
1 corrigió el acceso determinista al toolchain, expectativas antiguas de
migraciones/schema, fixtures D5-R045 y la contaminación del runner PostgreSQL.
La campaña previa ejecutó el gate base con 798 tests: 779 PASS, 0 fail y 19
skips PostgreSQL inventariados; después materializó esos skips como 17 tests
del composite y 2 tests PBI-039, todos PASS y sin skips. Preview-like runtime
aplicó 51 migraciones desde vacío, dejó 0 pendientes y probó readiness
200/503/200. Backend compilado y UI smoke pasaron; cleanup dejó 0 recursos
gobernados. El warning Vite actual de 531.33 kB / 147.52 kB gzip queda
aceptado para medición posterior.

CI / PR Readiness incorporó los dos contratos PostgreSQL PBI-039 a ambos jobs
independientes, añadió manifiesto sanitizado/vinculado, comparación semántica y
cleanup gobernado compartido sin absorberlos en PBI-023. Dos nuevas campañas
del commit `8b1d91e…` ejecutaron cada una 802 tests base: 783 PASS, 0 fail y 19
skips esperados, seguidos por 17 + 2 pruebas PostgreSQL materiales, Preview-like
runtime, smoke y cleanup; ambas terminaron PASS con fingerprint idéntico.

La revisión independiente del PR #42 no reabrió producto: detectó que
`canonicalDeviceTypeId`, aunque se validaba y persistía, faltaba en la huella
durable de Create Repair. También detectó que Roadmap, workflow y documentos de
SPRINT-02 conservaban gates anteriores. La remediación agrega la identidad
canónica al fingerprint, preserva conflicto ante payload incompatible y amplía
la prueba PostgreSQL real para replay exacto, cambio de tipo canónico y creación
concurrente con una sola Repair/command/timeline/audit. La reverificación de
riesgo alto terminó PASS en la campaña
`local-full-verification-20260911054515-f32f41dfc5ef`: 12/12 stages, candidate
fingerprint `c1f8273aa94ad362cdd6e73ddabe83e3f5eb03ebe99c14fa06e5f54778ca1513`
idéntico before/after, PostgreSQL 17 + 2 material, Preview-like, smoke y cleanup
PASS. Esta actualización documental es posterior a esa huella. La CI exacta
del nuevo head sigue siendo obligatoria antes de re-review.

## Límites vigentes

- El audit de PBI-028 está acotado a `repairs.add_note`; no hay query/export UI,
  observabilidad extendida ni retrofit de todos los writes de Repairs.
- PBI-037 no convierte la administración local en un módulo IAM genérico ni
  reabre foundations ya cerradas.
- Customers y New Repair persistente existen sólo en el WIP local congelado de
  PBI-039; todavía no están integrados en Git/CI. Pricing, Payments, Inventory,
  Delivery, Basic Operational Evidence, Repair Concepts funcional y Diagnosis
  ampliado permanecen diferidos o fuera de alcance.
- Preview remoto, Dokploy, PostgreSQL remoto, DNS, secretos e infraestructura
  no fueron modificados. Production no está materializada.

## Roadmap y WIP

| Elemento | Estado vigente |
|---|---|
| Sprint activo | SPRINT-02 — Operational Authentication & Authorization |
| Current PBI | `PBI-039` — PR #42 / review remediation; In progress |
| WIP | `1/1` |
| PBI-028 | `Done`; `Released: NO` |
| G5 AUDIT | `PASS` |
| PBI-037 | Slice integrado y trazable dentro de PBI-028; sin lifecycle independiente |
| PBI-038 | `Done`; `Released: NO`; `Branch.timeZone: America/Hermosillo`; UTC storage invariant `PASS` |
| Next candidate | `NONE` — no se seleccionó trabajo posterior |
| Formal UI Verification | `PASS — READY FOR HARDENING` |
| Next PBI-039 gate | High-risk Full Verification, exact-head CI and independent re-review |
| Hardening / orchestration / full verify / readiness / CI | PASS / PASS / PASS / PASS / PASS |
| PR / merge / deploy | #42 open / not authorized / not authorized |

## Próxima acción

Completar la remediación, ejecutar Full Verification de riesgo alto, publicar
sin force push y exigir CI autoritativa exacta antes de re-review. La CI previa
no autoriza merge; no ejecutar merge, release, deploy ni iniciar otro PBI.
