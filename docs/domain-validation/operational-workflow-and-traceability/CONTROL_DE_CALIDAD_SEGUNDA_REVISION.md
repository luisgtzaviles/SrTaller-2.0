# Control de calidad y segunda revisión

## Hechos validados

### FOT-DEC-021 — Filtro independiente

La segunda revisión ocurre después de un servicio exitoso o una reparación terminada y funciona como filtro distinto del trabajo técnico.

### FOT-DEC-022 — Actor operativo en Avicell

En Avicell normalmente la realiza recepción o el recepcionista en turno. La persona revisa que la reparación no presente fallas antes de notificar al cliente.

### FOT-DEC-023 — Resultado obligatorio

La segunda revisión produce un resultado atribuible:

- aprobada: habilita marcar Listo;
- rechazada: devuelve el equipo a Taller.

Un comentario libre no debe ser la única representación del resultado.

## Información mínima del control

Debe poder conocerse:

- quién revisó;
- fecha y hora;
- resultado;
- observaciones;
- pruebas realizadas, cuando aplican;
- orden y trabajo revisados;
- contexto tenant/sucursal;
- iteración, si hubo más de una.

## Tipos que deben distinguirse

| Tipo | Pregunta | Estado |
|---|---|---|
| Revisión técnica | ¿El trabajo y componentes cumplen criterios técnicos? | alcance pendiente |
| Revisión funcional | ¿Las funciones acordadas operan correctamente? | práctica validada en general |
| Revisión cosmética | ¿La condición externa posterior es aceptable/documentada? | alcance pendiente |
| Revisión frente al cliente | ¿El resultado funciona al presentarlo antes de entregar? | hecho validado de entrega |

No se decide si son controles separados, criterios de una misma revisión o plantillas por tipo.

## Flujo

| Situación | Acción de revisión | Resultado | Estado | Ubicación | Custodia |
|---|---|---|---|---|---|
| servicio exitoso | recepción prueba | aprueba | Listo | listos | continúa |
| reparación terminada | recepción prueba | aprueba | Listo | listos | continúa |
| cualquier trabajo terminado | revisor detecta falla | rechaza | no puede permanecer Listo | taller | continúa |
| equipo Listo frente al cliente | falla antes de entregar | revisión/rechazo contextual | vuelve a trabajo | taller | continúa |

## Independencia del revisor

### FOT-PROP-012 — Revisor distinto

Que la segunda revisión la haga una persona distinta del técnico ejecutor cuando la operación lo permita es una propuesta/política candidata. El segundo filtro está validado; la independencia universal no.

Debe resolverse:

- si un taller de una sola persona puede auto-revisar con controles adicionales;
- qué reparaciones exigen especialidad técnica;
- si recepción puede aprobar cualquier tipo;
- qué excepciones requieren supervisor.

## Varias iteraciones

Cada rechazo y nueva aprobación debe conservarse. La última aprobación puede determinar la condición vigente, pero no borra:

- revisión fallida;
- fallas detectadas;
- técnico o técnicos que corrigieron;
- pruebas realizadas;
- tiempo y actor de cada ciclo.

## Precondición de Listo

### Precondición de Listo en Avicell

FOT-INV-006 establece que, en Avicell, aprobar segunda revisión es precondición validada para marcar Listo. Como regla universal para otros tenants se clasifica como propuesta hasta validar excepciones y política.

### Rechazo incompatible con Listo

FOT-INV-007 establece que, en el flujo validado, una revisión rechazada no puede dejar el equipo como Listo. Debe retornar a Taller o quedar en una situación explícita distinta.

## Ejemplos inválidos

- Marcar Listo sólo porque el técnico terminó.
- Usar el campo legacy revisor como prueba de segunda revisión.
- Aprobar sin actor, resultado o momento.
- Rechazar en comentario y conservar Listo.
- Sobrescribir la primera revisión fallida con una aprobación posterior.
- Notificar al cliente antes de completar el filtro requerido.

## Preguntas relacionadas

Criterios, plantillas, evidencia fotográfica, independencia, permisos y tipos de equipo permanecen en [Preguntas abiertas](PREGUNTAS_ABIERTAS.md).
