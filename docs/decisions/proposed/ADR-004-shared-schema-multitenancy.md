# ADR-004 — Multitenancy con base y esquema compartidos

**Status: Accepted**
**Fecha:** 2026-07-21
**Autoridad de aceptación:** Responsable de Producto, mediante las decisiones explícitas de propiedad, aislamiento y alcance registradas en la revisión de ADR-004.

## Estado del documento

Decisión aceptada para la estrategia multitenant inicial de SR Taller 2.0. La ruta histórica bajo `proposed/` se conserva para no romper referencias; el estado dentro de este ADR y el [registro de decisiones](../README.md) son autoritativos.

Este ADR fija la topología lógica inicial, la propiedad de datos y las invariantes de aislamiento. No autoriza implementación, no selecciona motor de base de datos, no diseña tablas, columnas físicas, SQL, migraciones, endpoints, middleware o interfaces y no acepta RLS.

## Contexto

SR Taller 2.0 es un SaaS para organizaciones de talleres. Un tenant representa al dueño u organización de un taller y puede tener una o más sucursales. La cantidad de sucursales activas puede depender de su membresía o plan, sin que este ADR diseñe ese enforcement comercial.

El aislamiento entre tenants es obligatorio desde R0. Compartir aplicación y persistencia reduce costo y complejidad operativa inicial, pero amplifica el impacto de una consulta, trabajo en segundo plano, caché, archivo o reporte que omita su contexto. La decisión debe hacer explícitos tanto el dueño lógico de cada concepto como el alcance desde el cual puede operarse.

[ADR-002](ADR-002-modular-monolith-first.md) ya acepta una sola aplicación de servidor, una sola base de datos física inicial y propiedad lógica por módulo. ADR-004 decide cómo esa unidad preserva la separación entre SaaS, tenant y sucursal. El motor de persistencia continúa bajo [ADR-003](ADR-003-postgresql-primary-database.md).

## Fuerzas de decisión

- El acceso entre tenants debe denegarse por defecto desde R0.
- La sucursal necesita confinamiento operativo sin convertirse en un tenant separado.
- El MVP requiere operación, despliegue y migraciones simples y coordinados.
- Los módulos deben conservar propiedad de datos dentro de una persistencia compartida.
- La pertenencia local de clientes, Órdenes, pagos y evidencias debe sostener automatizaciones confiables.
- Catálogos, precios y configuración necesitan compartir valores sin perder procedencia ni autoridad.
- Soporte, reportes y trabajos en segundo plano no pueden convertirse en rutas de evasión.
- La estrategia debe poder evolucionar si regulación, recuperación o carga aportan evidencia suficiente.

## Evidencia y compatibilidad

La decisión considera:

- el [modelo multitenant del MVP](../../architecture-readiness/repair-mvp/MODELO_MULTITENANT.md);
- el [modelo de configuración](../../architecture-readiness/repair-mvp/MODELO_DE_CONFIGURACION.md);
- las [reglas de dependencia](../../architecture-readiness/repair-mvp/REGLAS_DE_DEPENDENCIA.md);
- la [seguridad y acciones sensibles](../../architecture-readiness/repair-mvp/SEGURIDAD_Y_ACCIONES_SENSIBLES.md);
- el [inventario de bloqueantes](../../architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md);
- el [mapa de contextos](../../domain-model/integrated-repair-domain-model/MAPA_DE_CONTEXTOS_DELIMITADOS.md) y sus [relaciones](../../domain-model/integrated-repair-domain-model/RELACIONES_ENTRE_CONTEXTOS.md);
- el [modelo conceptual de la Orden](../../domain-model/integrated-repair-domain-model/MODELO_CONCEPTUAL_DE_LA_ORDEN.md);
- el [modelo de trazabilidad](../../domain-model/integrated-repair-domain-model/MODELO_DE_TRAZABILIDAD.md);
- la [arquitectura de datos](../../architecture/DATA_ARCHITECTURE.md) y la [estrategia de pruebas de aislamiento](../../quality/MULTITENANT_ISOLATION_TESTING.md).

