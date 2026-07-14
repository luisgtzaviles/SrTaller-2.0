# Política de migraciones

## Estado del documento

- **Estado:** Propuesta
- **Alcance:** Cambios futuros de esquema, datos, índices, configuración persistida y backfills.
- **Hecho conocido:** En esta etapa no se crearán esquemas ejecutables ni migraciones.
- **Decisión pendiente:** Herramienta, naming, locking, ejecución, aprobación y retención de compatibilidad.

## Objetivo

Cambiar datos y estructura de forma trazable, compatible y recuperable, sin mezclar tenants, interrumpir innecesariamente la operación o hacer imposible volver a una versión segura de la aplicación.

## Principios

- Toda migración se vincula a PBI, ADR cuando aplique, release y evidencia.
- Una migración aplicada es inmutable; se corrige mediante otra migración.
- El contexto de tenant y sucursal es explícito en backfills y validaciones.
- Se favorecen cambios pequeños y compatibles hacia adelante.
- La reversibilidad no se presume: se demuestra o se documenta como irreversible con mitigación.
- Migrar esquema no equivale a completar migración de datos o retirar compatibilidad.
- Producción no es el primer lugar donde se prueba duración, locks o recuperación.
- No se ejecutan scripts ad hoc sin versión, revisión, dry-run/preview y evidencia.

## Tipos de migración

| Tipo | Ejemplos conceptuales | Riesgo a evaluar |
|---|---|---|
| Esquema | agregar campo/índice/restricción | locks, compatibilidad, volumen. |
| Datos/backfill | poblar o transformar valores | tenant, idempotencia, concurrencia, duración. |
| Contrato | cambio usado por API/workers/clientes | despliegues independientes y versiones adyacentes. |
| Storage/archivos | mover claves o metadatos | consistencia DB-objeto, acceso y reanudación. |
| Configuración persistida | defaults o estructura por tenant | personalización, rollback y auditoría. |
| Integración | identificadores/estado externo | reconciliación, replay y límites de tercero. |

## Estrategia expandir–migrar–contraer

Se propone como patrón preferente cuando el cambio cruza versiones:

1. **Expandir:** agregar estructura/contrato compatible sin retirar el anterior.
2. **Desplegar compatibilidad:** lectores/escritores toleran ambos estados según diseño.
3. **Migrar:** ejecutar backfill idempotente, observable y reanudable.
4. **Verificar:** integridad, cobertura por tenant y ausencia de referencias inválidas.
5. **Cambiar uso:** hacer que las nuevas versiones usen el estado nuevo.
6. **Observar:** confirmar que no quedan consumidores/filas en formato anterior.
7. **Contraer:** retirar estructura antigua en un release posterior aprobado.

No todos los cambios requieren cada paso, pero omitirlo debe justificarse. La fase de contracción no se combina con el primer despliegue que deja de usar el estado anterior si eso impide rollback.

## Requisitos de una migración

### Identificación y diseño

- ID/nombre único según convención futura.
- PBI, módulo y datos propietarios.
- Estado origen y destino.
- Hechos, hipótesis de volumen y consultas de validación.
- Compatibilidad con versión anterior, actual y siguiente prevista.
- Efecto en tenant, branch, permisos, auditoría y retención.
- Alternativas y ADR si es difícil de revertir.

### Ejecución

- Ambiente, versión, actor/cuenta de servicio y permisos mínimos.
- Dependencias y orden respecto a API/workers/clientes.
- Estimación basada en ensayo; hasta entonces `TBD`.
- Estrategia de lotes, throttling, checkpoint y reanudación.
- Timeouts, locks, espacio y carga monitorizados.
- Idempotencia y comportamiento ante repetición/fallo parcial.
- Criterios de pausa, cancelación, rollback o roll-forward.

### Verificación

- Conteos y checks por tenant, no sólo total global.
- Muestras sintéticas/controles que no expongan datos.
- Relaciones tenant/sucursal y restricciones válidas.
- Lectura/escritura desde versiones compatibles.
- Jobs/eventos emitidos sólo cuando corresponde y sin duplicados.
- Logs/métricas sin contenido sensible.

