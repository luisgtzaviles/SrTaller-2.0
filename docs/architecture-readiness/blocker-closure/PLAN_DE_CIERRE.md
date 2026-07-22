# Plan de cierre

## Forma de trabajo

El plan cierra decisiones, no fechas. Cada fila representa un paquete coherente: las decisiones individuales permanecen identificadas en el [inventario](INVENTARIO_DE_BLOQUEANTES.md). Un paquete sólo termina con evidencia y autoridad; redactar una propuesta no cuenta como cierre.

## Cierre registrado

El Responsable de Producto cerró `DEC-002` y `DEC-062` el 2026-07-21. Quedaron aprobados el alcance de R0, sus exclusiones, escenarios verificables y autoridad de aceptación. Este cierre no autoriza implementación, no declara R0 construido o aceptado y no cierra `DEC-063`.

Arquitectura + Ingeniería aceptaron ADR-001, ADR-003 y ADR-009 el 2026-07-21, y ADR-005 con condiciones el 2026-07-22. TypeScript, Node.js `24.x`, PostgreSQL, NestJS `11.x`, Express, REST/HTTP JSON mínima y el repositorio único evolutivo quedan resueltos dentro de `DEC-004`; PostgreSQL 18.x es la baseline de R0, PostgreSQL 18.4 su versión efectiva inicial y NestJS `11.1.28` la referencia que deberá revalidarse al cerrar la baseline ejecutable.

El 2026-07-22 se ejecutó [SPIKE-009](../../../spikes/spike-009-nestjs-shell/RESULTS.md), autorizado como `Mandatory before acceptance` de ADR-005. Tras el dictamen Opción B, su remediación obtuvo 48/48 pruebas y la revisión enfocada de Seguridad, Operaciones y Calidad fue aprobada con condiciones no bloqueantes. El spike queda completado y ADR-005 aceptado; `DEC-004` continúa abierta por tooling y baseline ejecutable final.

## Secuencia ejecutable de decisiones