No existe una decisión aceptada incompatible. Las siguientes diferencias eran preguntas o propuestas y quedan resueltas o acotadas por este ADR:

| Hipótesis previa | Decisión autoritativa desde este ADR |
| --- | --- |
| Una identidad ordinaria podría pertenecer a varios tenants | Un usuario ordinario pertenece exactamente a un tenant; la autenticación concreta se decide aparte |
| Cliente compartido en el tenant o global pendiente | El cliente operativo pertenece a una sucursal y no se fusiona automáticamente entre sucursales |
| Transferencia de órdenes entre sucursales pendiente | La sucursal de origen de la Orden es inmutable y la Orden no se traslada |
| Datos compartidos por tenant frente a datos de sucursal sin clasificar | La matriz de propiedad de este ADR fija el alcance inicial |
| RLS como posible requisito para aceptar esquema compartido | RLS queda como defensa adicional por evaluar; no sustituye ni condiciona las invariantes aceptadas |
| Objetivo nominal de 1,000 tenants como fuerza suficiente | La topología se acepta por simplicidad y etapa; capacidad real requiere medición y no se infiere de un número nominal |

Los documentos previos conservan valor histórico. Cuando mantengan una pregunta incompatible, prevalecen este ADR y las decisiones del Responsable de Producto aquí registradas.

## Alcance

Este ADR decide:

- la jerarquía SaaS → tenant → sucursal;
- una base y un esquema compartidos para el MVP;
- propiedad lógica y alcance operativo de datos;
- contexto tenant obligatorio en operaciones ordinarias;
- contexto de sucursal obligatorio cuando el dato o caso sea local;
- confinamiento de usuarios, clientes, órdenes y datos relacionados;
- catálogos globales y extensiones de tenant;
- niveles de propiedad para precios y configuración;
- controles y pruebas mínimos de aislamiento.

Este ADR no decide:

- autenticación, PIN, formato de sesión o mecanismo técnico de estación; la fuente de sucursal activa se decide en [ADR-010](ADR-010-station-bound-operational-context.md);
- roles y permisos detallados;
- motor de persistencia, ORM, RLS o middleware;
- esquema físico, índices definitivos o constraints concretos;
- folios, snapshots de política o resolución técnica de precios;
- soporte, impersonación o acceso global excepcional;
- BI, desidentificación o uso analítico transversal;
- suspensión, retención, eliminación o reactivación del tenant.

## Definiciones

- **SaaS o plataforma:** autoridad que opera SR Taller 2.0 y posee conceptos globales de la oferta y seguridad de plataforma.
- **Tenant:** organización dueña de la operación de un taller y frontera obligatoria de aislamiento.
- **Sucursal:** frontera operativa local dentro de un tenant; pertenece exactamente a un tenant.
- **Propietario lógico:** autoridad de dominio que gobierna identidad, reglas y cambios de un dato. No implica una tabla o base separada.
- **Alcance operativo:** contexto desde el que un caso de uso ordinario puede consultar o modificar un concepto.
- **Contexto de plataforma:** contexto excepcional, separado del flujo ordinario de tenant y sujeto a una decisión posterior.

## Decisión

SR Taller 2.0 utilizará inicialmente:

1. una sola aplicación de servidor;
2. un solo despliegue coordinado de aplicación por ambiente;
3. una sola base de datos física inicial;
4. un esquema lógico compartido para los datos del MVP;
5. aislamiento lógico obligatorio por tenant;
6. alcance adicional por sucursal para conceptos y operaciones locales;
7. propiedad lógica explícita por concepto y módulo;
8. repositorios y casos de uso que exigen contexto confiable;
9. rutas administrativas de plataforma separadas de la operación ordinaria;
10. pruebas automáticas de aislamiento como condición de implementación y liberación.

No se usará una base por tenant, un esquema por tenant ni un despliegue por tenant durante el MVP. Una estrategia híbrida futura sólo podrá introducirse mediante un ADR nuevo sustentado por evidencia.

