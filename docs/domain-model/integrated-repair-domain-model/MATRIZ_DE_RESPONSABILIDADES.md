# Matriz de responsabilidades

## Convención

Esta matriz muestra responsabilidad de dominio candidata, no permisos implementados ni estructura laboral.

| Código | Significado |
|---|---|
| R | ejecuta o registra |
| A | responde por la decisión o excepción |
| C | aporta información o debe ser consultado |
| I | recibe el resultado |
| — | no participa normalmente |

**Clasificación:** PM basada en HOV/DDV; las capacidades sensibles permanecen pendientes.

## Ciclo operativo

| Actividad | Cliente/decisor | Recepción/atención | Técnico | Revisor QC | Caja | Gerente | Sistema |
|---|---|---|---|---|---|---|---|
| Declarar problema y datos | R/C | R | — | — | — | — | I |
| Crear orden/aceptar custodia | C | R/A | — | — | — | C en excepción | R |
| Identificar físicamente | — | R/A | C | — | — | — | C |
| Mover a pendientes/taller | — | R | R | — | — | A según política | I |
| Asignar técnico | — | C | C | — | — | A/R | I |
| Diagnosticar | C | I | R/A técnico | — | — | C | I |
| Emitir recomendación | I | I | R/A técnico | — | — | C | I |
| Crear cotización | C | R/A | C | — | — | C/A en ajuste | I |
| Decidir por concepto | R/A decisor | R registra | C | — | — | C en excepción | I |
| Ejecutar trabajo | I | I | R/A técnico | — | — | C | I |
| Solicitar QC | — | I | R | C | — | — | I |
| Aprobar/rechazar QC | — | C/R en Avicell | I/C | R/A | — | C en excepción | I |
| Marcar Listo/No quedó | I | R/A | C | C | — | C | I |
| Notificar | I/C | R/A | C | — | — | — | R/C |
| Registrar anticipo/pago | C | R | — | — | R/A según operación | C | I |
| Verificar y entregar | C/R receptor | R/A | C | — | C | A en excepción | I |
| Corregir un hecho | I según impacto | R por contexto | R por contexto | R por contexto | R por contexto | A | I |

## Ownership de información

| Información | Productor primario | Responsable de interpretación | Consumidores |
|---|---|---|---|
| Problema reportado | cliente + recepción | Recepción | Técnico, Comercial |
| Conclusión técnica | técnico | Técnico | Comercial, QC |
| Recomendación técnica | técnico | Técnico | Comercial |
| Precio/cotización | recepción/comercial | Comercial | Cliente, Técnico, Pagos |
| Autorización/rechazo | decisor + recepción | Comercial | Técnico, Pagos, Trazabilidad |
| Trabajo ejecutado | técnico | Técnico | QC, Comercial, Cliente |
| Resultado QC | revisor | Calidad | Workflow, Técnico, Recepción |
| Movimiento financiero | recepción/caja | Pagos/Caja | Entrega, Comercial |
| Movimiento físico | actor que mueve | Workflow/Custodia | Toda operación |
| Entrega | recepción + receptor | Entrega/Custodia | Órdenes, Pagos, Posventa |

**Clasificación:** DDV para ownership técnico/comercial y atribución; PM para frontera final.

## Vacíos de autoridad

- **PA:** quién puede aprobar precios manuales, descuentos y excepciones.
- **PA:** autoridad del contacto frente al cliente operativo.
- **PA:** reglas para tercero que recoge.
- **PA:** independencia del revisor y sustitución cuando no está disponible.
- **PA:** ownership de pagos entre recepción, caja y finanzas.
- **PA:** acciones de proveedor externo y gerente multisucursal.
