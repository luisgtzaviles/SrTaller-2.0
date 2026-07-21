# ADR-002 — Monolito modular orientado al dominio como arquitectura inicial

**Status: Accepted**
**Fecha:** 2026-07-21
**Autoridad de aceptación:** Responsable de Producto, mediante instrucción explícita de la revisión arquitectónica.

## Estado del documento

Decisión arquitectónica aceptada para la arquitectura inicial de SR Taller 2.0. La ruta histórica bajo `proposed/` se conserva para no romper referencias; el estado dentro del ADR y el [registro de decisiones](../README.md) son autoritativos.

Este ADR decide la forma arquitectónica y operativa inicial. No autoriza implementación, no acepta un lenguaje, framework, proveedor, estrategia multitenant física ni motor de persistencia, y no define carpetas, tablas, APIs o infraestructura.

## Contexto

SR Taller 2.0 está en etapa de descubrimiento y arquitectura. El dominio de Reparaciones ya cuenta con un modelo integrado, fronteras conceptuales, invariantes, límites transaccionales candidatos, riesgos y una secuencia incremental R0–R6. No existe evidencia de cargas que requieran escalado independiente, varios equipos autónomos por módulo ni ciclos de despliegue separados.

El producto necesita preservar consistencia inmediata en operaciones como crear una Orden e iniciar custodia, decidir conceptos sobre una cotización vigente, registrar movimientos financieros y completar una entrega una sola vez. Distribuir esas responsabilidades desde el inicio introduciría coordinación, contratos y fallos operativos antes de demostrar su necesidad.

El sistema heredado también muestra el riesgo opuesto: una aplicación única sin fronteras puede mezclar presentación, reglas, datos y responsabilidades hasta formar un monolito caótico. La unidad de despliegue no debe convertirse en unidad universal de dominio.

## Evidencia considerada

- La [preparación arquitectónica del MVP](../../architecture-readiness/repair-mvp/README.md) concluye `Preparado con bloqueantes`, propone fronteras internas y una secuencia R0–R6.
- El [modelo integrado del dominio](../../domain-model/integrated-repair-domain-model/README.md) distingue contextos, agregados, hechos y consistencias sin exigir servicios desplegables independientes.
- El [mapa de contextos](../../domain-model/integrated-repair-domain-model/MAPA_DE_CONTEXTOS_DELIMITADOS.md) y sus [relaciones](../../domain-model/integrated-repair-domain-model/RELACIONES_ENTRE_CONTEXTOS.md) sostienen propiedad conceptual y colaboraciones explícitas.
- Los [límites transaccionales candidatos](../../domain-model/integrated-repair-domain-model/LIMITES_TRANSACCIONALES_CANDIDATOS.md) favorecen transacciones locales y procesos visibles, no transacciones distribuidas.
- El análisis de [consistencia y concurrencia](../../domain-model/integrated-repair-domain-model/CONSISTENCIA_Y_CONCURRENCIA.md) exige idempotencia y versiones, pero no una topología distribuida.
- Los [riesgos arquitectónicos](../../architecture-readiness/repair-mvp/RIESGOS_ARQUITECTONICOS.md) identifican tanto microservicios prematuros como agregado gigante, acceso transversal y núcleo compartido creciente.
- No se encontró una decisión aceptada incompatible. Los documentos que mostraban API, workers o tiempo real como desplegables iniciales separados eran propuestas de topología y quedan subordinados a este ADR.

## Fuerzas de decisión

- **Etapa del producto:** las reglas y límites siguen madurando; cambiar dentro de una unidad es menos costoso que cambiar contratos distribuidos.
- **Equipo:** no hay evidencia actual de equipos autónomos por módulo; la decisión se revisará si esa realidad cambia.
- **Velocidad:** un artefacto y un despliegue reducen coordinación y permiten entregar rebanadas completas.
- **Consistencia:** las invariantes críticas pueden protegerse con transacciones locales.
- **Operación:** un despliegue, configuración y observabilidad unificados reducen costo inicial.
- **Dominio:** las fronteras internas evitan que simplicidad operativa signifique mezcla de responsabilidades.
- **Evolución:** la separación futura sigue disponible si aparecen señales objetivas y contratos maduros.

## Alternativas consideradas

### Monolito tradicional sin fronteras

Se descarta porque facilita lógica mezclada, tablas sin dueño, dependencias circulares, controladores con reglas, entidades anémicas y un módulo común creciente. Su simplicidad inicial trasladaría el costo a cada cambio futuro y repetiría problemas observados en el legado.