## Jerarquía de propiedad

### Datos del SaaS

Pertenecen al SaaS, como mínimo:

- planes y definición de membresías comerciales;
- tenant como cuenta organizacional de la plataforma;
- catálogo global curado;
- operadores administrativos de plataforma;
- configuración global del SaaS;
- metadatos de facturación del tenant y estado de suscripción;
- conjunto de datos analítico gobernado, cuando exista una decisión posterior;
- registros de soporte y seguridad de plataforma.

Que un dato del SaaS se relacione con un tenant no lo convierte en dato operable por otro tenant. Los operadores de plataforma no se modelan como usuarios ordinarios de tenant.

### Datos compartidos por tenant

Pertenecen al tenant, como mínimo:

- usuarios ordinarios y su pertenencia operativa;
- roles y permisos propios del tenant;
- sucursales;
- catálogos personalizados;
- lista de precios base y servicios;
- políticas generales y configuración del tenant;
- integraciones propias del tenant;
- reportes consolidados de sus sucursales.

La membresía comercial del SaaS y la pertenencia operativa de un usuario son conceptos distintos: la primera gobierna la cuenta/plan; la segunda gobierna quién puede operar dentro del tenant.

### Datos de sucursal

Pertenecen a una sucursal, como mínimo:

- clientes operativos;
- Órdenes de Servicio;
- anticipos, pagos operativos y movimientos de caja;
- ubicaciones físicas;
- seguimientos;
- diagnósticos;
- cotizaciones y autorizaciones;
- trabajos;
- revisiones de control de calidad;
- entrega;
- evidencias asociadas a la Orden;
- estaciones operativas.

Todo dato de sucursal pertenece también al tenant padre. El aislamiento tenant no puede depender únicamente de seguir una relación indirecta hasta la Orden.

## Matriz de propiedad lógica

| Concepto | Propietario lógico | Alcance operativo | Contexto mínimo conceptual |
| --- | --- | --- | --- |
| Plan | SaaS | Global | Plataforma |
| Membresía comercial | SaaS con tenant asociado | Cuenta | Plataforma + tenant asociado |
| Tenant | SaaS | Cuenta organizacional | Plataforma o tenant autorizado |
| Sucursal | Tenant | Tenant | Tenant |
| Usuario ordinario | Tenant | Tenant | Tenant |
| Rol y permiso | Tenant o SaaS según tipo | Tenant o plataforma | Tenant o plataforma explícita |
| Cliente operativo | Sucursal | Sucursal | Tenant + sucursal |
| Orden de Servicio | Sucursal | Sucursal | Tenant + sucursal |
| Pago de Orden | Sucursal | Sucursal | Tenant + sucursal |
| Ubicación física | Sucursal | Sucursal | Tenant + sucursal |
| Catálogo global curado | SaaS | Global | Plataforma o lectura autorizada |
| Catálogo personalizado | Tenant | Tenant | Tenant |
| Lista de precios base | Tenant | Tenant | Tenant |
| Ajuste de precio | Sucursal | Sucursal | Tenant + sucursal |
| Configuración base | Tenant | Tenant | Tenant |
| Ajuste de configuración | Sucursal | Sucursal | Tenant + sucursal |
| Reporte consolidado | Tenant | Tenant | Tenant |
| Conjunto de datos analítico gobernado | SaaS | Plataforma | Plataforma separada |
| Estación operativa | Sucursal | Sucursal | Tenant + sucursal |
| Evidencia de Orden | Sucursal | Sucursal | Tenant + sucursal |

Esta matriz no prescribe tablas. `tenant_id` y `sucursal_id` expresan discriminadores lógicos obligatorios que el diseño físico futuro deberá materializar sin debilitar estas invariantes.

## Reglas de discriminación de datos

