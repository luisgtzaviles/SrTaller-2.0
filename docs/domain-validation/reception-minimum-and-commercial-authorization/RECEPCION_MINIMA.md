# Recepción mínima

## Alcance

Este documento define la información mínima necesaria para crear una orden y distingue datos capturados, contexto generado por el sistema, requisitos configurables y actividades posteriores.

## Decisiones validadas

### RMCA-DEC-001 — Nacimiento de la orden

Una orden nace sólo cuando su creación termina correctamente. Antes de ese resultado no existe una orden formal ni comienza la custodia formal.

### RMCA-DEC-002 — Significado de la orden

Una orden representa un ciclo de servicio y custodia para un dispositivo: comienza con la creación correcta y concluye con la entrega. Puede contener varios trabajos o conceptos durante ese mismo ciclo.

### RMCA-DEC-003 — Datos universales capturados

Para crear una orden deben capturarse:

- nombre del cliente;
- problema reportado.

El nombre y el apellido se conservan como datos separados. El nombre es universalmente obligatorio. La obligatoriedad del apellido no quedó resuelta y debe obedecer una política posterior explícita.

### RMCA-DEC-004 — Contexto universal generado

Toda orden creada debe quedar asociada con:

- tenant;
- sucursal;
- usuario receptor;
- fecha y hora de creación;
- número de orden o folio;
- ubicación inicial de custodia.

Estos valores forman parte del contexto de la creación y no son casillas configurables del formulario.

### RMCA-DEC-005 — Información configurable

La obligatoriedad de los siguientes datos puede configurarse:

- información de contacto;
- marca;
- modelo;
- IMEI o número de serie;
- color;
- señas o características distintivas.

La decisión no define si cada política se administra a nivel tenant, sucursal o mediante precedencia entre ambos.

### RMCA-DEC-006 — Fotografías posteriores

Las fotografías no forman parte del formulario de Nueva Reparación ni son precondición universal de creación. Se toman después de recibir físicamente el dispositivo y después de que la orden existe.

Esta decisión fija el momento relativo, no la cantidad, propósito, retención ni obligatoriedad universal de las fotografías.

## Matriz de recepción

| Información o hecho | Clasificación validada | Antes de crear | Al crear correctamente | Después de crear | Configurable |
|---|---|---:|---:|---:|---:|
| Nombre | requisito universal capturado | Sí | queda registrado | puede corregirse sólo con trazabilidad por definir | No |
| Apellido | requisito pendiente de política | según política | queda registrado si se capturó | por definir | Sí, alcance pendiente |
| Problema reportado | requisito universal capturado | Sí | queda registrado | evoluciona por ampliación/corrección trazable por definir | No |
| Contacto | requisito configurable | según política | queda registrado si aplica | puede completarse según política futura | Sí |
| Marca/modelo | requisito configurable | según política | queda registrado si aplica | puede completarse según política futura | Sí |
| IMEI o serie | requisito configurable | según política | queda registrado si aplica | puede completarse según política futura | Sí |
| Color/señas | requisito configurable | según política | queda registrado si aplica | puede completarse según política futura | Sí |
| Tenant/sucursal | contexto universal del sistema | contexto disponible | asociación obligatoria | permanece atribuible | No |
| Usuario/fecha-hora | contexto universal del sistema | actor autenticado/reloj confiable | atribución obligatoria | permanece en historia | No |
| Folio | identidad generada por el sistema | aún no existe como orden formal | se asigna al éxito | identifica orden y dispositivo | No |
| Ubicación inicial de custodia | contexto universal del sistema | no hay custodia formal | queda determinada | cambia sólo mediante operación trazable futura | No |
| Fotografías | actividad posterior | No | No | según política aún abierta | No como campo mínimo |

## Precondiciones de una creación válida

1. Existe contexto identificable de tenant y sucursal.
2. Existe un usuario receptor atribuible.
3. Se capturó el nombre.
4. Se capturó el problema reportado.
5. Se cumplieron los requisitos configurables aplicables al caso.

## Resultado esperado

Una creación correcta produce una orden identificable, inicia el ciclo formal de custodia y hace posible identificar físicamente el dispositivo con su folio. Las actividades posteriores, como imprimir la etiqueta o tomar fotografías, no retrotraen ni retrasan el inicio formal.

## Ejemplos inválidos

- Crear una orden sin nombre o sin problema reportado.
- Permitir que un checkbox elimine tenant, sucursal, usuario receptor, fecha/hora, folio o ubicación inicial.
- Declarar custodia formal antes de que la creación termine correctamente.
- Bloquear universalmente la creación porque todavía no se tomaron fotografías.
- Tratar la ausencia de IMEI como impedimento universal cuando su obligatoriedad depende de política.
- Usar un único campo ambiguo para mezclar nombre y apellido si después no pueden distinguirse.

## Aspectos no resueltos

La gobernanza y precedencia de la configuración, el criterio exacto del apellido, la captura tardía, la corrección histórica y la política fotográfica se conservan en [Preguntas abiertas](PREGUNTAS_ABIERTAS.md).
