# DEC-004 — Resultado del dictamen formal

## Resultado

**PASS — ACCEPTED, SELECTION APPROVED / EVIDENCE PENDING**

La autoridad efectiva aprobó la selección arquitectónica del contrato de toolchain, otorgó los vistos buenos requeridos y autorizó crear su PBI de materialización y verificación. La implementación no existe todavía, la reproducibilidad no fue demostrada y la evidencia autoritativa Linux continúa pendiente.

## Estado anterior y estado final

| Campo | Resultado |
| --- | --- |
| Estado anterior | `Abierta — Formal Review Complete / Approval Pending` |
| Estado final | `Accepted — Selection Approved / Evidence Pending` |
| Alcance de `Accepted` | Selección arquitectónica exclusivamente |
| Implementación | No creada |
| Verificación runtime | No ejecutada |
| Reproducibilidad | No demostrada |
| Evidencia Linux | Pendiente |
| PBI de materialización/verificación | Autorizado |

DEC-004 no se marca como `Implemented`, `Verified`, `Complete`, `Closed` ni `Reproducibility Proven`.

## Autoridad y vistos buenos registrados

- **Fecha:** 2026-07-22.
- **Autoridad efectiva:** Luis Antonio Gutiérrez Avilés, responsable del proyecto SR Taller 2.0.
- **Aprobación conjunta:** funciones de Arquitectura + Ingeniería.
- **Vistos buenos:** perspectivas de Seguridad, Operaciones y Calidad.

No se inventaron identidades, firmas ni autoridades adicionales. El [dictamen formal](FORMAL_REVIEW.md) y el [registro canónico](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md) contienen fecha, autoridad, funciones, alcance, condiciones y trazabilidad. El gobierno documental observado no exige un archivo separado, por lo que no se creó `APPROVAL_RECORD.md`.

## Contrato aprobado

| Área | Selección normativa |
| --- | --- |
| Runtime | Node.js `24.18.0` exacto, pins coherentes y fallo temprano ante versión incompatible |
| Package manager | pnpm `11.15.1` exacto mediante `packageManager` y mecanismos compatibles |
| Lockfile | Sólo `pnpm-lock.yaml` |
| Instalación | `pnpm install --frozen-lockfile`; inconsistencia falla sin regeneración silenciosa |
| Módulos | ESM nativo con `module: NodeNext` y `moduleResolution: NodeNext` |
| TypeScript | `6.0.3` exacta, local, estricta y con typecheck independiente |
| Desarrollo | `tsc --watch` y ejecución del JavaScript emitido |
| Producción | Compilación previa y ejecución exclusiva de JavaScript desde `dist/` |
| Scripts | Independientes del IDE para clean, entorno/instalación, build, typecheck, test, start, watch y verificación |
| Supply chain | Scripts de dependencias bloqueados por defecto; allowlist explícita, mínima, revisada, justificada y versionada |
| Plataforma autoritativa | Linux x86_64/glibc; macOS sólo como entorno de desarrollo no concluyente |

npm y Yarn no son gestores autoritativos. CommonJS requiere excepción documentada y revisión arquitectónica. TypeScript directo en producción queda prohibido. Linux ARM64 u otra plataforma requieren validación adicional.

## Alternativas no seleccionadas

- npm o Yarn como gestor inicial autoritativo;
- rangos mutables o dist-tags para las herramientas fijadas;
- varios lockfiles o regeneración silenciosa;
- TypeScript `7.x` sin revisión y evidencia futuras;
- CommonJS como baseline inicial;
- runtime directo de TypeScript como dependencia arquitectónica de desarrollo;
- ejecución directa de TypeScript en producción;
- scripts de dependencias habilitados por defecto;
- macOS como evidencia final de reproducibilidad;
- estados de cumplimiento antes de ejecutar la verificación.

## Condiciones y riesgos aceptados

La autoridad acepta para la selección, con mitigaciones obligatorias:

