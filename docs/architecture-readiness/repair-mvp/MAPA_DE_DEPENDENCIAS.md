# Mapa de dependencias

## Dirección recomendada

**[DAR]** Las dependencias apuntan desde orquestación hacia capacidades propietarias mediante contratos internos. Ningún módulo obtiene autoridad por leer o escribir directamente los datos de otro.

| Consumidor | Proveedor de capacidad | Necesidad | Forma recomendada | Clasificación |
| --- | --- | --- | --- | --- |
| Todos | Identidad y acceso | Actor y permisos | Contexto verificado | DAR |
| Todos | Tenant y sucursal | Alcance | Contexto obligatorio | RDD |
| Órdenes | Clientes | Referencia mínima | Identificador e instantánea permitida | DAP |
| Órdenes | Configuración | Campos y política de recepción | Política resuelta/versionada | DAR |
| Trabajo técnico | Órdenes | Orden y equipo válidos | Consulta contractual | RDD |
| Comercial | Trabajo técnico | Conclusión/recomendación | Referencia a revisión | RDD |
| Trabajo técnico | Comercial | Conceptos autorizados | Decisión versionada | RDD |
| Flujo y calidad | Trabajo técnico | Trabajo terminado | Hecho confirmado | RDD |
| Pagos | Comercial | Importe exigible | Snapshot/versionado | DAP |
| Entrega/custodia | Pagos | Condición de saldo | Resultado de política | PB |
| Línea temporal | Todos | Hechos relevantes | Eventos posteriores a confirmar la transacción | DAR |
| Evidencia | Todos | Archivos vinculados | Puerto controlado | DAR |

## Regla de ciclos

**[DAR]** Si dos módulos parecen necesitarse mutuamente, la coordinación se mueve a la capa de aplicación o se intercambian hechos/versiones. No se acepta dependencia circular entre dominios.

## Dependencias futuras

- **[FMVP]** Inventario recibe demanda o consumo futuro; no controla la autorización comercial del MVP.
- **[FMVP]** Facturación consume orden y pagos cerrados; no modifica su historia.
- **[DD]** Notificaciones consumen hechos notificables de forma reemplazable.
- **[FMVP]** BI consume proyecciones/eventos sin entrar en transacciones operativas.

## Riesgos de acoplamiento

- **[R]** Convertir la orden en objeto universal concentra reglas y bloquea evolución.
- **[R]** Compartir tablas hace indistinguible la propiedad y facilita saltos de aislamiento multitenant.
- **[R]** Consultar proveedores externos dentro de una transacción crítica amplía fallos y latencia.
- **[R]** Usar la línea temporal como fuente autoritativa accidental equivale a Event Sourcing no diseñado.
