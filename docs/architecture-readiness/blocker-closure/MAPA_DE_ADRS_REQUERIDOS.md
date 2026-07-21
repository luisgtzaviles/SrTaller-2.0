# Mapa de ADRs requeridos

## Regla de uso

Este mapa prioriza trabajo de decisión; no crea ni acepta ADRs. Cada ADR sólo debe abrirse cuando tenga una pregunta irreversible, alternativas reales, consecuencias y autoridad identificada. Las decisiones puramente de producto se cierran fuera de un ADR y luego se usan como entrada.

## Estado de los ADRs existentes

| ADR | Tema | Estado | Hito relacionado | Acción requerida |
| --- | --- | --- | --- | --- |
| ADR-001 | Lenguaje y runtime | Proposed | H0 | Revisar contra alcance R0 y aceptar, reemplazar o rechazar |
| ADR-002 | Monolito modular inicial | Accepted | H0 cerrado | Aplicar y verificar; no reabrir sin evidencia |
| ADR-003 | Persistencia principal | Proposed | H0/H1 | Revisar junto con ownership y migraciones |
| ADR-004 | Estrategia multitenant y propiedad lógica | Accepted | H1 parcialmente cerrado | Aplicar invariantes; RLS y contexto operativo siguen separados |
| ADR-005 | NestJS para backend y API | Proposed | H0 | Confirmar frontera de backend y restricciones del framework |
| ADR-006 | Next.js para clientes web | Proposed | Antes de la primera UI | Revisar por superficie; no asumir una única necesidad |
| ADR-007 | Despliegues mediante contenedores | Proposed | Antes del primer despliegue | Revisar artefacto, promoción, rollback y operación |
| ADR-008 | Resolución de tenant por subdominios wildcard | Proposed | H1/antes de acceso externo | Revisar DNS, certificados, dominios y fuente confiable del tenant |
| ADR-009 | Monorepo con workspaces | Proposed | H0 | Revisar junto con ownership, pipeline y estructura inicial |

`Proposed` no equivale a decisión cerrada ni autoriza implementación.

## Backlog priorizado de ADRs

| Prioridad | Decisión arquitectónica | Decisiones previas | ¿Requiere Producto? | ¿Requiere spike? | Resultado esperado | Hito |
| --- | --- | --- | --- | --- | --- | --- |
| Cerrado | Estrategia multitenant, propiedad lógica y aislamiento de datos | DEC-007, DEC-008 | Respondido | RLS sólo si sigue candidato | ADR-004 aceptado; falta evidencia de aplicación y pruebas | H1 |
| 2 | Contexto operativo de tenant y sucursal | DEC-010 a DEC-012, DEC-037 | Sí | Condicional, para resolución segura del contexto | Fuente confiable, selección, cambio, alcance y auditoría del contexto | H1 |
| 3 | Identidad, sesión, PIN e inactividad; crear ADR específico | DEC-013 a DEC-015 | Sí | Sí, si PIN/estación compartida siguen en alcance | Separación entre identidad, credencial, sesión y actor operativo | H1 |
| 4 | Roles, permisos, acciones sensibles y reautenticación | DEC-017 a DEC-020 | Sí | No por defecto | Autorización server-side por acción y alcance | H1 |
| 5 | Persistencia, ownership de repositorios y migraciones; revisar ADR-003 | DEC-006, DEC-049, DEC-050 | No para mecanismo; sí para datos globales | Condicional | Propiedad de escritura, evolución de esquema y recuperación definidas | H1 |
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

## Próximo ADR recomendado

ADR-004 ya está aceptado. La siguiente revisión prioritaria es un **ADR de contexto operativo de tenant y sucursal**: debe decidir fuente confiable, estación, sucursal activa, cambio de turno/contexto, asignación multisucursal, ausencia segura y auditoría sin reabrir propiedad lógica ni permitir operación cruzada de Órdenes.

Después corresponde el ADR de identidad, sesión y PIN, usando el contexto operativo ya delimitado. RLS permanece como experimento técnico y decisión condicionada a PostgreSQL; no es requisito para reabrir ADR-004.

ADR-001, ADR-003, ADR-005 y ADR-009 siguen siendo el lote mínimo de plataforma para el primer commit. Pueden prepararse en paralelo, pero no sustituyen el cierre de multitenancy para completar R0.

## Condiciones para llevar un ADR a revisión

- pregunta de decisión delimitada y hito bloqueado;
- decisiones de Producto necesarias ya respondidas;
- al menos dos alternativas viables y sus consecuencias;
- evidencia de spike cuando la incertidumbre es empírica;
- efecto en seguridad, datos, operación y evolución;
- criterios verificables de cumplimiento;
- responsables de aceptar y de aplicar la decisión;
- enlaces a fuentes y decisiones dependientes.
