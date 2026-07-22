# Trazabilidad del cierre de bloqueantes

## Alcance de la revisión

El paquete consolidó 82 decisiones a partir de 189 documentos en los conjuntos solicitados. Los conteos describen el corpus inspeccionado, no un porcentaje de aprobación:

| Conjunto | Archivos revisados | Fuente índice |
| --- | ---: | --- |
| Preparación arquitectónica del MVP | 32 | [repair-mvp](../repair-mvp/README.md) |
| Modelo integrado de Reparaciones | 28 | [integrated-repair-domain-model](../../domain-model/integrated-repair-domain-model/README.md) |
| Validaciones de dominio | 56 | [domain-validation](../../domain-validation/) |
| Documentación de dominio | 27 | [domain](../../domain/README.md) |
| ADRs, plantilla y registro | 15 | [decisions](../../decisions/README.md) |
| Arquitectura transversal | 12 | [architecture](../../architecture/) |
| Producto | 9 | [product](../../product/) |
| Revisión de sprint y prototipos documentales | 10 | [sprint-00 review](../../reviews/sprint-00/README.md) |
| **Total** | **189** | — |

## Autoridad de las fuentes

1. una decisión `Accepted` en su ADR y en el registro es autoritativa;
2. decisiones consolidadas de dominio conservan autoridad sobre reglas validadas;
3. documentos de preparación proponen arquitectura y gates, pero no aceptan ADRs;
4. preguntas abiertas y hotspots son incertidumbre, no decisiones;
5. documentos históricos explican origen, no prevalecen sobre una decisión posterior explícita;
6. este paquete prioriza y enlaza: no reemplaza las fuentes ni eleva propuestas a decisiones.

## Matriz de decisiones y evidencia

| Decisiones | Evidencia principal | Complemento | Uso en este paquete |
| --- | --- | --- | --- |
| DEC-001, DEC-005, DEC-049, DEC-071 | [ADR-002](../../decisions/proposed/ADR-002-modular-monolith-first.md), [monolito modular](../repair-mvp/MONOLITO_MODULAR.md) | [fronteras](../repair-mvp/FRONTERAS_MODULARES_PROPUESTAS.md), [dependencias](../repair-mvp/REGLAS_DE_DEPENDENCIA.md) | Arquitectura aceptada y límites de evolución |
| DEC-002, DEC-003, DEC-062, DEC-063 | [criterios de salida de R0](CRITERIOS_DE_SALIDA_DE_R0.md), [alcance MVP](../repair-mvp/ALCANCE_DEL_MVP.md), [rebanadas](../repair-mvp/PLAN_DE_REBANADAS_VERTICALES.md) | [criterios de implementación](../repair-mvp/CRITERIOS_DE_INICIO_DE_IMPLEMENTACION.md), [flujo mínimo](../repair-mvp/FLUJO_VERTICAL_MINIMO_VENDIBLE.md) | DEC-002/062 cerradas para R0 el 2026-07-21; DEC-003/063 y ejecución de pruebas siguen pendientes |
| DEC-004 | [registro de ADRs](../../decisions/README.md), ADR-[001](../../decisions/proposed/ADR-001-typescript-as-primary-language.md), [003](../../decisions/proposed/ADR-003-postgresql-primary-database.md), [005](../../decisions/proposed/ADR-005-nestjs-backend.md), [009](../../decisions/proposed/ADR-009-monorepo-strategy.md) | [arquitectura objetivo](../../architecture/TARGET_ARCHITECTURE.md) | Lote de plataforma pendiente; ninguna propuesta se trata como aceptada |
| DEC-006 a DEC-012 | [ADR-004 Accepted](../../decisions/proposed/ADR-004-shared-schema-multitenancy.md), [ADR-010 Accepted](../../decisions/proposed/ADR-010-station-bound-operational-context.md), [modelo multitenant](../repair-mvp/MODELO_MULTITENANT.md) | [multitenancy transversal](../../architecture/MULTITENANCY_MODEL.md), [sucursal/estación](../../architecture/BRANCH_AND_DEVICE_MODEL.md) | Topología, propiedad y contexto operativo aceptados; faltan aplicación y pruebas |
| DEC-013 a DEC-020 | [ADR-011 Accepted](../../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md), [ADR-012 Accepted](../../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md), [ADR-013 Accepted](../../decisions/proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md), [identidad y atribución](../repair-mvp/MODELO_DE_IDENTIDAD_Y_ATRIBUCION.md) | [seguridad](../repair-mvp/SEGURIDAD_Y_ACCIONES_SENSIBLES.md), [identidad/permisos](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md), [baseline](../../architecture/SECURITY_BASELINE.md) | DEC-013 a 020 cerradas conceptualmente; mecanismos, composición/clasificación por rebanada y pruebas continúan |
| DEC-021 a DEC-025, DEC-041 a DEC-043 | [recepción future-state](../../domain-validation/future-state-reception/README.md), [custodia e identificación](../../domain-validation/reception-minimum-and-commercial-authorization/CUSTODIA_E_IDENTIFICACION_FISICA.md) | [concurrencia](../repair-mvp/CONCURRENCIA_E_IDEMPOTENCIA.md), [escenarios](../../domain-validation/reception-minimum-and-commercial-authorization/ESCENARIOS.md) | Folio, doble envío, impresión, fallback y QR diferido |
| DEC-026 a DEC-031 | [estados, ubicación y custodia](../../domain-model/integrated-repair-domain-model/ESTADOS_UBICACIONES_CUSTODIA_Y_RESPONSABILIDAD.md) | [transiciones](../../domain-validation/operational-workflow-and-traceability/TRANSICIONES_Y_PRECONDICIONES.md), [límites](../../domain-model/integrated-repair-domain-model/LIMITES_TRANSACCIONALES_CANDIDATOS.md) | Lenguaje, estados y límites transaccionales de custodia |
| DEC-032 a DEC-036 | [modelo de configuración](../repair-mvp/MODELO_DE_CONFIGURACION.md), [clasificación de recepción](../../domain-validation/reception-minimum-and-commercial-authorization/CLASIFICACION_POLITICA_RECEPCION.md) | [decisiones de recepción](../../domain-validation/future-state-reception/FUTURE_STATE_RECEPTION_DECISIONS.md) | Precedencia, snapshots, vigencia y catálogos |
| DEC-037, DEC-038 | [arquitectura de datos](../../architecture/DATA_ARCHITECTURE.md) | [preguntas abiertas](../../domain-model/integrated-repair-domain-model/PREGUNTAS_ABIERTAS_PRIORIZADAS.md) | Tiempo marcado como decisión H1 aún abierta |
| DEC-039, DEC-040, DEC-057 | [integraciones y adaptadores](../repair-mvp/INTEGRACIONES_Y_ADAPTADORES.md), [evidencias de recepción](../../domain-validation/reception-minimum-and-commercial-authorization/RECEPCION_MINIMA.md) | [seguridad](../../architecture/SECURITY_BASELINE.md) | Archivo como recurso protegido, no URL libre |
| DEC-044 a DEC-048, DEC-055, DEC-056 | [observabilidad y auditoría](../repair-mvp/OBSERVABILIDAD_Y_AUDITORIA.md) | [estrategia transversal](../../architecture/OBSERVABILITY_STRATEGY.md), [trazabilidad integrada](../../domain-model/integrated-repair-domain-model/MODELO_DE_TRAZABILIDAD.md) | Operabilidad, atribución, secretos y retención |
| DEC-050 a DEC-054 | [arquitectura de datos](../../architecture/DATA_ARCHITECTURE.md), [riesgos](../repair-mvp/RIESGOS_ARQUITECTONICOS.md) | [estado de preparación](../repair-mvp/ESTADO_DE_PREPARACION_ARQUITECTONICA.md) | Migraciones, pruebas y recuperación como gates |
| DEC-058 a DEC-061 | [consistencia multipaso](../repair-mvp/CONSISTENCIA_Y_PROCESOS_MULTIPASO.md), [estrategia de evolución](../repair-mvp/ESTRATEGIA_DE_EVOLUCION.md) | [lecciones del legado](../../product/LEGACY_SR_TALLER_LESSONS.md) | Degradación, convivencia, piloto y rollback |
| DEC-064 a DEC-070 | [riesgos arquitectónicos](../repair-mvp/RIESGOS_ARQUITECTONICOS.md), [seguridad](../../architecture/SECURITY_BASELINE.md) | [supuestos de rendimiento](../repair-mvp/SUPUESTOS_DE_RENDIMIENTO.md), [preguntas de producto](../../product/OPEN_QUESTIONS.md) | Gate productivo, capacidad y ciclo del tenant |
| DEC-072 a DEC-082 | [decisiones diferibles](../repair-mvp/DECISIONES_DIFERIBLES.md), [capacidades incluidas/diferidas](../repair-mvp/CAPACIDADES_INCLUIDAS_Y_DIFERIDAS.md) | [fuera de alcance](../../product/OUT_OF_SCOPE.md) | Diferimiento explícito, no deuda oculta |