### Microservicios desde el inicio

Se descartan para el MVP por complejidad operacional, consistencia distribuida, latencia, observabilidad, contratos prematuros, múltiples despliegues, costo de infraestructura y dificultad para cambiar recorridos coordinados. No existe evidencia de escalado, autonomía o aislamiento que compense esos costos.

### Event Sourcing como arquitectura base

Se descarta porque añade almacenamiento y versionado de eventos, proyecciones, migraciones históricas, depuración y operación especializadas sin una necesidad demostrada. Usar eventos internos de dominio no implica Event Sourcing.

### Arquitectura completamente genérica por capas

Se descarta como forma principal porque puede ignorar contextos delimitados, promover repositorios genéricos, servicios globales y lógica sin dueño. Las capas siguen siendo útiles dentro de cada frontera, pero no sustituyen la modularidad orientada al dominio.

## Decisión

SR Taller 2.0 iniciará como un **monolito modular orientado al dominio** con:

1. un único artefacto y despliegue inicial de la aplicación;
2. una sola aplicación backend inicial;
3. una sola base de datos física inicial;
4. propiedad lógica de datos por módulo;
5. fronteras modulares internas explícitas;
6. dependencias controladas y acíclicas entre módulos;
7. comunicación directa y transaccional cuando una invariante requiera consistencia inmediata;
8. eventos internos sólo cuando propaguen hechos útiles o reduzcan acoplamiento;
9. prohibición de usar eventos como sustituto de transacciones críticas;
10. exclusión de microservicios para el MVP;
11. exclusión de Event Sourcing como arquitectura base;
12. exclusión de CQRS completo como requisito inicial;
13. prohibición de crear módulos vacíos por anticipación;
14. prohibición de acceso indiscriminado a datos de otros módulos;
15. prohibición de compartir entidades o agregados mutables entre módulos;
16. un núcleo compartido mínimo y estable;
17. dominio independiente de infraestructura, interfaz y controladores;
18. capa de aplicación responsable de coordinar casos de uso y transacciones;
19. infraestructura responsable de implementar puertos definidos hacia el interior;
20. fronteras preparadas conceptualmente para una extracción futura justificada;
21. ninguna separación futura diseñada o implementada por anticipación;
22. revisión de toda excepción mediante justificación explícita o ADR.

Una sola base física no acepta todavía PostgreSQL, esquema compartido, RLS, base por tenant, nombres de esquema ni tablas. Esas decisiones permanecen bajo sus ADRs correspondientes.

## Qué significa monolito modular

Significa una unidad operativa inicial con múltiples responsabilidades de dominio encapsuladas. No significa:

- una sola capa;
- una sola tabla;
- un agregado gigante;
- acceso global a datos;
- ausencia de módulos;
- ausencia de reglas de dependencia;
- un solo archivo o modelo universal.

## Fronteras conceptuales iniciales

El ADR reconoce como candidatas:

- Identidad y acceso;
- Tenancy y sucursales;
- Usuarios, roles y permisos;
- Configuración;
- Clientes y contactos;
- Órdenes de Servicio;
- Custodia y ubicaciones;
- Diagnóstico técnico;
- Cotización y autorizaciones;
- Ejecución técnica;
- Control de calidad;
- Pagos básicos;
- Entrega;
- Evidencias y documentos;
- Notas y línea temporal;
- Notificaciones;
- Reportes operativos.

No todas deben materializarse como módulos físicos independientes desde el primer cambio de código. Pueden agruparse inicialmente cuando exista cohesión, siempre que se preserven lenguaje, responsabilidad, propiedad y contratos. La fragmentación excesiva es también un riesgo.

La evaluación detallada vive en [Fronteras modulares propuestas](../../architecture-readiness/repair-mvp/FRONTERAS_MODULARES_PROPUESTAS.md); esa evaluación puede evolucionar sin reabrir este ADR mientras respete sus reglas.

## Reglas arquitectónicas obligatorias

Desde R0 y el primer cambio de código:

