# Preguntas abiertas de “Nueva Reparación”

- **Estado:** Pending Product Owner validation
- **Propósito:** Organizar las decisiones humanas que el código legado no puede resolver.
- **Alcance:** Cliente, dispositivo, recepción, diagnóstico, dinero, garantía, evidencia, seguridad, tiempo, sucursal y auditoría.
- **Fuente:** Hallazgos de SR Taller 1.0 documentados en este directorio.
- **Audiencia:** Product Owner, Domain Experts, Seguridad, Finanzas, Arquitectura, QA y Operaciones.
- **Última actualización:** 2026-07-14

> Las preguntas no presuponen que el comportamiento legado deba conservarse.

## Cliente

| ID | Pregunta | Motivo/evidencia | Responsable sugerido | Estado |
|---|---|---|---|---|
| `LEGACY-NR-Q-001` | ¿Qué identifica de manera estable a un cliente y cómo se resuelven homónimos? | El legado usa teléfono o nombre como `dedupe_key`. | Product Owner/Recepción | Pending Product Owner validation |
| `LEGACY-NR-Q-002` | ¿Puede un teléfono pertenecer a varias personas o contactos autorizados? | El índice único por clave puede fusionarlas. | Product Owner/Recepción | Pending Product Owner validation |
| `LEGACY-NR-Q-003` | ¿Qué debe ocurrir al cambiar un teléfono: corregir, versionar o crear otro contacto? | Cambiarlo en alta limpia el ID y puede crear/reusar otro maestro. | Product Owner/Privacidad | Pending Product Owner validation |
| `LEGACY-NR-Q-004` | ¿Qué datos de cliente deben quedar congelados en una orden histórica? | La reparación guarda snapshot y vínculo maestro. | Product Owner/Legal | Pending Product Owner validation |
| `LEGACY-NR-Q-005` | ¿Son distintos propietario, persona que entrega, contacto autorizado y receptor de notificaciones? | Esos roles no aparecen en el formulario. | Product Owner/Operaciones | Pending Product Owner validation |

## Dispositivo

| ID | Pregunta | Motivo/evidencia | Responsable sugerido | Estado |
|---|---|---|---|---|
| `LEGACY-NR-Q-006` | ¿Qué constituye la identidad de un dispositivo con y sin IMEI/serie? | IMEI es opcional por default y no hay entidad de dispositivo. | Técnicos/Product Owner | Pending Product Owner validation |
| `LEGACY-NR-Q-007` | ¿Debe reconocerse el mismo dispositivo en reparaciones repetidas? | No se encontró deduplicación por IMEI ni relación entre visitas. | Product Owner/Técnicos | Pending Product Owner validation |
| `LEGACY-NR-Q-008` | ¿“Características” describe condición física, accesorios, daños, rasgos identificadores o todo lo anterior? | Es texto libre sin regla posterior. | Recepción/Técnicos | Pending Product Owner validation |
| `LEGACY-NR-Q-009` | ¿Existe un sticker físico, cuándo se coloca y qué hecho debe registrar el sistema? | No se encontró flujo de etiqueta de reparación; sólo impresión de nota. | Operaciones | Pending Product Owner validation |

## Recepción

| ID | Pregunta | Motivo/evidencia | Responsable sugerido | Estado |
|---|---|---|---|---|
| `LEGACY-NR-Q-010` | ¿Encendido/Apagado es observación, prueba funcional o declaración del cliente? | El select se muestra, pero no cambia reglas posteriores. | Recepción/Técnicos | Pending Product Owner validation |
| `LEGACY-NR-Q-011` | ¿Qué accesorios y condiciones deben inventariarse de forma estructurada al recibir? | Sólo hay chip, memoria y características libres. | Operaciones/Legal | Pending Product Owner validation |
| `LEGACY-NR-Q-012` | ¿Qué riesgos pueden coexistir y quién debe informarlos? | El legado permite una sola opción y no registra informante específico. | Operaciones/Legal | Pending Product Owner validation |
| `LEGACY-NR-Q-013` | ¿Qué constituye aceptación válida de riesgo y qué evidencia debe conservarse? | No hay firma, checkbox, PIN ni timestamp específico. | Legal/Product Owner | Pending Product Owner validation |

## Diagnóstico