## Trazabilidad interna

- La fuente central de IDs, estados, hitos, responsables y evidencia es [INVENTARIO_DE_BLOQUEANTES.md](INVENTARIO_DE_BLOQUEANTES.md).
- Los conteos se derivan en [CLASIFICACION_POR_HITO.md](CLASIFICACION_POR_HITO.md).
- El orden de cierre está en [SECUENCIA_DE_DECISIONES.md](SECUENCIA_DE_DECISIONES.md) y [PLAN_DE_CIERRE.md](PLAN_DE_CIERRE.md).
- Los ADRs candidatos se relacionan en [MAPA_DE_ADRS_REQUERIDOS.md](MAPA_DE_ADRS_REQUERIDOS.md).
- Las respuestas reservadas a Producto están en [PREGUNTAS_PARA_PRODUCT_OWNER.md](PREGUNTAS_PARA_PRODUCT_OWNER.md).
- La incertidumbre empírica se separa en [PREGUNTAS_PARA_SPIKES_TECNICOS.md](PREGUNTAS_PARA_SPIKES_TECNICOS.md).
- Los gates verificables se distribuyen entre R0, R1, piloto y producción.

## Límites de esta consolidación

- al crear este paquete no se creó ni aceptó ningún ADR; ADR-004, ADR-010, ADR-011, ADR-012 y ADR-013 fueron aceptados posteriormente y se registran como actualizaciones trazables;
- `DEC-002` y `DEC-062` se cerraron por decisión del Responsable de Producto el 2026-07-21; las demás preguntas conservan su estado;
- no se ejecutó ningún spike;
- no se alteró código, runtime, datos, API, interfaz o infraestructura;
- no se sustituyeron documentos históricos ni se ocultaron contradicciones;
- los conteos deberán recalcularse si una decisión se divide, fusiona o cambia de hito mediante revisión explícita.
