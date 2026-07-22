# DEC-004 — Revisión formal y dictamen del contrato de toolchain

## Resultado

**PASS — ACCEPTED, SELECTION APPROVED / EVIDENCE PENDING**

La autoridad efectiva aprobó la selección arquitectónica, otorgó los vistos buenos requeridos y autorizó crear el PBI de materialización/verificación. La aprobación no afirma que exista implementación, ejecución o reproducibilidad demostrada.

## Dictamen explícito

- **Fecha:** 2026-07-22.
- **Autoridad:** Luis Antonio Gutiérrez Avilés, responsable del proyecto SR Taller 2.0.
- **Funciones decisorias representadas:** Arquitectura + Ingeniería, conjuntamente.
- **Vistos buenos otorgados:** Seguridad, Operaciones y Calidad.
- **Alcance:** selección arquitectónica del contrato de toolchain reproducible.
- **Autorización:** creación del PBI de materialización y verificación.

La autoridad declara que aprueba conjuntamente, desde Arquitectura e Ingeniería, el contrato técnico propuesto para DEC-004. Después de revisar sus riesgos y condiciones, también otorga los vistos buenos desde Seguridad, Operaciones y Calidad.

La autoridad declara expresamente que esta aprobación **no** significa que el toolchain esté implementado, que la instalación o el build reproducibles se hayan ejecutado, que exista evidencia autoritativa Linux o que DEC-004 esté verificada en runtime.

## Participantes y autoridad efectiva

| Rol | Dictamen registrado | Alcance |
| --- | --- | --- |
| Arquitectura | APROBADO | Coherencia normativa, módulos, runtime y evolución |
| Ingeniería | APROBADO | Compatibilidad, versiones, tooling y mantenibilidad |
| Seguridad | VISTO BUENO | Supply chain, scripts, allowlist, procedencia y secretos |
| Operaciones | VISTO BUENO | Linux, lifecycle, artefacto y actualización |
| Calidad | VISTO BUENO | Casos negativos, repetibilidad y evidencia VC-001 a VC-024 |

Luis Antonio Gutiérrez Avilés es la única persona registrada en este dictamen. Las funciones y perspectivas no se presentan como firmas o autoridades adicionales.

## Forma de registro

El repositorio registra las aprobaciones dentro del documento canónico y del expediente de revisión, como ocurre con los ADR aceptados. Por ello no se crea `APPROVAL_RECORD.md`: este documento contiene todos los campos exigidos y el [registro canónico](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md) conserva estado, autoridad, fecha, condiciones y trazabilidad.

## Documentos revisados

### Expediente principal

- [Propuesta de decisión](DECISION_PROPOSAL.md).
- [Análisis de opciones](OPTIONS_ANALYSIS.md).
- [Contrato de verificación](VERIFICATION_CONTRACT.md).
- [Análisis de impacto](IMPACT_ANALYSIS.md).
- [Resultado](RESULTS.md).

### Contexto y dependencias

- [Intento de baseline](../../architecture-readiness/dec-004-executable-baseline/IMPLEMENTATION.md) y su [resultado](../../architecture-readiness/dec-004-executable-baseline/RESULTS.md).
- [Mapa de dependencias](../../architecture-readiness/dec-004-governance-unblocking/DEPENDENCY_MAP.md).
- [Vacíos de gobierno](../../architecture-readiness/dec-004-governance-unblocking/GOVERNANCE_GAPS.md).
- [Orden de resolución](../../architecture-readiness/dec-004-governance-unblocking/RESOLUTION_ORDER.md).
- [Inventario de bloqueantes](../../architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md).
- [Secuencia oficial](../../architecture-readiness/blocker-closure/SECUENCIA_DE_DECISIONES.md).

### Decisiones y políticas relacionadas

