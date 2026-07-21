# Preguntas abiertas

## Regla

Estas preguntas no reducen la autoridad de las decisiones validadas. Delimitan aquello que todavía no puede convertirse en regla, criterio de aceptación o diseño sin una respuesta adicional.

## Recepción y configuración

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| RMCA-PREG-001 | ¿En qué casos el apellido es obligatorio? | Product Owner + Operaciones | recepción mínima |
| RMCA-PREG-002 | ¿Qué datos configurables pertenecen al tenant y cuáles a la sucursal? | Product Owner | alcance |
| RMCA-PREG-003 | ¿Puede una sucursal endurecer o relajar la política del tenant y con qué precedencia? | Product Owner + Operaciones | gobernanza |
| RMCA-PREG-004 | ¿Cuándo contacto, marca, modelo, IMEI/serie, color o señas se vuelven requisitos condicionales? | Product Owner + Operaciones | validez |
| RMCA-PREG-005 | ¿Qué ocurre si una política cambia mientras una recepción está en curso? | Product Owner | vigencia |
| RMCA-PREG-006 | ¿Cómo se atribuyen correcciones o datos completados después sin perder el original? | Product Owner + Auditoría | historia |
| RMCA-PREG-007 | ¿Qué nombre canónico reemplaza o relaciona “falla reportada” con “problema reportado”? | Product Owner + Operaciones | lenguaje |

## Custodia, identificación y evidencia

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| RMCA-PREG-008 | ¿Qué métodos de fijación mantienen el folio unido sin dañar cada tipo de dispositivo? | Operaciones | custodia física |
| RMCA-PREG-009 | ¿Debe registrarse quién reemplazó una etiqueta y por qué? | Product Owner + Auditoría | trazabilidad |
| RMCA-PREG-010 | ¿Cómo se relacionan órdenes sucesivas del mismo dispositivo sin reutilizar su ciclo? | Product Owner | historia/garantía |
| RMCA-PREG-011 | ¿Qué fotos se requieren, en qué casos y con qué propósito? | Product Owner + Operaciones | evidencia |
| RMCA-PREG-012 | ¿Qué consentimiento, acceso, retención y protección aplican a fotografías? | Seguridad + Legal | privacidad |
| RMCA-PREG-013 | ¿Qué condición operativa demuestra que la entrega terminó la custodia? | Product Owner + Operaciones | frontera del ciclo |
| RMCA-PREG-014 | ¿Cómo se manejan abandono, transferencia o imposibilidad de entrega? | Product Owner + Legal | excepciones |

## Problema reportado y hallazgos

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| RMCA-PREG-015 | ¿Quién se registra como fuente cuando quien entrega no es el cliente? | Product Owner + Operaciones | atribución |
| RMCA-PREG-016 | ¿Cómo se corrige un relato sin reescribir la declaración original? | Product Owner + Auditoría | historia |
| RMCA-PREG-017 | ¿Existe un mínimo de detalle más allá de que el campo no esté vacío? | Product Owner + Operaciones | calidad |
| RMCA-PREG-018 | ¿Cómo se relacionan varios síntomas con hallazgos y conceptos sin perder su origen? | Product Owner + Técnicos | trazabilidad técnica |

## Autorización comercial

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| RMCA-PREG-019 | ¿Quién puede autorizar en nombre del cliente? | Product Owner + Legal | autoridad |
| RMCA-PREG-020 | ¿Qué canales y evidencia prueban una aceptación o rechazo? | Product Owner + Legal + Seguridad | consentimiento |
| RMCA-PREG-021 | ¿Cuándo entra en vigor y cuándo vence una autorización inicial? | Product Owner + Finanzas | vigencia |
| RMCA-PREG-022 | ¿Puede modificarse o revocarse y qué historia debe conservarse? | Product Owner + Legal | cambios |
| RMCA-PREG-023 | ¿Cuál será el término canónico y visible para “autorización comercial inicial”? | Product Owner + Operaciones | lenguaje |
| RMCA-PREG-024 | ¿Cómo se demuestra la condición “sólo si funciona” y quién confirma el resultado? | Product Owner + Técnicos | elegibilidad |

## Cotizaciones y políticas de precio

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| RMCA-PREG-025 | ¿Qué estados adicionales puede tener una decisión antes o después de aceptar/rechazar? | Product Owner | ciclo de decisión |
| RMCA-PREG-026 | ¿Cómo se versiona una cotización y qué ocurre con decisiones de una versión anterior? | Product Owner + Finanzas | consistencia |
| RMCA-PREG-027 | ¿La política de precio se fija por tenant, sucursal, tipo de servicio u orden? | Product Owner + Finanzas | alcance |
| RMCA-PREG-028 | ¿Quién puede crear, seleccionar o cambiar una política comercial? | Product Owner + Seguridad | autoridad |
| RMCA-PREG-029 | ¿Qué tiene precedencia si la condición comunicada contradice la política configurada? | Product Owner + Legal + Finanzas | compromiso comercial |
| RMCA-PREG-030 | ¿“Siempre agregado” permite cobrar un servicio que no cumplió su condición? | Product Owner + Finanzas | elegibilidad |
| RMCA-PREG-031 | ¿“Sólo si se rechaza” requiere que el servicio haya sido exitoso o genera otro cargo? | Product Owner + Finanzas | elegibilidad |
| RMCA-PREG-032 | ¿Cómo se aplican impuestos, descuentos, redondeos y moneda? | Finanzas | total |
| RMCA-PREG-033 | ¿Cómo se relacionan autorización, anticipo, pago, saldo, devolución y cancelación? | Finanzas + Product Owner | dinero |
| RMCA-PREG-034 | ¿Qué obligación conserva el taller frente a un hallazgo de seguridad rechazado, como una batería inflada? | Product Owner + Operaciones + Legal | seguridad |
| RMCA-PREG-035 | ¿Puede ejecutarse trabajo parcial dentro de un concepto o debe recotizarse? | Product Owner + Técnicos | alcance |

## Fuera de alcance técnico

La forma de persistir, calcular, versionar, autorizar, imprimir o presentar estas decisiones no es una pregunta de dominio que este paquete deba responder. Se analizará sólo después de cerrar las decisiones aplicables.

## Criterio de cierre

Una pregunta puede cerrarse únicamente con:

1. respuesta explícita;
2. autoridad identificada;
3. fecha y evidencia;
4. alcance normal y excepción;
5. documentos afectados;
6. confirmación de que no contradice una invariante validada o registro explícito de una nueva decisión que la sustituya.