| Clase | Requisito conceptual |
| --- | --- |
| Dato global del SaaS | No se presenta como dato de un tenant; cualquier asociación a tenant es explícita |
| Dato propio del tenant | Conserva `tenant_id` obligatorio y no nulo en su representación autoritativa |
| Dato propio de sucursal | Conserva `tenant_id` y `sucursal_id` obligatorios y coherentes |
| Dato derivado o proyección | Conserva el mismo alcance o uno más restrictivo que sus fuentes |
| Evento, trabajo en segundo plano, caché o archivo | Transporta o usa espacio de nombres de tenant y sucursal cuando aplica |

No se confía sólo en identificadores globalmente únicos ni en relaciones indirectas. El diseño físico podrá reforzar la coherencia mediante referencias o restricciones compuestas, pero su forma pertenece al diseño de persistencia posterior.

## Usuarios y sucursales

- Un usuario ordinario pertenece exactamente a un tenant.
- Un usuario ordinario no pertenece simultáneamente a dos tenants.
- El mismo nombre de usuario puede existir en tenants distintos; no es único globalmente.
- La identidad operativa se resuelve dentro del tenant correspondiente.
- Un usuario puede estar habilitado para trabajar en distintas sucursales del mismo tenant por rotación de personal.
- El usuario no se duplica por cada sucursal.
- Habilitación multisucursal no concede operación transversal simultánea ni acceso a otro tenant.
- [ADR-010](ADR-010-station-bound-operational-context.md) establece que la estación vinculada determina tenant y sucursal y que el usuario no elige sucursal. [ADR-011](ADR-011-tenant-user-pin-authentication-and-operational-session.md) establece identidad, autenticación por PIN y sesión dentro de ese contexto; los permisos permanecen separados.

Este ADR decide propiedad y cardinalidad del usuario ordinario, no el proveedor ni mecanismo de autenticación.

## Clientes operativos

- Un cliente operativo pertenece a una sucursal.
- El mismo ser humano puede tener registros separados en varias sucursales del mismo tenant.
- Los registros no se fusionan automáticamente.
- La sucursal de origen permanece explícita.
- Un teléfono puede repetirse entre clientes y sucursales; no es identidad global.
- La deduplicación o coincidencia transversal futura no cambia la propiedad del cliente operativo.
- Automatizaciones, comunicación y pertenencia comercial local usan el registro de la sucursal correcta.

## Órdenes y datos relacionados

- Una Orden de Servicio pertenece a un tenant y a una sucursal de origen.
- Tenant y sucursal se fijan al crear la Orden.
- La sucursal de la Orden es inmutable durante todo su ciclo.
- Una Orden no puede trasladarse a otra sucursal.
- Una sucursal sólo opera las Órdenes creadas en esa sucursal.
- No se habilita consulta u operación de detalle entre sucursales.
- Un reporte consolidado del tenant puede agregar varias sucursales sin otorgar capacidad operativa cruzada.
- Pagos, diagnósticos, cotizaciones, autorizaciones, trabajos, QC, entrega, seguimientos y evidencias conservan tenant y sucursal de la Orden.

La comunicación humana entre sucursales puede resolver necesidades informativas actuales; no se usa como justificación para ampliar acceso técnico.

## Catálogos

- El SaaS puede publicar catálogos globales curados, como marcas, modelos, colores, problemas, componentes y categorías.
- Los tenants pueden consumirlos y añadir valores propios.
- Una extensión creada por un tenant pertenece a ese tenant y se comparte entre sus sucursales.
- Una extensión tenant no se vuelve global automáticamente.
- Promover un valor a catálogo global requiere gobierno, revisión y normalización posteriores.
- Las sucursales no crean una copia automática del catálogo tenant.

## Precios y configuración

- El tenant puede definir una lista de precios base compartida.
- Una sucursal puede declarar un ajuste cuando su región, costos u operación lo requieran.
- El ajuste no modifica la base del tenant ni a otras sucursales.
- El precio efectivo sigue conceptualmente `base tenant → ajuste de sucursal cuando exista`.
- La Orden conserva el precio histórico aplicado independientemente de cambios posteriores.
- Se reconocen configuración global SaaS, configuración tenant y ajuste de sucursal.
- No toda configuración admite todos los niveles.
- La resolución efectiva, vigencia e instantánea pertenecen a un ADR de configuración; no se crea aquí un motor general de reglas.

