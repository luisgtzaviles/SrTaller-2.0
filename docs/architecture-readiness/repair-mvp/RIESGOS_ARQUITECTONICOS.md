# Riesgos arquitectónicos

## Registro priorizado

| Riesgo | Probabilidad / impacto | Señal temprana | Mitigación | Momento de decisión | Clasificación |
| --- | --- | --- | --- | --- | --- |
| Orden como agregado gigante | Alta / alta | Toda función carga o bloquea Orden completa | Separar invariantes y versiones | Antes de R1 | R |
| Lógica de negocio en controladores | Alta / alta | Reglas repetidas por entrada | Dominio/aplicación y pruebas | Primer cambio de implementación de R0 | R |
| Tablas compartidas sin propietario | Alta / alta | Escrituras cruzadas | Ownership y repositorios propietarios | Diseño de persistencia | R |
| Configuración como JSON sin semántica | Media / alta | Claves libres y sin versión | Políticas tipadas/versionadas | Antes de R1 | R |
| Dependencias circulares | Media / alta | Importaciones/llamadas bidireccionales | Orquestación y contratos | Primer cambio de implementación de R0 | R |
| Eventos indiscriminados | Media / media | Cada cambio publica y encadena | Evento sólo con valor/consumidor | Por rebanada | R |
| Trazabilidad incompleta | Alta / alta | Acciones sin actor/tiempo | Contrato transversal y auditoría | Primer cambio de implementación de R0 | R |
| Notas libres como fuente de verdad | Alta / alta | Estado/precio sólo en texto | Datos gobernados + nota contextual | Modelado de cada etapa | R |
| Tenant implícito | Media / crítica | Contexto inferido de entidad/cliente | Contexto verificado explícito | Antes de programar | R |
| Consultas sin aislamiento | Media / crítica | Búsqueda por ID sin tenant | Filtro estructural y pruebas negativas | Antes de R1 | R |
| Permisos sólo en interfaz | Alta / crítica | API interna acepta acción oculta | Autorización en aplicación | Primer cambio de implementación de R0 | R |
| Precios mutables sin historial | Media / crítica | Cotización autorizada cambia | Versiones e instantáneas | Antes de R3 | R |
| Pagos como columnas de Orden | Media / crítica | Saldo editado manualmente | Movimientos idempotentes | Antes de R5 | R |
| Archivos en base de datos sin evaluación | Media / alta | Filas grandes/backups lentos | Puerto, límites y decisión de almacenamiento | Antes de evidencias | R |
| Transacciones demasiado amplias | Media / alta | Incluyen impresión/notificación | Limitar a invariantes | Por caso de uso | R |
| Consistencia eventual en invariantes | Media / crítica | Listo sin QC o entrega doble | Consistencia inmediata local | Antes de R4/R5 | R |
| Sobrearquitectura | Media / alta | Infraestructura sin flujo usable | Rebanadas y evidencia | En cada ADR | R |
| Fragmentación excesiva | Media / alta | Módulos vacíos/coordinación constante | Integrar físicamente, preservar frontera | Antes de R0 | R |
| Microservicios prematuros | Baja / alta | Despliegues/red sin necesidad | Monolito modular | ADR-002 | R |
| Núcleo compartido creciente | Media / alta | Reglas de negocio en “Común” | Núcleo mínimo y estable | Primer cambio de implementación de R0 | R |
| Arquitectura genérica sin dominio | Media / alta | CRUD de tablas sustituye invariantes | Trazabilidad al modelo integrado | Por PBI | R |
| Copiar esquema heredado | Media / alta | Nombres/relaciones sin validación | Usar legacy sólo como evidencia | Diseño de persistencia | R |
| Interfaz primero, modelo después | Alta / alta | Pantallas fijan agregados/endpoints | Caso vertical desde dominio | Antes de R1 | R |
| Aislamiento multitenant incompleto | Media / crítica | Prueba cruzada accede datos | Defensa en profundidad | Antes de R1/producción | R |
| Proveedor externo en transacción | Media / alta | Impresora/canal bloquea orden | Adaptador y estado pendiente | R1/R2 | R |
| SLOs inventados | Media / media | Cifras sin medición | Acordar carga y medir | Antes de producción | R |

## Riesgo residual

**[RP]** Antes de producción, cada riesgo crítico o alto debe estar mitigado, probado o aceptado explícitamente por el rol competente. Este documento no acepta riesgos.

## Seguimiento

**[DAR]** Los riesgos deben enlazarse con ADR, PBI, prueba y evidencia de cierre; cambiar una propuesta no equivale a cerrar el riesgo.
