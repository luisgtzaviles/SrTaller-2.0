# Bloqueantes del primer cambio de implementación de R0

## Criterio

H0 contiene sólo decisiones cuya omisión convertiría una hipótesis en estructura ejecutable, obligaría a rehacer la fundación o erosionaría desde el inicio los límites aceptados. No incluye proveedores, UX, folios ni reglas completas de R1.

## Estado actual

**No puede comenzar ningún código ejecutable del producto.** Sí pueden continuar documentación, refinamiento, diseño de ADRs y preparación no ejecutada de experimentos.

## Decisiones H0

| ID | Decisión | Estado | Cierre mínimo |
| --- | --- | --- | --- |
| DEC-001 | Arquitectura inicial | Aceptada | ADR-002; no bloquea |
| DEC-002 | Alcance exacto de R0 | Cerrada por Producto el 2026-07-21 | Fundación ejecutable, resultado, inclusiones y exclusiones aprobados |
| DEC-004 | Stack de aplicación | Propuesta | Lenguaje, runtime, backend, persistencia y repositorio aceptados o explícitamente excluidos |
| DEC-005 | Organización inicial del monolito | Parcialmente resuelta | Agrupación inicial, ownership y reglas verificables sin módulos vacíos |
| DEC-044 | Estrategia de errores | Propuesta | Taxonomía mínima, resultado seguro y frontera dominio/aplicación |
| DEC-049 | Repositorios y propiedad lógica | Parcialmente resuelta | Contratos propietarios y prohibiciones de acceso transversal |
| DEC-051 | Estrategia de pruebas | Propuesta | Niveles, gates y aislamiento como prueba obligatoria |
| DEC-062 | Criterios de aceptación | Cerrada para R0 por Producto el 2026-07-21 | Escenarios verificables, pruebas/evidencia requeridas y autoridad de aceptación aprobados |
| DEC-063 | Definición de terminado | Propuesta | Evidencia mínima y gates documentados para cambios ejecutables |

## Guardrails ya disponibles

- ADR-002 obliga a dominio independiente, dependencias acíclicas y datos con dueño lógico.
- Tenant, sucursal y actor deben ser explícitos desde el primer caso de uso, aunque su mecanismo se cierre en H1.
- Configuración técnica y secretos deben provenir del entorno; el mecanismo se cierra en H1.
- No se crean módulos vacíos, infraestructura distribuida, eventos sin consumidor ni carpetas definitivas por anticipación.

## Evidencia para liberar el primer cambio de implementación de R0

- alcance y contrato de salida de R0 aprobados (`DEC-002`, `DEC-062`); satisfecho el 2026-07-21;
- autorización explícita para iniciar implementación; pendiente;
- ADRs de plataforma necesarios en `Accepted`;
- mapa de agrupación física inicial trazado a ADR-002;
- reglas de dependencia comprobables con la herramienta elegida;
- estrategia de errores, pruebas y Definition of Done revisadas;
- PBI de R0 trazado a los escenarios felices, negativos, de denegación y cross-tenant aprobados;
- confirmación de que el cambio no incluye reglas de R1 ni decisiones H3–H5.

## Qué no bloquea H0

Proveedor cloud, contenedores definitivos, wildcard DNS, RLS, impresora concreta, almacenamiento final de archivos, catálogo completo de estados, SLOs cuantitativos, facturación SaaS y capacidades H5.