- mantenimiento atómico de los pins;
- bootstrap adicional de pnpm;
- posible fricción entre ESM, CommonJS, NestJS y TypeScript;
- latencia potencial de compile-watch;
- compatibilidad todavía no demostrada de TypeScript `6.0.3` con la combinación completa;
- alcance inicial limitado a Linux x86_64/glibc;
- exposición potencial mediante source maps, mitigada con maps externos sin fuentes inline y acceso restringido;
- ejecución de código de terceros, mitigada mediante bloqueo de scripts y allowlist gobernada.

Las condiciones obligatorias son:

1. `Accepted` sólo expresa selección arquitectónica.
2. Materialización, ejecución y evidencia permanecen pendientes.
3. No se declarará reproducibilidad antes de completar satisfactoriamente el contrato VC-001 a VC-024 aplicable sobre Linux.
4. El PBI autorizado se limita al toolchain y su verificación.
5. SPIKE-009 no se reutilizará como scaffold.
6. No se introducirá funcionalidad de dominio, autenticación, multitenancy, persistencia, SQL, migraciones ni módulos de negocio.
7. DEC-005, DEC-044, DEC-049, DEC-050, DEC-051 y DEC-063 conservan estado, alcance y proceso propios.

## Evidencia pendiente

No se ejecutó ni demostró:

- creación de los archivos ejecutables del toolchain;
- instalación limpia con lockfile congelado;
- rechazo de versiones o lockfiles incompatibles;
- ausencia de dependencias globales implícitas;
- bloqueo y allowlist de scripts de dependencias;
- typecheck, build, pruebas o start;
- compatibilidad NestJS `11.1.28` + ESM + TypeScript `6.0.3`;
- ejecución exclusiva del artefacto desde `dist/`;
- repetición desde entornos limpios;
- igualdad de inventario y hashes de dos builds;
- ejecución autoritativa sobre Linux x86_64/glibc;
- integración posterior en CI.

Los casos futuros están definidos en el [contrato de verificación](VERIFICATION_CONTRACT.md). Ningún caso VC-001 a VC-024 se presenta como ejecutado.

## Autorización concedida

**AUTORIZADO:** crear un PBI separado para:

- materializar los archivos mínimos del contrato;
- ejecutar el contrato de verificación;
- obtener evidencia autoritativa Linux;
- registrar resultados y someter la evidencia a revisión.

La autorización no incluye implementación funcional del dominio, autenticación, multitenancy, persistencia o módulos de SR Taller 2.0; tampoco incluye contenedores, proveedor de CI, SQL, migraciones o despliegue.

## Compatibilidad y fronteras

La revisión confirmó compatibilidad documental con ADR-001, ADR-002, ADR-003, ADR-004, ADR-005 y ADR-009. DEC-004 concreta el toolchain sin modificar lenguaje/runtime, forma de aplicación, motor, topología multitenant, shell backend o topología del repositorio.

- DEC-005 conserva estructura, ownership, imports y enforcement.
- DEC-044 conserva taxonomía y adaptación segura de errores.
- DEC-049 conserva acceso a datos, repositories y transacciones.
- DEC-050 conserva migraciones.
- DEC-051 conserva runner, suites, cobertura, proveedor y gates generales.
- DEC-063 conserva Definition of Done y excepciones.
- ADR-007 permanece `Proposed`; Linux autoritativo no acepta contenedores ni CI/CD.

## Documentos actualizados

### Rastreado

