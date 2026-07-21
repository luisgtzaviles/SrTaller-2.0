# Decisiones consolidadas

## Propósito

Este registro normaliza los 117 principios suministrados para la consolidación. No reemplaza los IDs fuente; `IDM-DEC-*` es sólo un índice maestro. Las reglas contextuales y configurables conservan esa clasificación y no se elevan a universales.

## Orden y ciclo de servicio

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-001 | Una Orden de Servicio representa un único ciclo desde creación exitosa hasta entrega. | DDV | RMCA-DEC-001/002/009 |
| IDM-DEC-002 | El regreso posterior del mismo equipo crea nueva orden y ciclo. | DDV | RMCA-DEC-009; RMCA-INV-010 |
| IDM-DEC-003 | Una orden admite múltiples intervenciones, diagnósticos, recomendaciones, cotizaciones, decisiones, pagos y ciclos QC. | DDV | RMCA-INV-009; DTR/FOT |
| IDM-DEC-004 | La orden no representa permanentemente al dispositivo ni un trabajo fijo. | DDV | RMCA-DEC-002 |
| IDM-DEC-005 | La identidad de la orden permanece durante su ciclo. | DDV | RMCA-DEC-009/013 |

## Recepción y custodia

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-006 | La custodia comienza con la creación exitosa de la orden. | DDV | RMCA-DEC-007 |
| IDM-DEC-007 | Antes de ese éxito no existe custodia formal aceptada. | DDV | RMCA-DEC-007 |
| IDM-DEC-008 | La entrega válida termina custodia. | DDV | RMCA-DEC-008; FOT-DEC-010 |
| IDM-DEC-009 | Marcar Listo no termina custodia. | DDV | RMCA-DEC-008; FOT |
| IDM-DEC-010 | Marcar No quedó no termina custodia. | DDV | RMCA-DEC-008; FOT |
| IDM-DEC-011 | El nombre del cliente operativo es obligatorio. | DDV | RMCA-DEC-003 |
| IDM-DEC-012 | Nombre y apellido son conceptos separados. | DDV | RMCA-DEC-003 |
| IDM-DEC-013 | El nombre es universalmente obligatorio. | DDV | RMCA-DEC-003; RMCA-INV-003 |
| IDM-DEC-014 | La obligatoriedad del apellido es configurable o permanece pendiente. | PC/PA | RMCA-DEC-003/005 |
| IDM-DEC-015 | El problema reportado es obligatorio. | DDV | RMCA-DEC-014/015 |
| IDM-DEC-016 | El problema reportado no equivale al diagnóstico. | DDV | RMCA-INV-011 |
| IDM-DEC-017 | Contacto, marca, modelo, IMEI, color y rasgos pueden depender de política. | PC | RMCA-DEC-005 |
| IDM-DEC-018 | Tenant, sucursal, receptor, fecha, hora y folio son contexto generado. | DDV | RMCA-DEC-004 |
| IDM-DEC-019 | Las fotografías se toman después de creada la orden. | HOV/DDV | RMCA-DEC-006 |

## Identificación física

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-020 | Todo equipo bajo custodia permanece identificado con el folio. | DDV | RMCA-DEC-010; RMCA-INV-005 |
| IDM-DEC-021 | La identificación permanece adherida durante el ciclo. | DDV | RMCA-DEC-012 |
| IDM-DEC-022 | El medio normal puede ser etiqueta impresa. | HOV | RMCA-DEC-011 |
| IDM-DEC-023 | Ante falla de impresora puede escribirse el folio manualmente. | DDV | RMCA-DEC-011 |
| IDM-DEC-024 | La disponibilidad de impresora no es invariante. | DDV | RMCA-INV-006 |
| IDM-DEC-025 | Reimprimir no cambia identidad de orden. | DDV | RMCA-DEC-013; RMCA-INV-008 |

