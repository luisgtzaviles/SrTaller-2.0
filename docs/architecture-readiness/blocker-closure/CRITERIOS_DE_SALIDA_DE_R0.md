# Criterios de salida de R0

## Estado y autoridad

- **Alcance y contrato de salida:** aprobados.
- **Decisiones cerradas:** `DEC-002` y `DEC-062` para R0.
- **Autoridad decisora:** Responsable de Producto.
- **Fecha de decisión:** 2026-07-21.
- **Implementación:** pendiente y no autorizada por esta decisión.
- **Diseño técnico:** pendiente donde el inventario mantenga decisiones abiertas.
- **Pruebas y demostración:** pendientes de implementación y ejecución.
- **Aceptación de R0:** pendiente; aprobar su alcance no equivale a aceptar el resultado.

Esta es una decisión de producto y de aceptación verificable. No crea ADR-014, no reabre ADR-004, ADR-012 o ADR-013 y no incorpora Reparaciones en R0.

## Definición aprobada

R0 es una **fundación ejecutable, integrada, demostrable y verificable** del SaaS multi-tenant. No incluye el flujo de órdenes de reparación ni la recepción operativa de R1.

R0 no se satisface con scaffolding, carpetas, configuración técnica, contratos abstractos o componentes aislados. Su salida debe demostrar mediante comportamiento observable que la aplicación opera de forma segura y atribuible bajo los fundamentos arquitectónicos aprobados.

## Resultado observable obligatorio

Al finalizar R0 debe existir una aplicación ejecutable que demuestre, como mínimo:

1. al menos dos tenants independientes;
2. aislamiento efectivo entre ambos tenants;
3. usuarios, roles y asignaciones pertenecientes a su tenant;
4. contexto operativo explícito y atribuible;
5. selección o resolución válida de sucursal cuando corresponda;
6. combinación de capacidades conforme a ADR-012;
7. denegación por defecto;
8. autorización contextual evaluada por el servidor;
9. imposibilidad de acceder a recursos de otro tenant manipulando identificadores o contexto;
10. revocación efectiva de acceso o asignación;
11. vinculación y revocación de estación o dispositivo cuando esa rebanada forme parte de la demostración;
12. evidencia para correlacionar actor, tenant, sucursal, sesión, operación y resultado;
13. errores seguros, sin información de otros tenants ni detalles internos indebidos.

## Alcance incluido

R0 incluye solamente las capacidades necesarias para demostrar la fundación:

- arranque y configuración de la aplicación;
- persistencia y migraciones base;
- modelo multi-tenant compartido conforme a ADR-004;
- tenants y sucursales mínimas;
- identidades de usuario y pertenencias al tenant;
- roles, capacidades y asignaciones tenant-wide o restringidas por sucursal;
- autenticación base;
- establecimiento y validación del contexto operativo;
- autorización contextual y denegación por defecto;
- revocación;
- trazabilidad y auditoría mínima;
- manejo seguro de errores;
- pruebas automatizadas de las invariantes fundacionales;
- una interfaz mínima o mecanismo de demostración observable.

La interfaz puede ser mínima y no representa la experiencia final del producto. Los datos de soporte para tenants, sucursales, usuarios, roles, capacidades o estaciones tampoco convierten esas capacidades en módulos funcionales terminados.

## Exclusiones explícitas

Quedan fuera de R0:

- recepción de equipos y evidencias de recepción;
- creación o gestión de órdenes de reparación;
- diagnóstico, cotización, anticipos, pagos y estados operativos de reparación;
- firmas o consentimientos del cliente, comprobantes y garantías;
- inventario, caja, ventas y clientes como módulo funcional completo;
- CRM, WhatsApp, finanzas y Business Intelligence;
- panel completo del tenant o de superadministración;
- administración comercial de planes o suscripciones;
- diseño visual o modo oscuro definitivos;
- impersonación y acceso de emergencia;
- aprobaciones sin conexión y elevación permanente de privilegios;
- cualquier acción sensible cuyo mecanismo de nivel 2 o 3 no se haya definido en su rebanada.

