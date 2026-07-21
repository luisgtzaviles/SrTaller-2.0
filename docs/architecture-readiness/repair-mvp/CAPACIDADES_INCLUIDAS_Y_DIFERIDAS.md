# Capacidades incluidas y diferidas

## Matriz de decisión

| Capacidad evaluada | Tratamiento | Motivo | Clasificación |
| --- | --- | --- | --- |
| Acceso tenant/sucursal | Imprescindible para la primera venta | Fija aislamiento y alcance | RDD |
| Sesión operativa | Imprescindible para la primera venta | Atribuye acciones | RDD |
| Crear orden | Imprescindible para la primera venta | Inicia el flujo | RDD |
| Custodia | Imprescindible para la primera venta | Responsabilidad central | RDD |
| Nombre del cliente | Imprescindible para la primera venta | Identificación mínima acordada | RDD |
| Problema reportado | Imprescindible para la primera venta | Entrada obligatoria | RDD |
| Campos configurables de recepción | Imprescindible para la primera venta | Sólo el conjunto mínimo aprobado; no un motor general | RP |
| Folio único | Imprescindible para la primera venta | Identidad operativa | RDD |
| Identificación física | Imprescindible para la primera venta | Vincula objeto y orden | RDD |
| Detalle de orden | Imprescindible para la primera venta | Soporta operación | RP |
| Seguimientos o notas narrativas | Imprescindible para la primera venta | Conserva contexto | RP |
| Actor, fecha y hora | Imprescindible para la primera venta | Trazabilidad mínima | RDD |
| Estado de negocio | Imprescindible para la primera venta | Controla el ciclo | RDD |
| Ubicación física | Imprescindible para la primera venta | No debe confundirse con estado | RDD |
| Asignación/participación técnica | Imprescindible para la primera venta | Distingue intervención y responsabilidad | RDD |
| Diagnóstico/conclusión | Imprescindible para la primera venta | Base técnica de propuesta | RDD |
| Recomendaciones | Imprescindible para la primera venta | Separa consejo de hallazgo | RDD |
| Cotización multiconcepto | Imprescindible para la primera venta | Permite alcance comercial real | RDD |
| Autorización parcial por concepto | Imprescindible para la primera venta | Evita todo-o-nada falso | RDD |
| Ejecución autorizada | Imprescindible para la primera venta | Protege alcance acordado | RDD |
| Segunda revisión/control de calidad | Imprescindible para la primera venta | Criterio de paso a resolución | RDD |
| Listo/No quedó | Imprescindible para la primera venta | Cierre técnico explícito | RDD |
| Anticipos básicos | Imprescindible para la primera venta | Realidad operativa de caja | RP |
| Pago final básico | Imprescindible para la primera venta | Permite cerrar venta | RP |
| Entrega/fin de custodia | Imprescindible para la primera venta | Cierra responsabilidad | RDD |
| Línea temporal/historial operativo | Imprescindible para la primera venta | Evidencia transversal | RDD |

## Capacidades de preparación para producción

**[RP]** Pruebas de aislamiento, autorización negativa, recuperación, auditoría, manejo de secretos, archivos seguros y observabilidad son obligatorias antes de producción aunque no sean pantallas del flujo comercial.

## Capacidades diferidas con frontera explícita

| Capacidad | Interfaz mínima en el MVP | Clasificación |
| --- | --- | --- |
| Inventario | Concepto descriptivo sin stock | FMVP |
| Compras/proveedores | Ninguna dependencia en el flujo | FMVP |
| Facturación | Referencia futura desde pago/orden | FMVP |
| Mensajería | Hecho notificable; envío manual aceptable | DD |
| Impresión | Solicitud a adaptador opcional | DD |
| Analítica | Proyecciones operativas, no warehouse | FMVP |
| Pagos en línea | Registro manual de movimiento permitido | FMVP |
| Dispositivo global | Sesión contextual suficiente inicialmente | DD |

## Regla de cambio de alcance

**[DAR]** Cualquier incorporación debe demostrar qué invariante o paso vendible desbloquea, su dueño modular, riesgos de tenancy y costo de pruebas. Si no lo demuestra, permanece diferida.