- [ADR-001](../proposed/ADR-001-typescript-as-primary-language.md), [ADR-002](../proposed/ADR-002-modular-monolith-first.md), [ADR-003](../proposed/ADR-003-postgresql-primary-database.md), [ADR-004](../proposed/ADR-004-shared-schema-multitenancy.md), [ADR-005](../proposed/ADR-005-nestjs-backend.md) y [ADR-009](../proposed/ADR-009-monorepo-strategy.md), todos `Accepted`.
- [Estrategia de despliegue](../../architecture/DEPLOYMENT_STRATEGY.md).
- [Baseline de seguridad](../../architecture/SECURITY_BASELINE.md).
- [Estrategia de pruebas](../../quality/TESTING_STRATEGY.md).
- [Pruebas de seguridad](../../quality/SECURITY_TESTING.md).
- [Definition of Done](../../delivery/DEFINITION_OF_DONE.md).

## Confirmación de compatibilidad

No se identificó contradicción material con decisiones `Accepted`:

- ADR-001 fija TypeScript y Node.js `24.x`; DEC-004 concreta versiones y toolchain.
- ADR-002 y ADR-009 conservan una aplicación/artefacto y no permiten workspaces anticipatorios.
- ADR-003 conserva PostgreSQL `18.x`; DEC-004 no selecciona driver ni migrador.
- ADR-004 conserva aislamiento multitenant; esta aceptación no lo implementa.
- ADR-005 conserva NestJS `11.x`, Express y REST mínima; la compatibilidad efectiva sigue pendiente.
- ADR-007 permanece `Proposed`; Linux autoritativo no acepta contenedores o CI/CD.

## Matriz de elecciones aprobadas

| # | Elección | Alternativas | Resolución aprobada | Condición principal |
| ---: | --- | --- | --- | --- |
| 1 | Package manager | pnpm / npm / Yarn | pnpm `11.15.1` exacto | npm y Yarn no son autoritativos |
| 2 | Node.js | Pin exacto / rango `24.x` | `24.18.0` exacto | Pins coherentes y fail-fast |
| 3 | TypeScript | `6.x` / `7.x` | `6.0.3` exacta | TypeScript 7 requiere revisión y evidencia futura |
| 4 | Módulos | ESM / CommonJS | ESM nativo con NodeNext | CommonJS exige excepción y revisión arquitectónica |
| 5 | Desarrollo | `tsc --watch` / runtime TS directo | `tsc --watch` y ejecución del JavaScript emitido | Otro runtime TS requiere decisión posterior |
| 6 | Producción | JS compilado / TS directo | Sólo JavaScript compilado desde `dist/` | TypeScript directo queda prohibido |
| 7 | Scripts de dependencias | Bloqueo / allowlist / default | Bloqueo por defecto con allowlist explícita | Excepción mínima, justificada, revisada y versionada |
| 8 | Plataforma | Linux glibc / macOS / otra | Linux x86_64/glibc autoritativo | macOS no constituye evidencia final |
| 9 | Estado | Accepted / abierto / completado | `Accepted — Selection Approved / Evidence Pending` | No usar estados de cumplimiento antes de verificar |

## Contrato aprobado

### Runtime y pinning

- Node.js `24.18.0` exacto.
- `.nvmrc`, `.node-version`, `package.json#engines.node`, runner Linux y comprobación fail-fast deberán coincidir.
- Una versión incompatible deberá fallar temprano antes de instalar, compilar o iniciar.
- Patch dentro de `24.x` requiere revisión técnica documentada; minor requiere revisión formal de baseline; major o runtime distinto requiere el gobierno de ADR-001.

### Gestor, lockfile e instalación

- pnpm `11.15.1` exacto mediante `packageManager`, mecanismo compatible y fail-fast.
- `pnpm-lock.yaml` como único lockfile.
- `pnpm install --frozen-lockfile` como instalación canónica.
- Lockfile ausente, inconsistente o desactualizado deberá fallar sin regeneración silenciosa.

### Módulos, TypeScript y ejecución

