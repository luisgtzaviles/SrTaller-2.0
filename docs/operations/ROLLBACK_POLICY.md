# Política de rollback

## Estado del documento

- **Estado:** Propuesta
- **Alcance:** Artefactos, configuración, migraciones y datos de la futura plataforma.
- **Decisión pendiente:** Autoridad, tiempos, estrategias de rollout, retención de artefactos y automatización.

## Objetivo

Restaurar un estado seguro y conocido cuando un cambio causa impacto, sin confundir revertir un artefacto con deshacer datos ni agravar inconsistencias entre API, workers, clientes e integraciones.

## Distinciones

| Acción | Qué hace | Cuándo considerar |
|---|---|---|
| Rollback de artefacto | Promueve una versión/digest anterior compatible. | Regresión de aplicación sin escritura incompatible. |
| Rollback de configuración | Revierte una configuración versionada. | Cambio de comportamiento atribuible y reversible. |
| Roll-forward | Publica una corrección nueva compatible. | Hay datos nuevos/incompatibles o rollback es más riesgoso. |
| Reversión lógica de datos | Compensa cambios mediante operación diseñada. | El dominio permite compensación auditada. |
| Restore desde backup | Recupera un estado previo de datos. | Pérdida/corrupción bajo [Backup and Recovery](./BACKUP_AND_RECOVERY.md). |
| Contención | Pausa/deshabilita/limita una superficie. | Se necesita frenar impacto antes de recuperar. |

Estas opciones pueden combinarse, pero requieren decisión explícita y orden controlado.

## Principios

- Preparar rollback durante refinamiento y probarlo antes de production.
- Conservar artefactos inmutables y configuración/versiones necesarias.
- Promover por digest; nunca reconstruir “la misma” versión.
- Mantener migraciones compatibles hacia adelante y contratos tolerantes a versiones adyacentes.
- No revertir datos destructivamente sólo para hacer compatible una versión anterior.
- Verificar tenant, sucursal, permisos, jobs, caché, realtime y archivos después de recuperar.
- Registrar quién decidió, qué evidencia usó y qué riesgo residual quedó.
- Un rollback urgente no autoriza FTP, cambios no versionados ni consultas globales improvisadas.

## Cuándo activar

Se deben definir umbrales por servicio. Señales candidatas:

- acceso o riesgo de acceso cruzado entre tenants;
- bypass de autorización o exposición de secretos;
- corrupción, pérdida o duplicación de datos;
- errores/latencia/saturación fuera de objetivo y correlacionados al cambio;
- acumulación o procesamiento incorrecto de jobs/mensajes;
- flujo crítico inutilizable sin workaround seguro;
- migración que excede locks/duración o falla validación;
- evidencia de staging inválida para el digest promovido.

Ante riesgo inmediato, se contiene primero. La autoridad exacta para ordenar rollback es `TBD`.

## Plan requerido por cambio

| Campo | Valor |
|---|---|
| PBI/release | TBD |
| Servicios/artefactos afectados | TBD |
| Versión actual y objetivo + digests | TBD |
| Configuración/migraciones asociadas | TBD |
| Compatibilidad versión anterior ↔ esquema/datos | TBD |
| Señales de éxito/fallo | TBD |
| Trigger y autoridad | TBD |
| Pasos automatizados/runbook | TBD |
| Tiempo estimado basado en ensayo | TBD |
| Pérdida/riesgo esperado | TBD |
| Verificación y evidencia | TBD |
| Alternativa roll-forward/contención | TBD |

## Procedimiento conceptual

