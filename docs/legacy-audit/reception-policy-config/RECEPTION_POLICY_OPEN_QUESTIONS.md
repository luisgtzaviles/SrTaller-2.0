# Preguntas abiertas

**Estado:** `Pending Product Owner validation`.
**Uso:** resolver semántica y autoridad antes de diseñar el mecanismo futuro. Las preguntas no implican que la respuesta deba convertirse en un campo.

## Identidad

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-001` | ¿Qué identidad mínima del cliente o contacto debe existir antes de crear una orden? | Legacy fija nombre, pero eso no demuestra que sea el invariante correcto. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-002` | ¿Cliente, contacto y persona que entrega pueden ser personas distintas? | Legacy sólo conserva cliente nombrado y no modela entregante. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-003` | ¿Cuándo puede reutilizarse un cliente maestro y qué dato evita confundir homónimos? | Sin teléfono, el dedupe legacy usa nombre normalizado. | `Pending operations validation` |
| `LEGACY-RPC-Q-004` | ¿Se permite una recepción con identidad desconocida y, si sí, bajo qué autoridad? | No existe excepción trazable; nombre es fijo. | `Pending Product Owner validation` |

## Contacto

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-005` | ¿Debe existir al menos un canal de contacto, aunque no sea teléfono? | Legacy sólo configura teléfono y admite vacío. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-006` | ¿Cuándo el teléfono se vuelve obligatorio por notificación, promesa o autorización? | No hay condición asociada al uso posterior. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-007` | ¿Qué debe registrarse si el cliente no tiene o no desea proporcionar teléfono? | Empty no distingue ausencia, negativa o error. | `Pending operations validation` |
| `LEGACY-RPC-Q-008` | ¿Quién decide defaults regionales de código país y cómo se evita asumir México? | El panel siempre envía `52`. | `Pending Product Owner validation` |

## Dispositivo

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-009` | ¿Qué combinación mínima identifica suficientemente el objeto bajo custodia? | Marca, modelo, IMEI, color y rasgos pueden ser opcionales. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-010` | ¿Qué sustituto o razón se acepta cuando IMEI/serie no existe o no es accesible? | Legacy sólo bloquea o permite vacío. | `Pending operations validation` |
| `LEGACY-RPC-Q-011` | ¿Qué accesorios deben inventariarse además de chip y memoria? | Cargador, funda, tarjetas u otros no están representados. | `Pending operations validation` |
| `LEGACY-RPC-Q-012` | ¿“Recibido encendido/apagado” describe condición, acceso o una prueba realizada? | La columna guarda sí/no bajo un nombre ambiguo. | `Pending Product Owner validation` |

## Custodia

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-013` | ¿Qué efectos exactos nacen junto con orden y custodia en el commit exitoso? | La frontera está confirmada, pero sus efectos completos no. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-014` | ¿Qué debe ocurrir físicamente si la creación falla después de recibir el equipo en mostrador? | No debe quedar equipo sin orden; falta protocolo de recuperación. | `Pending operations validation` |
| `LEGACY-RPC-Q-015` | ¿`En Tienda` representa ubicación, responsable o estado de custodia? | Legacy usa un literal ambiguo en `entregado`. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-016` | ¿Qué actor estable y qué sucursal deben atribuirse cuando un usuario cambia de ubicación o cubre otra sucursal? | Legacy usa nombre y contexto de sesión al guardar. | `Pending Product Owner validation` |

## Evidencia

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-017` | ¿Cuándo es obligatoria evidencia antes de crear y cuándo puede quedar pendiente? | Fotos legacy sólo existen después de la orden. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-018` | ¿Qué condición o riesgo dispara evidencia adicional? | No hay reglas daño/riesgo→evidencia. | `Pending operations validation` |
| `LEGACY-RPC-Q-019` | ¿Cómo se distingue evidencia tomada al recibir de una agregada horas después? | Seguimiento posterior no prueba momento inicial por sí solo. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-020` | ¿Qué datos personales pueden aparecer en imágenes y qué retención es aceptable? | Captura del equipo puede exponer información privada. | `Pending security review` |

## Riesgo

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-021` | ¿Quién identifica un riesgo y con qué catálogo o descripción? | Legacy mezcla fallback y catálogo por scope. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-022` | ¿Identificar riesgo, comunicarlo y obtener una decisión son hechos separados? | “Aceptó riesgo de” sólo guarda un valor. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-023` | ¿Qué prueba de aceptación o negativa se requiere y quién puede otorgarla? | No hay actor, texto, versión o momento. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-024` | ¿Cuándo `no_aplica` puede ser default y cuándo debe ser una decisión explícita? | El default satisface silenciosamente el backend. | `Pending operations validation` |

## Credencial y acceso

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-025` | ¿Es necesario recibir una credencial para aceptar custodia o sólo para tareas posteriores? | Legacy la condiciona al tipo de bloqueo durante alta. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-026` | ¿Cómo se documenta “cliente no autoriza”, “no conoce” o “acceso posterior”? | Sólo existen PIN, patrón y no tiene. | `Pending operations validation` |
| `LEGACY-RPC-Q-027` | ¿Quién puede consultar la credencial, para qué propósito y hasta cuándo? | Se guarda en una columna y el detalle la consume. | `Pending security review` |
| `LEGACY-RPC-Q-028` | ¿Puede evitarse conservar el secreto o reducir su exposición sin impedir el trabajo autorizado? | El mecanismo legacy no muestra minimización/ciclo de vida. | `Pending security review` |

