# Mapa de ADRs requeridos

## Regla de uso

Este mapa prioriza trabajo de decisión; no crea ni acepta ADRs. Cada ADR sólo debe abrirse cuando tenga una pregunta irreversible, alternativas reales, consecuencias y autoridad identificada. Las decisiones puramente de producto se cierran fuera de un ADR y luego se usan como entrada.

## Estado de los ADRs existentes

| ADR | Tema | Estado | Hito relacionado | Acción requerida |
| --- | --- | --- | --- | --- |
| ADR-001 | TypeScript y Node.js `24.x` | Accepted | H0 parcialmente cerrado | Aplicar política LTS/EOL, validación runtime y gobierno de excepciones |
| ADR-002 | Monolito modular inicial | Accepted | H0 cerrado | Aplicar y verificar; no reabrir sin evidencia |
| ADR-003 | PostgreSQL como persistencia principal | Accepted | Motor H0 cerrado; mecanismos H1 abiertos | Aplicar junto con ownership y migraciones; baseline PostgreSQL 18.x |
| ADR-004 | Estrategia multitenant y propiedad lógica | Accepted | H1 parcialmente cerrado | Aplicar invariantes; RLS queda separado y contexto se rige por ADR-010 |
| ADR-005 | NestJS como shell técnico del backend | Accepted — 2026-07-22 | H0 parcialmente cerrado | Aplicar condiciones; no reutilizar SPIKE-009 como scaffold ni inferir tooling |
| ADR-006 | Next.js para clientes web | Proposed | Antes de la primera UI | Revisar por superficie; no asumir una única necesidad |
| ADR-007 | Despliegues mediante contenedores | Proposed | Antes del primer despliegue | Revisar artefacto, promoción, rollback y operación |
| ADR-008 | Resolución de tenant por subdominios wildcard | Proposed | H1/antes de acceso externo | Revisar DNS, certificados, dominios y fuente confiable del tenant |
| ADR-009 | Repositorio único evolutivo y workspaces bajo demanda | Accepted | Topología H0 cerrada; tooling abierto | Aplicar límites; no crear workspaces, apps, packages ni desplegables sin condición y autoridad |
| ADR-010 | Contexto operativo derivado de estación vinculada | Accepted | H1 parcialmente cerrado | Aplicar invariantes; identidad/sesión se rigen por ADR-011 y autorización por ADR-012 |
| ADR-011 | Identidad, autenticación por PIN y sesión operativa | Accepted | H1 parcialmente cerrado | Aplicar invariantes; mecanismos técnicos y autorización se rige por ADR-012 |
| ADR-012 | Roles de tenant, capacidades y autorización contextual | Accepted | H1 parcialmente cerrado | Aplicar invariantes y definir composición por rebanada; refuerzo se rige por ADR-013 |
| ADR-013 | Acciones sensibles y autorización reforzada | Accepted | H1 parcialmente cerrado | Clasificar por rebanada, aplicar niveles y demostrar reautenticación/segregación; mecanismos siguen separados |

`Proposed` no equivale a decisión cerrada ni autoriza implementación.

## Backlog priorizado de ADRs

