# Decisiones de agregados

## Principio

**[DAR]** Un agregado protege invariantes que deben ser inmediatas. No debe abarcar todo el ciclo de la reparación sólo por compartir folio.

## Clasificación de candidatos

| Candidato | Madurez | Invariantes bajo su autoridad | Relación con la orden | Clasificación |
| --- | --- | --- | --- | --- |
| Orden de Servicio | Confirmado para MVP como coordinador, no contenedor total | Identidad, folio, datos mínimos y vínculo al ciclo | Raíz de referencia | DAR |
| Custodia | Candidato fuerte; integrable inicialmente con Orden | Inicio, vigencia y término válido | Identidad o componente protegido | DAP |
| Movimiento de ubicación | Candidato que debe integrarse dentro de Custodia | Secuencia y ubicación vigente | Referencia a orden/custodia | DAP |
| Asignación técnica | Candidato que debe integrarse inicialmente en Trabajo técnico | Responsable y participaciones | Referencia a orden | DAP |
| Evaluación diagnóstica | Candidato fuerte | Revisiones, conclusión y recomendaciones | Referencia a orden/equipo | DAP |
| Cotización | Confirmado para MVP con identidad y ciclo propios | Versión, conceptos, importes, precios y vigencia | Referencia a orden | DAR |
| Decisión de autorización | Candidato fuerte dentro de Comercial | Decisor, evidencia y decisión por concepto/versión | Referencia a cotización | DAP |
| Ejecución de trabajo | Candidato fuerte | Actividades y alcance autorizado | Referencia a autorización | DAP |
| Control de calidad | Candidato fuerte e independiente/repetible | Revisión examinada, revisor y resultado | Referencia a trabajo | DAP |
| Movimiento financiero | Confirmado para MVP | Importe, moneda, medio, actor e idempotencia | Referencia a orden/cotización | DAR |
| Entrega | Candidato fuerte; operación atómica | Receptor, evidencia, momento y no duplicidad | Solicita fin de custodia | DAP |
| Nota narrativa | No debería ser agregado | Autor, texto, tiempo y vínculo | Registro propietario | DAR |
| Línea temporal | No debería ser agregado | No decide invariantes | Proyección | DAR |
| Evidencia | Pregunta abierta según ciclo y seguridad | Metadatos, clasificación y acceso | Referencia desde hechos | PB |
| Política de configuración | Candidato fuerte | Versión, alcance y vigencia | Resuelta por contexto | DAP |
| Promoción avanzada | Candidato diferible | No requerida para el flujo | Referencia futura | DD |

## Decisiones recomendadas

- **[DAR]** La creación de orden y el inicio de custodia comparten límite transaccional.
- **[DAR]** Diagnóstico, propuesta, autorización, ejecución y QC se modelan separados y se enlazan por versiones.
- **[DAR]** Los pagos se agregan como movimientos; el saldo es derivado.
- **[DAR]** Estado de negocio, ubicación física, asignación y responsabilidad son dimensiones distintas.
- **[DAR]** La línea temporal es proyección de hechos, no agregado que decide la operación.

## Orden de Servicio

**[DAR]** Se recomienda una Orden de Servicio como identidad y coordinador del ciclo, con agregados separados para evaluación, cotización/autorización, ejecución, calidad, movimientos financieros y entrega. No es una entidad pasiva ni un agregado monolítico de todo el ciclo.

**[R]** Incrustar cliente, recepción, diagnósticos, cotizaciones, autorizaciones, trabajos, pagos, evidencias, ubicaciones, notas y entrega produciría carga excesiva, conflictos concurrentes, historia mutable y propiedad ambigua. La vista de detalle puede componerlos sin guardarlos juntos.

## Evaluaciones especiales

- **[DAR] Cotización:** identidad y ciclo propios por versiones, conceptos, autorización parcial, precio histórico, obsolescencia y cambios. Promociones avanzadas quedan diferidas.
- **[DAR] Movimiento financiero:** separado para anticipos, correcciones, devoluciones/anulaciones compensatorias y futuro enlace con Caja.
- **[DAR] Evaluación diagnóstica:** revisión propia para preservar iteraciones sin sobrescribir conclusiones anteriores.
- **[DAR] Control de calidad:** registro independiente y repetible que refiere a la revisión de trabajo examinada.
- **[DAR] Entrega:** operación atómica idempotente protegida contra doble entrega y coordinada con fin de custodia.
- **[DAP] Custodia y ubicación:** custodia protege responsabilidad; ubicación se obtiene del historial de movimientos. Pueden compartir agregado inicialmente, pero no se reducen a un estado de Orden.

## Preguntas que impiden cerrar el diseño

- **[PB]** ¿La entrega y el término de custodia deben ser una sola transacción en el mismo agregado?
- **[PB]** ¿Qué cambios invalidan o reemplazan una propuesta/autorización previa?
- **[PB]** ¿Quién puede aprobar QC y puede ser la misma persona que ejecutó?
- **[PB]** ¿Qué reversos de pago existen y quién los autoriza?
- **[PB]** ¿Qué alcance garantiza la unicidad del folio?

## Antiobjetivo

**[R]** Un agregado “Reparación” que cargue cliente, pagos, evidencia, diagnóstico, propuesta, ejecución y línea temporal completa produciría contención, conflictos y reglas cruzadas. No se recomienda.