1. Las tablas o estructuras internas de otro módulo no son contrato público.
2. Un módulo no modifica directamente el estado interno de otro.
3. No se comparten agregados o entidades mutables.
4. No se permiten dependencias circulares.
5. Los controladores no contienen reglas de negocio.
6. Tenant y sucursal no se infieren de datos manipulables por el cliente.
7. Toda operación recibe contexto explícito y verificado de tenant, sucursal cuando aplique y actor.
8. Toda consulta y mutación respeta aislamiento tenant.
9. Los módulos exponen capacidades, no su modelo interno completo.
10. Las transacciones son tan pequeñas como sea posible y tan amplias como la invariante requiera.
11. Los eventos internos representan hechos ocurridos, no órdenes disfrazadas.
12. El dominio no depende de infraestructura, interfaz, controladores ni proveedores.
13. La aplicación coordina autorizaciones, agregados, transacciones, idempotencia y resultados.
14. La infraestructura implementa puertos definidos hacia adentro.
15. Las excepciones requieren ADR o justificación explícita, responsable, riesgo y condición de retiro.

## Núcleo compartido mínimo

Puede contener conceptos estables y transversales como:

- identificadores;
- dinero;
- tiempo;
- contexto tenant;
- errores base;
- contratos técnicos mínimos.

No puede contener reglas específicas de Reparaciones, Cotización, Pagos, Custodia u otro módulo. Su crecimiento se revisará como riesgo de acoplamiento.

## Propiedad de datos

La aplicación usará inicialmente una sola base de datos física, con propiedad lógica por módulo. Compartir base física no autoriza consultas o mutaciones indiscriminadas ni convierte las estructuras internas en contratos.

Los accesos entre módulos se realizan mediante:

- servicios internos o capacidades de aplicación;
- contratos de lectura explícitos;
- proyecciones;
- eventos internos;
- consultas gobernadas y documentadas cuando sean la opción pragmática.

Los joins transversales no serán un contrato arquitectónico permanente. Una excepción debe documentar propósito, módulos afectados, riesgo, responsable y condición de retiro. Este ADR no diseña esquemas ni tablas.

## Comunicación entre módulos

### Comunicación directa

Se utiliza cuando el usuario necesita respuesta inmediata, se protege una invariante o la operación forma parte de una transacción local. La llamada cruza un contrato publicado y el módulo propietario conserva la autoridad.

### Eventos internos

Se utilizan cuando un hecho ya ocurrió, varios consumidores pueden reaccionar, la consistencia eventual es aceptable o un proceso secundario no debe bloquear la acción principal. Al inicio, un consumidor puede ejecutarse dentro del mismo proceso sin comprometer una infraestructura de mensajería.

### Cuándo no usar eventos

No se usan para ocultar una llamada directa necesaria, coordinar consistencia inmediata, representar intenciones como hechos, alimentar consumidores inexistentes o añadir complejidad sin beneficio verificable.

## Despliegue y operación inicial

- Un único artefacto desplegable de aplicación.
- Un único despliegue coordinado por ambiente.
- Una sola aplicación backend que aloja las responsabilidades síncronas y diferibles iniciales.
- Configuración y observabilidad unificadas por ambiente.
- Transacciones locales cuando corresponda.
- Fallos aislados lógicamente mediante límites y manejo explícito; no físicamente por servicio.
- Migraciones coordinadas con el mismo despliegue, cuando sean autorizadas en el futuro.
- Escalado horizontal del conjunto completo si la demanda lo requiere antes de una extracción.

No se decide proveedor cloud, contenedores, orquestador, CI/CD, lenguaje, framework ni motor de base de datos. Las responsabilidades de trabajos diferibles o tiempo real pueden existir dentro de la aplicación sin convertirse en desplegables separados.

## Consecuencias positivas

- Menor complejidad y costo operativos iniciales.
- Mayor velocidad para R0–R6.
- Transacciones locales para invariantes críticas.
- Depuración y reproducción más sencillas.
- Observabilidad y configuración centralizadas.
- Cambios coordinados sin contratos de red prematuros.
- Conservación de fronteras y lenguaje de dominio.
- Refactorización y extracción futuras posibles con evidencia.

## Consecuencias negativas

- Un solo despliegue contiene cambios de varios módulos.
- El escalado inicial se aplica al conjunto.
- Un fallo de proceso puede afectar toda la aplicación.
- Existe riesgo continuo de acoplamiento y acceso directo a datos.
- Las fronteras dependen de disciplina y controles verificables.
- Los cambios de esquema y despliegue deben coordinarse.
- El núcleo compartido puede crecer indebidamente.
- Se necesitan pruebas de arquitectura y revisión periódica.

## Controles de cumplimiento

### Obligatorios desde R0

- ownership explícito de módulos y datos;
- revisión de dependencias y ciclos;
- convenciones de importación;
- revisión de código para reglas de frontera;
- documentación de puertos/capacidades públicas;
- ADR o justificación para excepciones;
- pruebas de aislamiento tenant en cada rebanada.

