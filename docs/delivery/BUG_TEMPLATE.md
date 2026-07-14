# Plantilla de bug

## Estado del documento

- **Estado:** Propuesta
- **Uso:** Registrar un comportamiento reproducible que contradice una expectativa verificable.
- **Nota:** Un incidente activo se gestiona además mediante [Incident Management](../operations/INCIDENT_MANAGEMENT.md).

---

# BUG-### — Resumen del comportamiento observado

## Identificación

| Campo | Valor |
|---|---|
| ID | `BUG-###` |
| Estado | `New` / `Triaged` / `Ready` / `In progress` / `Review` / `QA` / `Done` / `Blocked` / `Cancelled` |
| Severidad | TBD |
| Prioridad | TBD |
| Ambiente | `local` / `staging` / `production` |
| Detectado en versión | TBD |
| Corregido en versión | TBD |
| PBI/Epic relacionado | `PBI-###` / `EPIC-###` |
| Reportado por | TBD |
| Responsable | TBD |

## Resumen del impacto

Describir a quién afecta, qué operación impide o degrada, alcance conocido y si existe riesgo de seguridad, privacidad, pérdida de datos o exposición entre tenants.

## Expectativa

Comportamiento que debía ocurrir y su fuente: criterio de aceptación, documentación, contrato de API, decisión aprobada o comportamiento previamente verificado.

## Comportamiento observado

Descripción objetiva. No incluir secretos, tokens, PIN, credenciales ni datos personales reales.

## Precondiciones

- Tenant de prueba: alias no sensible TBD.
- Sucursal de prueba: alias no sensible TBD.
- Rol/permisos: TBD.
- Dispositivo/sesión: TBD.
- Datos necesarios: sintéticos o sanitizados TBD.

## Pasos para reproducir

1. TBD.
2. TBD.
3. TBD.

## Resultado reproducible

- **Frecuencia:** TBD.
- **Primera versión conocida:** TBD.
- **Última versión verificada:** TBD.
- **Navegador/cliente:** TBD.
- **Correlation/trace ID:** TBD; no pegar datos sensibles.

## Análisis de alcance y seguridad

| Comprobación | Resultado | Evidencia |
|---|---|---|
| ¿Afecta a uno o varios tenants? | TBD | TBD |
| ¿Permite leer o modificar datos de otro tenant? | TBD | TBD |
| ¿Afecta alcance de sucursal? | TBD | TBD |
| ¿Evade permisos, PIN o revocación? | TBD | TBD |
| ¿Corrompe, pierde o duplica datos? | TBD | TBD |
| ¿Afecta jobs, caché, archivos o rooms realtime? | TBD | TBD |
| ¿Exhibe datos sensibles en UI o logs? | TBD | TBD |

Ante sospecha de exposición entre tenants o bypass de autorización, detener pruebas invasivas, preservar evidencia mínima, restringir acceso y activar triage de seguridad/incidente.

## Mitigación temporal

- **Existe:** `Sí` / `No` / `TBD`.
- **Pasos seguros:** TBD.
- **Riesgo de la mitigación:** TBD.
- **Caducidad/reversión:** TBD.

## Causa raíz

TBD. Distinguir causa confirmada de hipótesis. No es obligatorio conocerla para registrar el bug, pero sí para cerrar defectos de alto riesgo cuando corresponda.

## Solución propuesta

TBD. Incluir alternativas y ADR si la corrección cambia límites arquitectónicos.

## Criterios de aceptación de la corrección

- [ ] El caso original deja de reproducirse.
- [ ] Se agrega una prueba de regresión al nivel adecuado.
- [ ] Se verifican casos negativos de tenant, sucursal y permisos cuando aplican.
- [ ] No se introduce exposición de datos en logs o evidencia.
- [ ] La mitigación temporal se retira o queda trazada.
- [ ] Documentación y runbooks se actualizan si cambia el comportamiento operativo.

## Evidencia

- Captura/video sanitizado: TBD.
- Logs/trace sanitizados: TBD.
- Prueba de regresión: TBD.
- Evidencia QA: TBD.
- PR/archivos: TBD.
- Release: TBD.

## Riesgos y preguntas abiertas

- Riesgos residuales: TBD.
- Preguntas bloqueantes: TBD.

## Cierre

- [ ] Cumple la [Definition of Done](./DEFINITION_OF_DONE.md).
- [ ] Se verificó en staging con datos no reales.
- [ ] Se definió rollback si alcanza producción.
- [ ] Aprobaciones registradas: TBD.

---

## Reglas de uso de la plantilla

- Severidad expresa impacto; prioridad expresa orden de atención. Las escalas definitivas son `TBD`.
- No usar datos reales de producción para reproducir en staging.
- No degradar una posible vulnerabilidad a bug ordinario sin triage de seguridad.
- Vincular el incidente cuando haya impacto operativo activo.

## Preguntas abiertas sobre la plantilla

- ¿Qué matriz de severidad y tiempos de respuesta se aprobará?
- ¿Qué canal privado se usará para vulnerabilidades?
- ¿Qué herramienta almacenará adjuntos sensibles de forma controlada?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** definición de niveles de severidad o primer bug real documentado.
- **Documentos relacionados:** [Security Testing](../quality/SECURITY_TESTING.md), [Incident Management](../operations/INCIDENT_MANAGEMENT.md), [QA Evidence Template](../quality/QA_EVIDENCE_TEMPLATE.md).
