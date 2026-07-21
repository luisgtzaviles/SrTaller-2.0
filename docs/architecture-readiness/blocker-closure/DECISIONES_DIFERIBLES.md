# Decisiones diferibles

## Regla

Una decisión es diferible cuando el MVP puede completar su flujo e invariantes mediante una alternativa simple y explícita. Diferir no autoriza acoplamiento accidental ni crea un compromiso futuro.

## Diferibles dentro de los primeros hitos

| Decisión | Puede diferirse si | Punto de activación |
| --- | --- | --- |
| Wildcard/subdominios | Tenant se resuelve por un mecanismo seguro alternativo | Antes de routing productivo por hostname |
| RLS | Aislamiento por aplicación/repositorios está probado | Antes de adoptar esquema compartido productivo si sigue aportando defensa |
| Proveedor de archivos | Existe puerto, metadatos y almacenamiento seguro de desarrollo/piloto | Antes de datos reales o proveedor definitivo |
| Proveedor/impresora | El folio manual satisface identificación física | Antes de automatizar impresión |
| Cola externa | No hay efecto diferible con volumen/fallo que la requiera | Antes del primer job real |
| Tiempo real | Consulta/refresco resuelve la experiencia | Cuando un recorrido demuestre latencia requerida |
| Contenedores definitivos | Desarrollo reproducible y promoción todavía no ocurren | Antes del primer ambiente compartido/release |
| Framework de todas las webs | R0/R1 no necesitan esas superficies | Antes de crear cada cliente |
| Dispositivo persistente | Sesión atribuible cubre operación conectada | Cuando POS/offline tenga caso validado |
| QR | Folio legible y etiqueta/manual identifican | Cuando escaneo demuestre valor operativo |

## H5 — Fuera del bloqueo del MVP

| IDs | Capacidad | Motivo de diferir |
| --- | --- | --- |
| DEC-071 | Microservicios | ADR-002 ya cubre la etapa inicial; no hay señal de extracción |
| DEC-072 | Event Sourcing | No existe necesidad de reconstrucción por eventos |
| DEC-073 | CQRS completo | Consultas publicadas/proyecciones selectivas bastan |
| DEC-074 | BI/data warehouse | Faltan datos y preguntas analíticas reales |
| DEC-075 | Inteligencia artificial | No debe intervenir en invariantes sin caso/gobernanza |
| DEC-076 | RFID/NFC | Folio e identificación física cubren custodia inicial |
| DEC-077 | Inventario, compras y proveedores completos | R1–R5 usan conceptos descriptivos sin stock ficticio |
| DEC-078 | CRM omnicanal/WhatsApp | Aviso manual y hechos notificables desacoplan proveedor |
| DEC-079 | Promociones avanzadas | Precios y ajustes básicos pueden gobernarse sin motor general |
| DEC-080 | Portal/pagos en línea | Amplían actores, fraude y superficie pública |
| DEC-081 | Dispositivo global/offline | Exigen conflictos, sincronización y revocación adicionales |
| DEC-082 | Multi-región | No hay requisito de residencia/capacidad que la justifique |

## Detalles que pueden cerrarse durante implementación

Siempre que el ADR y el criterio de aceptación ya fijen la frontera, pueden decidirse localmente nombres internos, organización de archivos, mensajes de error no contractuales, detalles de instrumentación, forma de fixtures, algoritmo de paginación y composición de consultas publicadas.

No son detalles locales: contexto tenant, permisos, propiedad de datos, límites transaccionales, folio, idempotencia, política efectiva, retención o semántica de entrega.
