# Plantilla de runbook

## Estado del documento

- **Estado:** Propuesta
- **Uso:** Crear un runbook versionado por operación o síntoma concreto antes de necesitarlo.
- **Regla:** Nunca incluir contraseñas, tokens, PIN, llaves o datos reales; referenciar el mecanismo seguro de acceso.

---

# Runbook — Nombre de la operación o síntoma

## Estado del documento

| Campo | Valor |
|---|---|
| Estado | `Draft` / `Validated in staging` / `Approved` / `Deprecated` |
| Servicio/capacidad | TBD |
| Ambientes permitidos | local / staging / production TBD |
| Owner técnico | TBD |
| Owner operativo | TBD |
| Última validación real | TBD |
| Próxima revisión | TBD |
| Runbook reemplazado | TBD / Ninguno |

## Propósito

Qué resultado seguro produce el runbook y qué problema resuelve.

## Alcance y exclusiones

- **Incluye:** TBD.
- **No incluye:** TBD.
- **Impacto esperado:** TBD.
- **¿Puede afectar varios tenants?:** Sí/No/TBD.

## Cuándo usarlo

### Señales de entrada

- Alerta/síntoma: TBD.
- Métrica/log/trace: TBD.
- Evento operativo autorizado: TBD.

### No usar cuando

- Condición que requiere otro runbook o escalación: TBD.
- Riesgo que exige Incident Commander/seguridad: TBD.

## Riesgos

| Riesgo | Señal | Mitigación | Acción si ocurre |
|---|---|---|---|
| Acceso cruzado entre tenants | TBD | Scope/preview/validación | Detener y escalar |
| Pérdida o duplicación de datos | TBD | Backup/idempotencia | TBD |
| Interrupción | TBD | Ventana/limitación | TBD |
| Exposición de secretos | TBD | Redacción/acceso seguro | TBD |

## Precondiciones y autorización

- [ ] Ambiente y cuenta/proyecto confirmados de forma visible.
- [ ] Versión/digest y configuración actual registrados.
- [ ] Alcance tenant/sucursal/servicio confirmado.
- [ ] Incidente/cambio/PBI vinculado.
- [ ] Aprobación requerida obtenida: TBD.
- [ ] Acceso de mínimo privilegio disponible; no credenciales compartidas.
- [ ] Backup/checkpoint/rollback disponible cuando aplica.
- [ ] Canal de coordinación y responsable definidos.
- [ ] Ventana y comunicación confirmadas cuando aplica.

## Dependencias y herramientas

| Dependencia | Estado esperado | Cómo verificar sin secretos |
|---|---|---|
| PostgreSQL | TBD | TBD |
| Redis/colas | TBD | TBD |
| Storage | TBD | TBD |
| API/workers/realtime | TBD | TBD |
| Integración externa | TBD | TBD |

Comandos o automatizaciones futuras deben ser copiables, versionadas y seguras por defecto. No usar placeholders que puedan ejecutarse accidentalmente contra production.

## Datos de contexto a registrar

- Timestamp inicial real: TBD.
- Ambiente/región: TBD.
- Servicio y versión/digest: TBD.
- Correlation/job/event ID no sensible: TBD.
- Tenant ID interno no sensible: TBD / No aplica.
- Síntoma y baseline: TBD.

## Procedimiento

### 1. Diagnóstico seguro

1. TBD.
2. Confirmar resultado esperado: TBD.
3. Si se observa condición de paro, ir a **Detener y escalar**.

### 2. Preview o dry-run

1. Mostrar alcance sin contenido sensible: TBD.
2. Verificar número de tenants/filas/jobs/objetos afectados: TBD.
3. Obtener segunda validación si el umbral TBD se supera.

### 3. Ejecución

1. Acción pequeña/reanudable: TBD.
2. Checkpoint: TBD.
3. Observar señal: TBD.
4. Repetir por lotes sólo si la validación sigue aprobada.

### 4. Verificación