## Tiempo

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-029` | ¿Promesa de entrega es compromiso, estimación o dato informativo? | `datetime-local` no declara semántica. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-030` | ¿Cuándo puede ofrecerse una promesa y quién está autorizado? | Required absoluto no depende de capacidad/diagnóstico. | `Pending operations validation` |
| `LEGACY-RPC-Q-031` | ¿Qué zona horaria gobierna recepción y promesa cuando usuario, tenant y sucursal difieren? | Legacy usa config de sucursal con fallback. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-032` | ¿Cómo se registra una revisión de la promesa y qué se comunica al cliente? | Sólo se observa un valor inicial sin historia en este alcance. | `Pending Product Owner validation` |

## Dinero

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-033` | ¿El anticipo puede ser condición para crear la orden/iniciar custodia? | Legacy crea primero y registra pago después. | `Pending finance review` |
| `LEGACY-RPC-Q-034` | ¿Qué ocurre si el pago falla después del commit de orden? | No hay reversa automática en el flujo. | `Pending finance review` |
| `LEGACY-RPC-Q-035` | ¿Qué método, moneda, caja, usuario y comprobante deben confirmar un anticipo? | Legacy usa monto y método default `Anticipo`. | `Pending finance review` |
| `LEGACY-RPC-Q-036` | ¿Presupuesto inicial es rango, estimación, cotización o autorización? | Se guarda como dígitos sin semántica monetaria completa. | `Pending finance review` |

## Alcance tenant/sucursal

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-037` | ¿Qué reglas puede cambiar tenant y cuáles nunca deberían ser configurables? | Intención de producto permite sólo parte de la política. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-038` | ¿Qué autonomía tiene una sucursal frente a tenant y con qué límites? | Legacy permite override total de lista. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-039` | ¿Debe una sucursal heredar cambios tenant automáticamente si ya guardó? | Save actual congela una copia efectiva. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-040` | ¿Existe un nivel corporativo/global real además del tenant? | Esquema permite cadena vacía, pero resolver no lee global. | `Pending Product Owner validation` |

## Permisos

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-041` | ¿Qué autoridad de negocio puede cambiar una Política de Recepción? | Los nombres de rol activos son desconocidos. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-042` | ¿Quién puede aceptar custodia y crear una orden? | Endpoint de alta no pide permiso funcional específico. | `Pending security review` |
| `LEGACY-RPC-Q-043` | ¿Leer la política y editarla requieren capacidades distintas? | GET sólo exige sesión/contexto; POST exige permiso. | `Pending security review` |
| `LEGACY-RPC-Q-044` | ¿Una sucursal puede solicitar una excepción sin permiso para cambiar la política general? | Legacy sólo permite cambiar required para todas las altas del scope. | `Pending Product Owner validation` |

## Cambios y vigencia

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-045` | ¿Cuándo entra en vigor un cambio: al guardar, al abrir formulario o en la siguiente orden? | Frontend y backend pueden usar snapshots distintos. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-046` | ¿Qué ocurre con una recepción ya iniciada cuando la política se endurece? | Legacy devuelve error tardío sin tratamiento específico. | `Pending operations validation` |
| `LEGACY-RPC-Q-047` | ¿Qué historial, actor, motivo y aprobación deben conservarse por cambio? | Sólo existen timestamps de fila. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-048` | ¿Debe poder reconstruirse la política aplicada a una orden histórica? | La orden no guarda versión/referencia. | `Pending Product Owner validation` |

## UI y modo de captura

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-049` | ¿“Opcional” debe significar vacío, oculto, diferido, derivado o no aplicable? | Legacy sólo quita no-vacío y mantiene visible. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-050` | ¿Qué procedencia debe mostrar “configuración efectiva”: sistema, tenant o sucursal? | Panel descarta `layers`. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-051` | ¿“Restaurar defaults” debe deshacer, usar sistema o volver a heredar tenant? | Legacy sólo cambia memoria y luego guarda override. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-052` | ¿Un modo guiado puede cambiar orden/ayuda sin cambiar criterios de aceptación? | V2 no existe; política y modo comparten JSON. | `Pending Product Owner validation` |

## Excepciones

| ID | Pregunta | Motivo | Estado |
|---|---|---|---|
| `LEGACY-RPC-Q-053` | ¿Qué requisitos admiten excepción por caso y cuáles son invariantes? | Legacy sólo cambia la sucursal completa. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-054` | ¿Quién autoriza una excepción y qué motivo/evidencia debe aportar? | No hay actor ni registro de excepción. | `Pending Product Owner validation` |
| `LEGACY-RPC-Q-055` | ¿Una excepción permite crear la orden con pendiente o debe rechazar la recepción física? | La frontera de custodia vuelve crítica esta decisión. | `Pending operations validation` |
| `LEGACY-RPC-Q-056` | ¿Cómo caduca una excepción y cómo se evita debilitar la política de futuras recepciones? | Desmarcar required afecta todas las altas hasta otro cambio. | `Pending Product Owner validation` |

## Orden sugerido de resolución

1. Definir la frontera y los invariantes de custodia (`Q-013` a `Q-016`).
2. Definir identidad mínima del cliente y objeto (`Q-001` a `Q-012`).
3. Resolver riesgo, evidencia y acceso con Seguridad (`Q-017` a `Q-028`).
4. Resolver tiempo y dinero (`Q-029` a `Q-036`).
5. Acordar alcance, autoridad, vigencia y excepción (`Q-037` a `Q-056`).

El orden es una recomendación de conversación, no una decisión aprobada.