## Cliente, contacto, propiedad y entregante

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-026 | Cliente operativo es la persona a cuyo nombre se deja la orden. | HOV/DDV | RMCA/Current State |
| IDM-DEC-027 | Contacto recibe notificaciones y puede diferir del cliente. | DDV | Current State/FOT |
| IDM-DEC-028 | La persona que entrega físicamente puede ser distinta. | DDV | RMCA/Current State |
| IDM-DEC-029 | La propiedad legal del equipo no se verifica necesariamente. | HOV | Current State |
| IDM-DEC-030 | Cliente igual a propietario es suposición práctica, no verdad universal. | IDO/RCL | auditorías legacy y lenguaje |
| IDM-DEC-031 | La entrega a un tercero es posible bajo reglas y excepciones documentadas. | HOV/PC | FOT; regla exacta PA |

## Diagnóstico y trabajo técnico

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-032 | El técnico diagnostica y normalmente también repara. | HOV | DTR-DEC-001/033 |
| IDM-DEC-033 | El técnico revisa globalmente el equipo. | DDV | DTR-DEC-002 |
| IDM-DEC-034 | No se exige registrar cada prueba como hallazgo estructurado. | DDV | DTR-DEC-003/007 |
| IDM-DEC-035 | Las pruebas individuales forman parte del diagnóstico. | DDV | DTR-DEC-003 |
| IDM-DEC-036 | El resultado importante es una conclusión suficiente para operar. | DDV | DTR-DEC-006/009 |
| IDM-DEC-037 | Puede desmontar, limpiar humedad, probar funciones y usar piezas temporales. | HOV/DDV | DTR-DEC-004 |
| IDM-DEC-038 | Una pieza de prueba no equivale a pieza vendida/instalada. | DDV | DTR-DEC-005 |
| IDM-DEC-039 | El diagnóstico determina necesidad técnica, no precio. | DDV | DTR-DEC-012/013 |
| IDM-DEC-040 | Conclusión y recomendación son conceptos distintos. | DDV | DTR-DEC-009/014 |
| IDM-DEC-041 | Recomendación y cotización son conceptos distintos. | DDV | DTR-DEC-015/025/026 |
| IDM-DEC-042 | Una orden puede contener múltiples iteraciones diagnósticas. | DDV | DTR-DEC-019/020/024 |
| IDM-DEC-043 | Pueden descubrirse problemas tras autorización o reparación inicial. | DDV | DTR-DEC-019 |
| IDM-DEC-044 | Diagnósticos y recomendaciones anteriores no se borran/sobrescriben. | DDV | DTR-DEC-023 |
| IDM-DEC-045 | Sólo se ejecutan trabajos autorizados, salvo excepción pendiente. | DDV/PA | DTR-DEC-029 |
| IDM-DEC-046 | Los resultados incluyen servicio suficiente, piezas, especialista, no recomendable, irreparable o no concluyente. | DDV | DTR-DEC-037 a 041 |
| IDM-DEC-047 | No se impone prioridad técnica obligatoria si causa fricción. | DDV | DTR-DEC-018 |
| IDM-DEC-048 | Distinguir necesidad, recomendación o riesgo es evolución futura posible. | PM | DTR-PROP-005 |

## Flujo operativo

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-049 | Tras recepción, el equipo se coloca en pendientes. | HOV/RCA | FOT-DEC-001/024 |
| IDM-DEC-050 | El técnico toma el equipo, escanea y consulta la orden. | HOV | FOT-DEC-002 |
| IDM-DEC-051 | Escanear abre contexto; no cambia estado necesariamente. | HOV/DDV | FOT-DEC-002 |
| IDM-DEC-052 | Si queda con servicio, se arma, documenta y pasa a segunda revisión. | HOV/RCA | FOT-DEC-004 |
| IDM-DEC-053 | Si requiere piezas, se concluye/recomienda y pasa al flujo comercial validado. | HOV/DDV | FOT-DEC-005; DTR |
| IDM-DEC-054 | Recepción comunica la propuesta. | HOV | FOT-DEC-013; DTR-DEC-025 |
| IDM-DEC-055 | Si el cliente autoriza, el equipo vuelve a Taller. | HOV | FOT-DEC-007 |
| IDM-DEC-056 | Si rechaza, se registra y puede marcarse No quedó bajo custodia. | HOV/DDV | FOT-DEC-006 |
| IDM-DEC-057 | Reparación terminada pasa a segunda revisión. | HOV | FOT-DEC-008 |
| IDM-DEC-058 | Segunda revisión aprobada habilita Listo. | DDV/HOV | FOT-DEC-009/023 |
| IDM-DEC-059 | Segunda revisión rechazada devuelve a Taller. | HOV | FOT-DEC-008/023 |
| IDM-DEC-060 | Un equipo Listo puede volver a Taller si falla antes de entrega. | HOV/DDV | FOT-DEC-009 |
| IDM-DEC-061 | Puede haber múltiples ciclos Taller → QC → Taller. | HOV/DDV | FOT flujo/escenarios |

