# Decisiones diferibles

## Pueden esperar sin bloquear la primera rebanada

| Decisión | Condición para diferir | Punto de revisión | Clasificación |
| --- | --- | --- | --- |
| Marco web definitivo de todas las superficies | No fijar la interfaz completa | Antes de implementar esa superficie | DD |
| Contenedores y plataforma de despliegue | Desarrollo inicial reproducible definido | Antes de ambiente compartido | DD |
| Enrutamiento por subdominio comodín | Tenant resuelto por mecanismo seguro alterno | Antes de dominios productivos | DD |
| RLS como defensa adicional | Aislamiento inicial probado por otra estrategia | Antes de producción o escala | DD |
| Broker/cola externa | Efectos laterales toleran mecanismo local confiable | Al aparecer volumen/fallo real | DD |
| Tiempo real | El flujo funciona con refresco/consulta | Al validar necesidad UX | DD |
| Proveedor de notificación | Operación manual aceptable | Antes de automatizar canal | DD |
| Impresora/proveedor concreto | Identificación manual posible | Antes de operación que la exija | DD |
| Identidad global de dispositivo | Sesión revocable cubre el MVP | Al agregar POS/offline | DD |
| Extracción a microservicios | No hay evidencia de independencia | Sólo con señal verificable | DD |
| BI/data warehouse | Proyecciones operativas bastan | Tras datos y preguntas reales | DD |
| Motor completo de promociones | Precio/conceptos básicos funcionan | Al validar promoción real | DD |
| Múltiples monedas | Moneda única explícita basta | Antes de operar otra moneda | DD |
| Impuestos avanzados | Precio histórico básico basta | Antes de facturación/regla fiscal | DD |
| CQRS completo | Lecturas híbridas bastan | Con evidencia de escala | DD |
| Inteligencia artificial | No interviene en invariantes | Con caso y gobernanza | DD |
| SLA avanzados | Próxima acción básica basta | Con acuerdos medibles | DD |
| Personalización total de estados | Catálogo mínimo aprobado | Tras validar variantes | DD |
| Espacios de trabajo sin conexión | Operación conectada cubre MVP | Con necesidad y modelo de conflictos | DD |
| Firma digital | Evidencia básica aceptada | Cuando tenga valor legal/operativo | DD |

## No son diferibles una vez iniciado código base

**[R]** Lenguaje, marco de servidor, persistencia y topología del repositorio no pueden quedar ambiguos después de crear la estructura base. Su aceptación o reemplazo es bloqueante para esa actividad.

## Fuera del MVP

**[FMVP]** Inventario completo, compras, proveedores, contabilidad, facturación electrónica, CRM omnicanal, WhatsApp automático, portal cliente, pagos en línea, RFID/NFC, motor general de reglas, microservicios y Event Sourcing no son “pendientes implícitos” del MVP.

## Regla de activación

**[DAR]** Una decisión diferida se activa sólo cuando una rebanada, riesgo o evidencia operativa la necesita; entonces se registra el ADR o PBI correspondiente.
