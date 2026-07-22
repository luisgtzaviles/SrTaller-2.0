# Mapa de ADRs requeridos

## Regla de uso

Este mapa prioriza trabajo de decisión; no crea ni acepta ADRs. Cada ADR sólo debe abrirse cuando tenga una pregunta irreversible, alternativas reales, consecuencias y autoridad identificada. Las decisiones puramente de producto se cierran fuera de un ADR y luego se usan como entrada.

## Estado de los ADRs existentes

| ADR | Tema | Estado | Hito relacionado | Acción requerida |
| --- | --- | --- | --- | --- |
| ADR-001 | Lenguaje y runtime | Proposed | H0 | Revisar contra alcance R0 y aceptar, reemplazar o rechazar |
| ADR-002 | Monolito modular inicial | Accepted | H0 cerrado | Aplicar y verificar; no reabrir sin evidencia |
| ADR-003 | Persistencia principal | Proposed | H0/H1 | Revisar junto con ownership y migraciones |
| ADR-004 | Estrategia multitenant y propiedad lógica | Accepted | H1 parcialmente cerrado | Aplicar invariantes; RLS queda separado y contexto se rige por ADR-010 |
| ADR-005 | NestJS para backend y API | Proposed | H0 | Confirmar frontera de backend y restricciones del framework |
| ADR-006 | Next.js para clientes web | Proposed | Antes de la primera UI | Revisar por superficie; no asumir una única necesidad |
| ADR-007 | Despliegues mediante contenedores | Proposed | Antes del primer despliegue | Revisar artefacto, promoción, rollback y operación |
| ADR-008 | Resolución de tenant por subdominios wildcard | Proposed | H1/antes de acceso externo | Revisar DNS, certificados, dominios y fuente confiable del tenant |
| ADR-009 | Monorepo con workspaces | Proposed | H0 | Revisar junto con ownership, pipeline y estructura inicial |
| ADR-010 | Contexto operativo derivado de estación vinculada | Accepted | H1 parcialmente cerrado | Aplicar invariantes; identidad/sesión se rigen por ADR-011 y autorización por ADR-012 |
| ADR-011 | Identidad, autenticación por PIN y sesión operativa | Accepted | H1 parcialmente cerrado | Aplicar invariantes; mecanismos técnicos y autorización se rige por ADR-012 |
| ADR-012 | Roles de tenant, capacidades y autorización contextual | Accepted | H1 parcialmente cerrado | Aplicar invariantes y definir composición por rebanada; acciones sensibles/refuerzo siguen separados |

`Proposed` no equivale a decisión cerrada ni autoriza implementación.

## Backlog priorizado de ADRs

| Prioridad | Decisión arquitectónica | Decisiones previas | ¿Requiere Producto? | ¿Requiere spike? | Resultado esperado | Hito |
| --- | --- | --- | --- | --- | --- | --- |
| Cerrado | Estrategia multitenant, propiedad lógica y aislamiento de datos | DEC-007, DEC-008 | Respondido | RLS sólo si sigue candidato | ADR-004 aceptado; falta evidencia de aplicación y pruebas | H1 |
| Cerrado | Contexto operativo de tenant y sucursal | DEC-009 a DEC-012 | Respondido | No para aceptar el modelo | ADR-010 aceptado; falta evidencia de aplicación y pruebas | H1 |
| Cerrado | Identidad, sesión, PIN e inactividad | DEC-013 a DEC-016 | Respondido | Mecanismos técnicos aún pueden requerir evidencia | ADR-011 aceptado; falta aplicación, modelo de amenazas y pruebas | H1 |
| Cerrado | Modelo de roles, capacidades y autorización ordinaria | DEC-017, DEC-018 | Respondido | No para aceptar el modelo | ADR-012 aceptado; faltan composición por rebanada, aplicación y pruebas | H1 |
| 4 | Acciones sensibles y reautenticación | DEC-019, DEC-020 | Sí | No por defecto | Catálogo, control reforzado, vigencia, motivo y autoridad por acción | H1 |
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

ADR-004, ADR-010, ADR-011 y ADR-012 ya están aceptados. La siguiente revisión de seguridad prioritaria es el **ADR de acciones sensibles y autorización reforzada**. Debe partir de la capacidad ordinaria aceptada y cerrar catálogo, reautenticación, vigencia, motivo, segundo actor y segregación aplicables a R0/R1.

Protección técnica del PIN, intentos, recuperación y formato de sesión siguen como diseño/evidencia dependiente de ADR-011. El mecanismo de propagación de cambios de autorización depende de ADR-012 y debe impedir que una capacidad revocada autorice la siguiente operación protegida. RLS permanece como experimento técnico y decisión condicionada a PostgreSQL; no es requisito para reabrir ADR-004.

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
