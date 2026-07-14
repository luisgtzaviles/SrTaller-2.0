# Plantilla de evidencia QA

## Estado del documento

- **Estado:** Propuesta
- **Uso:** Crear un registro por PBI, bug o candidato de release; no sobrescribir evidencia histórica.
- **Regla de datos:** No adjuntar credenciales, PIN, tokens, secretos, datos personales reales ni contenido de clientes.

---

# Evidencia QA — PBI-### / BUG-### — Título

## Identificación

| Campo | Valor |
|---|---|
| Elemento validado | `PBI-###` / `BUG-###` |
| Epic | `EPIC-###` |
| Sprint | `SPRINT-##` / No aplica |
| Release candidato | TBD / No aplica documental |
| Artefactos y digests | API TBD; worker TBD; web TBD |
| Commit/pull request | TBD |
| Ambiente | `local` / `CI` / `staging` / verificación segura en `production` |
| Fecha y hora real de ejecución | TBD |
| Ejecutado por | Persona/automatización TBD |
| Estado de evidencia | `Draft` / `In review` / `Approved` / `Rejected` |

## Objetivo y alcance

- **Objetivo de la validación:** TBD.
- **Incluido:** TBD.
- **No incluido:** TBD.
- **Riesgos priorizados:** tenant, sucursal, permisos, datos, seguridad, accesibilidad, operación u otros TBD.

## Base de prueba

- Documento/criterios: enlaces TBD.
- ADRs/decisiones aplicables: TBD.
- Contratos/especificaciones: TBD.
- Definition of Done aplicable: [enlace](../delivery/DEFINITION_OF_DONE.md).

## Ambiente y configuración

| Aspecto | Valor no sensible |
|---|---|
| URL/ambiente lógico | TBD |
| Versiones de servicios | TBD |
| Estado de migraciones | TBD |
| Navegador/OS/dispositivo | TBD |
| Feature flags | TBD / No aplica |
| Integraciones/sandboxes | TBD |
| Diferencias conocidas frente a production | TBD |

Nunca copiar valores de variables secretas. Indicar sólo su presencia, versión o alias seguro cuando sea relevante.

## Datos de prueba

- **Origen:** sintéticos / fixture versionado / datos sanitizados bajo proceso aprobado.
- **Dataset/versión:** TBD.
- **Tenant Alfa:** alias y propósito TBD.
- **Tenant Beta:** alias y propósito TBD.
- **Sucursales/roles/dispositivos:** TBD.
- **Precondiciones:** TBD.
- **Limpieza posterior:** TBD.

## Resultado ejecutivo

| Resultado | Valor |
|---|---|
| Criterios aprobados | TBD |
| Criterios fallidos | TBD |
| Criterios no ejecutados | TBD |
| Bugs/hallazgos nuevos | TBD |
| Riesgos residuales | TBD |
| Recomendación | `Approve` / `Reject` / `Approve with recorded risk` / `More evidence required` |

La recomendación no equivale a aprobación final; la autoridad y el mecanismo quedan `TBD`.

## Trazabilidad de criterios

| Criterio | Caso(s) | Nivel | Resultado | Evidencia | Hallazgo |
|---|---|---|---|---|---|
| AC-1 | TC-1 | Unit/Integration/E2E/Manual/Documental | Pass/Fail/Blocked/Not run | Enlace TBD | Ninguno/TBD |
| AC-2 | TC-2 | TBD | TBD | TBD | TBD |

## Casos ejecutados

### TC-1 — Título del caso

- **Riesgo/criterio:** TBD.
- **Precondiciones:** TBD.
- **Actor, tenant, sucursal y dispositivo:** TBD.
- **Pasos o referencia automatizada:** TBD.
- **Resultado esperado:** TBD.
- **Resultado observado:** TBD.
- **Estado:** `Pass` / `Fail` / `Blocked` / `Not run`.
- **Evidencia sanitizada:** TBD.
- **Notas/limitaciones:** TBD.

Repetir la sección por caso o vincular reporte automatizado estable.

## Aislamiento multitenant

Completar cuando el cambio toca datos, contexto o una superficie compartida; justificar cualquier `No aplica`.