- `docs/architecture-readiness/blocker-closure/BLOQUEANTES_DEL_PRIMER_COMMIT.md`
- `docs/architecture-readiness/blocker-closure/CRITERIOS_DE_SALIDA_DE_R0.md`
- `docs/architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md`
- `docs/architecture-readiness/blocker-closure/DEPENDENCIAS_ENTRE_DECISIONES.md`
- `docs/architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md`
- `docs/architecture-readiness/blocker-closure/MAPA_DE_ADRS_REQUERIDOS.md`
- `docs/architecture-readiness/blocker-closure/PLAN_DE_CIERRE.md`
- `docs/architecture-readiness/blocker-closure/README.md`
- `docs/architecture-readiness/blocker-closure/SECUENCIA_DE_DECISIONES.md`
- `docs/architecture-readiness/blocker-closure/TRAZABILIDAD.md`
- `docs/architecture-readiness/repair-mvp/CRITERIOS_DE_INICIO_DE_IMPLEMENTACION.md`
- `docs/architecture-readiness/repair-mvp/ESTADO_DE_PREPARACION_ARQUITECTONICA.md`
- `docs/architecture-readiness/repair-mvp/README.md`
- `docs/architecture-readiness/repair-mvp/TRAZABILIDAD.md`
- `docs/backlog/pbis/PBI-020.md`
- `docs/decisions/proposed/ADR-001-typescript-as-primary-language.md`
- `docs/decisions/proposed/ADR-003-postgresql-primary-database.md`
- `docs/decisions/proposed/ADR-005-nestjs-backend.md`
- `docs/decisions/proposed/ADR-009-monorepo-strategy.md`
- `docs/reviews/sprint-00/ADR_READINESS_MATRIX.md`
- `docs/reviews/sprint-00/DOCUMENT_AUDIT.md`
- `docs/reviews/sprint-00/EXECUTIVE_SUMMARY.md`
- `docs/reviews/sprint-00/PROTOTYPE_CANDIDATES.md`
- `docs/reviews/sprint-00/SPRINT_00_CLOSURE_ASSESSMENT.md`

### No rastreado

- `docs/decisions/dec-004-toolchain-contract/FORMAL_REVIEW.md`
- `docs/decisions/dec-004-toolchain-contract/RESULTS.md`

Los otros cuatro documentos preexistentes del expediente permanecen no rastreados y conservados. También se preservaron sin modificación los directorios de diagnósticos previos y los duplicados preexistentes de SPIKE-009.

## Validaciones documentales

| Validación | Resultado |
| --- | --- |
| Lectura completa de los siete documentos requeridos | PASS |
| Compatibilidad con decisiones `Accepted` | PASS |
| Estado, autoridad y vistos buenos trazables | PASS |
| Contrato, condiciones y evidencia separados | PASS |
| Fronteras DEC-005/044/049/050/051/063 preservadas | PASS |
| Enlaces relativos de los documentos afectados | PASS — 26 archivos |
| Whitespace de rastreados y no rastreados | PASS — 26 archivos |
| Fences Markdown balanceados | PASS — 26 archivos |
| `git diff --check` | PASS |
| Toolchain o pruebas técnicas | NOT RUN — prohibido por alcance |

## Estado Git de referencia

| Campo | Resultado |
| --- | --- |
| Repositorio | `/Users/luisantoniogutierrez/Documents/GitHub/SrTaller-2.0` |
| Rama | `main` |
| HEAD | `6bd9289e31fd382d6c35303f669c2c00ea7ff89f` |
| `origin/main` | `6bd9289e31fd382d6c35303f669c2c00ea7ff89f` |
| Divergencia inicial | `0 0` |
| Working tree inicial | No limpio; cambios previos preservados |

## Siguiente acción exacta

Crear el PBI autorizado de materialización/verificación de DEC-004, limitado al contrato aprobado, y mantener `Evidence Pending` hasta ejecutar y revisar satisfactoriamente VC-001 a VC-024 y la evidencia Linux.

## Restricciones confirmadas

- No se creó implementación, manifiesto, lockfile, pin, `tsconfig`, código, Dockerfile o workflow de CI.
- No se instaló ni cambió Node.js, pnpm o dependencia alguna.
- No se ejecutó build, typecheck, prueba técnica, SQL o migración.
- No se modificó ni reutilizó SPIKE-009.
- No se aceptó ni cerró DEC-005, DEC-044, DEC-049, DEC-050, DEC-051 o DEC-063.
- No hubo commit, push ni deploy.