## Acciones sensibles

La gestión de roles y asignaciones, la revocación de usuarios y la vinculación o revocación de estaciones conservan la clasificación de ADR-013.

Mientras una rebanada no defina un mecanismo ejecutable de nivel 2 o 3, la acción correspondiente permanece no permitida o restringida conforme al nivel 4. Una interfaz o endpoint no prueba que la acción sensible esté resuelta.

## Escenarios felices mínimos

La demostración debe incluir, al menos:

1. crear o disponer de dos tenants separados;
2. autenticar a un usuario válido del tenant A;
3. resolver su tenant y contexto operativo;
4. operar dentro de una sucursal autorizada;
5. ejecutar una operación permitida por sus capacidades;
6. demostrar una asignación tenant-wide;
7. demostrar una asignación restringida a una sucursal;
8. cambiar de contexto sólo con autorización;
9. revocar una asignación o acceso y comprobar que deja de ser efectivo;
10. correlacionar la operación con actor, sesión, tenant, sucursal y resultado.

## Escenarios negativos y de denegación mínimos

La demostración debe probar, al menos:

1. un usuario del tenant A no puede leer ni modificar recursos del tenant B;
2. modificar un identificador no permite cruzar tenants;
3. omitir tenant o contexto requerido produce denegación;
4. usar una sucursal no asignada produce denegación;
5. carecer de capacidad produce denegación;
6. una sesión expirada o revocada no puede continuar operando;
7. una asignación revocada deja de autorizar conforme al modelo definido;
8. un rol de otro tenant no puede asignarse ni aprovecharse;
9. una acción sensible no implementada no puede ejecutarse por una ruta alternativa;
10. manipular UI, payload, ruta o identificadores no convierte una denegación en permiso;
11. una operación denegada deja evidencia suficiente sin exponer datos sensibles;
12. los errores no revelan existencia o contenido de recursos de otro tenant.

## Pruebas mínimas

R0 no puede aceptarse sólo mediante revisión visual. Debe incluir pruebas automatizadas de:

- aislamiento multi-tenant;
- pertenencia de roles al tenant;
- unión de capacidades;
- alcance tenant-wide y restringido por sucursal;
- denegación por defecto y servidor como autoridad final;
- revocación;
- contexto inválido o incompleto;
- referencias cruzadas entre tenants;
- trazabilidad mínima;
- manejo seguro de errores.

Las pruebas pueden distribuirse entre unidad, integración y end-to-end. Las invariantes críticas deben comprobar comportamiento integrado y persistencia real, no únicamente mocks.

## Evidencia de salida

La evidencia conservada debe identificar:

- versión o commit evaluado y ambiente de demostración;
- migraciones aplicadas;
- tenants, usuarios, roles y contextos de prueba;
- escenarios ejecutados y resultados esperados/obtenidos;
- pruebas automatizadas ejecutadas;
- defectos conocidos y excepciones aceptadas;
- persona que validó, persona que aceptó formalmente y fecha de aceptación.

## Autoridad de aceptación

El Responsable de Producto acepta formalmente R0, con apoyo de:

- Arquitectura, para verificar ADRs e invariantes;
- Calidad, para verificar escenarios, pruebas y evidencia;
- Seguridad, cuando exista ese rol formal, para revisar aislamiento, autorización, revocación y trazabilidad.

Arquitectura o Calidad pueden declarar incumplimientos y bloquear la recomendación de salida. La aceptación final del resultado de producto corresponde al Responsable de Producto. Una persona puede cubrir temporalmente más de una función, pero la evidencia debe distinguir el criterio evaluado desde cada responsabilidad.

## Distinción de gates

### Alcance y contrato de salida aprobados

