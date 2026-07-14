# Auditoría legacy — Configuración de política de recepción

**Estado:** `Pending Product Owner validation`.
**Propósito:** Determinar qué representa realmente el mecanismo de “campos obligatorios” de Nueva Reparación y separar evidencia de formulario, validación y política operativa.
**Alcance:** Panel Ajustes > Catálogos por módulo > Nueva Reparación, resolución de configuración, alta clásica, creación de la orden y efectos laterales inmediatos de anticipo, impresión y evidencia.
**Fuente:** Código local de SR Taller 1.0, rama `staging`, commit `9357b8629ed320f690ee07d106660020ce8b42e3`.
**Audiencia:** Product Owner, Operaciones, Recepción, Seguridad, Finanzas y Arquitectura.
**Última actualización:** 2026-07-14.

> Este paquete es evidencia del sistema legacy. No aprueba una Política de Recepción futura, no convierte checkboxes en reglas de dominio y no prescribe tablas, APIs, clases, permisos, UI ni arquitectura para SR Taller 2.0.

## Propósito y conclusión corta

El mecanismo configura principalmente la **obligatoriedad de captura de 19 controles visibles** en el formulario clásico. También transporta ocho defaults técnicos y una bandera de modo de captura, pero el panel no permite editarlos realmente. No configura visibilidad, orden, finalización posterior, excepciones, evidencia ni el hecho de custodia.

El alta sí consume la lista en frontend y backend, pero la política efectiva queda repartida entre configuración JSON, defaults duplicados, validaciones fijas y efectos posteriores. Por eso el mecanismo es una mezcla de configuración del formulario y precondiciones técnicas de creación; no es una Política de Recepción completa.

## Contexto de dominio confirmado

La auditoría toma como decisión aportada por Product Owner que la custodia comienza cuando Nueva Reparación se crea correctamente. Antes de ese éxito no existe custodia formal; después, orden y custodia existen aunque impresión o fotografías queden pendientes. Esta decisión se usa como lente de evaluación y no se atribuye al código legacy.

La intención de producto de permitir que cada tenant configure **parte** de la información requerida tampoco se considera implementada sólo porque existe una capa de lectura tenant: el flujo inspeccionado sólo permite guardar desde la UI y endpoint en la sucursal actual.

## Relación con Future State Reception

El [Future State Event Storming de recepción](../../domain-validation/future-state-reception/README.md) formula decisiones candidatas sobre identidad, custodia, evidencia, riesgo y completitud. Este paquete aporta la evidencia legacy que debe contrastarse con esas decisiones; no modifica ni valida ese Future State.

La lectura recomendada es:

1. usar el audit para comprender el mecanismo actual;
2. usar el registro de campos y el mapa de validación para localizar mezclas y divergencias;
3. recorrer los escenarios con Product Owner y Operaciones;
4. decidir por separado qué es invariante, política tenant, política sucursal, requisito condicional o preferencia de presentación;
5. promover decisiones sólo mediante un trabajo posterior explícito.

## Índice

| Documento | Contenido |
|---|---|
| [RECEPTION_POLICY_CONFIG_AUDIT.md](RECEPTION_POLICY_CONFIG_AUDIT.md) | Reconstrucción integral, archivos, carga, guardado, restauración, seguridad y conclusión. |
| [RECEPTION_POLICY_FIELD_REGISTRY.md](RECEPTION_POLICY_FIELD_REGISTRY.md) | 41 campos configurados, relacionados, derivados o ausentes del alta. |
| [RECEPTION_POLICY_SCOPE_AND_PRECEDENCE.md](RECEPTION_POLICY_SCOPE_AND_PRECEDENCE.md) | 15 reglas de alcance, herencia, precedencia, merge, fallback y persistencia. |
| [RECEPTION_POLICY_VALIDATION_MAP.md](RECEPTION_POLICY_VALIDATION_MAP.md) | 28 reglas de lectura, enforcement, allowlists, bypass y divergencias. |
| [RECEPTION_POLICY_SCENARIOS.md](RECEPTION_POLICY_SCENARIOS.md) | Los 12 escenarios obligatorios reconstruidos extremo a extremo. |
| [RECEPTION_POLICY_DOMAIN_FINDINGS.md](RECEPTION_POLICY_DOMAIN_FINDINGS.md) | 19 hallazgos semánticos y funcionales con evidencia y revisión requerida. |
| [RECEPTION_POLICY_OPEN_QUESTIONS.md](RECEPTION_POLICY_OPEN_QUESTIONS.md) | 56 preguntas agrupadas por autoridad y tema. |

