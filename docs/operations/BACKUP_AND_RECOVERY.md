# Backup y recuperación

## Estado del documento

- **Estado:** Contrato mínimo vigente para Preview; política de Production
  pendiente.
- **Alcance:** Datos y configuración necesarios para recuperar la baseline
  actual y los ambientes futuros.
- **Hecho conocido:** Preview usa PostgreSQL 18.4 con volumen persistente;
  Redis y storage compatible con S3 no están materializados.
- **Decisión pendiente:** RPO/RTO, retención, almacenamiento off-server,
  cifrado, frecuencia de restore tests, restauración por tenant y
  responsabilidades de Production.

## Objetivo

Restaurar capacidades y datos de forma verificable después de error humano, despliegue defectuoso, corrupción, pérdida de infraestructura o incidente de seguridad, sin crear nuevas exposiciones entre tenants.

Un backup que nunca se ha restaurado con éxito es sólo una suposición de recuperación.

## Estado por ambiente

- **Preview — CURRENT:** datos no productivos; backups best-effort según la
  necesidad de una tarea. Persistencia no equivale a backup y no autoriza
  operaciones destructivas.
- **Staging — PLANNED:** backups y restores se usarán para ensayar migraciones y
  recuperación cuando corresponda.
- **Production — REQUIRED BEFORE PRODUCTION:** backups obligatorios, fuera del
  mismo failure domain cuando aplique, y restauración probada con evidencia.

Frecuencia, retención, off-server storage, encryption, restore tests, RPO y RTO
permanecen `TO BE DECIDED BEFORE PRODUCTION`.

## Conceptos

- **RPO:** pérdida máxima de datos aceptable medida en tiempo; `TBD` por capacidad.
- **RTO:** tiempo objetivo para recuperar una capacidad; `TBD` por capacidad.
- **Backup:** copia protegida para recuperación.
- **Restore:** reconstrucción desde backup en destino controlado.
- **Point-in-time recovery:** recuperación a un momento disponible, sujeto a tecnología aprobada.
- **Reconciliación:** comprobación/corrección de diferencias con sistemas externos después de recuperar.

## Inventario preliminar

| Activo | Papel propuesto | Estrategia por definir |
|---|---|---|
| PostgreSQL 18.x | Fuente de verdad transaccional aceptada | backups completos/incrementales y point-in-time según proveedor. |
| Object storage, si se acepta | Archivos y derivados | versionado/replicación/backup según criticidad y borrado. |
| Redis, si se acepta | Caché, colas y coordinación | determinar qué estado es reconstruible y qué datos de cola requieren persistencia/recuperación. |
| Configuración | Definición por ambiente sin secretos | repositorio/automatización futura y export verificable. |
| Secretos/llaves | Acceso y cifrado | backup seguro, rotación y recuperación separada. |
| Registro de artefactos | Imágenes/digests desplegables | retención suficiente para rollback. |
| Observabilidad/auditoría | Investigación y cumplimiento | retención/backup según requisito y acceso. |
| Integraciones | Estado externo no controlado | reconciliación, replay e idempotencia. |

Redis no debe asumirse automáticamente como fuente durable ni como reconstruible: cada uso debe declarar su expectativa de pérdida y recuperación.

## Requisitos de protección

- Separar backups por ambiente; no restaurar production en staging como atajo.
- Cifrar en tránsito y reposo mediante mecanismos aprobados posteriormente.
- Separar permisos de crear, borrar y restaurar; mínimo privilegio.
- Considerar inmutabilidad o protección contra borrado según riesgo.
- Mantener copias fuera del mismo failure domain cuando se defina topología.
- Registrar ejecución, estado, tamaño, alcance y verificación sin datos sensibles.
- Alertar por fallos, antigüedad fuera de objetivo o incapacidad de restaurar.
- Definir retención, expiración y borrado seguro conforme a necesidades legales/producto aún pendientes.

## Clasificación y objetivos

Antes de producción se completará:

| Capacidad/dato | Criticidad | RPO | RTO | Retención | Restauración parcial | Dependencias |
|---|---|---|---|---|---|---|
| Identidad/membresías | TBD | TBD | TBD | TBD | TBD | TBD |
| Reparaciones/clientes | TBD | TBD | TBD | TBD | TBD | TBD |
| Inventario/pagos/caja | TBD | TBD | TBD | TBD | TBD | TBD |
| Mensajes/CRM | TBD | TBD | TBD | TBD | TBD | Proveedor/canal TBD |
| Archivos | TBD | TBD | TBD | TBD | TBD | TBD |
| Auditoría | TBD | TBD | TBD | TBD | TBD | TBD |

