# Escenarios de diagnóstico y recomendación

## Convención

Los escenarios describen negocio, no pasos de interfaz ni pruebas de software. Cuando aparece una iteración o versión se identifica como propuesta documental y no como mecanismo aprobado.

## DTR-ESC-001 — Equipo recuperado únicamente con servicio

| Aspecto | Descripción |
|---|---|
| Situación inicial | equipo bajo custodia, disponible para diagnóstico y con problema reportado |
| Acciones técnicas | revisar, limpiar por humedad, probar funciones y armar |
| Conclusión | quedó funcionando únicamente con servicio |
| Recomendación | no requiere pieza definitiva bajo la información actual |
| Transición comercial | no se crea por inferencia una cotización de pieza |
| Siguiente paso | seguimiento y traslado a segunda revisión |
| Resultado | pendiente de control; todavía no Listo ni Entregado |
| Historia esperada | técnico, conclusión, momento, observaciones relevantes y paso a revisión |
| Inválido | registrar una pieza de prueba como vendida o saltar control de calidad |

## DTR-ESC-002 — Equipo mojado que requiere pantalla

| Aspecto | Descripción |
|---|---|
| Situación inicial | equipo mojado en evaluación técnica |
| Acciones técnicas | limpieza, pruebas y comprobación temporal de pantalla si aporta información |
| Conclusión | el servicio no resuelve; pantalla dañada |
| Recomendación | reemplazar pantalla |
| Transición comercial | seguimiento, segunda revisión y recepción prepara cotización |
| Decisión | todavía pendiente; recomendar no autoriza |
| Resultado | espera decisión comercial bajo custodia |
| Historia esperada | servicio intentado, conclusión y recomendación permanecen distinguibles |
| Inválido | cobrar o instalar pantalla por haberla probado temporalmente |

## DTR-ESC-003 — Pantalla autorizada

| Aspecto | Descripción |
|---|---|
| Situación inicial | conclusión y recomendación de reemplazar pantalla; cotización emitida por recepción |
| Acciones comerciales | cliente acepta el concepto de pantalla |
| Conclusión | pantalla dañada; no cambia por la aceptación |
| Recomendación | reemplazar pantalla |
| Alcance autorizado | reemplazo de pantalla conforme a la propuesta aceptada |
| Acción técnica | técnico ejecuta sólo ese alcance |
| Resultado | trabajo terminado pasa a segunda revisión |
| Historia esperada | recomendación, cotización, decisión y ejecución relacionadas sin confundirse |
| Inválido | presentar la autorización como prueba de diagnóstico o de reparación terminada |

## DTR-ESC-004 — Pantalla autorizada y micrófono descubierto después

| Aspecto | Descripción |
|---|---|
| Situación inicial | pantalla autorizada y reparación en curso |
| Descubrimiento | durante el trabajo el técnico detecta falla adicional de micrófono |
| Conclusión | se conserva la conclusión anterior y se añade la nueva información |
| Recomendación | atender micrófono además del alcance de pantalla ya autorizado |
| Transición comercial | recepción prepara nueva propuesta y contacta al cliente |
| Decisión | pendiente para el micrófono; pantalla conserva su decisión anterior |
| Resultado | el trabajo adicional no comienza todavía |
| Historia esperada | orden única con secuencia de conocimientos, recomendaciones y decisiones |
| Inválido | extender la autorización de pantalla al micrófono o sobrescribir el primer diagnóstico |

## DTR-ESC-005 — Cliente acepta la nueva recomendación

| Aspecto | Descripción |
|---|---|
| Situación inicial | pantalla autorizada y recomendación posterior de micrófono cotizada |
| Acción comercial | cliente acepta el nuevo concepto |
| Conclusión | ambas conclusiones técnicas permanecen en su contexto temporal |
| Recomendación | micrófono queda como recomendación aceptada comercialmente |
| Alcance autorizado | pantalla más micrófono conforme a sus decisiones vigentes |
| Acción técnica | se ejecuta el alcance adicional y continúa el flujo |
| Resultado | después del trabajo, segunda revisión |
| Historia esperada | segunda decisión atribuible sin reemplazar la primera |
| Inválido | consolidar todo en una nota que impida saber cuándo se autorizó cada trabajo |

