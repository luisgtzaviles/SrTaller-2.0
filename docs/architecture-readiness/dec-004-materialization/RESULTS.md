# DEC-004 — Resultado de PBI-021

## Resultado

**CONDITIONAL PASS — DEC-004 MATERIALIZED / EVIDENCE INCOMPLETE**

El baseline técnico fue materializado y validado con resultados positivos en macOS arm64 usando las versiones exactas aceptadas. El resultado no puede ser `PASS` porque no existe evidencia Linux x86_64/glibc, no se ejecutaron dos builds Linux desde el mismo commit candidato limpio, VC-024 espera DEC-051 y faltan las revisiones posteriores de evidencia.

## Resumen

| Área | Resultado |
| --- | --- |
| Node.js `24.18.0` | Materializado y verificado localmente |
| pnpm `11.15.1` | Materializado y verificado localmente |
| TypeScript `6.0.3` | Typecheck/build local exitoso |
| NestJS `11.1.28` + Express | Startup local exitoso |
| ESM/NodeNext | Compilación y startup exitosos |
| `dist/` como runtime | Smoke y paquete sin fuente exitosos |
| Frozen install | Exitoso y sin cambios en entradas técnicas |
| Lifecycle scripts | Fixture no aprobado bloqueado; payload no ejecutado |
| Tests | 5/5 pass |
| Dos builds macOS | Inventario y hashes idénticos |
| Linux x86_64/glibc | Blocked — entorno no disponible/autorizado |
| CI | Pending — DEC-051 no resuelta |
| Funcionalidad de producto | Ninguna introducida |

## Checklist

- [x] Aplicación técnica única en la raíz.
- [x] Sin `pnpm-workspace.yaml` ni workspace anticipatorio.
- [x] Un único `pnpm-lock.yaml` en la raíz del producto.
- [x] Pins exactos de Node.js y pnpm.
- [x] Dependencias directas exactas y sin prereleases.
- [x] ESM nativo y NodeNext.
- [x] TypeScript estricto y typecheck sin emit.
- [x] Build limpio sólo bajo `dist/`.
- [x] Desarrollo mediante `tsc --watch` y JavaScript emitido.
- [x] Producción de prueba exclusivamente desde `dist/main.js`.
- [x] Source maps externos sin fuentes inline.
- [x] Variables técnicas válidas/ausentes verificadas.
- [x] Supply chain con deny-by-default y allowlist gobernada vacía.
- [x] Casos negativos locales ejecutados en copias aisladas.
- [x] Dos builds macOS independientes con hashes iguales.
- [ ] Checkout/commit candidato limpio y versionado.
- [ ] VC-001 a VC-023 en Linux x86_64/glibc.
- [ ] Dos builds Linux independientes con hashes iguales.
- [ ] VC-024 en CI Linux autorizado por DEC-051.
- [ ] Revisión de Arquitectura, Ingeniería, Seguridad, Operaciones y Calidad.

## Matriz final

| VC | Estado | Resultado resumido |
| --- | --- | --- |
| VC-001 | Blocked | Local exacto; Linux pendiente |
| VC-002 | Blocked | Rechazo local exitoso; Linux pendiente |
| VC-003 | Blocked | Local exacto; Linux pendiente |
| VC-004 | Blocked | Rechazo local exitoso; Linux pendiente |
| VC-005 | Blocked | Frozen local exitoso; falta clon limpio Linux |
| VC-006 | Blocked | Lock inconsistente rechazado localmente; falta Linux |
| VC-007 | Blocked | Raíz correcta; falta Linux y aclarar alcance repo-wide del spike |
| VC-008 | Blocked | No ejecutado en Linux controlado |
| VC-009 | Blocked | Lifecycle bloqueado localmente; falta Linux/revisión |
| VC-010 | Blocked | Typecheck local pass; falta Linux |
| VC-011 | Blocked | Typecheck negativo local pass; falta Linux |
| VC-012 | Blocked | Build local pass; falta Linux |
| VC-013 | Blocked | ESM/NestJS local pass; falta Linux |
| VC-014 | Blocked | Start compilado local pass; falta Linux |
| VC-015 | Blocked | Paquete sin fuente/devtools local pass; falta Linux |
| VC-016 | Blocked | Source maps local pass; falta Linux |
| VC-017 | Blocked | Variables válidas local pass; falta Linux |
| VC-018 | Blocked | Variables inválidas local pass; falta Linux |
| VC-019 | Blocked | Plataforma autoritativa no disponible/autorizada |
| VC-020 | Blocked | Dos builds macOS iguales; faltan dos Linux |
| VC-021 | Blocked | Casing local rechazado; falta Linux |
| VC-022 | Blocked | Inputs locales estables; árbol inicial sucio y falta Linux |
| VC-023 | Blocked | Gate local no interactivo; falta Linux |
| VC-024 | Pending | DEC-051 no autoriza CI |