| Orden | Decisiones | Responsable principal | Entradas mínimas | Salida verificable | ADR | Criterio de aceptación | Hito |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 — cerrado 2026-07-21 | DEC-002, DEC-062 | Producto | Rebanadas, objetivo MVP, escenarios | Alcance, exclusiones, escenarios y autoridad de aceptación de R0 aprobados | No | Contrato verificable de R0 sin Reparaciones ni dependencia de R1 | H0 cerrado para estas decisiones |
| 2 — parcial | DEC-004 | Arquitectura + Ingeniería; revisiones por componente | ADR-001/003/005/009 Accepted, alcance R0 y condiciones normativas | Package manager, versión, lockfile, scripts, módulos/compilación, compatibilidad de la [baseline](DEC-004_BASELINE_TECNICA.md), CI Linux y reproducibilidad verificados | Existentes | Lenguaje, runtime, motor, framework, adaptador/API mínima y repositorio satisfechos; tooling y baseline ejecutable pendientes | H0 |
| 3 | DEC-005, DEC-049 | Arquitectura | ADR-002, mapa de contextos y dependencias | Estructura inicial, ownership y reglas de dependencia | No, salvo excepción | Ningún módulo futuro vacío ni acceso global a datos | H0 |
| 4 | DEC-044, DEC-051, DEC-063 | Calidad + Arquitectura | Riesgos, stack y aceptación R0 | Errores, pruebas y Definition of Done | ADR de pruebas | Gates repetibles cubren arquitectura y aislamiento | H0 |
| 5 | DEC-007, DEC-008 | Producto + Arquitectura | ADR-004 Accepted | Aplicar matriz SaaS/tenant/sucursal | ADR-004 | Todo dato de R0/R1 tiene dueño, alcance y prueba | H1 |
| 6 | DEC-006, DEC-009 | Arquitectura + Seguridad | ADR-004/010, threat model, spike autorizado | Aislamiento y contexto aplicados/probados | ADR-004/010 | Pruebas negativas demuestran aislamiento y contexto cerrado | H1 |
| 7 | DEC-010 a DEC-012 | Producto + Operaciones | ADR-010 Accepted | Aplicar estación, sucursal derivada, turno y reubicación | ADR-010 | Ninguna operación usa contexto ambiguo o seleccionado | H1 |
| 8 | DEC-013 a DEC-016 | Seguridad + Arquitectura | ADR-011 Accepted | Aplicar autenticación, protección técnica del PIN, sesión, inactividad y atribución | ADR-011 | Usuario y contexto se reconstruyen sin confiar en entrada manipulable y pasan pruebas negativas | H1 |
| 9a | DEC-017, DEC-018 | Producto + Seguridad | ADR-012 Accepted, acciones de R0/R1 | Aplicar roles/capacidades y componer matriz mínima por rebanada | ADR-012 | Unión, alcance, revocación y denegación server-side probados | H1 |
| 9b | DEC-019, DEC-020 | Producto + Seguridad | ADR-013 Accepted y riesgos por rebanada | Clasificar, aplicar y probar control reforzado | ADR-013 | Nivel, reautenticación, motivo, autoridad, un solo uso e invalidación probados por acción | H1 |
| 10 | DEC-038, DEC-045 a DEC-048, DEC-055 | Arquitectura + Operaciones + Seguridad | Contexto, tiempo, errores | Tiempo, logs, auditoría mínima, observabilidad y secretos | ADR de tiempo/auditoría cuando corresponda | Sistema operable sin exponer secretos | H1 |
| 11 | DEC-050, DEC-052 | Arquitectura + Ingeniería | Tenancy, ownership, pruebas | Migraciones y fixtures reproducibles | ADR de persistencia/migraciones | Dos tenants pueden instalarse, migrarse y probarse aisladamente | H1 |
| 12 | DEC-003, DEC-026, DEC-027 a DEC-030 | Producto + Operaciones | Future-state y RMCA | Alcance R1, lenguaje, estados, ubicación y custodia | ADR estados/custodia | Inicio de orden y custodia es coherente y atómico | H2 |
| 13 | DEC-021 a DEC-025 | Producto + Arquitectura | Alcance tenant/sucursal y spike de concurrencia | Folio e idempotencia aceptados | ADR nuevo de folio/idempotencia | Doble envío o concurrencia no duplican identidad operativa | H2 |
| 14 | DEC-032 a DEC-036 | Producto + Arquitectura | Matriz de alcance y decisiones RMCA | Política efectiva, snapshot, vigencia y campos | ADR nuevo de política efectiva | Una recepción histórica puede explicarse | H2 |
| 15 | DEC-039 a DEC-042, DEC-057, DEC-058 | Producto + Seguridad + Operaciones | Evidencia requerida, proveedores y fallos | Archivos, evidencia, impresión y degradación definidos | ADR de archivos | Fallo lateral no revierte orden válida ni filtra datos | H2/H3 |
| 16 | DEC-031, DEC-046, DEC-053, DEC-054 | Operaciones + Arquitectura | R1–R5, auditoría y almacenamiento | Fin de custodia, backup y restore demostrados | ADR de entrega/recuperación | Entrega y restauración son trazables e idempotentes | H3 |
| 17 | DEC-059 a DEC-061, DEC-065, DEC-068 | Producto + Operaciones | Datos legado, recorrido completo, capacidad | Plan de convivencia, piloto, soporte y tenant piloto | ADR de convivencia | Piloto tiene fuente de verdad, límites, salida y rollback | H3 |
| 18 | DEC-056, DEC-064, DEC-066, DEC-067, DEC-069, DEC-070 | Producto + Seguridad + Operaciones | Evidencia piloto, oferta y obligaciones | Gate de producción, ciclo de tenant y riesgos residuales | ADR de ciclo de tenant | Todos los criterios H4 tienen evidencia y autoridad | H4 |
| 19 | DEC-043, DEC-071 a DEC-082 | Producto + Arquitectura | Señales futuras medibles | Registro de diferimiento vigente | Sólo si se reabre | Ninguna decisión entra al MVP sin cambiar alcance formalmente | H5 |

## Cadencia de cierre por paquete

1. confirmar autoridad y pregunta;
2. reunir evidencia de las fuentes enlazadas;
3. responder preguntas de Producto antes del diseño técnico dependiente;
4. autorizar y ejecutar spike sólo cuando la incertidumbre sea empírica;
5. preparar ADR o registro de decisión con alternativas;
6. revisar seguridad, datos, operación y evolución;
7. aceptar, rechazar o diferir explícitamente;
8. actualizar inventario, gate afectado y trazabilidad.

## Reglas de control

- no hay cierre por consenso informal;
- una decisión puede dividirse si mezcla autoridades o consecuencias distintas;
- un spike no elige arquitectura: reduce incertidumbre;
- una ADR aceptada no sustituye criterios de aceptación ni pruebas;
- el avance al siguiente hito requiere todos los criterios obligatorios, no una mayoría.