- ESM nativo, `type: module`, `module: NodeNext` y `moduleResolution: NodeNext`.
- TypeScript `6.0.3` exacta, local, estricta y con type checking independiente.
- Desarrollo mediante `tsc --watch` y ejecución del JavaScript emitido.
- Producción mediante compilación previa con `tsc` y JavaScript de `dist/` únicamente.
- Ejecución directa de TypeScript en producción prohibida.

### Scripts y supply chain

- Scripts independientes del IDE para clean, preflight/instalación, build, typecheck, test, start, watch y verificación integral.
- Scripts de dependencias bloqueados por defecto.
- Allowlist explícita, mínima, revisada, justificada y versionada; cada entrada identifica dependencia, necesidad, riesgo y revisión.

### Plataforma

- Linux x86_64/glibc es la plataforma autoritativa inicial para instalación, typecheck, build, pruebas y ejecución del artefacto.
- macOS es desarrollo permitido y evidencia no concluyente.
- Linux ARM64 u otra plataforma requiere validación adicional.

## Objeciones resueltas

| Perspectiva | Objeción | Resolución aceptada |
| --- | --- | --- |
| Arquitectura | pnpm podría implicar workspaces | El gestor no autoriza workspaces ni proyectos adicionales |
| Ingeniería | Compile-watch puede añadir latencia | Se acepta inicialmente; cualquier sustitución requiere evidencia y decisión |
| Seguridad | Lifecycle scripts ejecutan código de terceros | Bloqueo por defecto y allowlist gobernada |
| Operaciones | Linux glibc puede diferir del destino futuro | Autoridad inicial; cualquier destino distinto se revalida |
| Calidad | No existe evidencia técnica | La evidencia permanece pendiente y es condición de verificación, no de selección |

## Riesgos aceptados

La autoridad acepta para la selección, con mitigaciones obligatorias:

- mantenimiento atómico de varios pins;
- bootstrap adicional de pnpm;
- fricción ESM/CommonJS y compatibilidad todavía no demostrada con NestJS;
- mayor latencia potencial de compile-watch;
- compatibilidad aún no demostrada de TypeScript `6.0.3` con la combinación completa;
- alcance inicial limitado a Linux x86_64/glibc;
- riesgo de exposición por source maps, mitigado con maps externos sin sources inline y acceso restringido;
- riesgo de scripts de terceros, mitigado por bloqueo y allowlist.

Aceptar estos riesgos no convierte un fallo futuro en válido. Una señal material activa remediación, reapertura o sustitución.

## Condiciones impuestas

1. `Accepted` se limita a selección arquitectónica.
2. La implementación y la evidencia permanecen pendientes.
3. No se declarará reproducibilidad hasta completar la matriz VC-001 a VC-024 aplicable en Linux.
4. El PBI autorizado se limita a materialización y verificación del toolchain.
5. No se reutilizará SPIKE-009 como scaffold.
6. No se introducirán funcionalidad de dominio, autenticación, multitenancy, persistencia, SQL, migraciones ni módulos de negocio.
7. DEC-005, DEC-044, DEC-049, DEC-050, DEC-051 y DEC-063 conservan estado y autoridad propios.

## Evidencia pendiente

- archivos ejecutables del toolchain;
- instalación frozen desde checkout limpio;
- typecheck, build, test y start;
- ejecución exclusiva desde `dist/`;
- rechazo de versiones y lockfiles incompatibles;
- ausencia de dependencias globales implícitas;
- bloqueo/allowlist de scripts;
- dos ejecuciones limpias comparables;
- hashes de `dist/`;
- evidencia Linux x86_64/glibc;
- integración posterior en CI.

## Autorización de materialización

**AUTORIZADA.** Puede crearse un PBI separado para materializar el contrato, ejecutar la verificación y obtener evidencia Linux. Esta autorización no habilita implementación funcional de SR Taller 2.0.

## Conclusión

DEC-004 cambia a `Accepted — Selection Approved / Evidence Pending`. La selección técnica es normativa; el cumplimiento técnico no está demostrado. La siguiente acción es crear el PBI autorizado y mantener el estado `Evidence Pending` hasta que la evidencia sea ejecutada y revisada.