## Estado, ubicación, custodia y responsabilidad

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-062 | Estado, ubicación, custodia, asignación y responsabilidad son distintos. | DDV | FOT-DEC-011 |
| IDM-DEC-063 | Un equipo puede estar Listo y En tienda. | DDV/HOV | FOT estado/ubicación |
| IDM-DEC-064 | En espera de autorización es estado, no ubicación. | DDV | FOT |
| IDM-DEC-065 | Caja de listos es ubicación, no estado. | DDV/RCA | FOT-DEC-024/025 |
| IDM-DEC-066 | Entregado es fin de custodia/salida, no ubicación interna ordinaria. | DDV | FOT-PROP-003; RMCA |
| IDM-DEC-067 | Técnico asignado no implica posesión física. | DDV | FOT modelo asignación |
| IDM-DEC-068 | Ubicación puede cambiar sin estado. | DDV | FOT-DEC-025 |
| IDM-DEC-069 | Estado no prueba movimiento físico. | DDV | FOT-DEC-025 |
| IDM-DEC-070 | El modelo debe permitir detectar divergencias de dimensiones. | PM | FOT-PROP-002 |

## Roles y responsabilidad operativa

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-071 | Recibir, diagnosticar, reparar, revisar, notificar, cobrar y entregar pueden recaer en personas distintas. | DDV | FOT-DEC-014/015 |
| IDM-DEC-072 | El técnico produce información técnica. | DDV | FOT-DEC-013; DTR-DEC-032 |
| IDM-DEC-073 | Recepción/atención gestiona comunicación, cotización, autorización, notificación y entrega. | HOV | FOT-DEC-013 |
| IDM-DEC-074 | En Avicell, segunda revisión normalmente la realiza recepción. | RCA | FOT-DEC-022 |
| IDM-DEC-075 | Un equipo puede pasar por varios técnicos. | DDV | FOT-DEC-026 |
| IDM-DEC-076 | Se preserva historial de asignaciones y participaciones. | DDV | FOT-DEC-027 |
| IDM-DEC-077 | Técnico resumen no borra otras participaciones. | DDV | FOT-DEC-028 |
| IDM-DEC-078 | Debe responderse quién realizó cada participación relevante. | DDV | FOT-DEC-015/020 |

## Trazabilidad y autenticación

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-079 | SR Taller 1.0 usa PIN de cuatro dígitos y cierre por inactividad. | HOV/RCA | FOT-DEC-018/019 |
| IDM-DEC-080 | PIN aporta atribución operativa, no identidad absoluta. | DDV/HOV | FOT-DEC-018 |
| IDM-DEC-081 | Acción relevante registra actor, fecha, hora, tenant, sucursal y contexto. | DDV | FOT-DEC-017/020 |
| IDM-DEC-082 | Se distinguen evento estructurado, nota narrativa y actividad automática. | DDV | FOT-DEC-016 |
| IDM-DEC-083 | Nota no sustituye autorización, entrega, anticipo ni QC estructurado. | DDV | FOT eventos/notas |
| IDM-DEC-084 | UI puede mostrar “recibió”, “reparó”, “revisó” y “entregó”. | IDO | FOT-PROP-007/008 |
| IDM-DEC-085 | Esos resúmenes son proyecciones del historial. | PM | FOT-PROP-007/018 |
| IDM-DEC-086 | El modelo no prescribe Event Sourcing. | DDV de alcance | especificación del paquete |