No se deben derivar RPO/RTO sólo de capacidad técnica; requieren impacto del negocio y costos de recuperación.

## Flujo de backup propuesto

1. Inventariar activos y propietario.
2. Seleccionar mecanismo administrado o automatizado, sin pasos manuales habituales.
3. Ejecutar con identidad de mínimo privilegio.
4. Verificar completitud, cifrado, integridad y edad.
5. Replicar/aislar según failure domains aprobados.
6. Emitir métricas/alertas y conservar evidencia.
7. Expirar conforme a política sin eliminar copias bajo hold autorizado.

## Procedimiento conceptual de recuperación

1. **Declarar:** registrar motivo, alcance, impacto, momento objetivo y autoridad.
2. **Contener:** impedir escrituras o acciones que agraven corrupción cuando corresponda.
3. **Preservar:** conservar evidencia y estado previo necesarios para investigación.
4. **Seleccionar:** elegir backup/punto validado y estimar pérdida respecto al RPO.
5. **Aislar:** restaurar primero en destino controlado y con accesos restringidos cuando sea viable.
6. **Validar:** integridad, migraciones, conteos, relaciones tenant/sucursal, permisos y archivos.
7. **Reconciliar:** comparar jobs, pagos, webhooks/mensajes y sistemas externos; no replay sin idempotencia.
8. **Promover/cambiar tráfico:** mediante procedimiento aprobado y observable.
9. **Verificar:** recorridos críticos, métricas y ausencia de acceso cruzado.
10. **Comunicar y cerrar:** registrar pérdida real, tiempos, limitaciones y seguimiento.

Cada tecnología tendrá un [runbook](./RUNBOOK_TEMPLATE.md) concreto antes de production.

## Restauración por tenant

En un esquema compartido, restaurar un único tenant puede requerir extracción lógica, validación de relaciones y reconciliación, con alto riesgo de sobrescribir datos recientes o mezclar referencias. No se promete esta capacidad todavía. Debe evaluarse:

- alcance de datos y archivos relacionados;
- claves compartidas/globales y membresías;
- referencias entre módulos;
- eventos/jobs emitidos durante recuperación;
- conflictos con cambios posteriores;
- auditoría y consentimiento/autoridad;
- verificación de ausencia de datos de otros tenants.

Hasta aprobar un proceso, no se realizarán restores parciales improvisados sobre production.

## Pruebas de recuperación

Se propone ensayar con frecuencia `TBD`:

- restore completo de PostgreSQL a ambiente aislado;
- point-in-time a un momento conocido;
- recuperación de objetos y versiones/borrados;
- pérdida/reconstrucción de caché;
- recuperación/reconciliación de jobs;
- rotación/pérdida controlada de credencial o llave;
- recuperación combinada de base + archivos a un punto consistente;
- escenario de región/failure domain cuando la topología lo permita.

### Evidencia mínima

- backup/punto y versiones usados;
- ambiente aislado y responsables;
- inicio/fin reales y comparación con RTO;
- pérdida estimada/real frente a RPO;
- verificaciones de integridad, tenants y recorridos;
- fallos, acciones y siguiente prueba;
- confirmación de eliminación segura del restore de prueba.

## Seguridad y privacidad

- Un backup conserva la sensibilidad del dato original.
- Acceso y descarga se auditan; no usar laptops o ubicaciones no autorizadas.
- Datos restaurados para prueba mantienen acceso/retención limitados.
- Compromiso de backup o llave activa [Incident Management](./INCIDENT_MANAGEMENT.md).
- Borrado de usuario/tenant, retención legal y backups requieren una política de producto/legal por definir.

## Preguntas abiertas

- ¿Cuáles son RPO/RTO y retención por capacidad/plan?
- ¿Qué proveedores y regiones/failure domains se seleccionarán?
- ¿Se requerirá restore por tenant y con qué expectativa de tiempo?
- ¿Qué estado de Redis/colas debe sobrevivir y cómo se reconstruirá?
- ¿Cómo se mantendrá consistencia entre PostgreSQL y object storage?
- ¿Quién puede solicitar, aprobar y ejecutar un restore?
- ¿Qué obligaciones de borrado, conservación y residencia de datos aplican?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** cambio material de persistencia o antes de crear Production y
  almacenar datos reales.
- **Documentos relacionados:** [Data Architecture](../architecture/DATA_ARCHITECTURE.md), [Migration Policy](./MIGRATION_POLICY.md), [Incident Management](./INCIDENT_MANAGEMENT.md), [Environments](../delivery/ENVIRONMENTS.md).
