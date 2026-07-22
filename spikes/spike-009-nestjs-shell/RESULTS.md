# Resultados de SPIKE-009

## Veredicto de remediación

**REMEDIATIONS PASS — ready for focused re-review.**

El dictamen anterior de Seguridad, Operaciones y Calidad fue **APPROVED FOR ADR REVIEW WITH REQUIRED REMEDIATIONS (Opción B)**. Los ocho hallazgos obligatorios quedaron implementados y demostrados localmente. Este veredicto sólo abre una re-revisión enfocada: no equivale a `PASS — recommend ADR acceptance`, no acepta ADR-005 y no cierra DEC-004.

## Resultado por hallazgo

| Hallazgo obligatorio | Resultado | Evidencia principal |
|---|---|---|
| Independencia de auditoría | PASS | reset por caso, operaciones/IDs propios, 6/6 en suite y 3/3 aislada |
| Job pendiente en shutdown | PASS | barrera por row lock, rechazo de trabajo nuevo, drain a cero y cierre listener/pool |
| Señales operativas sanitizadas | PASS | logs JSON de startup/readiness/dependencia/lifecycle, capturados sin secretos |
| Timeouts PostgreSQL | PASS | límites configurables; conexión rechazada/silenciosa, statement y lock probados |
| Correlación autoritativa | PASS | UUID siempre server-side; candidato validado sólo como referencia secundaria |
| Linux/CI | PASS local / remoto pendiente | descubrimiento portable, recursos dinámicos y `scripts/ci.sh`; runner Linux remoto aún no ejecutado |
| Cleanup y colisiones | PASS | éxito, fallo, señal, concurrencia, stop idempotente y cero recursos propios residuales |
| Gate arquitectónico | PASS | `verify` obligatorio, siete reglas y mutation checks controlados |

## Criterios de salida de la remediación

| Criterio | Estado |
|---|---|
| Auditoría aislada, repetible y sin dependencia de orden observable | Cumplido |
| Job pendiente automatizado, determinista y con cleanup | Cumplido |
| Startup/shutdown y dependencia caída observables sin secretos | Cumplido |
| PostgreSQL acotado ante dependencia silenciosa, statement y lock | Cumplido |
| Server correlation ID siempre propio y único | Cumplido |
| Candidato cliente inválido/ largo/control descartado | Cumplido |
| Socket, directorio y puerto por ejecución | Cumplido |
| Cleanup en éxito, fallo y señal; `db:stop` seguro | Cumplido |
| Portabilidad Linux documentada y CI local automatizable | Cumplido; ejecución remota pendiente de revisión |
| Gate canónico detecta violaciones y ciclos | Cumplido dentro de límites textuales |
| Lockfile estable, auditoría sin vulnerabilidades y firmas verificadas | Cumplido |
| Suites completas repetidas sin flakiness | Cumplido: 48/48 dos veces en `verify` |

## Resultado técnico consolidado

El total pasó de 31 a 48 pruebas:

- unit: 9;
- arquitectura: 7;
- integración: 6;
- E2E: 13;
- job: 4;
- PostgreSQL/timeouts: 5;
- operaciones/lifecycle/cleanup: 4.

Las dos ejecuciones iniciales de `npm run verify` aprobaron 48/48 más build en `15.33 s` y `18.34 s`. También pasaron auditoría aislada 3/3 y, 2/2 cada una, las pruebas focalizadas de timeouts, job pendiente, correlación concurrente y startup/shutdown. Una carrera expuesta por CI frío fue corregida y la suite operativa pasó cuatro veces consecutivas; sobre el código final pasaron el CI completo (48/48 + build/audits, `20.97 s`) y otro `verify` (48/48 + build, `16.95 s`). `npm audit --audit-level=low` reportó cero vulnerabilidades; `npm audit signatures` verificó 134 firmas y 4 attestations. El lockfile conservó su SHA-256.

## Fronteras demostradas

- Dominio y aplicación siguen libres de NestJS.
- Dominio no importa infraestructura/transporte.
- Controllers no contienen SQL ni dependen de adapters concretos.
- La autoridad operacional y autorización viajan por puertos/contexto explícitos.
- El servidor genera la correlación autoritativa para HTTP, logs y auditoría.
- HTTP y jobs comparten caso de uso, políticas, puertos y adapters.
- Health, lifecycle y errores operativos quedan visibles mediante señales mínimas sanitizadas.
- El gate canónico falla ante mutaciones controladas de imports, service locator, request scope, SQL/adapters en controller y ciclos.

NestJS continúa comportándose como shell técnico en la evidencia. La remediación no amplió el recorrido funcional ni lo convirtió en producto.

## Riesgos y decisiones que permanecen

### Condición previa a implementar R0: auditoría autoritativa

Hoy el write de negocio confirma antes de persistir la auditoría de éxito. La prueba nueva demuestra que, si falla el adapter de auditoría después del commit, el efecto permanece y la operación rechaza; el intento secundario de registrar el fallo también puede fallar. Debe elegirse posteriormente entre:

1. misma transacción;
2. outbox transaccional;
3. auditoría posterior con reconciliación;
4. fail-closed antes del commit;
5. fail-open explícito, sólo si es aceptable.

No se eligió una política. Es un riesgo de consistencia que antecede R0, no una falla de NestJS.

### Riesgos técnicos residuales

- el checker arquitectónico es textual y no sustituye análisis AST/grafo de producción;
- `scripts/ci.sh` es reproducible, pero falta ejecutar el mismo gate en un runner Linux remoto;
- la reserva de puerto dinámico conserva una ventana TOCTOU pequeña, mitigada con reintentos;
- npm/package-lock, `pg`, Express y REST/HTTP JSON siguen siendo experimentales;
- falta definir política de scripts de instalación npm (`esbuild`/`fsevents`);
- fixtures de identidad/revocación, job in-process y logger propio no son soluciones productivas;
- no se evaluaron carga sostenida, cobertura, ORM, migrador, RLS, pooler ni observabilidad externa.

## Alcance de la conclusión

La evidencia permite a Seguridad, Operaciones y Calidad revisar exclusivamente si las remediaciones satisfacen sus hallazgos. No permite todavía:

- aceptar ADR-005;
- cerrar DEC-004;
- resolver DEC-044, DEC-049, DEC-050 o DEC-051;
- promover el directorio a scaffold;
- autorizar implementación de R0.

## Próximo paso exacto

Seguridad, Operaciones y Calidad deben realizar una **revisión enfocada exclusivamente en estas remediaciones** usando [EVIDENCE.md](EVIDENCE.md) y los comandos reproducibles de [README.md](README.md). Si esa revisión es favorable, Arquitectura + Ingeniería podrá evaluar ADR-005 en una iteración documental separada.

Hasta entonces, ADR-005 permanece `Proposed` y DEC-004 permanece abierta.