| ID | Pregunta | Motivo/evidencia | Responsable sugerido | Estado |
|---|---|---|---|---|
| `LEGACY-NR-Q-014` | ¿“Falla” es síntoma reportado, categoría de ingreso o diagnóstico? | Es catálogo de recepción y no existe diagnóstico estructurado. | Técnicos/Product Owner | Pending Product Owner validation |
| `LEGACY-NR-Q-015` | ¿Qué significa “Testimonio” y quién es su autor? | Se captura en mostrador como texto libre. | Recepción/Legal | Pending Product Owner validation |
| `LEGACY-NR-Q-016` | ¿Cuándo y por quién se confirma o corrige un diagnóstico? | Los datos iniciales no se editan; sólo hay seguimientos libres. | Técnicos/Product Owner | Pending Product Owner validation |
| `LEGACY-NR-Q-017` | ¿Qué parte del problema/diagnóstico debe imprimirse o comunicarse al cliente? | La plantilla activa es dinámica y no está en el repositorio. | Product Owner/Legal | Pending Product Owner validation |

## Dinero

| ID | Pregunta | Motivo/evidencia | Responsable sugerido | Estado |
|---|---|---|---|---|
| `LEGACY-NR-Q-018` | ¿Presupuesto inicial es estimación informal, cotización aceptada o límite autorizado? | Se conserva sin historial y el saldo usa presupuesto final. | Finanzas/Product Owner | Pending Product Owner validation |
| `LEGACY-NR-Q-019` | ¿Qué cambios de precio requieren aceptación y qué historial debe conservarse? | El presupuesto final se sobrescribe sin bitácora. | Finanzas/Legal | Pending Product Owner validation |
| `LEGACY-NR-Q-020` | ¿“Anticipo” es tipo de pago, aplicación del pago o medio de cobro? | Se guarda como `metodo_pago='Anticipo'`. | Finanzas/Caja | Pending Product Owner validation |
| `LEGACY-NR-Q-021` | ¿Puede el pago superar la estimación/cotización y cómo se manejan saldo a favor, devolución y cancelación? | No se encontraron validación, reverso ni cancelación. | Finanzas/Product Owner | Pending Product Owner validation |
| `LEGACY-NR-Q-022` | ¿Todo pago debe vincularse a caja, turno, sucursal, usuario e instrumento? | El legado sólo guarda sucursal, nombre de usuario y texto de método. | Finanzas/Caja | Pending Product Owner validation |

## Garantía

| ID | Pregunta | Motivo/evidencia | Responsable sugerido | Estado |
|---|---|---|---|---|
| `LEGACY-NR-Q-023` | ¿Qué diferencia hay entre posible garantía, solicitud, elegibilidad y garantía aprobada? | El legado sólo tiene un `si/no` opcional. | Garantías/Product Owner | Pending Product Owner validation |
| `LEGACY-NR-Q-024` | ¿Qué reglas de cliente, dispositivo, servicio, plazo y estado determinan vigencia? | No se valida ninguna. | Garantías/Finanzas | Pending Product Owner validation |
| `LEGACY-NR-Q-025` | ¿Una garantía siempre crea una orden independiente y cómo se relaciona con la anterior? | Se crea una reparación normal con folio anterior textual. | Garantías/Operaciones | Pending Product Owner validation |
| `LEGACY-NR-Q-026` | ¿Qué información y evidencia de la orden antecedente debe reutilizarse o quedar referenciada? | No hay reutilización automática. | Garantías/Técnicos | Pending Product Owner validation |

## Evidencia

| ID | Pregunta | Motivo/evidencia | Responsable sugerido | Estado |
|---|---|---|---|---|
| `LEGACY-NR-Q-027` | ¿Qué fotos son obligatorias antes de aceptar o entregar la nota? | La evidencia sólo se habilita después y es opcional. | Operaciones/Legal | Pending Product Owner validation |
| `LEGACY-NR-Q-028` | ¿Cómo se distingue evidencia de recepción, diagnóstico, avance, garantía y entrega? | Todas las fotos viven como seguimiento por folio. | Product Owner/Técnicos | Pending Product Owner validation |
| `LEGACY-NR-Q-029` | ¿Quién puede ver, adjuntar, corregir o eliminar evidencia y con qué retención? | Alta requiere sesión, pero eliminación está deshabilitada y no hay reemplazo en reparación. | Seguridad/Privacidad | Pending security review |
| `LEGACY-NR-Q-030` | ¿Qué recuperación debe ocurrir si el objeto o una de las dos filas de evidencia falla? | R2, seguimiento y `archivos` no son una unidad atómica. | Arquitectura/Operaciones | Pending architecture review |

