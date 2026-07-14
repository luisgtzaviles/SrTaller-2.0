# Hotspots del Current State

**Estado:** Borrador priorizado para validación interdisciplinaria.
**Propósito:** Concentrar ambigüedades, defectos y riesgos que impiden interpretar el flujo actual como una especificación confiable.
**Alcance:** Negocio, técnica, seguridad, finanzas y trazabilidad desde recepción hasta entrega/reingreso.
**Fuente:** Product Owner; auditorías legacy de nueva reparación y detalle; preguntas canónicas relacionadas.
**Audiencia:** Product Owner, operaciones, finanzas, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

## Criterio de prioridad

- **Crítica:** puede permitir pérdida de custodia, exposición sensible o inconsistencia monetaria grave.
- **Alta:** bloquea decisiones de dominio o reconstrucción confiable del caso.
- **Media:** produce ambigüedad o deuda operativa relevante, sin impacto crítico demostrado.

El impacto describe el riesgo de la situación actual; no prescribe una solución futura. “—” indica que no se demostró impacto directo, no que sea imposible.

## Hotspots de negocio

| ID | Descripción y evidencia | Impacto operativo | Seguridad | Finanzas | Arquitectura | Actores | Preguntas relacionadas | Urgencia | Estado |
|---|---|---|---|---|---|---|---|---|---|
| `CSE-HOTSPOT-001` | Cliente, propietario, persona que entrega y contacto se colapsan: sólo el cliente nombrado queda en nota; `LEGACY-NR-FINDING-003`. | No se sabe quién entregó ni quién es dueño. | Autoridad/privacidad ambiguas. | Titular del adeudo/cobro ambiguo. | Identidades y relaciones no definidas. | `CSE-ACTOR-001` a `004`. | `DQ-004`, `LEGACY-RD-Q-010/028`. | Alta | `Confirmed by both`. |
| `CSE-HOTSPOT-002` | Teléfono se usa para coincidencia y contacto; `LEGACY-NR-FINDING-002`. | Duplicado o teléfono compartido puede seleccionar otra persona. | Contacto/notificación a tercero. | Pago/autorización atribuidos ambiguamente. | Dedupe no equivale a identidad. | Cliente, contacto, recepción. | `LEGACY-NR-Q-003/004`, `DQ-004`. | Alta | `Confirmed by both`. |
| `CSE-HOTSPOT-004` | El dispositivo no es una entidad reutilizable; queda embebido en reparación, `LEGACY-NR-FINDING-004`. | Historial del mismo equipo no es confiable. | Secretos/evidencias pueden duplicarse. | Garantía/costo por dispositivo no se concilian. | Identidad sin IMEI no resuelta. | Cliente, recepción, técnico. | `DQ-005`, `LEGACY-NR-Q-013/014`. | Alta | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-005` | Problema reportado, cómo ocurrió, diagnóstico y hallazgo comparten campos/narrativa; `LEGACY-RD-FINDING-017`. | Alcance y causa se confunden. | Narrativa puede incluir datos excesivos. | Cambio de costo sin causa verificable. | Hechos distintos carecen de vínculos. | Recepción, técnico, cliente. | `DQ-008`, `LEGACY-RD-Q-007/009`. | Alta | `Confirmed by both`. |
| `CSE-HOTSPOT-010` | Estado técnico y custodia son dimensiones independientes, `LEGACY-RD-FINDING-002`. | Se admiten combinaciones contradictorias. | Puede facilitar liberación indebida. | Entrega puede ocurrir con saldo. | No hay regla cruzada/historial. | Usuario de estado/entrega, recepción. | `DQ-018/019/020`, `LEGACY-RD-Q-025/027`. | Crítica | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-016` | Entrega carece de legitimación estructurada, `LEGACY-RD-FINDING-015`; la práctica humana sí evalúa pruebas. | Cadena de custodia no demostrable. | Riesgo de entrega a tercero. | Responsabilidad por pérdida/reclamo. | Marca de fila y acto físico no se vinculan. | Recepción, receptor, contacto, dueño/gerente. | `DQ-014`, `LEGACY-RD-Q-028/030`. | Crítica | `Confirmed by both`. |
| `CSE-HOTSPOT-018` | Reconocimiento personal en comercio pequeño puede legitimar entrega, según PO. | Depende de memoria y disponibilidad del personal. | Suplantación/no auditabilidad. | Posible responsabilidad por entrega. | Hecho no representado. | Recepción, persona que recoge. | `LEGACY-RD-Q-029`. | Alta | `Confirmed by Product Owner`. |
| `CSE-HOTSPOT-019` | Dueño o gerente puede exceptuar regla sin nota/INE; excepción no se registra. | Decisión difícil de revisar. | Autoridad y abuso no auditables. | Responsabilidad por pérdida. | Falta vínculo entre excepción y entrega. | Dueño, gerente, recepción, receptor. | `LEGACY-RD-Q-029/030`. | Crítica | `Confirmed by Product Owner`. |
| `CSE-HOTSPOT-025` | Garantía aparece como bandera, folio previo o etiqueta; `LEGACY-RD-FINDING-022`. | Cobertura/vigencia/resolución indeterminadas. | Evidencia y datos heredados ambiguos. | Cobro/costo de garantía inciertos. | No hay relación validada entre ciclos. | Cliente, recepción, técnico. | `DQ-021/022`, `LEGACY-RD-Q-031/033`. | Alta | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-026` | Reapertura es sobrescribir estado; permanecen fechas previas, `LEGACY-RD-FINDING-003/022`. | Estado vigente mezcla ciclos. | Actor/motivo no auditables. | Pagos/costos no se ajustan. | No hay ciclo propio ni historia. | Usuario de estado, técnico, recepción. | `DQ-029`, `LEGACY-RD-Q-002/003/027`. | Alta | `Confirmed by legacy code`. |

## Defectos técnicos observados

| ID | Descripción y evidencia | Impacto operativo | Seguridad | Finanzas | Arquitectura | Actores | Preguntas relacionadas | Urgencia | Estado |
|---|---|---|---|---|---|---|---|---|---|
| `CSE-HOTSPOT-003` | Folio se consulta/predice sin reserva y se recalcula; `LEGACY-NR-FINDING-001`. | Posible colisión o sticker/orden divergentes bajo concurrencia. | — | Referencias de pago/documento pueden cruzarse. | Identidad pública y atomicidad frágiles. | Recepción, sistema. | `LEGACY-NR-Q-001/002`. | Crítica | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-009` | Estado es configuración/texto libre y backend no valida catálogo; `LEGACY-RD-FINDING-001`. | Secuencias y significado no confiables. | Acción sensible sin control semántico. | Reportes/cobros por estado ambiguos. | No hay transición/versionado. | Usuario de estado, sistema. | `DQ-018`, `LEGACY-RD-Q-001/003`. | Alta | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-011` | Técnico textual se sobrescribe sin historial, `LEGACY-RD-FINDING-007`. | Responsabilidad y carga no reconstruibles. | Identidad/permisos débiles. | Mano de obra/garantía no atribuibles. | Falta identidad estable/periodo. | Técnico, usuario de estado. | `DQ-004`, `LEGACY-RD-Q-004/006`. | Alta | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-020` | Webhook ocurre antes del guardado; `LEGACY-RD-FINDING-004`. | Se puede avisar cierre que no quedó guardado. | Salida no gobernada por resultado final. | Cliente puede actuar con información incorrecta. | No atomicidad/reintento/idempotencia. | Navegador, endpoint, receptores. | `LEGACY-RD-Q-037/038`. | Crítica | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-022` | Reimpresión reconstruye datos/plantilla presentes y sólo último pago; `LEGACY-RD-FINDING-024`. | Nota posterior puede diferir de original. | Puede volver a exponer datos/secretos. | Monto mostrado no equivale a total pagado. | Falta snapshot/bitácora/versionado. | Usuario, navegador, impresora. | `LEGACY-RD-Q-044`. | Alta | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-023` | Seguimiento libre se transforma a minúsculas salvo inicial; `LEGACY-RD-FINDING-017`. | Pierde fidelidad y mezcla hechos. | Puede contener PII sin clasificación. | Autorizaciones/montos no verificables. | Sin tipo, vínculo ni corrección. | Usuario de seguimiento. | `LEGACY-RD-Q-022/024`. | Alta | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-024` | Evidencia se distribuye entre R2, seguimiento y archivos sin transacción común; `LEGACY-RD-FINDING-018`. | Galería/metadatos pueden quedar incompletos. | Retención/acceso/borrado inconsistentes. | Prueba de entrega/pago puede faltar. | Resultado parcial y objetos huérfanos. | Usuario, sistema, R2. | `LEGACY-RD-Q-012/042`. | Alta | `Inferred from combined evidence`. |
| `CSE-HOTSPOT-029` | Alta, detalle y webhook no aplican una política temporal uniforme. | Orden de hechos/hitos ambiguo. | Logs difíciles de correlacionar. | Corte de caja/pago potencialmente ambiguo. | Zonas y semántica de timestamps inconsistentes. | Todos los usuarios/sistemas. | `LEGACY-NR-Q-043`, `LEGACY-RD-Q-046/048`. | Alta | `Confirmed by legacy code`. |

## Riesgos de seguridad

| ID | Descripción y evidencia | Impacto operativo | Seguridad | Finanzas | Arquitectura | Actores | Preguntas relacionadas | Urgencia | Estado |
|---|---|---|---|---|---|---|---|---|---|
| `CSE-HOTSPOT-006` | Código/patrón de seguridad circula en contrato amplio, ticket y webhook; `LEGACY-RD-FINDING-020`. | Necesario para trabajo, pero propósito no acotado. | Secreto reversible/visible y posible exfiltración. | — | Falta minimización/ciclo de vida. | Cliente, recepción, técnico, webhook. | `LEGACY-RD-Q-041/042`. | Crítica | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-007` | Riesgo capturado no conserva consentimiento demostrable; `LEGACY-NR-FINDING-007`. | Disputa sobre condición/riesgo aceptado. | Evidencia insuficiente de voluntad. | Responsabilidad por daños. | Selección no vinculada a aceptación. | Cliente, persona que entrega, recepción. | `LEGACY-NR-Q-018/019`. | Alta | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-008` | Evidencia de recepción es posterior y opcional. | Puede faltar o reflejar condición posterior. | Fotos pueden incluir PII sin política. | Reclamos/garantías difíciles. | Momento y propósito no vinculados. | Recepción, cliente, R2. | `LEGACY-NR-Q-025/027`. | Alta | `Confirmed by both`. |
| `CSE-HOTSPOT-017` | INE puede fotografiarse como evidencia sensible, sin categoría/vínculo de entrega. | Ayuda práctica, pero no demuestra decisión completa. | Exceso de datos, acceso y retención no definidos. | Evidencia ante disputa incierta. | Archivo genérico sin semántica. | Receptor, recepción, R2. | `LEGACY-RD-Q-012/029/042`. | Crítica | `Confirmed by Product Owner`; manejo `Pending security review`. |
| `CSE-HOTSPOT-021` | Webhook transmite fila anterior completa, incluido potencial secreto; `LEGACY-RD-FINDING-005`. | Receptor interpreta datos desactualizados. | PII/secreto fuera de contrato mínimo. | Valores monetarios pueden ser anteriores. | Payload/acoplamiento/receptores no gobernados. | Endpoint, receptores, cliente. | `LEGACY-RD-Q-038/039/041`. | Crítica | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-030` | Endpoints validan sesión/contexto/CSRF, pero no permiso por acción; `LEGACY-RD-FINDING-019`. | Cualquier sesión apta puede mutar decisiones sensibles. | Autorización funcional insuficiente. | Cobro/presupuesto/entrega sin rol específico. | Guardias no expresan autoridad de dominio. | Usuarios internos, sistema. | `LEGACY-RD-Q-040`. | Crítica | `Confirmed by legacy code`. |

