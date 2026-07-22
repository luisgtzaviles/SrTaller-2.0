# Estrategia de versionado

## Estado del documento

- **Estado:** Propuesta
- **Hecho conocido:** ADR-002 fija un único artefacto backend inicial y ADR-001 fija Node.js `24.x` como su baseline; clientes o separaciones futuras requieren autorización propia.
- **Hipótesis:** Semantic Versioning puede comunicar cambios de contratos publicados, complementado por un manifiesto de release.
- **Decisión pendiente:** Esquema definitivo, política pre-1.0, versionado de API y compatibilidad soportada.

## Objetivo

Poder responder qué cambió, qué artefactos están desplegados en cada ambiente, qué contratos son compatibles y qué release introdujo o retiró un comportamiento.

## Unidades de versión propuestas

| Unidad | Identificador propuesto | Propósito |
|---|---|---|
| Artefacto desplegable | `nombre@MAJOR.MINOR.PATCH` + digest | Identificar exactamente API, worker o cliente. |
| Release de plataforma | ID/version TBD + manifiesto | Agrupar las versiones compatibles promovidas juntas o en secuencia. |
| Migración | Identificador único, ordenado e inmutable | Trazar cambios de datos/esquema; no equivale a SemVer. |
| Contrato/API | Versión de contrato TBD | Comunicar compatibilidad a clientes web, móviles futuros e integraciones. |
| Documento | Git + estado y próxima revisión | Conservar evolución sin números artificiales por archivo. |
| Runtime backend | Node.js `24.x` + versión minor/patch fijada | Reproducir ejecución y verificar soporte conforme a ADR-001. |

## Runtime y soporte

ADR-001 acepta una sola línea major ordinaria por release: Node.js `24.x` para R0. La versión minor/patch se fija en la futura configuración ejecutable, se actualiza con evidencia de compatibilidad y no puede permanecer como baseline de un nuevo release después de EOL. Una migración temporal puede validar dos líneas, pero no crea soporte permanente para ambas.

## Semantic Versioning como propuesta

- `MAJOR`: cambio incompatible en un contrato publicado o requisito operativo soportado.
- `MINOR`: capacidad compatible hacia atrás.
- `PATCH`: corrección compatible sin capacidad contractual nueva.

Estas reglas no se consideran aceptadas hasta definir qué contratos son públicos, la política antes de `1.0.0` y el soporte de clientes antiguos. Una versión no reemplaza la descripción del impacto.

## Versiones independientes y manifiesto

El backend inicial avanza como un único artefacto conforme a ADR-002. Si en el futuro se autorizan clientes u otros desplegables, cada unidad podrá avanzar a su propio ritmo sólo si conserva compatibilidad. Un manifiesto de release debe fijar la combinación efectivamente promovida:

```yaml
# Ejemplo conceptual; no es configuración ejecutable.
release: TBD
artifacts:
  backend: version-and-digest-TBD
  web: version-and-digest-TBD
migrations: TBD
evidence: TBD
```

El ejemplo sólo ilustra datos necesarios; formato y almacenamiento están pendientes.

## Tags y artefactos

Se propone:

- tags de Git inmutables asociados al commit y proceso de CI;
- imágenes con versión y digest, sin depender de `latest`;
- metadatos de build que permitan rastrear commit, pipeline y fecha real de construcción;
- promoción del mismo digest entre staging y production;
- prohibición de reescribir una versión ya publicada.

La sintaxis exacta de tags queda `TBD` hasta decidir si el monorepo usa versionado independiente o coordinado.

## Changelog

El changelog debe describir efectos observables y agrupar:

- Added;
- Changed;
- Fixed;
- Security, sin publicar detalles explotables antes de mitigar;
- Deprecated;
- Removed;
- Migration/Operations notes.

Cada entrada debe vincular PBI o bug y, si corresponde, ADR, evidencia y guía de migración. Un commit no es por sí mismo una entrada entendible por usuarios u operación.

## Versionado de API y eventos

- Compatibilidad de URL, headers o media types es una decisión pendiente.
- Contratos de eventos y jobs requieren evolución compatible porque productores y consumidores pueden desplegarse por separado.
- Agregar campos opcionales suele ser preferible a cambiar semántica existente, sujeto a validación.
- Deprecaciones necesitan anuncio, telemetría de uso y fecha aprobada antes de retirar.
- Clientes móviles futuros obligarán a considerar versiones que no pueden actualizarse inmediatamente.

## Migraciones de datos

- Una migración aplicada conserva su identificador y contenido; una corrección se realiza mediante otra migración.
- La versión de aplicación debe declarar qué estado de esquema soporta.
- El orden de despliegue debe tolerar versiones adyacentes cuando la estrategia de rollback lo requiera.
- Backfills y transformaciones se trazan al PBI/release y siguen [Migration Policy](../operations/MIGRATION_POLICY.md).

## Preguntas abiertas

- ¿Versionado independiente o coordinado para los paquetes y desplegables del monorepo?
- ¿Cuándo se considerará que un contrato está publicado y requiere `MAJOR`?
- ¿Qué garantías habrá antes de `1.0.0`?
- ¿Cómo se versionarán API, webhooks, eventos realtime y mensajes de cola?
- ¿Cuántas versiones de clientes web, móviles e integraciones se soportarán?
- ¿Dónde vivirá el manifiesto de release y quién podrá modificarlo?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** aprobación de estrategia de monorepo/API o creación del primer artefacto desplegable.
- **Documentos relacionados:** [Release Process](./RELEASE_PROCESS.md), [Traceability Model](./TRACEABILITY_MODEL.md), [Migration Policy](../operations/MIGRATION_POLICY.md).