- [x] `DEC-002`: resultado, límites y exclusiones aprobados por Producto.
- [x] `DEC-062`: escenarios y autoridad de aceptación de R0 aprobados por Producto.
- [x] R0 se demuestra sin depender de R1.
- [x] Reparaciones y recepción permanecen fuera de R0.

### Base lista para el primer cambio de implementación de R0

Además del alcance aprobado, todos estos criterios siguen siendo obligatorios:

- [x] ADR-001 aceptado con TypeScript y Node.js `24.x`, límites y gobierno explícitos;
- [x] ADR-003 y ADR-009 aceptados; motor y repositorio único con workspaces bajo demanda definidos;
- [ ] ADR-005 y la selección de DEC-004 aceptados; materialización del package manager/lockfile y evidencia final de la baseline ejecutable pendientes;
- [x] estructura inicial y reglas de dependencia acordadas en DEC-005;
- [x] estructura y enforcement local de DEC-005 materializados y formalmente verificados; PBI-022 `Done`;
- [x] ownership de repositorios y datos aceptado para la fundación mediante [DEC-049](../../decisions/dec-049-persistence-ownership/DECISION_PROPOSAL.md); DEC049-C01 a C08 permanecen pendientes para materialización;
- [x] estrategia de errores y contratos mínimos de aplicación definidos por DEC-044;
- [x] estrategia de pruebas y Definition of Done aprobadas por DEC-051/063; sus condiciones permanecen pendientes;
- [ ] PBI de R0 trazado a los escenarios aprobados;
- [ ] no existen decisiones H0 abiertas;
- [ ] el cambio no introduce módulos futuros vacíos ni decisiones H1 implícitas;
- [ ] el Responsable de Producto autoriza expresamente iniciar implementación.

Este gate continúa cerrado. La aprobación de `DEC-002` y `DEC-062` no autoriza código.

### R0 listo para programación

Además del gate anterior:

- [ ] estrategia multitenant, ownership e aislamiento listos para aplicar y probar;
- [ ] datos SaaS, tenant-wide y branch-scoped clasificados para R0;
- [x] contexto tenant/sucursal/estación/usuario definido en ADR-010;
- [x] identidad, sesión, PIN, inactividad y atribución definidos conceptualmente en ADR-011;
- [x] roles, capacidades, alcance, combinación y revocación definidos en ADR-012;
- [x] sensibilidad, niveles y controles reforzados definidos en ADR-013;
- [ ] composición y clasificación concretas de operaciones de R0 acordadas;
- [ ] persistencia, migraciones y fixtures con estrategia aceptada;
- [ ] zona horaria y modelo temporal definidos;
- [ ] errores, logs, correlation ID, auditoría y observabilidad especificados;
- [ ] secretos, cifrado y separación de ambientes acordados;
- [ ] spikes H1 requeridos autorizados, ejecutados y revisados;
- [ ] no existen decisiones H0 o H1 críticas abiertas.

### R0 completo y listo para habilitar R1

- [ ] todos los escenarios obligatorios están demostrados;
- [ ] las pruebas críticas pasan;
- [ ] no existe una vulneración conocida de aislamiento tenant;
- [ ] no existe una ruta conocida que omita autorización del servidor;
- [ ] revocación, trazabilidad y errores seguros están demostrados;
- [ ] las exclusiones permanecen fuera;
- [ ] Arquitectura y Calidad emitieron evaluación;
- [ ] el Responsable de Producto aceptó formalmente la demostración;
- [ ] no hay decisiones H1 abiertas que comprometan aislamiento, identidad o persistencia.

Código, migraciones o interfaces por sí solos no completan R0.

## Relación con R1

R1 comienza después de la aceptación formal de R0 y constituye la primera rebanada operativa de Reparaciones. Recepción y creación de órdenes no se incorporan a R0 para hacerlo más demostrable. R1 debe usar las garantías verificadas en R0, no implementarlas por primera vez.
