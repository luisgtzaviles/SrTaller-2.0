# PBI-023 — Instalación gobernada de dependencias

## Resultado

**PASS — PBI-023 EXACT DEPENDENCIES INSTALLED**

- **Fecha local:** 2026-07-24.
- **Rama:** `r0/pbi-023-persistence-planning`.
- **Commit base:** `c794bff292670ae643bce0ae7b099ab5a4ce7db1`.
- **Paso ejecutado:** Paso 4 exclusivamente.
- **Estado PBI-023:** `Ready — exact persistence dependencies installed /
  typed configuration authorized`.

Las dependencias aprobadas quedaron fijadas sin rangos:

| Ubicación | Paquete |
|---|---|
| `dependencies` | `kysely@0.29.4` |
| `dependencies` | `pg@8.22.0` |
| `devDependencies` | `@types/pg@8.20.0` |

El cambio técnico se limita a `package.json` y `pnpm-lock.yaml`. No existe
import productivo, configuración de base, conexión, pool, instancia Kysely,
SQL, migración, tabla, port, adapter o repository.

## Evidencia

| Documento | Contenido |
|---|---|
| [PACKAGE_METADATA.md](PACKAGE_METADATA.md) | metadata autoritativa, engines e integridades |
| [DEPENDENCY_GRAPH.md](DEPENDENCY_GRAPH.md) | cierre transitivo y versiones únicas |
| [LIFECYCLE_SCRIPTS.md](LIFECYCLE_SCRIPTS.md) | scripts, binarios y builds |
| [SUPPLY_CHAIN_REVIEW.md](SUPPLY_CHAIN_REVIEW.md) | auditoría, licencias y riesgos |
| [FROZEN_INSTALL.md](FROZEN_INSTALL.md) | dos reinstalaciones limpias y hashes |
| [COMPATIBILITY.md](COMPATIBILITY.md) | ESM, NodeNext, toolchain y checker |
| [TRACEABILITY_MATRIX.md](TRACEABILITY_MATRIX.md) | requisito a evidencia |
| [RESULTS.md](RESULTS.md) | checklist y dictamen |
| [EVIDENCE_MANIFEST.json](EVIDENCE_MANIFEST.json) | manifest machine-readable |

## Límites preservados

- DEC050-C01 recibe evidencia parcial de selección, lock y compatibilidad; no
  queda cerrada porque runtime, migrador y PostgreSQL CI siguen pendientes.
- DEC051-C03/C04 y las condiciones runtime de DEC-063 no cambian.
- El PR #2 debe permanecer Draft.
- No se autoriza el Paso 5 por este documento; sólo queda como siguiente tarea
  autorizable mediante un mandato separado.