- [ ] Resultado funcional esperado.
- [ ] Tenant/sucursal correctos y ningún acceso cruzado.
- [ ] Integridad/conteos/reconciliación.
- [ ] Jobs, caché, realtime y archivos consistentes.
- [ ] Logs/métricas/alertas normales.
- [ ] No quedaron credenciales o artefactos temporales.

## Condiciones de paro

Detener inmediatamente si:

- aparece tenant/sucursal fuera del alcance;
- conteos o checksum difieren de lo esperado;
- crecen errores, locks, lag o saturación fuera del límite TBD;
- se pierde checkpoint o no se puede determinar qué se aplicó;
- la versión/ambiente no coincide;
- se detectan datos sensibles en salida/evidencia;
- la acción deja de ser idempotente o reversible según plan.

## Rollback o compensación

- Trigger: TBD.
- Autoridad: TBD.
- Versión/digest/checkpoint objetivo: TBD.
- Pasos: TBD.
- Riesgo/pérdida esperada: TBD.
- Verificación posterior: TBD.
- Referencia a [Rollback Policy](./ROLLBACK_POLICY.md): aplica/no aplica justificado.

## Detener y escalar

- Pausa/contención segura: TBD.
- A quién escalar: TBD.
- Canal: TBD.
- Severidad provisional: TBD.
- Evidencia que preservar: TBD.
- Referencia a [Incident Management](./INCIDENT_MANAGEMENT.md).

## Comunicación

| Momento | Audiencia | Mensaje/aprobación | Canal |
|---|---|---|---|
| Antes | TBD | Alcance, riesgo y ventana | TBD |
| Durante | TBD | Progreso, impacto, próximo update | TBD |
| Después | TBD | Resultado, riesgo residual, seguimiento | TBD |

No incluir información de un tenant en comunicaciones dirigidas a otro.

## Evidencia de ejecución

| Campo | Valor real |
|---|---|
| Fecha/inicio/fin | TBD |
| Ejecutores/aprobadores | TBD |
| Ambiente/versiones | TBD |
| Alcance real | TBD |
| Pasos completados | TBD |
| Resultado/verificaciones | TBD |
| Rollback/incident ID | TBD / No aplica |
| Logs/traces sanitizados | Enlace TBD |
| Hallazgos y seguimiento | TBD |

## Cierre y limpieza

- [ ] Accesos temporales revocados.
- [ ] Jobs/flags/pausas temporales restaurados o documentados.
- [ ] Archivos/restores temporales eliminados de forma segura.
- [ ] Alertas y dashboards confirmados.
- [ ] Registro de cambio/incidente actualizado.
- [ ] Runbook corregido con diferencias observadas.
- [ ] Trabajo de seguimiento trazado.

## Problemas conocidos

| Limitación | Impacto | Workaround seguro | Seguimiento |
|---|---|---|---|
| TBD | TBD | TBD | TBD |

## Preguntas abiertas

- TBD.

## Historial de validación

| Fecha real | Ambiente | Escenario | Resultado | Cambios requeridos | Revisor |
|---|---|---|---|---|---|
| TBD | staging | TBD | TBD | TBD | TBD |

---

## Reglas de uso de la plantilla

- Validar en staging antes de aprobar para production, salvo runbook puramente local.
- Escribir pasos para un operador informado que no conoce la historia del problema.
- Preferir automatización versionada con preview, límites y confirmaciones.
- Probar rollback/condiciones de paro, no sólo camino exitoso.
- Marcar `Deprecated` y enlazar reemplazo; no borrar historia utilizada en incidentes.
- Revisar después de cada ejecución real o cambio de servicio/dependencia.

## Preguntas abiertas sobre la plantilla

- ¿Dónde se publicarán runbooks para seguir disponibles durante una caída?
- ¿Qué periodo de revisión y roles de aprobación se exigirán?
- ¿Qué acciones requerirán segunda persona o acceso break-glass?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** selección de plataforma operativa o primera validación de un runbook en staging.
- **Documentos relacionados:** [Operations Overview](./OPERATIONS_OVERVIEW.md), [Backup and Recovery](./BACKUP_AND_RECOVERY.md), [Migration Policy](./MIGRATION_POLICY.md).