## Contexto confiable

Toda operación de negocio ordinaria ejecuta con un tenant resuelto desde fuentes confiables. Cuando el concepto o caso de uso es local, ejecuta además con una sucursal confiable.

- La UI no es autoridad para `tenant_id` o `sucursal_id`.
- El cuerpo, los parámetros de consulta, la ruta o una cabecera enviados por el cliente no redefinen el contexto.
- Tenant y sucursal de una operación ordinaria se obtienen de la vinculación de estación mantenida del lado del servidor conforme a [ADR-010](ADR-010-station-bound-operational-context.md); autenticación y sesión validan al usuario dentro de ese tenant.
- Un identificador solicitado se carga dentro del contexto ya autorizado; conocer un ID no concede acceso.
- La ausencia o conflicto de contexto falla de forma cerrada.
- No existe modo “sin tenant” para casos de uso ordinarios.
- Las operaciones globales del SaaS usan caminos y permisos separados.

La resolución conceptual del contexto queda aceptada en [ADR-010](ADR-010-station-bound-operational-context.md). Su mecanismo técnico no forma parte de ADR-004 ni de ADR-010.

## Módulos y repositorios

- Cada módulo conserva propietario lógico de sus datos aunque comparta base física.
- Las estructuras internas de un módulo no son API para otro.
- Los repositorios con alcance tenant exigen contexto tenant por contrato.
- Los repositorios con alcance sucursal exigen tenant y sucursal coherentes.
- El código operativo no dispone de métodos globales genéricos.
- Las consultas administrativas globales viven en interfaces separadas y auditadas.
- Un módulo no omite tenant o sucursal porque el dato se relacione indirectamente con una Orden.
- Reportes y proyecciones respetan el alcance de sus fuentes.

## Reglas obligatorias de aislamiento

Desde R0 son obligatorias:

1. Toda entidad operativa tiene propietario lógico explícito.
2. Todo dato de tenant es inaccesible para otros tenants por defecto.
3. Toda operación ejecuta dentro de un contexto tenant confiable.
4. Los datos de sucursal ejecutan además dentro de una sucursal confiable.
5. Los nombres de usuario sólo son únicos dentro del tenant.
6. Las Órdenes no pueden cambiar de tenant ni sucursal.
7. Los clientes operativos no pueden cambiar de tenant ni sucursal.
8. Pagos, diagnósticos, cotizaciones, autorizaciones, trabajos, QC y entregas heredan la sucursal de la Orden.
9. Los módulos no omiten aislamiento por existir una relación indirecta con la Orden.
10. Los trabajos en segundo plano se particionan por tenant y, cuando aplica, por sucursal.
11. Los archivos usan espacio de nombres de tenant y sucursal cuando aplica y autorización independiente de su ruta.
12. Las cachés incluyen tenant y sucursal en sus claves cuando aplica.
13. Los eventos incluyen tenant y sucursal cuando aplica.
14. Logs de negocio y auditoría incluyen tenant y sucursal bajo reglas de minimización.
15. Las métricas no exponen datos personales ni contenido entre tenants.
16. Los reportes consolidados agregan sólo sucursales del mismo tenant.
17. Las operaciones administrativas globales requieren permisos, rutas y auditoría separados.
18. Ningún `tenant_id` o `sucursal_id` aportado directamente por UI es autoridad suficiente.
19. No existe un modo ordinario de negocio sin tenant.
20. Toda excepción requiere ADR o justificación explícita, responsable, riesgo y condición de retiro.

## Alternativas consideradas

### Base y esquema compartidos con aislamiento lógico — aceptada

Ventajas:

- simplicidad operativa y menor costo inicial;
- despliegue unificado y migraciones coordinadas;
- uso eficiente de recursos;
- compatibilidad con el monolito modular;
- consultas y reportes de alcance tenant sin consolidación entre bases;
- evolución posterior disponible con evidencia.

