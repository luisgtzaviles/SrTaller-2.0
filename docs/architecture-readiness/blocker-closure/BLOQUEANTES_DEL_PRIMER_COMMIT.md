# Bloqueantes del primer cambio de implementación de R0

## Criterio

H0 contiene sólo decisiones cuya omisión convertiría una hipótesis en estructura ejecutable, obligaría a rehacer la fundación o erosionaría desde el inicio los límites aceptados. No incluye proveedores, UX, folios ni reglas completas de R1.

## Estado actual

**No puede comenzar código funcional del producto.** [PBI-022](../../backlog/pbis/PBI-022.md) quedó `Done` y DEC-005 formalmente verificada; ese cierre no amplía la autorización. Continúan permitidos el PBI técnico acotado de DEC-004, documentación, refinamiento, diseño de ADRs y preparación no ejecutada de experimentos bajo sus autoridades propias.

## Decisiones H0

| ID | Decisión | Estado | Cierre mínimo |
| --- | --- | --- | --- |
| DEC-001 | Arquitectura inicial | Aceptada | ADR-002; no bloquea |
| DEC-002 | Alcance exacto de R0 | Cerrada por Producto el 2026-07-21 | Fundación ejecutable, resultado, inclusiones y exclusiones aprobados |
| DEC-004 | Contrato de toolchain reproducible | `Accepted — Selection Approved / Evidence Pending` | Selección completa y PBI técnico autorizado; materialización, VC-001 a VC-024 y evidencia Linux pendientes |
| DEC-005 | Organización inicial del monolito | `Accepted — Materialized / Formally Verified`; PBI-022 `Done` | Cerrado para H0 el 2026-07-23 por la sexta reverificación formal `PASS`; obligaciones permanentes conservadas |
| [DEC-044](../../decisions/dec-044-error-strategy/FORMAL_REVIEW.md) | Estrategia de errores | `Accepted` el 2026-07-24 por el Responsable del Proyecto; cinco `PASS WITH CONDITIONS`; DEC044-C01 a C08 vigentes | Cerrado para H0; trasladar las ocho condiciones a DEC-051 y a una futura materialización autorizada |
| DEC-049 | Repositorios y propiedad lógica | [`Accepted`](../../decisions/dec-049-persistence-ownership/FORMAL_REVIEW.md) el 2026-07-24 por el Responsable del Proyecto; cinco `PASS WITH CONDITIONS`; DEC049-C01 a C08 vigentes | Cerrado para H0; trasladar las ocho condiciones a una futura materialización autorizada |
| [DEC-051](../../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md) | Estrategia de pruebas, CI y gates ejecutables | `Accepted` el 2026-07-24 por el Responsable del Proyecto; cinco `PASS WITH CONDITIONS`; C01 a C10 vigentes y pendientes | Cerrado para H0 por estado; materialización, protección de `main`, PostgreSQL real y VC-024 permanecen pendientes |
| DEC-062 | Criterios de aceptación | Cerrada para R0 por Producto el 2026-07-21 | Escenarios verificables, pruebas/evidencia requeridas y autoridad de aceptación aprobados |
| [DEC-063](../../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md) | Definición de terminado | `Accepted with conditions` el 2026-07-24 por el Responsable del Proyecto; cinco `PASS WITH CONDITIONS`; C01 a C08 `Pending` | Cerrado para H0 por estado; materialización de templates, riesgo, evidencia y gates continúa pendiente |

## Guardrails ya disponibles

- ADR-002 obliga a dominio independiente, dependencias acíclicas y datos con dueño lógico.
- ADR-001 obliga TypeScript para el producto autorizado y Node.js `24.x` para el backend inicial, sin aceptar framework ni tooling.
- ADR-003 obliga PostgreSQL 18.x como baseline de R0, sin aceptar proveedor, acceso a datos, migrador, pooler, extensiones ni RLS.
- ADR-005 obliga NestJS 11.x como shell exterior con Express y REST/HTTP JSON mínima, fronteras verificables y condiciones previas a implementar; no acepta tooling auxiliar ni el spike como scaffold.
- ADR-009 obliga repositorio único evolutivo, una aplicación/artefacto para R0 y workspaces bajo demanda, sin aceptar package manager, tooling ni estructura física.
- DEC-004 acepta Node.js `24.18.0`, pnpm `11.15.1`, ESM/NodeNext, TypeScript `6.0.3`, compilación previa y Linux x86_64/glibc; no autoriza funcionalidad ni declara evidencia.
- Tenant, sucursal y actor deben ser explícitos desde el primer caso de uso, aunque su mecanismo se cierre en H1.
- Configuración técnica y secretos deben provenir del entorno; el mecanismo se cierra en H1.
- No se crean módulos vacíos, infraestructura distribuida, eventos sin consumidor ni carpetas definitivas por anticipación.

## Evidencia para liberar el primer cambio de implementación de R0

- alcance y contrato de salida de R0 aprobados (`DEC-002`, `DEC-062`); satisfecho el 2026-07-21;
- autorización explícita para iniciar implementación; pendiente;
- ADRs de plataforma necesarios en `Accepted`;
- mapa de agrupación física inicial aceptado y trazado a ADR-002; satisfecho por DEC-005;
- reglas de dependencia materializadas y comprobadas por el checker local de DEC-005; sexta reverificación formal PASS, satisfecho el 2026-07-23;
- estrategia de errores, estrategia de pruebas y Definition of Done
  aceptadas; condiciones aplicables todavía deben materializarse;
- PBI de R0 trazado a los escenarios felices, negativos, de denegación y cross-tenant aprobados;
- materialización y evidencia Linux del contrato de DEC-004 completadas y revisadas;
- confirmación de que el cambio no incluye reglas de R1 ni decisiones H3–H5.

## Qué no bloquea H0

Proveedor cloud, contenedores definitivos, wildcard DNS, RLS, impresora concreta, almacenamiento final de archivos, catálogo completo de estados, SLOs cuantitativos, facturación SaaS y capacidades H5.