## Segunda revisión

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-087 | Segunda revisión es QC independiente del trabajo técnico. | DDV | FOT-DEC-021 |
| IDM-DEC-088 | Busca detectar fallas antes de notificar. | DDV/HOV | FOT-DEC-021 |
| IDM-DEC-089 | Registra revisor, momento, resultado y observaciones. | DDV | FOT-DEC-023 |
| IDM-DEC-090 | El resultado no existe sólo como comentario libre. | DDV | FOT-DEC-023 |
| IDM-DEC-091 | Independencia obligatoria del revisor permanece política/pregunta. | PC/PA | FOT-PROP-012 |

## Modelo comercial

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-092 | “Presupuesto inicial” legacy puede representar autorización comercial inicial. | IDO/RCA | RMCA-DEC-016 |
| IDM-DEC-093 | En Avicell: humedad $350 sólo si resuelve; pantalla $1,000 sustituye ese cobro. | RCA | RMCA-DEC-018 |
| IDM-DEC-094 | La absorción es contextual, no universal. | RCA/PC | RMCA-DEC-025 |
| IDM-DEC-095 | Se contemplan variantes configurables de cobro/absorción. | PC | RMCA-POL-001 a 005 |
| IDM-DEC-096 | Una cotización puede contener múltiples conceptos. | DDV | RMCA-DEC-019 |
| IDM-DEC-097 | Las decisiones se registran por concepto. | DDV | RMCA-DEC-020 |
| IDM-DEC-098 | Una cotización puede quedar parcialmente autorizada. | DDV | RMCA-DEC-021 |
| IDM-DEC-099 | Trabajo ofrecido y rechazado permanece en historia. | DDV | RMCA-DEC-022 |
| IDM-DEC-100 | Total autorizado deriva de conceptos autorizados y política. | DDV | RMCA-DEC-024; RMCA-INV-014 |
| IDM-DEC-101 | Recepción puede aplicar promociones o paquetes. | RCA/PC | RMCA política comercial |
| IDM-DEC-102 | Avicell ofrece dos flex de $500 por $800. | RCA | decisión aportada por PO |
| IDM-DEC-103 | El precio combinado no modifica diagnóstico. | DDV | DTR/RMCA |
| IDM-DEC-104 | La operación actual permite ajustes manuales. | HOV/RCA | validación PO |
| IDM-DEC-105 | Futuro recomendado: promociones + ajuste autorizado y trazable. | PM/PC | RMCA propuestas |

## Anticipos y pagos

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-106 | Anticipo es hecho financiero relacionado con la orden. | DDV | FOT-DEC-029 |
| IDM-DEC-107 | Conserva monto, moneda, usuario, fecha, hora, sucursal y medio conocido. | DDV | FOT-DEC-030 |
| IDM-DEC-108 | Puede haber múltiples anticipos. | DDV | FOT-DEC-031 |
| IDM-DEC-109 | Anticipo no es campo mutable aislado. | DDV/RCL | FOT-DEC-029/031 |
| IDM-DEC-110 | Correcciones/devoluciones/anulaciones no borran original. | DDV | FOT-DEC-032 |
| IDM-DEC-111 | Integración completa con Caja/contabilidad pertenece a paquetes posteriores. | PA/decisión de alcance | FOT |

## Entrega

| ID | Decisión consolidada | Clasificación | Fuente principal |
|---|---|---|---|
| IDM-DEC-112 | La entrega termina custodia. | DDV | RMCA-DEC-008; FOT-DEC-010 |
| IDM-DEC-113 | Quien entrega puede diferir de receptor, revisor o notificador. | DDV | FOT-DEC-014/015 |
| IDM-DEC-114 | Antes de entregar se verifica el equipo frente al cliente/receptor. | HOV | FOT flujo validado |
| IDM-DEC-115 | Se completa el cobro conforme a política. | HOV/PC | FOT-DEC-010 |
| IDM-DEC-116 | Se registra quién entregó y observaciones relevantes. | DDV | FOT-DEC-010/020 |
| IDM-DEC-117 | Una orden no se considera entregada por existir un comentario. | DDV | FOT eventos/notas |

## Gobierno

Las decisiones DDV no deben reabrirse sin evidencia de contradicción y autoridad suficiente. Las filas HOV/RCA deben mantenerse dentro de su contexto operativo. Las filas PC/PA/PM requieren validación antes de orientar implementación.
