# Consistencia y concurrencia

## Objetivo

**PM:** identificar decisiones concurrentes que pueden violar invariantes y definir el resultado de negocio esperado, sin escoger locks, colas, transacciones, versiones técnicas ni arquitectura distribuida.

## Riesgos prioritarios

| Riesgo | Carrera posible | Resultado no permitido | Expectativa conceptual |
|---|---|---|---|
| Folio duplicado | dos recepciones obtienen “siguiente” folio | dos órdenes con misma identificación en alcance | una sola creación conserva el folio; la otra debe reintentar con identidad distinta |
| Doble entrega | dos actores completan entrega | dos entregas válidas o custodia termina dos veces | sólo una entrega puede transicionar custodia |
| Doble cobro | reintento o dos cajas registran el mismo pago | movimiento duplicado | una misma intención financiera no produce dos movimientos válidos |
| Autorización obsoleta | cliente decide mientras cambia cotización | autorización sobre precio/alcance distinto | decisión se vincula a una versión; conflicto exige reconfirmación |
| Precio posterior a autorización | gerente ajusta después de aprobar | total autorizado cambia silenciosamente | nueva versión/decisión o política explícita |
| QC obsoleto | trabajo cambia durante revisión | aprobación de trabajo ya reemplazado | revisión refiere trabajo vigente identificable |
| Ubicación desactualizada | dos movimientos se registran fuera de orden | equipo aparece en dos lugares | secuencia y reconciliación visibles |
| Asignación simultánea | dos responsables toman la misma orden | responsabilidad ambigua | política define simultaneidad o conflicto explícito |
| Corrección concurrente | se corrige un pago mientras otro calcula saldo | saldo temporal incorrecto | movimientos se conservan y proyección se recalcula |
| Política cambiante | orden se evalúa durante cambio de política | requisito histórico cambia silenciosamente | decisión conserva versión aplicable |

**Clasificación:** PM; los resultados no permitidos derivan de DDV donde existe invariante.

## Consistencia por dimensión

| Dimensión | Consistencia requerida | Puede tolerar actualización derivada posterior |
|---|---|---|
| Identidad/custodia | fuerte en creación y entrega | resúmenes de lectura, no la condición |
| Comercial | fuerte al decidir por versión/concepto | total mostrado si puede recalcularse sin ambigüedad |
| Técnica | historia no sobrescribible; trabajo refiere autorización | técnico resumen y timeline |
| Workflow | transición válida y movimiento atribuible | tablero/colas si muestran frescura |
| QC | resultado sobre trabajo vigente | indicadores agregados |
| Pagos | movimiento único y trazable | saldo/proyecciones reconciliables |
| Evidencia | vínculo y autoría consistentes | miniaturas/índices |

**Clasificación:** PM.

## Detección y reconciliación conceptual

- **PM:** conservar identidad de intención para detectar repeticiones.
- **PM:** referir versiones vigentes en cotización, autorización, trabajo y QC.
- **PM:** exponer discrepancias de estado/ubicación/custodia sin corregirlas silenciosamente.
- **DDV:** corregir con registro compensatorio y preservar original.
- **PM:** permitir recálculo de proyecciones desde hechos autoritativos.
- **PA:** definir responsables, tiempos y autoridad de reconciliación.

## Casos que requieren decisión humana

| Conflicto | Decisión requerida |
|---|---|
| autorización y nueva cotización simultáneas | confirmar versión aceptada con decisor |
| equipo físicamente en lugar distinto al registro | verificar custodia y registrar corrección/movimiento |
| dos cobros con misma referencia | finanzas determina duplicado, aplicación o devolución |
| QC aprobado y nuevo trabajo registrado | invalidar/renovar revisión conforme a política |
| entrega marcada sin evidencia física | investigar y corregir sin inferir el acto |

**Clasificación:** PM/PA.

## No decisiones técnicas

Este documento no decide aislamiento, nivel de transacción, bloqueo, control optimista, mensajería, saga, outbox, Event Sourcing ni proveedor. Esas decisiones requieren primero cerrar los límites y escenarios de negocio.
