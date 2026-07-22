# Glosario inicial de dominio

## Estado del documento

- **Estado:** Borrador inicial.
- **Naturaleza:** Lenguaje común preliminar; no define tablas, clases, contratos de API ni reglas finales.
- **Aprobación:** ADR-004/010 son autoritativos para los términos marcados; el resto está pendiente del propietario del producto y especialistas del dominio.
- **Convención:** “Pendiente de validación” indica que la definición o sus límites podrían cambiar.

## Reglas de uso

1. Usar estos términos con el sentido documentado mientras se realiza descubrimiento.
2. No convertir una definición preliminar en regla de negocio sin PBI, evidencia y aprobación.
3. Registrar sinónimos del negocio y resolver ambigüedades antes de nombrar contratos o datos persistentes.
4. Si un término cambia, revisar módulos, preguntas, ADRs, PBIs y pruebas que lo utilicen.

## Términos

| Término | Definición inicial | Estado y ambigüedad pendiente |
|---|---|---|
| **Plataforma** | Conjunto de aplicaciones, servicios y capacidades administradas que componen SR Taller 2.0 y sirven a los tenants. | **Hecho conocido** en sentido general. Límites operativos, SLAs y componentes definitivos: **pendientes de validación**. |
| **Tenant** | Organización cliente y frontera de aislamiento de datos, usuarios y operación dentro de la plataforma SaaS. | **Aceptado en ADR-004.** Ciclo de vida, identidad legal y relación con una marca o empresa: pendientes. |
| **Sucursal** | Unidad operativa perteneciente exactamente a un tenant que delimita estaciones y datos locales. | **Aceptado en ADR-004/010:** la estación vinculada determina la sucursal efectiva; no existe sucursal elegida por el usuario. |
| **Usuario** | Identidad operativa ordinaria que pertenece exactamente a un tenant y puede rotar entre sus estaciones autorizadas sin duplicarse por sucursal. | **Aceptado en ADR-004/010:** pertenencia; pendientes atributos, autenticación, recuperación y relación con personal. No equivale a rol, sesión ni estación. |
| **Identidad global** | Posible correlación futura de una misma persona entre tenants o con identidades de plataforma; no es el usuario ordinario ni concede operación multi-tenant. | **Pendiente de decisión especializada:** necesidad, privacidad, identificadores y recuperación. |
| **Membresía** | Término histórico ambiguo. No representa al usuario ordinario multi-tenant; la membresía comercial del SaaS y el usuario del tenant son conceptos separados. | **No usar para inferir tenant/sucursal.** Cualquier uso futuro requiere definición explícita. |
| **Rol** | Agrupación nombrada de permisos para facilitar administración de acceso. | **Pendiente de validación:** roles base, personalización, herencia, alcance tenant/sucursal y versionado. No equivale necesariamente a puesto laboral. |
| **Permiso** | Autorización granular para ejecutar una acción sobre un tipo de recurso dentro de un alcance. | **Pendiente de validación:** catálogo, granularidad, condiciones, denegaciones y acciones sensibles. |
| **Estación operativa** | Equipo cliente reconocido y vinculado a una única sucursal activa para aportar origen físico y contexto. | **Aceptado en ADR-010:** vinculación y alcance; pendientes tipos, identidad técnica, credencial y evidencia concreta. |
| **Sesión de estación** | Evidencia técnica temporal de que una estación conserva una vinculación válida con sucursal/tenant derivados. | **Pendiente de mecanismo:** duración, renovación, revocación, credenciales y comportamiento sin conexión. No sustituye al usuario. |
| **Sesión de usuario** | Evidencia autenticada de un usuario dentro del tenant ya derivado de la estación. | **Pendiente de mecanismo:** duración, concurrencia, renovación, cierre remoto y autenticación reforzada. |
| **Contexto operativo** | Tenant, sucursal, estación y usuario efectivos para una operación ordinaria. | **Aceptado en ADR-010:** composición, fuente y cambio de turno; su representación técnica queda pendiente. |
| **PIN** | Secreto corto usado para identificar al usuario dentro del tenant de una estación vinculada. | **Propósito aceptado en ADR-010;** longitud, protección, rotación, recuperación, bloqueo y acciones permitidas quedan pendientes. |
| **Cliente** | Persona u organización que recibe servicios o compra productos del taller dentro de un tenant. | **Pendiente de validación:** identidad, duplicados, contactos, consentimiento, pertenencia a sucursal y relación entre varios equipos. No confundir con cliente técnico de la API. |
| **Equipo del cliente** | Dispositivo electrónico que el cliente entrega o relaciona con un servicio de reparación. | **Pendiente de validación:** identificación, propiedad, condición de recepción, accesorios y datos sensibles. No es una estación operativa. |
| **Reparación** | Caso de negocio que agrupa la solicitud, diagnóstico, trabajo, autorizaciones, partes, estados y resultado sobre un equipo del cliente. | **Pendiente de validación:** inicio y cierre, relación con orden de trabajo, múltiples trabajos, garantías y reaperturas. |
| **Orden de trabajo** | Instrucción o registro operativo del trabajo que debe realizarse o se realizó, posiblemente dentro de una reparación. | **Pendiente de validación:** si es sinónimo de reparación o una entidad separada, su cardinalidad y ciclo de vida. |
| **Inventario** | Capacidad para conocer y controlar artículos, partes o insumos y sus existencias dentro de alcances definidos. | **Pendiente de validación:** catálogo, unidad, propiedad tenant/sucursal, ubicaciones, reservas, lotes, series y valuación. |
| **Movimiento** | Cambio trazable que afecta cantidad, ubicación, reserva o estado de un elemento de inventario. | **Pendiente de validación:** tipos, signos, aprobación, reversión, costo y relación con reparación, venta o ajuste. |
| **Venta** | Operación comercial del taller mediante la cual se entregan productos o servicios a cambio de una contraprestación. | **Pendiente de validación:** alcance frente a reparación, documentos, impuestos, devoluciones y momento de reconocimiento. |
| **Conversación** | Contenedor de mensajes relacionados entre participantes y a través de uno o más contextos o canales. | **Pendiente de validación:** participantes, vinculación con cliente/reparación, continuidad entre canales y ownership. |
| **Canal** | Medio o proveedor por el que se intercambian mensajes o notificaciones, por ejemplo web o WhatsApp en una integración futura. | **Pendiente de validación:** canales iniciales, capacidades, consentimiento, costos y diferencias entre mensajería y notificación. |
| **Mensaje** | Unidad persistible de contenido entrante, saliente o interno dentro de una conversación, con identidad y estado de entrega. | **Pendiente de validación:** tipos, edición, adjuntos, estados, retención, orden y deduplicación. |
| **Caja** | Contexto de control para registrar y conciliar movimientos monetarios de una operación, persona, terminal o sucursal. | **Pendiente de validación:** qué representa exactamente, sesiones, monedas, medios y reglas de apertura/cierre. |
| **Pago** | Registro de valor recibido, devuelto o aplicado a una obligación de la operación del taller. | **Pendiente de validación:** medios, estados, parcialidades, aplicación, reembolso, conciliación y fiscalidad. No confundir con cobro de suscripción SaaS. |
| **Suscripción** | Relación comercial temporal entre un tenant y un plan de la plataforma, con estado y condiciones de servicio. | **Pendiente de validación:** alta, prueba, renovación, gracia, suspensión, cancelación y proveedor de cobro. |
| **Plan** | Oferta comercial de la plataforma que podría definir precio, límites o capacidades disponibles para una suscripción. | **Pendiente de validación:** catálogo, entitlements, medición, moneda, impuestos y cambios de plan. |
| **Superadministrador** | Nombre provisional para una identidad con capacidades administrativas a nivel plataforma. | **Pendiente de validación:** debe confirmarse el término, separar funciones y evitar que implique acceso universal rutinario a datos de tenants. |
| **Auditoría** | Registro consultable de quién o qué realizó una acción relevante, cuándo, en qué contexto y con qué resultado. | **Pendiente de validación:** eventos, contenido, integridad, acceso, retención, privacidad y exportación. |
| **Evento de dominio** | Representación de un hecho significativo que ya ocurrió dentro de un límite de dominio y que puede interesar a otros componentes. | **Propuesta técnica pendiente de validación:** semántica, contrato, publicación, persistencia y garantías de entrega. |
| **Trabajo asíncrono** | Unidad de procesamiento ejecutada fuera de la respuesta inmediata de una solicitud y que conserva contexto, estado y política de reintento. | **Propuesta técnica pendiente de validación:** tipos, prioridad, idempotencia, expiración, fallos y contexto de tenant. |
| **Integración** | Contrato y proceso controlado para intercambiar datos o acciones con un servicio externo. | **Pendiente de validación:** proveedores, ownership, credenciales, límites, soporte y responsabilidad ante errores. |
| **Contexto de tenant** | Tenant verificado que delimita una operación; en operación ordinaria deriva de la sucursal vinculada a la estación. | **Aceptado en ADR-004/010;** propagación técnica y defensas automatizadas pendientes. |
| **Alcance de sucursal** | Restricción local determinada por la única sucursal vinculada a la estación. | **Aceptado en ADR-010** para operación ordinaria; reportes tenant-wide y administración usan contextos separados. |
| **Cliente técnico** | Aplicación o servicio autorizado que consume la API central. | **Pendiente de validación:** tipos de cliente, credenciales y contratos. Se usa para evitar confusión con el cliente del taller. |

