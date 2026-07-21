# Supuestos de rendimiento

## Estado de evidencia

**[ST]** No existen volúmenes, SLOs ni perfiles de carga aprobados suficientes para fijar cifras de capacidad. El horizonte de hasta múltiples tenants es un objetivo de diseño, no una medición de demanda.

## Supuestos provisionales a validar

| Supuesto | Consecuencia inicial | Validación requerida | Clasificación |
| --- | --- | --- | --- |
| Talleres pequeños y varias sucursales comparten plataforma | Aislamiento y paginación desde el diseño | Medir distribución real | ST |
| Crecimiento puede llegar a miles de tenants | Claves e índices conceptuales incluyen tenant | Validar horizonte y volúmenes | ST |
| Mostrador necesita respuesta interactiva | Evitar integraciones externas en transacción | Medición con recepción | ST |
| La mayoría de órdenes tiene línea temporal moderada | Paginar desde el inicio | Datos de operación real | ST |
| Archivos pesan más que metadatos | Almacenarlos mediante puerto dedicado | Perfil de tamaños/tipos | ST |
| Búsqueda por folio es crítica | Índice/consulta dedicada futura | Escenarios de carga | ST |
| Escaneo de QR reutiliza búsqueda por identidad | Ruta de consulta acotada | Prueba en estación real | ST |
| Listas operativas filtran por sucursal/estado | Proyección acotada y paginada | Validación con usuarios | ST |
| Documentos y fotografías tienen costo distinto | Generación y carga diferidas | Medir tamaños y frecuencia | ST |
| Reportes crecerán después del MVP | No optimizar OLAP todavía | Preguntas reales de reporte | ST |
| Escrituras concurrentes son puntuales pero sensibles | Control optimista e idempotencia | Pruebas concurrentes | ST |

## Presupuesto cualitativo

- **[DAR]** Recepción, consulta por folio, autorización, pago y entrega no dependen de canales externos.
- **[DAR]** Listas y línea temporal se paginan; no cargan historias completas por defecto.
- **[DAR]** Archivos se procesan fuera de la transacción crítica.
- **[DAR]** Se mide antes de usar caché o particionar.
- **[DAR]** Evitar consultas N+1 mediante revisión y medición de modelos de lectura.
- **[DAR]** Definir límites de archivo, carga diferida, almacenamiento externo y retención antes de producción.
- **[DAR]** Considerar índices conceptuales por tenant+sucursal+folio y tenant+estado/ubicación, sin diseñar índices SQL definitivos.

## Gates

**[PB]** Antes de producción deben acordarse volumen esperado, percentiles de latencia, disponibilidad, tamaños de archivo, concurrencia por sucursal y retención.

**[ADR]** Cachés distribuidos, particionamiento, réplicas o colas externas sólo se adoptan con medición y decisión posterior.
