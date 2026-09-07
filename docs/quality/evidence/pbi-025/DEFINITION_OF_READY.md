# PBI-025 — Definition of Ready

## Resultado

**PASS — READY (2026-09-06).** PBI-025 puede ejecutarse localmente bajo el
`Identity Master Goal — Part D` con tamaño `Large` y riesgo `Critical`
preservado. El riesgo Critical es el riesgo de PIN ya conocido, seleccionado y
descrito antes del Goal; Part D cubre expresamente este slice y permite diferir
el reset operacional, y ordena detenerse ante un Critical **nuevo no previsto**.
No se identificó uno.

Este PASS no autoriza release, deploy, secretos productivos ni un PBI ajeno.

## Revisión

| Campo | Resultado |
|---|---|
| Objetivo | PASS — verificar `User + PIN` dentro del Tenant derivado de una Station confiable, sin crear Session ni conceder capability. |
| Alcance | PASS — credencial separada, provisioning local/server-only, verificación, contador/lock y rate limit Station/User. |
| Exclusiones | PASS — sin login HTTP/UI, Session, autorización, comando/superficie operacional de reset o revocación, recovery externo, Vault/KMS o deploy. |
| Dependencias | PASS — PBI-024, PBI-029, PBI-032 y PBI-033 están `Done`; PR #29 merge `d1a98c6d158cf53e1718a75c82f8eafbc3aafaf1`, CI `34084930812` GREEN. |
| Decisiones | PASS — ADR-010/011/012, DEC-005/044/049/050/051/063 y `Identity Master Goal — Part D`. |
| Producto | PASS — selector de User y seis dígitos ASCII; PIN no es identidad global ni autoridad. |
| Criptografía | PASS — Argon2id nativo versionado, salt individual, pepper externo y comparación constante; sin protocolo custom. |
| Abuse controls | PASS — cinco fallos consecutivos, lock cinco minutos y ventana adicional Station/User. |
| Multitenancy | PASS — Tenant/Branch/Station sólo desde `TrustedStationContext`; User y credencial tenant-scoped. |
| Persistencia | PASS — migración aditiva, PostgreSQL 18.4 material y rollback/reapply requeridos. |
| Concurrencia | PASS — provisioning idempotente y carreras de intentos/lock incluidas. |
| Error público | PASS — inexistente, inactivo, revocado, sin credencial y wrong PIN colapsan a una denegación genérica. |
| Estimación | PASS — `Large`, por KDF, persistencia, concurrencia, configuración y pruebas materiales. |
| Riesgo | PASS — `Critical`, sin downgrade; revisión focalizada Critical obligatoria. |
| Sprint/WIP | PASS — Sprint 01 cerrado; Sprint 02 activo; PBI-025 único PBI actual, WIP 1/1. |
| Pregunta Owner nueva | Ninguna. |

## Evidencia requerida antes de review

- unit/integration tests de formato, KDF, redacción y prueba efímera;
- PostgreSQL material para migración, tenant/Station isolation, lock,
  concurrencia, replay e idempotencia;
- `SR_PIN_PEPPER` server-only, fail-closed y ausente de navegador/log/evidence;
- arquitectura DEC-005, typecheck, build, `pnpm run verify`, secret scan y
  `git diff --check`;
- Draft PR CLEAN/MERGEABLE y CI run-1/run-2/comparison GREEN en el HEAD exacto.

## Límite

Autenticación satisfactoria produce sólo una prueba efímera no fabricable.
PBI-034 debe consumirla y volver a validar contexto/estado antes de crear una
Operational Session. PBI-026 conserva la decisión deny-by-default.
