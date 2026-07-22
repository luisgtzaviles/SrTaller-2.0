# Bloqueantes del piloto controlado

## Alcance del gate

El piloto usa operaciones reales limitadas. Por ello exige el flujo vendible R1–R5 integrado, pero puede mantener provisión, soporte o tareas auxiliares manuales si son explícitas, seguras, auditables y reversibles.

## Prerrequisitos funcionales

- R0 demostrado con aislamiento, identidad, permisos y observabilidad.
- R1–R5 integradas con los caminos esenciales: rechazo parcial, No quedó, QC rechazado, anticipo, falla de impresión y entrega.
- Ninguna operación crítica depende de una nota libre como fuente autoritativa.
- Creación, pago y entrega toleran reintento sin duplicar efectos.

## Decisiones H3

| ID | Decisión | Evidencia mínima |
| --- | --- | --- |
| DEC-031 | Fin de custodia | Entrega válida única, tercero/excepción y corrección trazables |
| DEC-053 | Backups | Ejecución exitosa, cifrado, alcance y monitoreo |
| DEC-054 | Restauración | Ensayo aislado y reconciliación de datos/archivos |
| DEC-057 | Límites de archivos | Tipos, tamaños, cuotas y rechazo seguro |
| DEC-059 | Convivencia con SR Taller 1.0 | Fuente de verdad, corte, doble captura y reconciliación decididos |
| DEC-060 | Estrategia de piloto | Tenant/sucursal, usuarios, datos, soporte y salida delimitados |
| DEC-061 | Soporte y rollback | Runbooks, responsables, criterios de abortar y recuperación |
| DEC-065 | Rendimiento mínimo | Criterios cualitativos por recorrido y medición con carga representativa |
| DEC-068 | Administración de tenants | Provisión y soporte del piloto auditables, aun si son manuales |

## Controles necesarios

- clasificación ADR-013, reautenticación/segundo aprobador e invalidación probadas para las acciones incluidas;
- auditoría suficiente para reconstruir recepción, autorización, trabajo, QC, pagos y entrega;
- monitoreo de errores, aislamiento, capacidad, archivos y efectos laterales pendientes;
- datos iniciales controlados, sin copiar producción sin proceso autorizado;
- canal de soporte, severidades y autoridad para detener el piloto;
- aceptación explícita de riesgos residuales del alcance limitado.

## Lo que puede seguir incompleto durante el piloto

Automatización de onboarding, facturación SaaS, alertamiento 24/7, multi-región, portal de cliente, canales automáticos, BI avanzado y todas las capacidades H5. Una tarea manual debe tener owner, registro y condición de retiro.

## Condición de no avance

No se inicia el piloto si no puede restaurarse la información, si existe riesgo cross-tenant no mitigado, si no se sabe qué sistema es fuente de verdad o si una entrega/pago puede duplicarse sin detección y recuperación.
