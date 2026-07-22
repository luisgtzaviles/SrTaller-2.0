# DEC-004 — Baseline ejecutable: registro de implementación

## Objetivo

Implementar una baseline local, compilable y ejecutable para SR Taller 2.0 que aplique las decisiones arquitectónicas aceptadas, incluya persistencia PostgreSQL, autenticación operativa básica y una prueba automatizada de aislamiento entre tenants.

## Alcance evaluado

La evaluación cubrió:

- la autoridad vigente de `DEC-004`;
- ADR-001 a ADR-005 y ADR-009 a ADR-013;
- los gates H0/H1 relacionados con estructura, errores, persistencia, migraciones y pruebas;
- el estado actual del repositorio y de la toolchain local;
- las precondiciones para implementar autenticación y aislamiento tenant sin decidir por código asuntos todavía abiertos.

## Resultado de la evaluación

La implementación se detuvo antes de crear código, configuración ejecutable, dependencias, SQL o migraciones.

La documentación autoritativa vigente impide comenzar el primer cambio ejecutable:

- [DEC-004](../blocker-closure/DEC-004_BASELINE_TECNICA.md) permanece `Abierta`, declara pendiente la baseline ejecutable y mantiene bloqueado el primer cambio de R0.
- [ADR-005](../../decisions/proposed/ADR-005-nestjs-backend.md) exige resolver, antes del primer recorrido productivo, `DEC-044`, `DEC-049`, `DEC-050`, `DEC-051`, package manager, lockfile, supply chain, CI Linux y política productiva de pool/timeouts.
- [La secuencia oficial](../blocker-closure/SECUENCIA_DE_DECISIONES.md) sitúa `DEC-004/005`, `DEC-044`, `DEC-049`, `DEC-051` y `DEC-063` antes del primer cambio de implementación.
- [ADR-011](../../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md) mantiene diferidos la protección técnica del PIN, el formato de sesión, la limitación de intentos y las reglas técnicas de invalidación.
- [ADR-012](../../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md) exige definir por rebanada la composición de roles y capacidades antes de habilitar operaciones protegidas.

Elegir una librería PostgreSQL, un migrador, una estrategia de repositorios, un runner de pruebas, un mecanismo de hash de PIN o un formato de sesión dentro de este cambio cerraría de hecho decisiones que siguen asignadas a autoridades específicas. La solicitud de implementar no reemplaza ese cierre documental.

## Arquitectura implementada

No se implementó arquitectura ejecutable.

La arquitectura aceptada que deberá materializar el baseline cuando se cierren los gates es:

- TypeScript sobre Node.js `24.x`;
- una aplicación backend y un artefacto;
- monolito modular con dependencias acíclicas;
- NestJS `11.x` como shell exterior, con paquetes runtime alineados;
- Express mediante `@nestjs/platform-express`;
- REST/HTTP JSON mínima;
- PostgreSQL `18.x`, con `18.4` como versión efectiva inicial registrada;
- una base física y un esquema lógico compartidos;
- contexto tenant y sucursal explícito, server-side y obligatorio;
- dominio y aplicación sin dependencias de NestJS, Express, PostgreSQL u ORM;
- autorización contextual dentro de aplicación, no únicamente en guards o transporte;
- pruebas negativas cross-tenant desde la primera rebanada persistente.

## Componentes creados

Sólo se crearon estos documentos de diagnóstico:

- `IMPLEMENTATION.md`;
- `RESULTS.md`.

No se creó aplicación, módulo, endpoint, esquema, migración, fixture, dependencia o prueba ejecutable.

## Decisiones tomadas

No se tomó ninguna decisión arquitectónica ni tecnológica nueva.

En particular, no se seleccionaron:

- package manager ni su versión;
- política de lockfile o scripts de instalación;
- ESM/CommonJS ni compilador TypeScript;
- driver, ORM o query builder;
- librería o mecanismo de migraciones;
- runner de pruebas o thresholds;
- librería de validación;
- algoritmo o parámetros de protección del PIN;
- formato o transporte de sesión;
- política de pool, timeouts o retries;
- RLS, contenedores o proveedor.

## Decisiones requeridas para continuar

| Gate | Cierre mínimo necesario |
| --- | --- |
| `DEC-004` | Package manager/version, lockfile, scripts, módulos/compilación, pinning, baseline integrada, CI Linux y reproducibilidad |
| `DEC-005` | Organización física inicial, ownership y enforcement de dependencias |
| `DEC-044` | Taxonomía y adaptación segura de errores |
| `DEC-049` | Puertos, repositorios, ownership de datos y acceso tenant-aware |
| `DEC-050` | Herramienta y ejecución reproducible de migraciones, compatibilidad y recuperación |
| `DEC-051` | Runner, estrategia, gates y evidencia de pruebas |
| `DEC-063` | Definition of Done aplicable al baseline |
| Identidad técnica | Protección del PIN, intentos, sesión, invalidación y reconocimiento seguro de estación |
| Autorización de la rebanada | Operaciones, capacidades, roles, alcance y sensibilidad concretos |
| Autorización organizacional | Registro explícito que habilite el primer cambio de implementación de R0 |

## Diferencias respecto al diseño solicitado

El alcance solicitado requería una aplicación ejecutable, migraciones, autenticación e aislamiento tenant. Ninguno de esos elementos se materializó porque hacerlo habría contradicho gates explícitos y habría introducido decisiones no aceptadas mediante código.

La detención es deliberada y aplica la restricción de la solicitud: detenerse y documentar cuando una decisión previa impida continuar.

## Limitaciones actuales

- El repositorio raíz no contiene todavía `package.json`, `tsconfig.json`, `nest-cli.json`, aplicación o migraciones de producto.
- La máquina local ejecuta Node.js `v25.9.0`, fuera de la baseline aceptada `24.x`; se requiere pinning antes de validar reproducibilidad.
- El cliente y servidor local de PostgreSQL reportan `18.4`, consistente con la versión efectiva registrada, pero no existe esquema autorizado que migrar.
- El código de SPIKE-009 es evidencia desechable y ADR-005 prohíbe reutilizarlo automáticamente como scaffold.
- No existe contrato técnico autorizado suficiente para afirmar que la autenticación básica o el aislamiento persistente cumplen ADR-004/010/011/012.

## Siguientes pasos

1. Cerrar `DEC-004` con las selecciones reversibles de tooling y evidencia de compatibilidad.
2. Cerrar `DEC-005` y `DEC-049` antes de definir estructura y acceso a datos.
3. Cerrar `DEC-044`, `DEC-051` y `DEC-063` para establecer errores y gates repetibles.
4. Cerrar `DEC-050` antes de crear o ejecutar la primera migración.
5. Registrar las decisiones técnicas mínimas de estación, PIN, sesión y autorización de la rebanada.
6. Registrar la autorización organizacional del primer cambio ejecutable.
7. Reemitir el mandato de implementación con esos cierres como entradas y ejecutar el baseline sin reutilizar el spike.
