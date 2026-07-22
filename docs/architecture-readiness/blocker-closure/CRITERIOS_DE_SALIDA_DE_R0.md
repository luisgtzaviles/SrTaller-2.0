# Criterios de salida de R0

## Distinción de estados

R0 puede estar listo para **diseño dirigido**, listo para **programación** o **completo**. Esos estados no son equivalentes.

## R0 listo para diseño dirigido

El repositorio ya aporta evidencia suficiente para este estado:

- [x] arquitectura inicial aceptada en ADR-002;
- [x] fronteras, dependencias y riesgos del monolito modular documentados;
- [x] rebanadas R0–R5 y propósito de R0 identificados;
- [x] preguntas de multitenancy, identidad, configuración y consistencia inventariadas;
- [x] ausencia de código ejecutable reconocida explícitamente;
- [x] decisiones diferibles separadas de los bloqueantes;
- [x] ningún ADR `Proposed` tratado como aceptado.

**Estado actual:** R0 está listo para diseño dirigido, no para programación.

## Base técnica lista para el primer commit

Todos estos criterios son obligatorios:

- [ ] `DEC-002`: resultado demostrable, límites y exclusiones de R0 aprobados por Producto;
- [ ] ADR-001, ADR-003, ADR-005 y ADR-009 revisados y con estado explícito;
- [ ] estructura inicial y reglas de dependencia de ADR-002 acordadas;
- [ ] ownership de repositorios y datos definido al nivel necesario para el scaffolding;
- [ ] estrategia de errores y contratos mínimos de aplicación definidos;
- [ ] estrategia de pruebas, aceptación y Definition of Done aprobadas;
- [ ] primer recorrido demostrable de R0 expresado como criterios observables;
- [ ] no existen decisiones H0 abiertas en el inventario;
- [ ] el primer commit no introduce módulos futuros vacíos ni decisiones H1 implícitas.

Este gate permite comenzar la base ejecutable autorizada. No permite programar los recorridos de R0 mientras H1 siga abierto.

## R0 listo para programación

Además del gate H0:

- [ ] estrategia multitenant, ownership e aislamiento aceptados;
- [ ] datos globales, tenant-wide y branch-scoped clasificados;
- [x] contexto tenant/sucursal/estación/usuario, ausencia y cambio definidos en ADR-010;
- [x] identidad, sesión, PIN, inactividad y atribución conceptual definidos en ADR-011;
- [x] modelo conceptual de roles, capacidades, alcance, combinación y revocación definido en ADR-012;
- [ ] composición mínima por rebanada, acciones sensibles y autorización reforzada acordadas;
- [ ] persistencia, migraciones y fixtures tienen estrategia aceptada;
- [ ] zona horaria y modelo temporal están definidos;
- [ ] errores, logs, correlation ID, auditoría y observabilidad mínima están especificados;
- [ ] secretos, cifrado y separación de ambientes tienen controles acordados;
- [ ] spikes H1 requeridos produjeron evidencia y sus ADRs fueron revisados;
- [ ] no existen decisiones H0 o H1 críticas abiertas.

## R0 completo y listo para habilitar R1

Además de terminar el código de R0 cuando éste sea autorizado, debe existir evidencia de:

- [ ] contexto de tenant y sucursal se obtiene de fuentes confiables en ejecución;
- [ ] desvinculación/revinculación de estación y ausencia de contexto se rechazan o resuelven con seguridad;
- [ ] identidad, sesión, PIN e inactividad cumplen los escenarios acordados;
- [ ] atribución, roles, capacidades, alcance, revocación y acciones sensibles se aplican server-side;
- [ ] propiedad de persistencia y política de migraciones aplicadas;
- [ ] zona horaria y almacenamiento/presentación de fechas definidos;
- [ ] configuración por ambiente y secretos fuera del repositorio;
- [ ] auditoría mínima, logs seguros, correlation ID, health y readiness verificables;
- [ ] fixtures repetibles con al menos dos tenants y sucursales cuando corresponda;
- [ ] pruebas negativas de aislamiento, autorización y contexto ausente;
- [ ] pruebas unitarias, de aplicación, integración y arquitectura acordes al riesgo;
- [ ] pipeline mínimo reproduce lint, pruebas y verificaciones de seguridad acordadas;
- [ ] documentación ejecutable y decisiones aceptadas enlazadas a su evidencia;
- [ ] demostración de R0 cumple los criterios de aceptación sin depender de R1;
- [ ] no existen decisiones H1 abiertas que comprometan aislamiento, identidad o persistencia.

## Evidencia de salida

La salida no se declara por porcentaje ni por presencia de carpetas. Requiere:

1. ADRs aceptados o decisiones de Producto registradas;
2. implementación trazable a esas decisiones;
3. checks automatizados verdes;
4. demostración de contexto, aislamiento y denegación;
5. revisión conjunta de Arquitectura, Seguridad, Calidad y Producto;
6. riesgos residuales explícitamente aceptados por la autoridad correspondiente.
