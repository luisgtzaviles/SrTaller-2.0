# Seguridad y acciones sensibles

## Acciones sensibles del MVP

| Acción | Permiso y posible reautenticación | Trazabilidad/motivo/compensación | Clasificación |
| --- | --- | --- | --- |
| Modificar precio | Comercial; reautenticar según umbral por definir | Precio anterior/nuevo, motivo; nueva versión | DAP |
| Aplicar descuento manual | Comercial especial; posible reautenticación | Regla, monto y motivo; nunca sobrescribir historia | DAP |
| Cancelar pago | Financiero; reautenticación recomendada | Movimiento compensatorio y motivo; sin borrado | DAR |
| Devolver anticipo | Financiero; reautenticación recomendada | Movimiento de devolución y referencia | DAR |
| Corregir entrega | Autoridad excepcional; reautenticación | Evento compensatorio, motivo y custodia resultante | PB |
| Reabrir orden | Autoridad operativa especial | Estado previo/nuevo, razón y efectos | PB |
| Saltar segunda revisión | Excepción explícita, nunca permiso general | Motivo, actor y riesgo aceptado; sin borrar requisito | PB |
| Entregar sin nota/evidencia mínima | Excepción de entrega | Motivo y evidencia alternativa | PB |
| Autorizar excepción | Rol competente y reautenticación | Política exceptuada, alcance y expiración | DAP |
| Cambiar tenant/sucursal | Membresía verificada | Sesión, origen/destino; no mutar tenant de entidad | RDD |
| Eliminar evidencia | Permiso restringido | Retiro lógico/retención y motivo; no borrado destructivo por defecto | DAP |
| Modificar políticas | Administrador de tenant; reautenticación | Nueva versión, alcance y motivo | DAR |
| Suplantar usuario | Soporte excepcional, temporal | Actor real/suplantado, razón, aprobación y expiración | PB |
| Cambiar técnico responsable | Operativo autorizado | Anterior/nuevo, motivo y momento | DAP |
| Modificar cotización autorizada | No editar versión; crear reemplazo autorizado | Relación entre versiones y nuevas decisiones | RDD |
| Ver/adjuntar evidencia | Capacidad por orden/tipo | Acceso o cambio sensible cuando corresponda | RDD |

## Controles obligatorios antes de implementación funcional

- **[RP]** Modelo de amenazas inicial de multitenancy, identidad/PIN, archivos y primera integración.
- **[RP]** Matriz preliminar de permisos y alcance.
- **[RP]** Estrategia de secretos y ambientes.
- **[RP]** Pruebas negativas para aislamiento, autorización y archivos.
- **[ADR]** Decisiones críticas registradas y aceptadas por el proceso aplicable.

## Controles antes de producción

- **[RP]** Pruebas de aislamiento y bypass de autorización.
- **[RP]** Revisión de cargas de archivos, referencias directas y exposición de datos.
- **[RP]** Backups/restauración y revocación ensayados.
- **[RP]** Observabilidad y procedimientos operativos mínimos.
- **[RP]** Riesgos residuales aceptados por autoridad competente.

## Prohibiciones

- **[R]** No registrar secretos, PIN, tokens o evidencia sensible en logs.
- **[R]** No conceder bypass permanente a soporte o plataforma.
- **[R]** No confiar en ocultamiento de la interfaz de usuario como autorización.
- **[R]** No exponer archivos mediante rutas predecibles sin control de acceso.
- **[R]** No usar borrado destructivo para ocultar correcciones financieras, comerciales, de entrega o evidencia sujeta a retención.