## Convención de conocimiento

Este paquete usa exclusivamente los siguientes estados para calificar conocimiento, decisiones y revisiones:

| Estado | Significado |
|---|---|
| `Confirmed by legacy code` | Existe evidencia directa en el corte de código inspeccionado. |
| `Inferred from legacy behavior` | Es una consecuencia razonable del flujo, no una regla declarada. |
| `Not found` | Se buscó ampliamente en el alcance y no se encontró implementación. |
| `Unknown` | No puede resolverse sin ejecución, datos activos o contexto externo. |
| `Pending Product Owner validation` | Requiere decisión o confirmación de intención de producto. |
| `Pending operations validation` | Requiere contrastar el flujo con recepción/taller. |
| `Pending security review` | Requiere análisis de secretos, privacidad, acceso o minimización. |
| `Pending finance review` | Requiere validar pago, caja, contabilidad o autorización financiera. |
| `Pending architecture review` | Requiere evaluar consistencia o mecanismo futuro después de validar negocio. |

`Not found` no significa que algo no exista en una base desplegada o en una práctica humana: significa que no apareció en las rutas y búsquedas versionadas inspeccionadas. No se consultó ninguna base de datos.

## Corte cuantitativo

| Elemento | Cantidad | Rango |
|---|---:|---|
| Campos auditados | 41 | Serie `LEGACY-RPC-FIELD` |
| Campos del registro configurable legacy | 19 | Primeros 19 campos |
| Niveles activos de resolución | 3 | Sistema, tenant y sucursal |
| Reglas de alcance y precedencia | 15 | Serie `LEGACY-RPC-SCOPE` |
| Reglas y divergencias de validación | 28 | Serie `LEGACY-RPC-VALIDATION` |
| Escenarios | 12 | Serie `LEGACY-RPC-SCENARIO` |
| Hallazgos | 19 | Serie `LEGACY-RPC-FINDING` |
| Preguntas abiertas | 56 | Serie `LEGACY-RPC-Q` |

## Límites

- No se ejecutó la aplicación, no se inspeccionó una base activa y no se probaron roles reales.
- La tabla versionada permite razonar sobre claves e índices si la migración fue aplicada; su estado desplegado es `Unknown`.
- No se determina la práctica humana real cuando un equipo llega sin IMEI, sin acceso, con riesgo o con un entregante distinto.
- No se determina el valor contractual de “Aceptó riesgo de”.
- No se define qué campos serán obligatorios en SR Taller 2.0.
- No se diseñan almacenamiento, API, UI, motor de reglas, permisos, auditoría ni migración futura.
- No se modifican la [auditoría anterior de Nueva Reparación](../README.md), la [auditoría del detalle](../repair-detail/README.md), Current State ni Future State Reception.

## Uso recomendado

Tratar el registro como una matriz de evidencia, no como backlog de implementación. Las clasificaciones candidatas señalan dónde hace falta una decisión; no autorizan copiar el comportamiento legacy. En especial, la creación correcta de la orden, el contexto tenant/sucursal, el actor y fecha receptores, el estado de custodia, las excepciones y la protección de credenciales deben discutirse como invariantes o políticas explícitas antes de exponer configurabilidad.