## Gaps financieros

| ID | Descripción y evidencia | Impacto operativo | Seguridad | Finanzas | Arquitectura | Actores | Preguntas relacionadas | Urgencia | Estado |
|---|---|---|---|---|---|---|---|---|---|
| `CSE-HOTSPOT-012` | Presupuesto final es total sobrescrito sin versiones/partidas; `LEGACY-RD-FINDING-010`. | No se sabe qué se ofreció. | Autor del cambio no distinguido. | Monto/alcance histórico no demostrable. | Falta versión y causalidad. | Recepción, técnico, usuario de estado, cliente. | `DQ-009`, `LEGACY-RD-Q-013/015`. | Crítica | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-013` | Autorización sólo puede narrarse; `LEGACY-RD-FINDING-011`. | Trabajo puede continuar sin prueba estructural. | Identidad/canal/evidencia ambiguos. | Monto autorizado no se vincula. | Decisión y cotización son peticiones separadas. | Cliente/contacto, técnico, usuario de seguimiento. | `DQ-011`, `LEGACY-RD-Q-010/012`. | Crítica | `Confirmed by both`. |
| `CSE-HOTSPOT-014` | Pagos se insertan por folio sin caja, turno o método real; `LEGACY-RD-FINDING-012`. | Conciliación manual o desconocida. | Permiso financiero no específico. | No demuestra ingreso, aplicación ni asiento. | Integración con POS/caja no encontrada. | Persona que paga, usuario de pago, finanzas. | `DQ-012`, `LEGACY-RD-Q-016/020`. | Crítica | `Confirmed by both`. |
| `CSE-HOTSPOT-015` | Saldo sólo es presupuesto actual menos filas, calculado en navegador; `LEGACY-RD-FINDING-014`. | No controla entrega ni explica ajustes. | Cliente directo puede eludir UI. | Negativos/sobrepagos/deuda no gobernados. | Regla no existe en backend. | Usuario de pago/entrega, finanzas. | `DQ-019`, `LEGACY-RD-Q-017/021/030`. | Crítica | `Confirmed by legacy code`. |
| `CSE-HOTSPOT-027` | Cancelación sería etiqueta; no hay compensaciones de pagos/evidencia/inventario. | Caso cancelado no tiene cierre operativo claro. | Retención y autoridad inciertas. | Reembolso/crédito/corrección ausentes. | No hay comando/ciclo dedicado. | Cliente, recepción, finanzas. | `DQ-029`, `LEGACY-RD-Q-003/018`. | Alta | `Confirmed by legacy code` para ausencia del proceso. |
| `CSE-HOTSPOT-028` | No existe vínculo activo con inventario/refacciones; `LEGACY-RD-FINDING-023`. | Pieza requerida/instalada no se reconcilia. | Autoridad sobre movimientos no aplica en flujo. | Costo/precio/garantía desconectados. | Sólo referencia textual lateral bloqueada. | Técnico, compras, finanzas. | `DQ-023`, `LEGACY-RD-Q-034/036`. | Alta | `Confirmed by legacy code` para ausencia en el flujo. |

## Gaps de trazabilidad — vista transversal

Esta vista no crea nuevos hotspots; muestra cuáles destruyen o debilitan la cadena de evidencia:

| Trazabilidad perdida | Hotspots relacionados | Consecuencia |
|---|---|---|
| Identidad y custodia | `001`, `002`, `016`, `017`, `018`, `019` | No puede probarse consistentemente quién entregó, autorizó o recibió. |
| Secuencia e historial | `003`, `009`, `010`, `011`, `020`, `026`, `029` | La fila presente no reconstruye cambios, ciclos ni orden causal. |
| Consentimiento y alcance | `005`, `007`, `008`, `012`, `013`, `023` | Riesgo, diagnóstico, autorización y cotización carecen de cadena común. |
| Dinero | `012`, `013`, `014`, `015`, `022`, `027`, `028` | Documento, pago, saldo, caja e inventario no se concilian. |
| Evidencia y seguridad | `006`, `017`, `021`, `024`, `030` | Datos sensibles y autoridad se dispersan sin propósito/auditoría suficientes. |

## Prioridad de validación

1. Custodia y seguridad: `CSE-HOTSPOT-006`, `016`, `017`, `019`, `021`, `030`.
2. Dinero y autorización: `CSE-HOTSPOT-012` a `015`.
3. Identidad, folio y tiempo: `CSE-HOTSPOT-001` a `004`, `029`.
4. Ciclo técnico, garantía y piezas: `CSE-HOTSPOT-005`, `009` a `011`, `025` a `028`.
5. Evidencia, comunicación e impresión: `CSE-HOTSPOT-007`, `008`, `020`, `022` a `024`.
