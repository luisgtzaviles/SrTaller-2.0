# Mapa de contextos delimitados candidatos

## Criterio

**PM:** los contextos de esta página son fronteras de lenguaje, responsabilidad e información candidatas. No representan servicios, repositorios, equipos humanos, carpetas ni unidades desplegables. Un área física como Taller, Pendientes o Caja de listos no se convierte por sí sola en contexto delimitado.

## Catálogo y propósito

| ID | Contexto candidato | Propósito y lenguaje propio | Información que posee | Relación con la Orden |
|---|---|---|---|---|
| IDM-CTX-01 | Gestión de Órdenes de Servicio | Identidad, folio, ciclo, hitos y coordinación de la orden | Identidad estable, referencias de ciclo y estado resumen | Es el eje de correlación, no dueño de todos los detalles |
| IDM-CTX-02 | Recepción y Custodia | Recepción mínima, equipo recibido, identificación y responsabilidad física | Acto de recepción, inicio/fin de custodia e identificación física | Abre el ciclo y protege la custodia |
| IDM-CTX-03 | Diagnóstico y Ejecución Técnica | Evaluación, conclusión, recomendación, prueba, trabajo y participación | Historia técnica y relación entre necesidad y ejecución | Aporta iteraciones y resultados técnicos |
| IDM-CTX-04 | Cotización y Autorización Comercial | Oferta, precio, concepto, promoción, decisión y alcance autorizado | Versiones comerciales, decisiones por concepto y total autorizado | Determina qué trabajo puede ejecutarse |
| IDM-CTX-05 | Workflow Operativo y Ubicación Física | Estado, cola, movimiento, ubicación y siguiente responsabilidad | Historial de transiciones y movimientos | Expone dónde está y qué sigue |
| IDM-CTX-06 | Control de Calidad | Segunda revisión, criterios, resultado y devolución a Taller | Revisiones y resultados estructurados | Habilita o impide marcar Listo |
| IDM-CTX-07 | Atención y Comunicación con Cliente | Contactos, comunicaciones, notificaciones y conversaciones | Interacciones y resultado de contacto | Comunica propuestas, avances y disponibilidad |
| IDM-CTX-08 | Pagos y Caja | Anticipo, pago, devolución, aplicación y saldo | Movimientos financieros atribuibles | Informa condición financiera y cobro |
| IDM-CTX-09 | Inventario y Refacciones | Disponibilidad, reserva, consumo, devolución y procedencia | Compromisos y movimientos de piezas | Soporta propuestas y trabajos autorizados |
| IDM-CTX-10 | Clientes y Contactos | Identidad operativa de personas y medios de contacto | Cliente, contactos y relaciones de comunicación | Provee participantes; no presume propiedad legal |
| IDM-CTX-11 | Identidad, Acceso y Atribución | Identidad operativa, capacidades, sesión y atribución | Actor autenticado y contexto de acción | Atribuye acciones relevantes |
| IDM-CTX-12 | Configuración de Tenant y Sucursal | Políticas configurables y alcance local | Versiones de política y vigencia | Determina requisitos y excepciones aplicables |
| IDM-CTX-13 | Evidencias y Documentos | Fotografías, archivos, comprobantes y relación probatoria | Evidencia, propósito, autor, momento y retención | Sustenta recepción, trabajo, decisión y entrega |
| IDM-CTX-14 | Garantías y Posventa | Cobertura, reclamación, evaluación y resolución posterior | Reclamos y decisiones de cobertura | Relaciona una nueva atención con trabajo previo |
| IDM-CTX-15 | Notificaciones | Preparación, envío, entrega y fallo por canal | Intentos y resultados de notificación | Informa cambios sin gobernar la orden |
| IDM-CTX-16 | Reportes y BI | Lecturas históricas, indicadores y análisis | Proyecciones y métricas derivadas | Consume hechos; no cambia el ciclo |

**Clasificación de todas las filas:** PM. Los significados internos derivan de DDV; la separación exacta permanece abierta.

## Consumos, publicaciones y dependencias