## Seguridad

| ID | Pregunta | Motivo/evidencia | Responsable sugerido | Estado |
|---|---|---|---|---|
| `LEGACY-NR-Q-031` | ¿Es indispensable conservar una credencial del dispositivo o basta una autorización asistida? | El legado guarda PIN/patrón reversible. | Seguridad/Product Owner | Pending security review |
| `LEGACY-NR-Q-032` | ¿Qué roles pueden capturar y revelar la credencial y en qué momentos? | No se encontró permiso por campo; el detalle la muestra. | Seguridad/IAM | Pending security review |
| `LEGACY-NR-Q-033` | ¿Cuándo debe expirar o eliminarse la credencial y cómo se prueba la eliminación? | No se encontró borrado al cerrar/entregar. | Seguridad/Privacidad | Pending security review |
| `LEGACY-NR-Q-034` | ¿Qué datos mínimos puede recibir una integración de estado? | El webhook envía `SELECT *`, potencialmente incluido el secreto. | Seguridad/Integraciones | Pending security review |
| `LEGACY-NR-Q-046` | ¿El catálogo de países debe ser público y qué detalle de error puede revelar? | `paises_activos.php` no usa guard y devuelve el mensaje de excepción. | Seguridad/Arquitectura | Pending security review |

## Tiempo

| ID | Pregunta | Motivo/evidencia | Responsable sugerido | Estado |
|---|---|---|---|---|
| `LEGACY-NR-Q-035` | ¿Promesa de entrega es estimación o compromiso aceptado? | La UI usa ambos sentidos: “Promesa” y helper “estimada”. | Product Owner/Operaciones | Pending Product Owner validation |
| `LEGACY-NR-Q-036` | ¿En qué zona se interpreta y qué ocurre al cambiar la zona de la sucursal? | `datetime-local` se guarda sin offset. | Arquitectura/Operaciones | Pending architecture review |
| `LEGACY-NR-Q-037` | ¿Quién puede reprogramar y qué motivo/historial/aviso requiere? | No se encontró edición ni auditoría de promesa. | Product Owner/Operaciones | Pending Product Owner validation |
| `LEGACY-NR-Q-038` | ¿Cómo se mide y gestiona incumplimiento de promesa? | No se encontraron alertas, filtros ni métricas. | Product Owner/Analítica | Pending Product Owner validation |

## Sucursal

| ID | Pregunta | Motivo/evidencia | Responsable sugerido | Estado |
|---|---|---|---|---|
| `LEGACY-NR-Q-039` | ¿Un usuario puede recibir para otra sucursal y bajo qué autorización? | La sucursal sólo proviene de sesión/contexto. | Operaciones/IAM | Pending Product Owner validation |
| `LEGACY-NR-Q-040` | ¿El folio necesita ser único globalmente, por organización, sucursal, año o serie? | El legado numera por tenant+sucursal sin año. | Product Owner/Operaciones | Pending Product Owner validation |
| `LEGACY-NR-Q-041` | ¿Cómo se representa traslado de custodia entre sucursales? | No aparece en el flujo y pagos/evidencia quedan ligados a sucursal/folio. | Operaciones | Pending Product Owner validation |

## Auditoría

| ID | Pregunta | Motivo/evidencia | Responsable sugerido | Estado |
|---|---|---|---|---|
| `LEGACY-NR-Q-042` | ¿Qué datos iniciales pueden corregirse y cómo se preserva el valor anterior? | El detalle no edita recepción y no hay bitácora general. | Product Owner/QA | Pending Product Owner validation |
| `LEGACY-NR-Q-043` | ¿Qué hechos requieren actor por ID, fecha, sucursal y motivo? | Se guardan nombres de sesión y timestamps parciales. | Seguridad/Operaciones | Pending Product Owner validation |
| `LEGACY-NR-Q-044` | ¿Debe conservarse copia/versionado de cada nota emitida y confirmación de entrega? | Impresión/reimpresión no se registra. | Legal/Product Owner | Pending Product Owner validation |
| `LEGACY-NR-Q-045` | ¿Qué fuente prevalece cuando cliente maestro, snapshot, pago, ticket o integración discrepan? | El flujo mantiene representaciones separadas y escrituras parciales. | Product Owner/Arquitectura | Pending Product Owner validation |
