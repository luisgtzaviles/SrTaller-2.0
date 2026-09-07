# PBI-034 — Definition of Ready

## Resultado

**PASS — READY (2026-09-07).** PBI-034 puede ejecutarse localmente bajo el
`Identity Master Goal`, con tamaño `Large` y riesgo `Critical` preservado. El
riesgo Critical corresponde a la Session/identity ya prevista por el Goal; no
se identificó un Critical nuevo inesperado.

Este PASS no autoriza release, deploy, PBI-026 ni infraestructura remota.

## Revisión

| Campo | Resultado |
|---|---|
| Objetivo | PASS — mantener actor atribuible dentro de Trusted Station Context después de PIN válido. |
| Alcance | PASS — start/resolve/touch/logout/switch, persistencia, cookies seguras y gate visible local. |
| Exclusiones | PASS — sin autorización de negocio, audit/correlation, Station administration, Users/Roles/PIN administration, release o deploy. |
| Dependencias | PASS — PBI-024/029/032/033/025 `Done`; PR #32 merge `ccdd7e243265c0f4d19e9798b8ddfa90d97e8c9e`, exact-main CI `34124746317` GREEN. |
| Decisiones | PASS — ADR-010/011/012, DEC-005/044/049/050/051/063, Master Goal y Option A dirigida aprobada. |
| Context authority | PASS — Tenant/Branch/Station sólo desde credencial de Station verificada server-side. |
| Actor authority | PASS — User activo, assignment aplicable y PIN credential/version se revalidan al resolver. |
| Transporte | PASS — cookie opaca HttpOnly/Strict/host-only, CSRF+Origin, no-store, sin JWT/localStorage/token JSON. |
| Persistencia | PASS — Access-owned, una activa por Station, guard transaccional, estados/versiones y migración aditiva. |
| Tiempo | PASS — idle 60 minutos, absolute 12 horas y reloj controlado. |
| Concurrencia | PASS — start/touch/logout/switch deterministas; switch fallido conserva la Session anterior. |
| Error público | PASS — fallos de autenticación/resolución genéricos y sanitizados. |
| UI | PASS — login, reload, actor activo, logout/switch, Light/Dark, focus y responsive básico. |
| Estimación | PASS — `Large`. |
| Riesgo | PASS — `Critical`, sin downgrade; focused Critical-risk review obligatorio. |
| Sprint/WIP | PASS — SPRINT-02 activo; PBI-034 único PBI actual; WIP `1/1`. |
| Pregunta Owner nueva | Ninguna. |

## Evidencia requerida antes de Owner Review

- pruebas application/contract de token, proof, cookies, CSRF, errores y
  superficies públicas;
- PostgreSQL 18.4 material: migración up/down/reapply, constraints,
  aislamiento, idempotencia, concurrencia, expiry, switch y revocaciones;
- validación local del gate/actor, reload, logout/switch, Light/Dark,
  390/768/1024/1280+ y keyboard/focus;
- DEC-005 Option A con checker y mutaciones negativas;
- typecheck, build, `pnpm run verify`, secret scan y `git diff --check`;
- Draft PR CLEAN/MERGEABLE y CI run-1/run-2/comparison GREEN en el HEAD exacto.

## Límite

La Session autentica y atribuye. No concede una acción de negocio; PBI-026
conserva la decisión contextual deny-by-default y PBI-028 la auditoría.