| Contexto | Información que consume | Eventos o hechos que podría exponer | Dependencias principales |
|---|---|---|---|
| Órdenes | Recepción creada, hitos de workflow y entrega | Orden creada, ciclo concluido | Recepción, workflow, entrega |
| Recepción y Custodia | Cliente, política, actor y sucursal | Custodia iniciada/terminada, equipo identificado | Clientes, configuración, identidad, evidencia |
| Técnico | Orden, ubicación, autorización y pieza disponible | Evaluación concluida, recomendación emitida, trabajo terminado | Órdenes, comercial, inventario, identidad |
| Comercial | Recomendación, cliente, política y precios vigentes | Cotización emitida, concepto autorizado/rechazado | Técnico, clientes, configuración, identidad |
| Workflow | Hitos de recepción, técnica, QC y entrega | Estado cambiado, equipo movido, siguiente acción | Todos los contextos operativos |
| Calidad | Trabajo vigente, criterios y actor | QC aprobado/rechazado | Técnico, workflow, configuración |
| Comunicación | Contacto, propuesta y estado comunicable | Cliente contactado/notificado | Clientes, comercial, órdenes, notificaciones |
| Pagos | Obligación comercial, actor y sucursal | Anticipo/pago/devolución registrado | Comercial, identidad, configuración |
| Inventario | Trabajo autorizado, sucursal y pieza | Pieza reservada/consumida/devuelta | Técnico, comercial, configuración |
| Clientes | Datos operativos y correcciones atribuibles | Cliente/contacto registrado o actualizado | Identidad y política de datos |
| Identidad | Membresía, tenant, sucursal y sesión | Contexto de atribución establecido | Configuración organizacional |
| Configuración | Decisiones de tenant/sucursal | Política publicada o reemplazada | Identidad administrativa |
| Evidencias | Solicitud de evidencia y contexto del hecho | Evidencia agregada/corregida | Órdenes, identidad, política |
| Garantías | Entrega previa, cobertura, trabajo y evidencia | Reclamo abierto/aceptado/rechazado | Órdenes, técnico, comercial, evidencia |
| Notificaciones | Mensaje autorizado y canal | Envío intentado/entregado/fallido | Comunicación, integraciones futuras |
| Reportes y BI | Eventos y proyecciones autorizadas | Indicadores derivados | Todos como consumidor de sólo lectura |

**Clasificación:** IDO para las dependencias observables; PM para la publicación y ownership propuestos. “Publicar” no implica transporte externo.

## Madurez y alcance MVP

| Contexto | Madurez | MVP Reparaciones | Decisiones abiertas |
|---|---|---|---|
| IDM-CTX-01 Órdenes | Candidato fuerte | Sí | Estado resumen y frontera mínima |
| IDM-CTX-02 Recepción/Custodia | Candidato fuerte | Sí | Excepciones y apellido configurable |
| IDM-CTX-03 Técnico | Candidato fuerte | Sí | Estructura mínima de iteración y pruebas |
| IDM-CTX-04 Comercial | Candidato fuerte | Sí | Versionado, precios, promociones y excepción |
| IDM-CTX-05 Workflow/Ubicación | Candidato fuerte | Sí | Catálogos definitivos y movimientos obligatorios |
| IDM-CTX-06 Calidad | Candidato fuerte | Sí | Independencia y checklist por política |
| IDM-CTX-07 Comunicación | Candidato medio | Sí, alcance mínimo | Canales, consentimiento y resultado estructurado |
| IDM-CTX-08 Pagos/Caja | Candidato fuerte | Anticipos/pagos básicos | Aplicación a caja, crédito y devoluciones |
| IDM-CTX-09 Inventario | Candidato medio | Dependencia mínima | Reserva, consumo, origen y stock multi-sucursal |
| IDM-CTX-10 Clientes/Contactos | Candidato fuerte | Sí | Duplicados, autoridad y propiedad legal |
| IDM-CTX-11 Identidad/Atribución | Candidato fuerte transversal | Sí | Seguridad del PIN y acciones reforzadas |
| IDM-CTX-12 Configuración | Candidato fuerte transversal | Sí, políticas mínimas | Precedencia, versión y autoridad |
| IDM-CTX-13 Evidencias | Candidato medio/fuerte | Sí | Obligatoriedad, retención y privacidad |
| IDM-CTX-14 Garantías | Pendiente | No, salvo enlace futuro | Cobertura, nueva orden y decisión |
| IDM-CTX-15 Notificaciones | Candidato medio | Alcance básico o diferido | Separación frente a comunicación e integración |
| IDM-CTX-16 Reportes/BI | Candidato débil | No, excepto vistas operativas | Métricas, retención y consistencia |

**Clasificación:** PM. La madurez no equivale a aprobación arquitectónica.

## Riesgos de delimitación

- **RCL:** el legacy concentra datos heterogéneos en campos mutables de la reparación.
- **PM:** dividir cada fase en contexto separado podría fragmentar prematuramente el flujo.
- **PM:** absorber pagos, inventario y notificaciones dentro de Órdenes produciría un núcleo monolítico.
- **PA:** debe decidirse si Notificaciones es capacidad separada o parte interna de Comunicación en el MVP.
- **PA:** Garantías necesita discovery específico antes de fijar relación con una orden nueva.
