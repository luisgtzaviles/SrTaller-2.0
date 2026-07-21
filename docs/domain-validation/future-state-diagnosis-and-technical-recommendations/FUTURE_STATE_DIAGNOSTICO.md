# Estado futuro del diagnóstico técnico

## Alcance y autoridad

Este documento conserva el flujo diagnóstico validado y propone una forma de describirlo sin diseñar software. Los nombres de fase y sus relaciones son documentales; no constituyen una máquina de estados ni una interfaz.

## Decisiones validadas

### DTR-DEC-001 — Actor técnico principal

El técnico realiza el diagnóstico y normalmente también realiza la reparación. “Normalmente” describe la operación, no una prohibición de que personas distintas diagnostiquen y reparen.

### DTR-DEC-002 — Revisión suficiente del equipo

Antes de emitir su conclusión, el técnico revisa completamente el equipo en el alcance que el caso y el acceso disponible permitan. Qué significa “completamente” por tipo de dispositivo o falla sigue abierto.

### DTR-DEC-003 — Pruebas como proceso interno

El técnico no registra un hallazgo por cada prueba. Las comprobaciones individuales forman parte del proceso interno de razonamiento y sólo necesitan elevarse cuando aportan valor operativo, sustentan la conclusión o documentan una excepción relevante.

### DTR-DEC-004 — Acciones diagnósticas permitidas

Según el caso, el técnico puede:

- desmontar el equipo;
- limpiar por humedad;
- probar piezas temporalmente;
- realizar pruebas funcionales;
- volver a armar el equipo.

Estas acciones no prueban por sí solas que exista reparación concluida, pieza instalada, consumo, venta o autorización comercial.

### DTR-DEC-005 — Pieza temporal no vendida

Una pieza usada para prueba diagnóstica no se considera automáticamente instalada, vendida, consumida ni autorizada. La prueba sólo aporta información técnica.

### DTR-DEC-006 — Resultado relevante para negocio

El producto operativo principal del diagnóstico es la conclusión técnica. Las pruebas apoyan esa conclusión, pero no se convierten necesariamente en una lista exhaustiva de hechos visibles.

### DTR-DEC-007 — Baja fricción

La operación privilegia rapidez y baja fricción. Se registra la información necesaria para ejecutar, explicar y trazar el trabajo, sin exigir decenas de hallazgos que no aportan valor.

### DTR-DEC-008 — Criterio humano de conclusión

El diagnóstico termina cuando el técnico considera que posee información suficiente para emitir una conclusión y, cuando corresponda, una recomendación. Los criterios objetivos mínimos y las excepciones permanecen abiertos.

## Recorrido futuro conceptual

| Momento | Acción técnica | Resultado de negocio | No implica |
|---|---|---|---|
| disponibilidad | el técnico recibe contexto de la orden y acceso permitido | evaluación puede comenzar | diagnóstico ya iniciado por escaneo |
| revisión | inspecciona, desmonta, limpia o prueba según necesidad | obtiene información suficiente o identifica límites | captura obligatoria de cada prueba |
| conclusión | explica qué determinó y con qué nivel de certeza | resultado diagnóstico atribuible | precio o autorización |
| recomendación | señala trabajo o componentes que conviene realizar | entrada técnica para recepción | cotización emitida |
| servicio resuelto | el equipo funciona sólo con servicio | armado, seguimiento y segunda revisión | venta automática de piezas |
| requiere piezas | identifica componentes recomendados | segunda revisión y preparación comercial | alcance autorizado |
| descubrimiento posterior | durante trabajo autorizado aparece otra falla | nueva conclusión y recomendaciones dentro de la orden | extensión automática de autorización |

## Entrada de la fase

La fase recibe una orden existente, un equipo bajo custodia y el contexto permitido de recepción. FSR-EVENT-025, equipo disponible para diagnóstico, es una frontera compatible, no prueba que el técnico ya comenzó a evaluar.

## Salidas posibles

- conclusión de que quedó únicamente con servicio;
- conclusión de que requiere piezas;
- reparación no recomendable;
- irreparable;
- no se pudo determinar con certeza;
- descubrimiento posterior que requiere una nueva decisión técnica y comercial.

Las salidas se detallan en [Resultados del diagnóstico](RESULTADOS_DEL_DIAGNOSTICO.md).

## Propuesta de fase explícita

### DTR-PROP-001 — Diagnóstico como fase distinguible

Tratar diagnóstico como fase distinguible de recepción, reparación, segunda revisión y cotización es una propuesta de organización futura. La separación semántica está validada; su representación, estados y mecanismo no lo están.

## Límites

- No se prescribe un formulario de pruebas.
- No se exige registrar cada desmontaje o comprobación.
- No se decide si existen plantillas por dispositivo.
- No se asigna precio a una conclusión.
- No se decide cómo almacenar imágenes, mediciones o texto.
- No se convierte el flujo en Event Sourcing.
