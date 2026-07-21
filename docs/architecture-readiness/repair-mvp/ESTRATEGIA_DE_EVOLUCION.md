# Estrategia de evolución

## Secuencia

**[DAR]** La arquitectura evoluciona por rebanadas verticales completas, manteniendo módulos lógicos y contratos internos. No se construyen primero capas horizontales exhaustivas sin valor comprobable.

## Etapas de producto

| Etapa | Resultado | Fronteras que deben preservarse | Clasificación |
| --- | --- | --- | --- |
| 1 — MVP vendible de Reparaciones | Flujo completo de recepción a entrega | Orden, custodia, comercial, trabajo, QC, pagos, archivos y contexto | RP |
| 2 — Fortalecimiento operativo | Permisos/excepciones, reportes, garantías básicas, notificaciones y plantillas QC | Acceso, políticas, evidencia y proyecciones | DAP |
| 3 — Inventario y Caja completos | Stock, compras y operación de caja conectados | Concepto de pieza y movimientos financieros no acoplados | DD |
| 4 — CRM y automatización | Comunicación y seguimiento multicanal | Cliente/contacto y hechos notificables | DD |
| 5 — BI y predicción | Analítica histórica y modelos | Eventos/proyecciones sin invadir fuentes autoritativas | DD |

## Incrementos de la Etapa 1

**[DAR]** La Etapa 1 se construye por recepción/custodia, trabajo técnico, comercial, ejecución/calidad, pagos/entrega y endurecimiento. Esta descomposición no cambia el hecho de que el MVP vendible requiere el flujo completo.

## Compatibilidad

- **[DAR]** Cambios de contratos y eventos son aditivos o versionados.
- **[DAR]** Políticas publicadas conservan versión aplicable.
- **[DAR]** Migraciones futuras son reversibles o tienen plan de recuperación; aquí no se diseñan.
- **[DAR]** Proyecciones son reconstruibles y no reemplazan fuentes autoritativas.

## Criterio de extracción

**[ADR]** Un módulo sólo se externaliza con evidencia de necesidad independiente. Hasta entonces se preserva como frontera lógica dentro del monolito.

## Extensiones futuras

**[FMVP]** Inventario, compras, facturación, CRM, mensajería, portal, BI y pagos en línea se conectan mediante contratos; no deben obligar a rediseñar la custodia o autorización del núcleo.