1. **Declarar:** identificar incidente/release, impacto, versión y decisión.
2. **Congelar:** detener promociones y cambios no relacionados.
3. **Contener:** pausar tráfico/jobs/integración si reduce daño y es seguro.
4. **Comprobar compatibilidad:** esquema, datos, eventos, cachés y clientes.
5. **Seleccionar:** rollback, roll-forward, restore o combinación.
6. **Ejecutar:** mediante pipeline/runbook, usando digest conocido.
7. **Verificar:** smoke tests, criterios del incidente, tenant/branch, permisos, datos, jobs y observabilidad.
8. **Observar:** confirmar estabilidad por periodo `TBD`.
9. **Comunicar:** estado, impacto y siguientes acciones.
10. **Cerrar:** registrar resultado, actualizar manifiesto y crear seguimiento/análisis.

## Orden entre desplegables

API, workers y clientes podrían desplegarse por separado. Cada plan debe indicar compatibilidad y orden. Ejemplos conceptuales a evaluar:

- detener workers que producen escrituras incompatibles antes de retroceder API;
- mantener API compatible con cliente web previamente cacheado y móviles futuros;
- invalidar sólo cachés seguras, con namespace de tenant;
- desconectar/reautenticar sockets cuando cambia contrato o revocación;
- coordinar proveedores/webhooks para evitar replay o pérdida.

No se fija un orden universal; se ensaya por release.

## Migraciones y datos

- Cambios aditivos facilitan volver a una aplicación anterior.
- Una migración destructiva requiere periodo separado y evidencia de que ningún consumidor antiguo existe.
- Si la versión nueva ya escribió un formato no entendido por la anterior, se prefiere contención/roll-forward salvo plan de conversión probado.
- Down migrations automáticas no se presumen seguras.
- Restaurar backup implica pérdida potencial y reconciliación; requiere el proceso específico.
- Backfills deben poder pausarse y reanudarse; revertir aplicación no debe continuar un backfill incompatible.

## Configuración y feature flags

La configuración debe estar versionada y separada del artefacto. Feature flags son opción futura y no sustituyen rollback:

- necesitan owner, estado por ambiente/tenant y caducidad;
- deben fallar de forma segura;
- cambios deben auditarse;
- código antiguo no se retira hasta cerrar la transición.

La herramienta y política no están seleccionadas.

## Pruebas

Antes de producción, según riesgo:

- promover candidato en staging y retroceder al digest anterior;
- verificar versiones adyacentes con esquema expandido;
- probar pausa/reinicio de jobs e idempotencia;
- verificar sockets, caché y clientes;
- medir duración y pasos manuales restantes;
- confirmar que runbook y accesos funcionan;
- realizar game days con escenarios de datos/tenant cuando la operación madure.

## Rollback fallido

Si el rollback no recupera o agrava impacto:

- detener reintentos automáticos no controlados;
- mantener/ajustar contención;
- escalar bajo [Incident Management](./INCIDENT_MANAGEMENT.md);
- elegir roll-forward o restore con evidencia disponible;
- preservar logs, estados y timeline;
- comunicar cambio de plan sin afirmar recuperación prematura.

## Evidencia

- trigger, decisión y aprobador;
- versiones/digests antes y después;
- pasos y timestamps reales;
- migraciones/configuración/flags;
- verificaciones y métricas;
- impacto y datos reconciliados;
- fallos del runbook;
- resultado y acciones posteriores.

## Preguntas abiertas

- ¿Quién puede iniciar, aprobar y detener un rollback?
- ¿Cuánto tiempo se retendrán artefactos y configuraciones anteriores?
- ¿Qué versiones adyacentes deben ser compatibles por desplegable?
- ¿Qué umbrales automáticos podrían pausar rollout y cuáles nunca deben ejecutar rollback solos?
- ¿Qué estrategia de rollout se elegirá por servicio?
- ¿Cómo se coordinará rollback con clientes móviles que no actualizan inmediatamente?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** selección de pipeline/topología o antes del primer despliegue funcional.
- **Documentos relacionados:** [Release Process](../delivery/RELEASE_PROCESS.md), [Migration Policy](./MIGRATION_POLICY.md), [Incident Management](./INCIDENT_MANAGEMENT.md), [Runbook Template](./RUNBOOK_TEMPLATE.md).