| Escenario | Resultado | Evidencia |
|---|---|---|
| Alfa accede a recurso propio permitido | TBD | TBD |
| Alfa sin permiso accede a recurso propio | TBD | TBD |
| Alfa usa ID válido de Beta | TBD | TBD |
| Token de Alfa con hostname de Beta | TBD | TBD |
| `branch_id` ajeno o de otro tenant | TBD | TBD |
| Lista/búsqueda/reporte/export no filtra datos ajenos | TBD | TBD |
| Jobs/caché/realtime/archivos afectados | TBD / No aplica justificado | TBD |

- **Referencia a suite completa:** [Multitenant Isolation Testing](./MULTITENANT_ISOLATION_TESTING.md).

## Identidad, permisos y auditoría

| Actor/contexto | Acción | Resultado esperado | Resultado | Auditoría |
|---|---|---|---|---|
| TBD | TBD | Permitido/Denegado | TBD | TBD |

- Sesión/dispositivo revocado: TBD.
- Acción sensible/reautenticación: TBD.
- Logs sin secretos/PIN/datos innecesarios: TBD.

## Estados de experiencia y accesibilidad

- [ ] Camino principal.
- [ ] Carga/progreso.
- [ ] Vacío/sin resultados.
- [ ] Error y recuperación.
- [ ] Permisos insuficientes.
- [ ] Responsive/zoom/reflow.
- [ ] Teclado, foco y nombre/rol/estado.
- [ ] Contraste/no sólo color.
- [ ] Realtime/timeout cuando aplica.

**Evidencia y excepciones:** TBD.

## Pruebas no funcionales y operación

| Área | Ejecutada | Resultado/evidencia | Justificación si no aplica |
|---|---|---|---|
| Seguridad | TBD | TBD | TBD |
| Rendimiento/carga | TBD | TBD | TBD |
| Resiliencia/reintentos | TBD | TBD | TBD |
| Migración | TBD | TBD | TBD |
| Rollback | TBD | TBD | TBD |
| Logs/métricas/alertas | TBD | TBD | TBD |
| Backup/recovery | TBD | TBD | TBD |

## Hallazgos

| Bug/hallazgo | Severidad propuesta | Impacto | Estado | Bloquea | Evidencia |
|---|---|---|---|---|---|
| `BUG-###` / TBD | TBD | TBD | TBD | Sí/No/TBD | TBD |

Detalles sensibles deben almacenarse en el canal restringido aprobado y aquí sólo se incluye referencia con acceso controlado.

## Pruebas omitidas o bloqueadas

| Prueba | Razón | Riesgo | Condición para ejecutar | Decisión |
|---|---|---|---|---|
| TBD | TBD | TBD | TBD | TBD |

## Riesgo residual y recomendación

- **Riesgo residual:** TBD.
- **Mitigación/monitoreo:** TBD.
- **Vencimiento de aceptación:** TBD.
- **Aprobador requerido:** TBD.
- **Recomendación QA:** TBD.

## Aprobaciones

| Rol | Persona | Resultado | Fecha real | Evidencia/comentario |
|---|---|---|---|---|
| QA | TBD | TBD | TBD | TBD |
| Ingeniería | TBD | TBD | TBD | TBD |
| Product Owner | TBD | TBD | TBD | TBD |
| Seguridad/Operaciones, si aplica | TBD | TBD | TBD | TBD |

## Anexos

- Reportes automatizados: TBD.
- Capturas/videos sanitizados: TBD.
- Logs/traces sanitizados: TBD.
- Manifiesto de release: TBD.

---

## Reglas de uso de la plantilla

- La evidencia identifica siempre build/digest y ambiente; “última versión” no es suficiente.
- `Pass` requiere resultado observable; no inferirlo por ausencia de bug.
- `Not run` no equivale a `Pass`.
- Una captura complementa, pero no sustituye pasos, datos y resultado.
- Cualquier dato sensible se redacta y el acceso al original, si es imprescindible, se restringe.
- La evidencia se enlaza desde PBI, bug y release según el [modelo de trazabilidad](../delivery/TRACEABILITY_MODEL.md).

## Preguntas abiertas sobre la plantilla

- ¿Dónde se almacenarán reportes y adjuntos con retención controlada?
- ¿Qué aprobaciones serán obligatorias según riesgo?
- ¿Qué formato integrará resultados automáticos sin duplicación manual?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** selección de tooling QA o primera ejecución completa en staging.
- **Documentos relacionados:** [Quality Strategy](./QUALITY_STRATEGY.md), [Testing Strategy](./TESTING_STRATEGY.md), [Release Process](../delivery/RELEASE_PROCESS.md).
