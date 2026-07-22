# Observabilidad y auditoría

## Separación

| Señal | Propósito | Autoridad | Clasificación |
| --- | --- | --- | --- |
| Log técnico | Diagnóstico de ejecución | Operaciones | DAP |
| Métrica | Tendencia, capacidad y alertas | Operaciones | DAP |
| Traza/correlación | Recorrido de una solicitud/proceso | Operaciones | DAP |
| Auditoría | Quién hizo qué, cuándo y bajo qué alcance | Negocio/seguridad | RDD |
| Timeline | Historia comprensible de la orden | Producto | RDD |
| Actividad operativa | Volumen y avance del trabajo | Operación | DAP |
| Error | Fallo técnico o de negocio accionable | Soporte/ingeniería | DAP |
| Evento de seguridad | Intento, denegación o anomalía relevante | Seguridad | DAP |

**[DAR]** Estas señales pueden compartir correlación, pero no son intercambiables. Borrar logs por retención no debe borrar la evidencia de negocio requerida.

## Campos mínimos seguros

- **[DAR]** Identificador de correlación/operación, módulo, caso de uso, resultado, duración, error, integración y número de reintento.
- **[RDD]** Identificadores opacos de tenant, sucursal, estación, actor y entidad cuando sean necesarios.
- **[DAR]** Versión de política o entidad en acciones sensibles.
- **[R]** Nunca secretos, PIN, tokens, contenido completo de archivos o datos personales innecesarios.

## Hechos auditables

**[RDD]** Creación, cambio de estado/ubicación, asignación, conclusión, propuesta, autorización, ejecución, QC, pago/reverso, excepción, entrega, cambio de configuración y acceso administrativo sensible.

**[DAR]** La línea temporal visible usa lenguaje de negocio y minimiza detalles técnicos. Los logs técnicos y errores no se copian al historial del usuario.

## Señales operativas mínimas

- **[DAP]** Tasa de error y latencia por caso de uso.
- **[DAP]** Conflictos de concurrencia e idempotencia.
- **[DAP]** Fallos de aislamiento/autorización.
- **[DAP]** Efectos laterales pendientes o agotados.
- **[DAP]** Custodias abiertas y entregas fallidas como indicador de negocio, con acceso restringido.

## Pendientes

- **[PB]** Retención y acceso de auditoría/línea temporal.
- **[PB]** Datos personales permitidos por señal.
- **[ADR]** Herramientas, almacenamiento y exportación se deciden con la plataforma.