El detalle por procedimiento, plataforma, exit code y evidencia está en [EVIDENCE.md](EVIDENCE.md).

## Riesgos y limitaciones

### Evidencia no autoritativa

El host local es macOS arm64. Los resultados prueban compatibilidad local, no la plataforma declarada por DEC-004.

### Árbol inicial no limpio

PBI-021 y el expediente no estaban versionados en HEAD. Debido a la prohibición de commit, no fue posible crear un commit candidato y clonar exactamente la materialización. Los directorios temporales usaron la misma entrada local, no un Git checkout.

### Política de lifecycle en pnpm 11

El deny-by-default funciona y la allowlist actual es vacía. pnpm 11 exige `pnpm-workspace.yaml` para una allowlist consumida por el gestor; PBI-021 prohíbe ese archivo. El estado actual es seguro porque ninguna excepción está aprobada. Cualquier allowlist no vacía requiere reconciliación de gobierno.

### Lockfile histórico del spike

El producto tiene sólo `pnpm-lock.yaml` en raíz. El repositorio conserva un `package-lock.json` rastreado bajo SPIKE-009. No se tocó por estar fuera del alcance y por la prohibición expresa de reutilizar o limpiar el spike. La revisión autoritativa debe confirmar que VC-007 se aplica a la raíz de producto o decidir el retiro separado del lockfile experimental.

### CI y revisiones

DEC-051 continúa pendiente; no se seleccionó proveedor, runner o workflow. Tampoco se registraron revisiones posteriores de la evidencia. Por tanto, PBI-021 no está `Done` y DEC-004 no está verificada.

## Estado de gobierno

| Elemento | Estado final |
| --- | --- |
| DEC-004 | `Accepted — Selection Approved / Evidence Pending` |
| PBI-021 | No `Done`; evidencia Linux/CI/revisiones pendientes |
| Estado documental de PBI-021 | `Ready`, `Unassigned`; no se modificó automáticamente |
| SPRINT-00 | No cerrado; PBI-021 no está asignado al sprint |
| Primer cambio funcional de R0 | No autorizado por este resultado |

## Git

| Campo | Resultado |
| --- | --- |
| Rama | `main` |
| HEAD | `6bd9289e31fd382d6c35303f669c2c00ea7ff89f` |
| `origin/main` | `6bd9289e31fd382d6c35303f669c2c00ea7ff89f` |
| Divergencia | `0 0` |
| Working tree | No limpio; cambios preexistentes y materialización sin commit |
| Commit/push/PR/merge/deploy | No ejecutados |

## Restricciones confirmadas

- No se copió ni modificó SPIKE-009.
- No se implementó Reparaciones, clientes, inventario, caja u otro módulo.
- No se implementó autenticación, autorización o multitenancy.
- No se creó persistencia, PostgreSQL funcional, SQL o migraciones.
- No se creó endpoint funcional ni `/health`.
- No se creó workspace, contenedor, CI o despliegue.
- No se ejecutó SSH ni se accedió a infraestructura remota.
- No se hizo commit, push, PR, merge o deploy.

## Siguiente acción exacta

Versionar en una tarea autorizada PBI-021, el expediente de DEC-004 y esta materialización; después ejecutar VC-001 a VC-023 desde dos checkouts limpios sobre Linux x86_64/glibc, y mantener VC-024 pendiente hasta que DEC-051 autorice el CI Linux.
