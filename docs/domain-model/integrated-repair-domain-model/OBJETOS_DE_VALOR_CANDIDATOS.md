# Objetos de valor candidatos

## Criterio

**PM:** un objeto de valor candidato expresa significado por sus atributos y reglas, no por identidad propia. La inclusión en esta lista no obliga a crear una clase; algunos pueden ser atributos validados, catálogos o referencias.

## Identidad y organización

| Candidato | Significado y reglas candidatas | No confundir con | Madurez |
|---|---|---|---|
| Folio de orden | referencia legible única en alcance definido | identidad interna o etiqueta física | Fuerte; alcance abierto |
| Identidad de tenant | organización propietaria del dato | hostname o sucursal | Fuerte transversal |
| Identidad de sucursal | unidad operativa dentro del tenant | ubicación interna | Fuerte transversal |
| Identidad de usuario | referencia al actor atribuido | nombre escrito o PIN | Fuerte transversal |
| Momento del evento | instante y contexto temporal | texto de fecha local | Fuerte transversal |

## Personas y contacto

| Candidato | Significado y reglas candidatas | No confundir con | Madurez |
|---|---|---|---|
| Nombre de persona | nombre y apellido diferenciables; nombre obligatorio | identidad completa | Validación parcial |
| Medio de contacto | canal y valor para un propósito | persona/contacto | Candidato fuerte |
| Número telefónico | número normalizado con contexto de país cuando aplique | consentimiento de mensajería | Candidato medio |
| Canal de comunicación | teléfono, mensajería u otro canal permitido | resultado del contacto | Candidato medio |

## Equipo recibido

| Candidato | Significado y reglas candidatas | No confundir con | Madurez |
|---|---|---|---|
| IMEI o serie | identificador observado que puede faltar o repetirse por error | identidad universal infalible | Candidato medio |
| Marca | denominación comercial declarada | fabricante verificado | Candidato débil |
| Modelo | referencia declarada/observada | tipo de equipo | Candidato débil |
| Color | descripción operativa | identificador | Candidato débil |
| Rasgo particular | detalle que ayuda a reconocer físicamente | evidencia completa | Candidato medio |
| Ubicación física | referencia a lugar interno vigente | estado de negocio | Candidato fuerte, quizá entidad/catalogo |
| Condición de custodia | bajo/no bajo custodia y causa | ubicación o estado | Candidato fuerte |

## Técnico y operativo

| Candidato | Significado y reglas candidatas | No confundir con | Madurez |
|---|---|---|---|
| Problema reportado | relato del cliente sobre el motivo | conclusión técnica | Validado |
| Descripción técnica | expresión de observación, conclusión o trabajo con tipo explícito | texto genérico “falla” | Candidato fuerte |
| Resultado diagnóstico | conclusión suficiente, incluso no concluyente | recomendación o precio | Validado conceptualmente |
| Resultado de control de calidad | aprobado/rechazado y observaciones | estado Listo | Validado conceptualmente |
| Estado de orden | fase o condición en catálogo explícito | ubicación, custodia o entrega | Pendiente de catálogo |
| Motivo | explicación estructurada de decisión, excepción o corrección | nota narrativa completa | Candidato fuerte |

## Dinero y autorización

| Candidato | Significado y reglas candidatas | No confundir con | Madurez |
|---|---|---|---|
| Importe monetario | cantidad no negativa/firmada según propósito + moneda | precio o saldo sin contexto | Candidato fuerte |
| Moneda | unidad monetaria aplicable | formato visual | Candidato fuerte |
| Precio | importe ofrecido para un concepto y versión | costo, pago o total autorizado | Candidato fuerte |
| Descuento | ajuste explicado y autorizado | edición silenciosa de precio | Candidato medio |
| Rango de autorización | límites de capacidad para ajustar/aprobar | autorización del cliente | Candidato; política abierta |
| Referencia de pago | referencia externa o interna del movimiento | identidad del pago completo | Candidato medio |
| Medio de pago | efectivo, transferencia u otro catálogo | propósito del movimiento | Candidato medio |

## Decisiones de modelado prudentes

- **DDV:** problema reportado, conclusión técnica, recomendación y trabajo son conceptos diferentes aunque compartan representación textual.
- **PM:** folio, dinero y momento suelen justificar reglas propias; marca, modelo y color quizá no.
- **PA:** estado, ubicación y resultados requieren catálogos definitivos antes de fijar tipos cerrados.
- **RCL:** valores legacy libres, saldos negativos y campos genéricos no deben copiarse sin semántica.
- **PM:** una referencia a persona, tenant, sucursal o ubicación puede ser valor dentro de un agregado sin duplicar su entidad propietaria.