### Incorporación progresiva

- pruebas automatizadas de arquitectura;
- análisis estático de dependencias;
- catálogo versionado de eventos internos;
- métricas de acoplamiento y ciclos;
- revisión periódica de fronteras;
- controles automatizados sobre el núcleo compartido.

La automatización concreta depende del conjunto tecnológico que se acepte; la obligación de respetar las reglas no se difiere.

## Criterios para considerar una extracción

Un módulo sólo se evalúa como candidato a extracción cuando exista evidencia de una o más señales:

- necesidad de despliegue independiente;
- escalado claramente distinto;
- requisitos regulatorios, de seguridad o aislamiento;
- equipo responsable autónomo;
- infraestructura especializada;
- ciclo de cambios independiente;
- carga operativa significativa;
- límites de datos y contratos maduros;
- impacto medido del acoplamiento actual;
- fallos cuya propagación no pueda mitigarse razonablemente dentro del monolito.

La existencia de un contexto delimitado conceptual no basta. Toda extracción requiere un nuevo ADR con costos, migración de datos, consistencia, operación y reversibilidad.

## Riesgos y mitigaciones

| Riesgo | Señal | Mitigación |
| --- | --- | --- |
| Monolito caótico | Acceso transversal, ciclos y reglas en controladores | Ownership, contratos, revisión y pruebas de arquitectura |
| Agregado gigante | Toda operación carga o bloquea Orden completa | Límites transaccionales pequeños y versiones explícitas |
| Núcleo compartido creciente | Reglas de módulos aparecen en código común | Catálogo limitado y revisión obligatoria |
| Fronteras sólo nominales | Carpetas distintas comparten entidades/tablas | Capacidades públicas y persistencia propietaria |
| Eventos indiscriminados | Cada cambio publica eventos sin consumidor | Criterios de comunicación y catálogo revisado |
| Fragmentación excesiva | Módulos vacíos y coordinación constante | Agrupación física por cohesión y extracción sólo con evidencia |
| Fallo de unidad completa | Un error afecta todo el proceso | Manejo de fallos, observabilidad, recuperación y escalado horizontal |

## Disparadores de revisión futura

Reconsiderar esta decisión ante:

- crecimiento importante del equipo o equipos autónomos;
- módulos con escalado sustancialmente desigual;
- despliegues coordinados que reduzcan la velocidad de entrega de forma medible;
- fallos que afecten repetidamente todo el sistema;
- requisitos regulatorios o de aislamiento físico;
- una frontera con ownership, datos y contratos maduros;
- necesidad demostrada de infraestructura especializada;
- costo operativo de mantener la unidad superior al de distribuirla.

Revisar no implica migrar automáticamente a microservicios. Puede resultar en fortalecer fronteras, separar procesos dentro del mismo despliegue o mantener la decisión.

## Asuntos deliberadamente no decididos

- lenguaje y frameworks;
- motor y estrategia lógica de base de datos;
- mecanismo multitenant físico y RLS;
- agrupación física definitiva de fronteras;
- estructura de carpetas o repositorio;
- contenedores, proveedor cloud, orquestador y CI/CD;
- mensajería externa, colas o patrón de publicación confiable;
- topología de clientes web.

## Trazabilidad

- [Architecture Readiness del MVP](../../architecture-readiness/repair-mvp/README.md)
- [Monolito modular](../../architecture-readiness/repair-mvp/MONOLITO_MODULAR.md)
- [Reglas de dependencia](../../architecture-readiness/repair-mvp/REGLAS_DE_DEPENDENCIA.md)
- [Riesgos arquitectónicos](../../architecture-readiness/repair-mvp/RIESGOS_ARQUITECTONICOS.md)
- [Plan R0–R6](../../architecture-readiness/repair-mvp/PLAN_DE_REBANADAS_VERTICALES.md)
- [Decisiones bloqueantes](../../architecture-readiness/repair-mvp/DECISIONES_BLOQUEANTES.md)
- [Modelo de Dominio Integrado](../../domain-model/integrated-repair-domain-model/README.md)
- [Mapa de contextos delimitados](../../domain-model/integrated-repair-domain-model/MAPA_DE_CONTEXTOS_DELIMITADOS.md)
- [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md)
- [Arquitectura de datos](../../architecture/DATA_ARCHITECTURE.md)

## Próxima revisión

Al aparecer un disparador observable de extracción o una contradicción material con el dominio. No existe fecha automática de caducidad.