## Ambigüedades prioritarias

1. **Reparación frente a orden de trabajo:** no se ha decidido si son sinónimos, una relación padre-hijo o conceptos alternativos.
2. **Usuario frente a empleado:** no se ha definido si toda persona que trabaja en el taller necesita usuario ni si el sistema administrará datos laborales.
3. **Cliente frente a contacto:** no se sabe si una organización, una persona y varios contactos requieren modelos distintos.
4. **Caja frente a sesión de caja:** no se ha definido si la caja es ubicación, terminal, cuenta de control o una combinación.
5. **Mensaje frente a notificación:** falta delimitar comunicación conversacional, alertas del sistema y entregas de proveedores.
6. **Pago del taller frente a cobro SaaS:** pertenecen a contextos distintos y no deben compartir lenguaje o reglas sin una decisión explícita.

## Preguntas abiertas

- ¿Qué vocabulario utiliza actualmente el segmento objetivo para recepción, reparación, orden, equipo, parte, caja y entrega? Véase [QUESTION-003](./OPEN_QUESTIONS.md#question-003).
- ¿Cómo se aplicarán y probarán las clasificaciones tenant/sucursal ya aceptadas? Véanse [QUESTION-006](./OPEN_QUESTIONS.md#question-006) y [QUESTION-007](./OPEN_QUESTIONS.md#question-007).
- ¿Qué conceptos del sistema anterior deben mapearse, transformarse o descartarse? Véase [QUESTION-033](./OPEN_QUESTIONS.md#question-033).

## Documentos relacionados

- [Actores y personas](./ACTORS_AND_PERSONAS.md)
- [Alcance de producto](./PRODUCT_SCOPE.md)
- [Mapa de módulos](./MODULE_MAP.md)
- [Arquitectura de datos](../architecture/DATA_ARCHITECTURE.md)

## Próxima revisión

Revisar después de sesiones de descubrimiento del recorrido operativo y cada vez que una decisión cambie el significado o límite de un término. **Fecha: TBD.**
