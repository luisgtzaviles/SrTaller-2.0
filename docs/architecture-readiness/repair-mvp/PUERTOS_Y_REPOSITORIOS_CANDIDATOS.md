# Puertos y repositorios candidatos

## Principio

**[DAR]** Los puertos expresan capacidades requeridas por aplicación o dominio; no exponen tablas, ORM ni proveedores. Los repositorios preservan agregados propietarios, no consultas arbitrarias entre módulos.

## Puertos de persistencia por responsabilidad

| Necesidad | Tipo | Operación conceptual | Clasificación |
| --- | --- | --- | --- |
| Guardar/recuperar Orden | Repositorio de agregado | Obtener por identidad/folio y guardar | DAP |
| Reservar/asignar folio | Puerto de infraestructura con regla de dominio | Reservar en alcance sin colisión | DAP |
| Consultar Cliente | Repositorio o consulta del módulo Clientes | Identificar cliente autorizado | DAP |
| Guardar evaluación | Repositorio de agregado | Obtener revisión y guardar iteración | DAP |
| Guardar Cotización/decisiones | Repositorios de agregados comerciales | Preservar versión y autorización | DAP |
| Guardar pagos | Repositorio de agregado financiero | Agregar movimiento idempotente | DAP |
| Guardar movimientos físicos | Repositorio de Custodia | Agregar movimiento y obtener ubicación | DAP |
| Guardar control de calidad | Repositorio de agregado | Guardar revisión repetible | DAP |
| Guardar entrega | Repositorio de agregado | Registrar entrega única | DAP |
| Guardar evidencias | Adaptador de archivos + metadatos propietarios | Almacenar referencia segura | DAP |
| Consultar políticas | Puerto de Configuración | Resolver versión efectiva | DAP |
| Contexto tenant/sucursal/estación/usuario | Puerto conceptual de contexto | Obtener contexto ADR-010 verificado | DAP |

## Puertos de infraestructura

| Capacidad | Contrato conceptual | Clasificación |
| --- | --- | --- |
| Identidad | Resolver sesión y usuario del tenant verificables | DAP |
| Archivos | Reservar, almacenar, verificar y leer evidencia autorizada | DAP |
| Folios | Reservar identidad única en alcance acordado | DAP |
| Reloj | Proveer tiempo consistente para reglas y pruebas | DAR |
| Impresión | Solicitar identificación física sin bloquear negocio | DD |
| Notificación | Entregar mensaje idempotente por canal | DD |
| Publicación de hechos | Entregar hechos posteriores a confirmar la transacción | DAP |
| Reloj/zona horaria | Proveer instante y zona operativa confiables | DAR |

## Modelos de lectura

**[DAR]** Las listas, búsquedas y línea temporal usan puertos de consulta separados de los repositorios de agregados. Pueden devolver modelos denormalizados sin conceder autoridad de escritura.

**[DAR]** No se crea un repositorio por tabla. La unidad es el agregado o una consulta publicada con propósito operativo.

## Restricciones

- **[DAR]** Un repositorio no cruza tenants ni omite contexto.
- **[DAR]** La interfaz no revela detalles de almacenamiento.
- **[R]** Un repositorio genérico compartido elimina propiedad e invariantes.
- **[ADR]** Firmas, nombres y mecanismo de transacción se definen al aceptar el conjunto tecnológico.
