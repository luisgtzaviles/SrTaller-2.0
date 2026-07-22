# Estrategia de pruebas de seguridad

## Estado del documento

- **Estado:** Propuesta
- **Alcance:** Aplicaciones web, API, workers, PostgreSQL 18.x y, si se aceptan por decisiones propias, Redis, storage, realtime, integraciones y clientes móviles futuros.
- **Hecho conocido:** Multitenancy, dispositivos/PIN, pagos, mensajería y soporte privilegiado elevan el impacto de fallos de acceso.
- **Decisión pendiente:** Estándar de referencia, herramientas, severidades, canal de divulgación y responsables.

## Objetivo

Detectar y reducir vulnerabilidades antes de producción, validar que los controles fallan de forma segura y conservar evidencia suficiente sin exponer secretos o datos personales.

Las pruebas se integran al ciclo de entrega. No se delega la seguridad únicamente a una evaluación final o a una herramienta automática.

## Principios

- Modelar amenazas desde refinamiento para cambios sensibles.
- Validar autorización en servidor en cada límite; ocultar controles en UI no es protección.
- Tratar aislamiento de tenant como propiedad de seguridad.
- Usar mínimo privilegio y separación por ambiente.
- No registrar PIN, contraseñas, tokens, secretos ni contenido sensible innecesario.
- Hacer explícitos nivel ADR-013, revocación, expiración, consumo, reautenticación y segundo aprobador.
- Probar caminos de abuso, fallos parciales y reintentos.
- No realizar pruebas destructivas en producción sin alcance y autorización específicos.

## Alcance por superficie

| Superficie | Riesgos a probar |
|---|---|
| Identidad global | enumeración, secuestro de sesión, recuperación, bloqueo, revocación y mezcla de membresías. |
| Tenant/sucursal | acceso cruzado, cambio de hostname/contexto, asociación de recursos y consultas globales accidentales. |
| Roles/permisos | escalamiento horizontal/vertical, permisos obsoletos, denegación y acciones sensibles. |
| Dispositivo/PIN | vinculación no autorizada, PIN compartido/forzado, sesión abandonada, cambio de turno, pérdida y revocación remota. |
| API | validación, mass assignment, injection, límites, errores, CORS/CSRF según autenticación y abuso de operaciones masivas. |
| Web | XSS, navegación forzada, almacenamiento de tokens, clickjacking y exposición en cliente. |
| Realtime | handshake, autorización de rooms, eventos falsos, reconexión, flood y revocación. |
| Webhooks/integraciones | autenticidad, replay, deduplicación, SSRF, redirecciones, timeouts y secretos por tenant. |
| Jobs/colas | payload manipulado, contexto, replay, poison jobs, privilegios y datos en errores. |
| Archivos | autorización, path/key manipulation, tipos/tamaño, contenido activo, malware y URLs compartibles. |
| Datos/logs/backups | cifrado/configuración, acceso, retención, borrado, restauración y filtración por telemetría. |
| Supply chain | secretos, dependencias vulnerables, procedencia de artefacto, imágenes y configuración insegura. |

## Proceso propuesto

### 1. Refinamiento y threat modeling

Para un cambio de riesgo alto:

1. Identificar activos y datos sensibles.
2. Dibujar límites de confianza y flujos.
3. Enumerar actores legítimos, abusivos y accesos privilegiados.
4. Analizar suplantación, manipulación, repudio, divulgación, denegación y elevación como heurísticas, sin limitarse a ellas.
5. Convertir amenazas relevantes en criterios, controles, pruebas y señales observables.
6. Registrar riesgo residual y aprobador `TBD`.

### 2. Revisiones automáticas futuras

- Detección de secretos antes de merge y en historial según alcance.
- Análisis estático de patrones inseguros y configuración.
- Inventario y análisis de dependencias/licencias conforme a política futura.
- Análisis de imágenes y artefactos cuando existan.
- Pruebas de seguridad de API/DAST en ambiente controlado.
- Validaciones de infraestructura/configuración cuando sea creada.

Ninguna herramienta se selecciona en esta etapa. Hallazgos automáticos requieren triage; falsos positivos suprimidos deben conservar justificación y caducidad.

### 3. Pruebas manuales basadas en riesgo

- Manipular host, tenant, branch, IDs y relaciones.
- Repetir acciones con rol menor, membresía distinta, dispositivo revocado y sesión expirada.
- Probar recuperación, cambio de credenciales, reautenticación, autoaprobación, aprobador sin capacidad y reutilización de control.
- Reenviar webhooks, jobs, mensajes y requests con idempotency keys alteradas.
- Intentar unirse a rooms ajenas y recibir eventos después de revocación.
- Cargar/servir archivos inesperados en un entorno seguro.
- Revisar mensajes de error, logs, exports y soporte para fuga indirecta.
- Probar límites de frecuencia y recursos con reglas autorizadas.

### 4. Revisión antes de producción

- Threat model actualizado.
- Hallazgos clasificados y vinculados a corrección o riesgo aceptado.
- Suite de tenant y permisos aprobada.
- Secretos/configuración del ambiente revisados sin incluir valores en evidencia.
- Rollback, monitoreo y respuesta preparados.
- Evidencia asociada a digest exacto.

## Escenarios críticos

### Tenant y autorización

