# Excepciones y casos límite

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Catálogo

La prioridad indica cuándo resolver el modelo, no urgencia de implementación.

| ID | Escenario y descripción | Impacto | Conceptos afectados | Regla candidata | Decisión necesaria | Prioridad |
|---|---|---|---|---|---|---|
| EDGE-001 | Cliente sin teléfono ni medio habitual | no puede usarse contacto como identidad obligatoria | Cliente, contacto | RULE-002 | mínimo y canal alterno | Alta |
| EDGE-002 | Cliente posiblemente duplicado | historial y autoridad pueden dividirse | Cliente | RULE-002 | criterios de coincidencia/fusión | Alta |
| EDGE-003 | Propietario distinto del contacto | comunicación no equivale a decisión | Cliente, propietario, contacto | RULE-003 | autoridad por acción | Crítica |
| EDGE-004 | Persona distinta recoge | riesgo de entrega indebida | Entrega, autorizado | RULE-015 | evidencia y fallback | Crítica |
| EDGE-005 | Dispositivo sin IMEI | identificador no puede ser obligatorio | Dispositivo | RULE-003 | identidad alternativa | Alta |
| EDGE-006 | Dispositivo con dos IMEI | unicidad simple falla | Dispositivo, IMEI | RULE-003 | cardinalidad y uso | Alta |
| EDGE-007 | Serie ilegible | identificación queda incierta | Dispositivo, evidencia | RULE-004 | representación de incertidumbre | Media |
| EDGE-008 | Equipo bloqueado | limita diagnóstico y prueba | Código, diagnóstico | RULE-005/006 | trabajo posible sin acceso | Alta |
| EDGE-009 | Cliente no da código | no debe impedir todo servicio por defecto | Código, prueba | RULE-005 | pruebas y responsabilidad | Alta |
| EDGE-010 | Equipo mojado | condición puede evolucionar y ser riesgosa | Condición, daño | RULE-004 | custodia y consentimiento | Alta |
| EDGE-011 | Equipo llega desarmado | inventario de piezas y condición son complejos | Recepción, accesorios | RULE-004 | nivel de detalle/evidencia | Alta |
| EDGE-012 | Accesorios entregados | custodia abarca más que el equipo | Recepción, entrega | RULE-004/015 | correspondencia de salida | Alta |
| EDGE-013 | Daño oculto descubierto | puede cambiar alcance y responsabilidad | Hallazgo, evidencia, cotización | RULE-006/007 | pausa y nueva autorización | Crítica |
| EDGE-014 | Falla intermitente | diagnóstico y QC pueden ser inconclusos | Diagnóstico, prueba | RULE-006/012 | criterio de conclusión | Alta |
| EDGE-015 | Diagnóstico inconcluso | no existe solución segura confirmada | Diagnóstico, cotización | RULE-006 | si puede cotizarse/cobrarse | Crítica |
| EDGE-016 | Cotización con opciones | una sola aprobación total no basta | Cotización, partida | RULE-007/008 | alternativas excluyentes | Crítica |
| EDGE-017 | Autorización verbal | evidencia y decisor pueden disputarse | Autorización | RULE-008 | suficiencia y registro | Crítica |
| EDGE-018 | Autorización por WhatsApp | canal transporta evidencia, no autoridad automática | Mensaje, autorización | RULE-008 | vínculo e identidad/retención | Crítica |
| EDGE-019 | Aprobación parcial | estados por orden pueden ocultar partidas | Cotización, reparación | RULE-008 | alcance y resultado parcial | Crítica |
| EDGE-020 | Cotización cambia tras anticipo | valor recibido queda ligado a oferta anterior | Cotización, pago | RULE-007/009 | aplicación/reembolso/nueva aprobación | Crítica |
| EDGE-021 | Refacción del cliente | no pertenece al stock propio | Refacción, garantía | RULE-011/016 | compatibilidad y cobertura | Alta |
| EDGE-022 | Refacción incompatible | reserva o instalación debe detenerse | Refacción, intervención | RULE-011 | quién valida y absorbe costo | Alta |
| EDGE-023 | Reparación externa | custodia y responsabilidad cruzan tercero | Reparación, proveedor | RULE-010/020 | contrato, evidencia y garantía | Alta |
| EDGE-024 | Reparación fallida | completado no significa resuelto | Reparación, QC | RULE-012 | estado, cobro y siguiente opción | Crítica |
| EDGE-025 | Daño causado durante trabajo | abre responsabilidad distinta | Daño, intervención, pago | RULE-004/020 | escalación, compensación, evidencia | Crítica |
| EDGE-026 | Control de calidad fallido | orden debe volver a trabajo sin borrar resultado | QC, retrabajo | RULE-012 | ownership y número de intentos | Crítica |
| EDGE-027 | Cliente no recoge | custodia continúa tras estar listo | Entrega, garantía | RULE-019 | avisos, costo y comienzo de garantía | Alta |
| EDGE-028 | Posible abandono | disposición puede estar regulada | Dispositivo, custodia | RULE-019 | plazo, avisos y autoridad legal | Crítica |
| EDGE-029 | Saldo pendiente | entrega y cierre pueden divergir | Pago, entrega | RULE-013/014 | crédito y excepción | Crítica |
| EDGE-030 | Devolución de pago | saldo y caja retroceden | Pago, caja | RULE-013/020 | autoridad y límite | Crítica |
| EDGE-031 | Contracargo externo | hecho puede llegar tarde o ser incierto | Pago, saldo | RULE-013 | estados y reconciliación | Crítica |
| EDGE-032 | Garantía rechazada | puede requerir nueva cotización | Reclamación, cotización | RULE-016/017 | autoridad y apelación | Alta |
| EDGE-033 | Garantía cubre una parte | orden completa no comparte un solo resultado | Garantía, partida, reparación | RULE-016 | granularidad de cobertura | Crítica |
| EDGE-034 | Una sucursal recibe y otra entrega | custodia y alcance cambian | Sucursal, orden, entrega | RULE-021 | transferencia y autoridad | Crítica |
| EDGE-035 | Orden transferida entre sucursales | origen, stock, técnico y pagos pueden divergir | Orden, sucursal | RULE-021 | qué se transfiere y qué no | Crítica |
| EDGE-036 | Técnico cambia durante reparación | atribución no puede sobrescribirse | Asignación, intervención | RULE-010 | handoff y responsabilidad | Alta |
| EDGE-037 | Caída de internet | operación puede no confirmarse | Comando, evidencia | RULE-020 | offline permitido y reconciliación | Alta |
| EDGE-038 | Operación duplicada por reintento | podría crear dos pagos o consumos | Pago, inventario, comando | RULE-020 | deduplicación de intención | Crítica |
| EDGE-039 | Evento recibido dos veces | consumidores podrían repetir efectos | Evento, notificación | RULE-020 | idempotencia conceptual | Alta |
| EDGE-040 | Accesorio se devuelve separado | entrega parcial de custodia queda oculta | Accesorio, entrega | RULE-004/015 | entregas parciales e historial | Media |

## Orden sugerido para discovery

Primero resolver EDGE-003/004, EDGE-013/015–020, EDGE-024–026, EDGE-028–035 y EDGE-038. Estos casos cambian límites, estados, autorización o valor; los demás pueden refinarse después sin tratarlos como inexistentes.
