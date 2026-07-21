# Servicios de dominio candidatos

## Criterio de uso

**[DAR]** Un servicio de dominio sólo se justifica cuando una regla pura cruza conceptos sin pertenecer naturalmente a un agregado. La coordinación, autorización técnica y persistencia permanecen en la aplicación.

## Evaluación de responsabilidades candidatas

| Responsabilidad | Ubicación recomendada | Razón | Clasificación |
| --- | --- | --- | --- |
| Asignación segura de folio | Aplicación + puerto de reserva; política de formato como valor | Requiere persistencia/concurrencia, no servicio puro | DAR |
| Evaluación de política de recepción | Entidad/valor Política efectiva | La política decide requisitos sobre datos presentes | DAP |
| Cálculo comercial | Cotización y objetos de valor monetarios | Pertenece al agregado cuando usa sus conceptos | DAR |
| Aplicación de promociones | Abierto y diferible | Promociones avanzadas están fuera del MVP | DD |
| Total autorizado | Objeto de valor/decisión de autorización | Deriva de conceptos y precios de una versión | DAR |
| Absorción del servicio | Abierto; posible política de dominio | Falta validación comercial | PB |
| Elegibilidad para Listo | Política de dominio si cruza Trabajo y QC | Requiere resultado de revisión y estado | DAP |
| Elegibilidad para entrega | Servicio/política de dominio | Cruza custodia, resolución, saldo y excepciones | DAP |
| Identificación física | Política de dominio + aplicación para imprimir | Regla decide suficiencia; aplicación coordina adaptador | DAP |
| Asignación técnica | Entidad de asignación salvo reglas cruzadas | La asignación protege responsable/participantes | DAP |
| Control de calidad | Entidad de revisión + política de elegibilidad | El registro decide resultado; política decide requisitos | DAP |
| Transición operativa | Servicio/política de dominio candidato | Cruza estado, ubicación, hecho y configuración | DAP |
| Posición financiera | Objeto de valor derivado de movimientos | Cálculo puro bajo Pagos | DAR |

## Lo que no es servicio de dominio

- **[DAR]** Enviar correo, imprimir, subir archivo o consultar proveedor es integración.
- **[DAR]** Cargar repositorios, iniciar transacción o deduplicar solicitudes es aplicación/infraestructura.
- **[DAR]** Formatear respuestas o validar JSON es presentación.
- **[R]** Un “servicio de reparación” que concentra todos los casos de uso recrearía un objeto universal.

## Criterio de promoción

**[DAR]** Una responsabilidad candidata se convierte en servicio sólo si aparecen al menos dos consumidores o si evita duplicar una regla crítica. De otro modo permanece en el agregado propietario.

## Pendientes

- **[PB]** Regla financiera exacta para entrega.
- **[PB]** Catálogo de transiciones y autoridad de excepciones.
- **[PB]** Política mínima de QC.
