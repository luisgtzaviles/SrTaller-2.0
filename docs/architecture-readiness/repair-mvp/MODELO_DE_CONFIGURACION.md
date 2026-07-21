# Modelo de configuración

## Propósito

**[DAR]** La configuración del MVP expresa políticas operativas limitadas, versionadas y con dueño. No es un motor general de reglas ni una colección de banderas sin semántica.

## Capas conceptuales

**[DAP]** La resolución candidata es: valores seguros del sistema → configuración del tenant → ajuste permitido de sucursal → política efectiva. Cuando reproducir una decisión lo exija, la orden conserva versión o instantánea mínima aplicada. Precedencia y campos exactos siguen abiertos.

| Tipo | Ejemplos | Tratamiento | Clasificación |
| --- | --- | --- | --- |
| Política de negocio | Servicio inicial, QC, entrega | Versionada y con autoridad | DAP |
| Requisito de captura | Contacto, apellido, marca, modelo, IMEI, color, rasgos, evidencia | Conjunto mínimo configurable | DAP |
| Preferencia visual | Presentación y orden de campos | No decide validez del dominio | DD |
| Catálogo | Estados y ubicaciones permitidos | Identidad estable y vigencia | DAP |
| Permiso | Quién puede ejecutar acción | Gobernado por Acceso, no por preferencias | DAR |
| Integración | Impresión, archivos, notificación | Referencia segura al adaptador | DAP |

## Configuración candidata

| Política | Alcance probable | Uso | Clasificación |
| --- | --- | --- | --- |
| Campos mínimos de recepción | Tenant/sucursal | Crear orden válida | DAP |
| Formato y alcance de folio | Tenant/sucursal | Identificación | DAP |
| Estados y transiciones habilitadas | Tenant con variantes controladas | Flujo | DAP |
| Regla mínima de QC | Tenant/sucursal | Resolución | DAP |
| Condición de pago para entrega | Tenant | Custodia | DAP |
| Evidencia de autorización/entrega | Tenant | Acciones sensibles | DAP |
| Contacto/apellido obligatorios | Tenant/sucursal | Recepción mínima | DAP |
| Marca/modelo/IMEI/color/rasgos | Tenant/sucursal | Identificación del equipo | DAP |
| Política de servicio inicial | Tenant/sucursal | Recepción/comercial | DAP |
| Impresión | Sucursal | Identificación y alternativa manual | DAP |

## Reglas

1. **[DAR]** Una política publicada es inmutable; los cambios crean versión.
2. **[DAR]** Una operación sensible conserva la versión aplicada cuando sea relevante.
3. **[DAR]** La precedencia entre valor global, tenant y sucursal es explícita.
4. **[DAR]** Los valores predeterminados son seguros y visibles; no aparecen por accidente técnico.
5. **[DAR]** Sólo actores autorizados publican cambios y queda auditoría.

## Decisiones bloqueantes

- **[PB]** Catálogo mínimo configurable frente a reglas fijas del producto.
- **[PB]** Precedencia y herencia exactas entre tenant y sucursal.
- **[PB]** Aplicación temporal a órdenes abiertas: conservar versión o adoptar nueva.
- **[PB]** Autoridad para cambiar cada política.
- **[PB]** Zona horaria efectiva y su precedencia.

## Diferido

**[FMVP]** Un motor general de reglas, scripting por tenant o personalización arbitraria queda fuera del MVP.