## DTR-ESC-006 — Cliente rechaza la nueva recomendación

| Aspecto | Descripción |
|---|---|
| Situación inicial | pantalla autorizada; micrófono descubierto y cotizado después |
| Acción comercial | cliente rechaza atender el micrófono |
| Conclusión | la falla de micrófono permanece documentada |
| Recomendación | permanece en historia con decisión negativa |
| Alcance autorizado | sólo pantalla |
| Acción técnica | no se ejecuta trabajo de micrófono |
| Resultado | continúa conforme al alcance permitido y las reglas de seguridad aplicables |
| Historia esperada | rechazo, actor, momento y concepto distinguibles |
| Inválido | borrar micrófono, repararlo o cobrarlo como autorizado |

## DTR-ESC-007 — Reparación irreparable

| Aspecto | Descripción |
|---|---|
| Situación inicial | equipo revisado con acceso y pruebas disponibles |
| Acciones técnicas | evaluación suficiente para sustentar el límite |
| Conclusión | irreparable bajo el alcance y conocimiento disponibles |
| Recomendación | puede no existir reparación recomendada; alternativas quedan abiertas |
| Transición comercial | recepción comunica el resultado y define la siguiente ruta pendiente |
| Decisión | no se inventa autorización ni precio |
| Resultado | estado, custodia y entrega se resuelven por reglas separadas |
| Historia esperada | técnico, momento, razón y límites relevantes |
| Inválido | usar irreparable como sinónimo automático de Entregado o Cierre |

## DTR-ESC-008 — Diagnóstico inconcluso

| Aspecto | Descripción |
|---|---|
| Situación inicial | acceso, evidencia o comportamiento no permiten certeza suficiente |
| Acciones técnicas | pruebas proporcionales y registro de límites relevantes |
| Conclusión | no se pudo determinar con certeza |
| Recomendación | posible siguiente evaluación, acceso o decisión por definir |
| Transición comercial | recepción no presenta como cierta una reparación no sustentada |
| Decisión | depende de opciones futuras todavía abiertas |
| Resultado | puede retomarse si aparece información nueva |
| Historia esperada | incertidumbre, técnico, momento y límites visibles |
| Inválido | elegir una causa para completar el formulario o fingir trabajo terminado |

## DTR-ESC-009 — Múltiples iteraciones diagnósticas

| Aspecto | Descripción |
|---|---|
| Situación inicial | orden con conclusión y decisión comercial previas |
| Acciones técnicas | trabajo, descubrimiento, nueva evaluación y posible corrección posterior |
| Conclusiones | cada resultado permanece contextualizado |
| Recomendaciones | cada nueva necesidad conserva su origen técnico |
| Transición comercial | cada ampliación aplicable vuelve a recepción |
| Decisiones | pueden existir aceptaciones y rechazos distintos dentro de la orden |
| Resultado | un solo ciclo de custodia con evolución trazable |
| Historia esperada | secuencia comprensible sin exigir Event Sourcing |
| Inválido | dejar sólo la última conclusión, recomendación o autorización |

## DTR-ESC-010 — Promoción comercial sin modificar diagnóstico

| Aspecto | Descripción |
|---|---|
| Situación inicial | conclusión de pantalla y centro de carga dañados; ambas reparaciones recomendadas |
| Acción comercial | recepción ofrece $1,000 y $600 o una promoción diferente |
| Conclusión | permanece igual |
| Recomendación | permanece igual salvo nueva evidencia técnica |
| Cotización | puede cambiar por política, promoción o condición comercial |
| Decisión | cliente acepta todo, parte o nada sobre la propuesta vigente |
| Resultado | el alcance autorizado deriva de la decisión comercial |
| Historia esperada | oferta y decisión explicables sin reescribir diagnóstico |
| Inválido | cambiar la causa o componentes dañados para justificar un precio promocional |

## Cobertura

| Tema | Escenarios |
|---|---|
| servicio y piezas temporales | DTR-ESC-001/002 |
| recomendación, cotización y autorización | DTR-ESC-002/003/010 |
| descubrimiento posterior | DTR-ESC-004–006/009 |
| resultados límite | DTR-ESC-007/008 |
| historia y varias decisiones | DTR-ESC-004–006/009 |