| Prioridad | Decisión arquitectónica | Decisiones previas | ¿Requiere Producto? | ¿Requiere spike? | Resultado esperado | Hito |
| --- | --- | --- | --- | --- | --- | --- |
| Cerrado | Lenguaje y runtime inicial | DEC-001, DEC-002 | No; Arquitectura + Ingeniería aceptaron | No para aceptar | ADR-001 Accepted: TypeScript y Node.js `24.x`; faltan scaffold y evidencia cuando se autoricen | H0 parcialmente cerrado |
| Cerrado | Estrategia multitenant, propiedad lógica y aislamiento de datos | DEC-007, DEC-008 | Respondido | RLS sólo si sigue candidato | ADR-004 aceptado; falta evidencia de aplicación y pruebas | H1 |
| Cerrado | Contexto operativo de tenant y sucursal | DEC-009 a DEC-012 | Respondido | No para aceptar el modelo | ADR-010 aceptado; falta evidencia de aplicación y pruebas | H1 |
| Cerrado | Identidad, sesión, PIN e inactividad | DEC-013 a DEC-016 | Respondido | Mecanismos técnicos aún pueden requerir evidencia | ADR-011 aceptado; falta aplicación, modelo de amenazas y pruebas | H1 |
| Cerrado | Modelo de roles, capacidades y autorización ordinaria | DEC-017, DEC-018 | Respondido | No para aceptar el modelo | ADR-012 aceptado; faltan composición por rebanada, aplicación y pruebas | H1 |
| Cerrado | Modelo de acciones sensibles y reautenticación | DEC-019, DEC-020 | Respondido | No para aceptar el modelo | ADR-013 aceptado; faltan política por acción, mecanismo, aplicación y pruebas | H1 |
| Cerrado | Repositorio único evolutivo y workspaces bajo demanda | DEC-004, DEC-005, DEC-049 | No para topología; Producto participa ante nuevas superficies | No para aceptar | ADR-009 Accepted: una aplicación/artefacto para R0; tooling y estructura física siguen separados | H0 parcialmente cerrado |
| Cerrado | Framework backend y API inicial | DEC-004, ADR-001/002/003/004/009–013 | No para la decisión; siguen pendientes decisiones de implementación | [SPIKE-009](../../../spikes/spike-009-nestjs-shell/RESULTS.md) completado y aprobado con condiciones no bloqueantes | ADR-005 Accepted: NestJS 11.x, referencia 11.1.28, Express y REST/HTTP JSON mínima; condiciones previas a implementar conservadas | H0 parcialmente cerrado |
| 5 | Persistencia PostgreSQL, ownership de repositorios y migraciones; aplicar ADR-003 | DEC-006, DEC-049, DEC-050 | No para mecanismo; sí para datos globales | Condicional | Propiedad de escritura, tooling, evolución de esquema y recuperación definidos | H1 |
| 6 | Tiempo y zonas horarias | DEC-037, DEC-038 | Sí | Condicional para casos límite | Instante autoritativo, zona operacional y reglas de presentación | H1 |
| 7 | Auditoría y atribución | DEC-016, DEC-019, DEC-046 | Sí | No por defecto | Hechos auditables, actor, contexto, integridad, acceso y retención inicial | H1/H3 |
| 8 | Estrategia de pruebas de arquitectura y aislamiento | DEC-051, DEC-052, DEC-062 | No para técnica; sí para aceptación | No | Gates repetibles, datos de dos tenants y pruebas de denegación | H0/H1 |
| 9 | Folio, reserva, concurrencia e idempotencia; crear ADR específico | DEC-021 a DEC-025 | Sí | Sí, concurrencia de folio | Identidad técnica separada del folio y creación exactamente efectiva una vez | H2 |
| 10 | Política efectiva, vigencia y snapshots; crear ADR específico | DEC-032 a DEC-035 | Sí | Condicional | Precedencia segura y reproducción histórica | H2 |
| 11 | Estados, ubicación y custodia | DEC-027 a DEC-031 | Sí | No por defecto | Invariantes, transiciones y límites transaccionales explícitos | H2/H3 |
| 12 | Archivos y evidencias | DEC-039, DEC-040, DEC-057 | Sí | Sí, si el proveedor o límites siguen inciertos | Puerto, metadatos, autorización, integridad, límites y eliminación | H2/H3 |
| 13 | Dinero, cotización y autorización comercial | Modelo integrado y alcance R2–R4 | Sí | Condicional | Valor, moneda, redondeo, vigencia y autorización reproducibles | Antes de R2/R3 |
| 14 | Entrega idempotente y fin de custodia | DEC-031, identidad, pagos | Sí | Sí, para reintentos/concurrencia si corresponde | Una entrega efectiva, autoridad y evidencia | Antes del piloto |
| 15 | Convivencia, corte o migración desde SR Taller 1.0 | DEC-059, DEC-060 | Sí | Sí, sobre datos reales sólo en entorno autorizado y aislado | Fuente de verdad, unidad de corte, reconciliación y salida | H3 |
| 16 | Backups, restauración y rollback operativo | DEC-053, DEC-054, DEC-061 | No para mecanismo; sí para tolerancia de pérdida | Sí, restore aislado | Evidencia de recuperación y runbook ejecutable | H3/H4 |
| 17 | Ciclo de vida de tenant, suspensión y cierre | DEC-056, DEC-067, DEC-069, DEC-070 | Sí | No por defecto | Estados, efectos, exportación, retención y eliminación gobernados | H4 |

## Próxima decisión recomendada

ADR-005 fue aceptado con condiciones el 2026-07-22 después de que Seguridad, Operaciones y Calidad aprobaran la remediación enfocada de [SPIKE-009](../../../spikes/spike-009-nestjs-shell/RESULTS.md). Resuelve el shell NestJS, Express y REST/HTTP JSON mínima sin inferir package manager, lockfile, estructura física ni autorización de implementación. El siguiente trabajo de DEC-004 es cerrar tooling y baseline ejecutable. ADR-006, ADR-007 y ADR-008 conservan sus gates posteriores.

ADR-001, ADR-003, ADR-004, ADR-009 y ADR-010 a ADR-013 ya están aceptados. En paralelo, la siguiente revisión de seguridad debe preparar la aplicación y prueba de esos contratos y clasificar las acciones concretas de cada rebanada. El ADR de auditoría permanece separado para integridad, retención, consulta y evidencia técnica.

Protección técnica del PIN, intentos, recuperación y formato de sesión siguen como diseño/evidencia dependiente de ADR-011. La propagación de cambios de autorización depende de ADR-012 y la invalidación de controles reforzados de ADR-013. RLS permanece como experimento técnico y decisión condicionada a PostgreSQL; no es requisito para reabrir ADR-004.

ADR-001, ADR-003, ADR-005 y ADR-009 están `Accepted` y satisfacen lenguaje/runtime, motor, shell backend, adaptador/API mínima y topología de repositorio dentro del lote de plataforma. PostgreSQL 18.x es la baseline de R0 y PostgreSQL 18.4 la versión efectiva inicial; NestJS 11.x es la major y `11.1.28` la referencia a revalidar. `DEC-004` continúa pendiente de package manager, lockfile, scripts de instalación, módulos/compilación, baseline integrada, CI Linux y reproducibilidad final; el primer cambio de implementación de R0 permanece bloqueado. `DEC-002` y `DEC-062` aportan alcance y aceptación esperada, pero tampoco sustituyen los demás gates técnicos y organizacionales.

## Condiciones para llevar un ADR a revisión

- pregunta de decisión delimitada y hito bloqueado;
- decisiones de Producto necesarias ya respondidas;
- al menos dos alternativas viables y sus consecuencias;
- evidencia de spike cuando la incertidumbre es empírica;
- efecto en seguridad, datos, operación y evolución;
- criterios verificables de cumplimiento;
- responsables de aceptar y de aplicar la decisión;
- enlaces a fuentes y decisiones dependientes.