Riesgos:

- omisión de filtros o contexto;
- impacto transversal de consultas defectuosas;
- trabajos en segundo plano, reportes, archivos o cachés mal segmentados;
- restauración selectiva más compleja;
- herramientas administrativas con privilegios excesivos.

Se acepta porque los controles obligatorios y el estado del producto favorecen una unidad operativa. La aceptación no supone que el aislamiento lógico funcione sin automatización y pruebas.

### Esquema por tenant — descartada para el MVP

Ofrece separación lógica adicional, pero multiplica migraciones, herramientas, observabilidad, conexiones y operación. Complica reportes de tenant o plataforma y puede producir demasiados esquemas sin una necesidad demostrada.

### Base por tenant — descartada para el MVP

Ofrece aislamiento físico y puede facilitar respaldo/restauración individual, pero agrega costo, conexiones, migraciones, monitoreo, administración y reportes globales. No existe requisito regulatorio, empresarial o de carga que compense ese costo inicial.

### Despliegue por tenant — descartada

Contradice ADR-002 y multiplica mantenimiento, actualizaciones, incidentes, observabilidad y costo sin mejorar el dominio. Un tenant no es una unidad desplegable.

### Modelo híbrido — diferido

Puede ser útil para tenants excepcionales, residencia o carga desproporcionada, pero introducirlo ahora exige enrutamiento, migraciones y operación dual sin un segmento demostrado.

## RLS como defensa adicional

La seguridad por fila de PostgreSQL (RLS) puede reducir el impacto de una consulta que omita alcance, pero no está aceptada por este ADR. Su evaluación depende de que PostgreSQL sea aceptado y debe cubrir reutilización de conexiones, limpieza de contexto, roles que eluden políticas, migraciones, trabajos en segundo plano y soporte.

Con o sin RLS siguen siendo obligatorios el contexto confiable, repositorios conscientes del tenant y las pruebas negativas. RLS no puede convertirse en la única barrera ni en falsa evidencia de aislamiento.

## Controles y pruebas requeridos

La estrategia de implementación debe incluir, desde R0:

- pruebas automáticas de aislamiento tenant;
- pruebas de operación sin contexto y con contexto conflictivo;
- pruebas entre tenants en lectura, escritura, búsqueda y eliminación;
- contratos de repositorios con alcance tenant/sucursal;
- datos de prueba con al menos dos tenants;
- sucursales con nombres o identificadores lógicos similares en tenants distintos;
- el mismo nombre de usuario en tenants distintos;
- el mismo teléfono en clientes de sucursales distintas;
- folios potencialmente iguales cuando su alcance futuro lo permita;
- validación de eventos, trabajos en segundo plano, registros técnicos, cachés, archivos y reportes;
- revisión separada de consultas administrativas;
- pruebas de permisos de plataforma;
- revisión de importaciones y accesos entre módulos;
- regresión obligatoria para todo defecto de aislamiento.

No se implementan estas pruebas en este ADR. Su diseño concreto depende del conjunto tecnológico aceptado, pero la obligación no se difiere.

## Casos obligatorios

### Caso 1 — Nombre de usuario repetido

Avicell y Tecnicell pueden tener cada uno un usuario `luisgtzaviles`. Son usuarios distintos, cada uno con alcance en su tenant; autenticación y operación se resuelven en el tenant correcto.

### Caso 2 — Usuario rota de sucursal

Un usuario de Avicell trabaja hoy en Centro y mañana en Centenario sin duplicar su usuario. La estación vinculada determina la sucursal activa conforme a [ADR-010](ADR-010-station-bound-operational-context.md).

### Caso 3 — Cliente repetido entre sucursales

Luis existe como cliente en Centro y deja otro equipo en Centenario. Se crea o usa un cliente propio de Centenario; no se fusiona automáticamente y cada automatización conserva su procedencia.

### Caso 4 — Orden confinada

