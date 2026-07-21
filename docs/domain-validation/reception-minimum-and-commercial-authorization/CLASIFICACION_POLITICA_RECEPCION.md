# Clasificación de la política de recepción

## Propósito

La política de recepción no es una lista plana de campos obligatorios. Este documento clasifica cada decisión para impedir que una invariante se vuelva configurable o que una preferencia de interfaz se confunda con una regla del negocio.

## Categorías

| Categoría | Pregunta que responde | Autoridad |
|---|---|---|
| Invariante universal | ¿Qué debe cumplirse en toda operación válida? | Producto; no la desactiva tenant ni sucursal |
| Política de tenant | ¿Qué regla común puede adoptar una organización? | Tenant, dentro de invariantes universales |
| Política de sucursal | ¿Qué variación operativa local puede adoptarse? | Sucursal, dentro de tenant e invariantes |
| Requisito condicional | ¿Qué se exige sólo cuando se cumple una condición de negocio? | Política explícita con condición observable |
| Preferencia de interfaz | ¿Cómo se presenta o facilita la captura? | Diseño de producto; no cambia validez del dominio |
| Contexto generado | ¿Qué aporta el sistema y no debe pedir como decisión al receptor? | Operación de la orden |
| Pregunta abierta | ¿Qué autoridad, alcance o excepción aún no está validada? | Propietario indicado en cada pregunta |

## Matriz validada

| Elemento | Clasificación | Universal | Configurable | Alcance confirmado | Observación |
|---|---|---:|---:|---|---|
| Creación correcta de la orden | invariante universal | Sí | No | global | inicia orden y custodia |
| Nombre | requisito universal | Sí | No | global | separado del apellido |
| Apellido | pregunta/política pendiente | No confirmado | Sí | no resuelto | no debe asumirse tenant o sucursal |
| Problema reportado | requisito universal | Sí | No | global | declaración del cliente |
| Contacto | requisito configurable | No | Sí | no resuelto | su condición y alcance siguen abiertos |
| Marca | requisito configurable | No | Sí | no resuelto | no es universal |
| Modelo | requisito configurable | No | Sí | no resuelto | no es universal |
| IMEI o serie | requisito configurable | No | Sí | no resuelto | admite equipos sin identificador disponible |
| Color | requisito configurable | No | Sí | no resuelto | no es universal |
| Señas distintivas | requisito configurable | No | Sí | no resuelto | no es universal |
| Tenant | contexto generado obligatorio | Sí | No | global | no es preferencia de formulario |
| Sucursal | contexto generado obligatorio | Sí | No | global | no es preferencia de formulario |
| Usuario receptor | contexto generado obligatorio | Sí | No | global | debe quedar atribuible |
| Fecha y hora | contexto generado obligatorio | Sí | No | global | debe quedar atribuible |
| Folio | identidad generada obligatoria | Sí | No | global | nace con la orden |
| Ubicación inicial de custodia | contexto generado obligatorio | Sí | No | global | acompaña el inicio de custodia |
| Fotografías en el formulario inicial | exclusión validada | No | No | global | se capturan después de crear |
| Política fotográfica posterior | pregunta abierta | No confirmado | por definir | no resuelto | momento relativo sí está validado |
| Forma visual de captura | preferencia de interfaz | No | Sí | no definido | no puede alterar la semántica anterior |

## Separación entre alcance y obligatoriedad

Que un dato sea configurable no determina dónde vive su política. “Configurable” significa que no es universalmente obligatorio; no significa automáticamente “configurable por tenant” ni concede a una sucursal la facultad de contradecir a su tenant.

Por tanto:

- el alcance tenant/sucursal no se infiere del comportamiento legacy;
- una política de sucursal nunca puede desactivar un requisito universal;
- una preferencia visual nunca puede cambiar la validez de una orden;
- un dato generado por el sistema no debe presentarse como checkbox de obligatoriedad;
- un requisito condicional necesita una condición observable y una consecuencia definida.

## Precedencia

La siguiente secuencia es una **propuesta**, no una decisión aprobada:

1. invariantes universales;
2. política tenant;
3. política sucursal permitida por el tenant;
4. requisito condicional aplicable al caso;
5. preferencia de interfaz.

Faltan validar la herencia, los defaults, la facultad de endurecer o relajar, la vigencia y la historia de cambios.

## Ejemplos de clasificación incorrecta

- Exponer “problema reportado” como opcional por tenant.
- Permitir desactivar el folio porque la impresora no funciona.
- Convertir el color en requisito universal sólo porque el legacy lo muestra.
- Suponer que una sucursal puede relajar toda política del tenant.
- Interpretar una etiqueta, orden visual o ayuda de captura como regla de validez.
- Hacer obligatorias las fotografías antes de crear la orden.

## Relación con el legacy

La [auditoría de configuración de recepción](../../legacy-audit/reception-policy-config/README.md) muestra que el registro actual mezcla campos visibles, defaults y efectos derivados. Esta clasificación es la decisión de dominio validada; no es una recomendación de copiar el mecanismo existente.