La matriz completa está en [Multitenant Isolation Testing](./MULTITENANT_ISOLATION_TESTING.md). Como mínimo se prueban referencias directas ajenas, filtros/listados/exportaciones, joins/relaciones, operaciones masivas, soporte privilegiado, caché, archivos, jobs y realtime.

### PIN, dispositivo y sesión operativa

- Vinculación requiere flujo autorizado y auditado.
- Desafíos reutilizados, vencidos, manipulados o emitidos para otro tenant/sucursal deben rechazarse y dejar evidencia segura.
- Dos activaciones concurrentes no pueden producir dos vínculos válidos ni conservar credenciales huérfanas.
- PIN incorrecto no revela identidad ni estado innecesario.
- Controles ante intentos repetidos, bloqueo y recuperación requieren definición antes de implementar.
- PIN de un empleado no amplía permisos ni tenant/sucursal.
- Cambio de turno y cierre remoto invalidan acceso según objetivo de propagación TBD.
- Una transferencia de sucursal debe cerrar/revalidar sesiones HTTP y WebSocket, contexto de jobs y cachés sin residuos de la sucursal anterior.
- El cierre remoto se prueba con el equipo online. El caso offline permanece condicional y sólo se exige si producto aprueba operación sin conexión; entonces debe validarse revocación al reconectar.
- Acciones sensibles exigen nivel 2, 3 o 4 conforme a ADR-013; factor, tiempos y mecanismo concreto permanecen pendientes.
- Evidencia nunca captura PIN real ni valor completo de token.

No se decide aquí longitud, hashing, caducidad ni algoritmo criptográfico.

### API y entrada no confiable

- Validación de forma, tipo, tamaño, rango y estado de negocio.
- Parámetros inesperados no modifican campos protegidos.
- Consultas y contenido se tratan como datos, evitando injection.
- Errores no incluyen stack, secretos ni datos ajenos.
- Rate limits distinguen ámbitos adecuados sin permitir ataque cruzado por claves compartidas.
- Operaciones repetidas son idempotentes cuando el dominio lo exige.

### Web, cookies y navegador

- Política de sesión, cookies, CSRF y almacenamiento se definirá junto con arquitectura de identidad.
- Salida no confiable se presenta sin ejecución de contenido.
- Redirecciones y URLs externas se validan.
- Headers y políticas del navegador se prueban por ambiente.
- Cachés del navegador/CDN no mezclan respuestas de tenants.

### Integraciones, mensajería y archivos

- Verificar autenticidad de webhook antes de procesar; método depende del proveedor.
- Impedir replay mediante timestamp/nonce/idempotencia según contrato.
- Aislar credenciales y canales por tenant.
- Controlar destinos salientes para reducir SSRF y exfiltración.
- Normalizar sin perder origen/auditoría y deduplicar con namespace.
- Validar archivos por contenido y política, no sólo extensión; límites y análisis antimalware son TBD.

## Ambientes y datos

- Las pruebas activas ocurren en local, CI o staging aislado.
- Production recibe únicamente verificaciones seguras acordadas y monitoreo; pentest requiere autorización y ventana específicas.
- No se usan datos reales para pruebas salvo proceso controlado de [Environments](../delivery/ENVIRONMENTS.md).
- Cuentas y tenants de prueba no comparten credenciales con production.
- Reportes y capturas se sanitizan antes de adjuntarse.

## Gestión de hallazgos

Cada hallazgo registra:

- descripción y activo afectado;
- precondiciones y alcance tenant/usuario;
- impacto y evidencia mínima sanitizada;
- versión/ambiente;
- severidad propuesta y estado;
- mitigación temporal;
- corrección y prueba de regresión;
- riesgo residual, aprobador y vencimiento si se acepta.

La matriz de severidad y SLA es `TBD`. Una sospecha de acceso cruzado o exposición activa se escala mediante [Incident Management](../operations/INCIDENT_MANAGEMENT.md), limitando distribución de detalles.

## Gates propuestos

- Ningún secreto confirmado en repositorio o artefacto candidato.
- Ningún hallazgo bloqueante abierto; definición de bloqueante pendiente de aprobar.
- Aislamiento y autorización negativos aprobados para superficies modificadas.
- Riesgos no corregidos con aceptación explícita, vencimiento y seguimiento.
- Evidencia de seguridad vinculada a PBI y release.
- Plan de detección y contención para riesgo residual relevante.

## Pruebas externas

Revisión independiente o pentest se considerará antes de hitos de alto impacto, pagos/cajas, exposición pública o cambios sustanciales de identidad/multitenancy. Alcance, proveedor, reglas de compromiso, retest y manejo confidencial quedan pendientes.

## Preguntas abiertas

- ¿Qué estándar y taxonomía de severidad se adoptarán?
- ¿Qué canal privado y tiempos se usarán para reportar vulnerabilidades?
- ¿Qué acciones exigirán autenticación reforzada?
- ¿Qué controles de PIN, sesión y recuperación equilibran operación y abuso?
- ¿Qué herramientas se incorporarán a CI y con qué gates?
- ¿Cuándo será obligatoria una revisión externa?
- ¿Qué retención tendrá la evidencia sensible de seguridad?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** aprobación de [Security Baseline](../architecture/SECURITY_BASELINE.md) e identidad o antes de exponer el primer endpoint.
- **Documentos relacionados:** [Identity, Access and Permissions](../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [Testing Strategy](./TESTING_STRATEGY.md), [Incident Management](../operations/INCIDENT_MANAGEMENT.md).