Una Orden creada en Centro no se mueve ni se opera desde Centenario. Un reporte consolidado del tenant puede incluirla sin conceder acceso operativo cruzado.

### Caso 5 — Precio con ajuste por sucursal

Avicell define un cambio de pantalla en $1,500; Centro usa $1,600 y Centenario $1,450. Cambiar Centro no altera la base ni Centenario, y la Orden conserva el precio aplicado.

### Caso 6 — Catálogo global y extensión tenant

El SaaS publica Samsung. Avicell agrega una marca faltante; la extensión queda disponible para sus sucursales y no se vuelve global automáticamente.

### Caso 7 — Intento entre tenants

Una sesión o consulta de Avicell intenta acceder a una Orden de Tecnicell. La operación se rechaza sin revelar contenido y produce la evidencia técnica o de seguridad aplicable.

### Caso 8 — Trabajo en segundo plano defectuoso

Un trabajo de notificaciones llega sin tenant o intenta procesar varios tenants sin partición explícita. Falla de forma cerrada, queda observable y se clasifica como riesgo crítico.

### Caso 9 — Archivo mal aislado

Una evidencia de Tecnicell se solicita desde Avicell conociendo ruta o identificador. Se rechaza porque el acceso valida metadatos y contexto, no posesión del enlace.

### Caso 10 — Reporte consolidado

Gerencia de Avicell agrega Centro y Centenario. No obtiene datos de Tecnicell y el reporte no habilita operación de Órdenes entre sucursales.

## Riesgos y mitigaciones

| Riesgo | Consecuencia | Control obligatorio |
| --- | --- | --- |
| Contexto tenant omitido | Fuga o mutación entre tenants | Rechazo seguro, repositorios con contexto y pruebas negativas |
| Contexto de sucursal omitido | Operación local sobre datos ajenos | Contrato con alcance sucursal y coherencia tenant–sucursal |
| Filtro correcto sólo en UI | Referencia directa insegura y evasión | Autorización y delimitación de alcance en servidor |
| Trabajo sin partición | Comunicación o cambios cruzados | Sobre con contexto, revalidación e idempotencia por tenant |
| Caché sin espacio de nombres | Lectura cruzada | Claves versionadas con tenant/sucursal |
| Archivo autorizado por URL | Exposición de evidencia | Metadatos autoritativos y autorización en cada acceso |
| Reporte global reutilizado | Evasión administrativa | Interfaces separadas, mínimo privilegio y auditoría |
| Cliente duplicado por sucursal | Analítica de persona más compleja | No fusionar; correlación futura gobernada |
| Herencia de precio/configuración | Resultado difícil de explicar | Precedencia explícita e instantánea en ADR posterior |
| Cambio futuro de estrategia | Migración compleja | Propiedad estable, contratos y disparadores medidos |

## Consecuencias positivas

- Aislamiento compatible con el monolito modular y una sola base física.
- Operación y despliegue iniciales más simples.
- Menor costo de infraestructura y migraciones coordinadas.
- Propiedad lógica explícita en SaaS, tenant y sucursal.
- Usuarios reutilizables entre sucursales del mismo tenant sin duplicación.
- Clientes y automatizaciones con pertenencia comercial local confiable.
- Órdenes confinadas y trazables durante todo su ciclo.
- Precios regionales sin mutar la base del tenant.
- Reportes consolidados sin acceso operativo cruzado.
- Catálogos globales gobernados y extensiones tenant aisladas.
- Posibilidad de evolucionar a otra topología si aparece evidencia.

## Consecuencias negativas

- Toda consulta, mutación y proceso requiere disciplina de contexto.
- Un defecto de delimitación de alcance puede tener impacto transversal severo.
- Los clientes pueden estar duplicados entre sucursales.
- La analítica transversal de una misma persona será más compleja.
- Trabajos en segundo plano, reportes, cachés y archivos requieren controles adicionales.
- Precios y configuración efectivos añaden herencia explícita.
- El acceso administrativo y soporte serán más complejos.
- Las pruebas de aislamiento son obligatorias y aumentan el costo de cada rebanada.
- Exportar o restaurar un tenant individual requiere diseño especial.
- Migrar a base o esquema por tenant será más difícil que elegirlo desde el inicio.