## Backfills multitenant

- Cada lote selecciona tenant explícito o conserva una partición verificable.
- Checkpoints e idempotency keys incluyen namespace de tenant.
- Fallo de un tenant no cambia silenciosamente al siguiente ni mezcla estado.
- Progreso, errores y reintentos se observan por tenant mediante IDs no sensibles.
- Operaciones globales requieren preview del alcance, límites y autorización.
- La concurrencia se controla para no permitir que un tenant grande degrade a todos sin visibilidad.
- Reanudar valida versión de migración y checkpoint, no confía en memoria de proceso.

## Índices, constraints y locks

El mecanismo depende de PostgreSQL y versión/proveedor seleccionados. Antes de ejecutar se debe evaluar:

- lock adquirido y duración esperada;
- impacto sobre lecturas/escrituras y pool de conexiones;
- espacio temporal y duración por volumen representativo;
- capacidad de cancelar sin dejar estado inválido;
- creación/validación por fases cuando sea posible;
- observación y umbral de abortar `TBD`.

No se declara una sintaxis definitiva en esta política.

## Datos destructivos e irreversibles

Eliminar, truncar, sobrescribir o transformar con pérdida requiere:

- necesidad confirmada y alcance exacto;
- retención/legal revisados;
- backup/punto de recuperación validado;
- export o periodo de compatibilidad cuando corresponda;
- doble revisión y aprobación `TBD`;
- ensayo de recuperación;
- comunicación y ventana si afecta operación;
- preferencia por retiro lógico antes de borrado físico cuando el dominio lo permita, sujeto a política de privacidad.

## Flujo por ambiente

1. Diseño y revisión documental.
2. Prueba automatizada desde estado vacío y desde estado anterior representativo.
3. Ensayo local/CI con volumen sintético.
4. Ensayo en staging con el candidato exacto y medición.
5. Revisión de backup, rollback/roll-forward y gate.
6. Ejecución automatizada/versionada en production.
7. Verificación, observación y registro del resultado.

No se copian datos de production a staging sin el proceso controlado de [Environments](../delivery/ENVIRONMENTS.md).

## Fallo y recuperación

- Detener o pausar de forma segura según diseño.
- Registrar último checkpoint y cambios aplicados.
- No volver a ejecutar a ciegas.
- Evaluar roll-forward como opción preferente cuando revertir datos perdería cambios posteriores.
- Usar [Rollback Policy](./ROLLBACK_POLICY.md) y [Backup and Recovery](./BACKUP_AND_RECOVERY.md) según naturaleza.
- Declarar incidente si existe impacto activo, corrupción o riesgo de tenant.

## Evidencia mínima

- diseño, revisión y aprobaciones;
- versiones/estados origen y destino;
- dataset/volumen del ensayo;
- duración, locks y recursos observados;
- verificaciones y resultado por tenant;
- artefacto/script y checksum/version inmutables;
- logs sanitizados;
- rollback/roll-forward probado;
- release y resultado en production.

## Preguntas abiertas

- ¿Qué herramienta de migración se integrará con NestJS/PostgreSQL si esas propuestas se aprueban?
- ¿Quién puede aprobar y ejecutar cambios destructivos?
- ¿Qué ventana/objetivo de lock e indisponibilidad es aceptable?
- ¿Cuánto tiempo convivirán contratos/esquemas anteriores?
- ¿Qué volumen sintético representará tenants grandes y cola larga?
- ¿Cómo se coordinarán backfills con jobs, WebSockets e integraciones?
- ¿Qué obligaciones de retención y borrado afectan la contracción?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** aprobación de estrategia de datos o antes de crear la primera migración.
- **Documentos relacionados:** [Data Architecture](../architecture/DATA_ARCHITECTURE.md), [Release Process](../delivery/RELEASE_PROCESS.md), [Rollback Policy](./ROLLBACK_POLICY.md), [Multitenant Isolation Testing](../quality/MULTITENANT_ISOLATION_TESTING.md).