## Decisiones separadas

### Contexto operativo y estación

[ADR-010](ADR-010-station-bound-operational-context.md) acepta la estación vinculada como fuente de tenant/sucursal, la rotación de usuarios sin asignación permanente por sucursal y la desvinculación/revinculación para reubicar. [ADR-011](ADR-011-tenant-user-pin-authentication-and-operational-session.md) acepta identidad, propósito del PIN, autenticación contextual, cambio de turno, inactividad y sesión. Protección técnica, formato de sesión, permisos y tiempos concretos permanecen en decisiones posteriores.

### Configuración efectiva

Un ADR posterior debe decidir precedencia ejecutable, vigencia, valores seguros, autoridad de cambio e instantánea de políticas/precios aplicados.

### Soporte y administración de plataforma

Quedan fuera el superadministrador, impersonación, soporte asistido, consentimiento o ticket, elevación temporal y consulta administrativa. ADR-004 no autoriza acceso indiscriminado a datos de tenants.

### BI y gobierno analítico

Quedan fuera el conjunto de datos analítico, desidentificación, enriquecimiento global, retención estadística, eliminación de información personal y explotación transversal. Un reporte consolidado del tenant no es BI de plataforma.

### Suspensión, retención y eliminación

El tenant conserva identidad y propiedad lógica durante su ciclo. Estados como activo, gracia, operación restringida, sólo lectura, retención y depuración, junto con plazos, exportación, reactivación y eliminación, requieren un ADR antes de producción general.

## Disparadores de revisión futura

Reconsiderar la estrategia ante evidencia de:

- exigencia regulatoria de aislamiento físico;
- contratos empresariales con requisitos incompatibles;
- residencia o soberanía de datos;
- restauración por tenant que no pueda operarse razonablemente;
- carga desproporcionada o interferencia persistente entre tenants;
- personalización extrema que rompa migraciones coordinadas;
- necesidad de región separada;
- incidente de aislamiento material;
- límites de conexiones o capacidad medidos;
- migraciones demasiado pesadas para la unidad compartida;
- costo total menor y riesgo aceptable de una topología distinta.

Un disparador abre evaluación; no implica automáticamente base, esquema o despliegue por tenant.

## Trazabilidad

- [ADR-002 — Monolito modular inicial](ADR-002-modular-monolith-first.md)
- [ADR-010 — Contexto operativo derivado de una estación vinculada](ADR-010-station-bound-operational-context.md)
- [Registro de ADRs](../README.md)
- [Modelo multitenant del MVP](../../architecture-readiness/repair-mvp/MODELO_MULTITENANT.md)
- [Modelo de configuración](../../architecture-readiness/repair-mvp/MODELO_DE_CONFIGURACION.md)
- [Mapa de ADRs requeridos](../../architecture-readiness/blocker-closure/MAPA_DE_ADRS_REQUERIDOS.md)
- [Secuencia de decisiones](../../architecture-readiness/blocker-closure/SECUENCIA_DE_DECISIONES.md)
- [Modelo de multitenancy](../../architecture/MULTITENANCY_MODEL.md)
- [Arquitectura de datos](../../architecture/DATA_ARCHITECTURE.md)
- [Línea base de seguridad](../../architecture/SECURITY_BASELINE.md)
- [Pruebas de aislamiento multitenant](../../quality/MULTITENANT_ISOLATION_TESTING.md)
- [Modelo integrado de Reparaciones](../../domain-model/integrated-repair-domain-model/README.md)
- [Trazabilidad del dominio](../../domain/TRACEABILITY.md)

## Próxima revisión

Al aparecer uno de los disparadores medidos o antes de autorizar una excepción al aislamiento aceptado. La implementación continúa bloqueada por los demás gates H0/H1; aceptar ADR-004 no autoriza código ni prototipos.
