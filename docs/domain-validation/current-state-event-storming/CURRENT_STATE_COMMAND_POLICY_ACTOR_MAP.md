# Mapa de comandos, políticas y actores

**Estado:** Borrador para validación interdisciplinaria.
**Propósito:** Relacionar intenciones, participantes y reglas o limitaciones que explican el Current State.
**Alcance:** Actores humanos/técnicos, comandos observados o inferidos, información consultada, sistemas externos y políticas actuales/futuras identificadas.
**Fuente:** Product Owner; auditorías legacy de nueva reparación y detalle; documentación canónica usada sólo como referencia.
**Audiencia:** Product Owner, operaciones, técnicos, finanzas, seguridad y arquitectura.
**Última actualización:** 2026-07-14.

## Precaución

Los actores son perspectivas participantes, no roles definitivos ni una matriz de permisos aprobada. “Sistema”, “navegador”, “endpoint” y “almacenamiento” se separan porque el comportamiento legacy cruza esas fronteras; no prescriben componentes futuros.

## Actores evaluados

| ID | Actor o perspectiva actual | Participación observada | Fuente / estado | Ambigüedad principal |
|---|---|---|---|---|
| `CSE-ACTOR-001` | Persona que consulta | Llega/contacta, describe necesidad, pregunta precio y decide continuar. | Product Owner. `Confirmed by Product Owner`. | Puede no ser propietario, cliente nombrado ni quien entregue. |
| `CSE-ACTOR-002` | Persona que entrega | Deja físicamente el equipo e indica a nombre de quién queda. | Product Owner. `Confirmed by Product Owner`. | No se registra si difiere del cliente nombrado. |
| `CSE-ACTOR-003` | Cliente nombrado en la nota | Es el cliente operativo; su nombre queda en la orden. | Código y Product Owner. `Confirmed by both`. | Propiedad real no se verifica. |
| `CSE-ACTOR-004` | Contacto registrado | Su teléfono recibe notificaciones y se usa para autorización/entrega. | Código y Product Owner. `Confirmed by both`. | Relación jurídica/operativa con cliente y equipo no se demuestra. |
| `CSE-ACTOR-005` | Recepcionista | Cotiza, recibe, captura, reconoce personas, llama y libera físicamente. | Principalmente Product Owner; captura visible en código. `Confirmed by both`. | Permisos backend y autoridad para excepciones no se diferencian. |
| `CSE-ACTOR-006` | Técnico | Diagnostica/trabaja y puede descubrir hallazgos. | Product Owner; texto técnico en código. `Inferred from combined evidence`. | El sistema no demuestra identidad, periodo, aceptación ni trabajo ejecutado. |
| `CSE-ACTOR-007` | Usuario que registra seguimiento | Inserta nota o evidencia con nombre textual de sesión. | Auditoría de detalle. `Confirmed by legacy code`. | Puede no ser autor del hecho narrado. |
| `CSE-ACTOR-008` | Usuario que registra pago | Inserta una fila monetaria por folio. | Auditorías legacy. `Confirmed by legacy code`. | No existe permiso financiero específico ni vínculo a caja. |
| `CSE-ACTOR-009` | Usuario que cambia estado | Guarda estado junto con técnico, presupuesto y custodia. | Auditoría de detalle. `Confirmed by legacy code`. | Autoridad por cada decisión no se valida. |
| `CSE-ACTOR-010` | Usuario que marca entrega | Cambia el campo de custodia y queda como `entregado_por`. | Auditoría de detalle. `Confirmed by legacy code`. | Es actor interno, no receptor del equipo. |
| `CSE-ACTOR-011` | Persona que recoge | Presenta nota/INE, puede ser reconocida o autorizada por llamada. | Product Owner. `Confirmed by Product Owner`. | No se registra estructuralmente. |
| `CSE-ACTOR-012` | Dueño | Puede autorizar excepción de entrega. | Product Owner. `Confirmed by Product Owner`. | Excepción, razón y acto no quedan vinculados a entrega. |
| `CSE-ACTOR-013` | Gerente | Puede autorizar excepción de entrega. | Product Owner. `Confirmed by Product Owner`. | Autoridad y alcance exactos requieren validación. |
| `CSE-ACTOR-014` | Sistema | Persiste orden, datos, pagos y mutaciones; devuelve resultados. | Código. `Confirmed by legacy code`. | No representa una frontera futura aprobada. |
| `CSE-ACTOR-015` | Navegador | Compone modal, calcula saldo, secuencia peticiones y abre canales. | Código. `Confirmed by legacy code`. | Contiene reglas que el backend no reproduce. |
| `CSE-ACTOR-016` | Proveedor de WhatsApp | Recibe una URL preparada por el navegador. | Código. `Confirmed by legacy code`. | Envío, entrega y lectura son `Unknown`. |
| `CSE-ACTOR-017` | Endpoint webhook | Consulta fila previa y reenvía datos a URLs configuradas. | Código. `Confirmed by legacy code`. | Receptor final y configuración activa son `Unknown`. |
| `CSE-ACTOR-018` | Impresora/navegador de impresión | Renderiza o materializa la nota generada. | Código para ventana; impresión física `Unknown`. | No existe bitácora que pruebe impresión o reimpresión. |
| `CSE-ACTOR-019` | Almacenamiento R2 | Conserva objetos de evidencia antes de referencias SQL. | Código. `Confirmed by legacy code`. | Retención, borrado y consistencia están pendientes. |

## Comandos e intenciones

| ID | Comando | Actor que lo intenta | Evento o resultado relacionado | Registro actual | Estado |
|---|---|---|---|---|---|
| `CSE-COMMAND-001` | Consultar precio | `CSE-ACTOR-001` | `CSE-EVENT-001` | No encontrado antes del ingreso. | `Confirmed by Product Owner`. |
| `CSE-COMMAND-002` | Presentar alternativas | `CSE-ACTOR-005` | `CSE-EVENT-002` | No encontrado; verbal. | `Confirmed by Product Owner`. |
| `CSE-COMMAND-003` | Iniciar recepción | `CSE-ACTOR-005` | `CSE-EVENT-005` | El formulario comienza a capturar; el inicio humano no tiene timestamp propio. | `Confirmed by Product Owner`. |
| `CSE-COMMAND-004` | Seleccionar cliente | `CSE-ACTOR-005` | `CSE-EVENT-006`, `008` | Búsqueda y selección en alta. | `Confirmed by legacy code`. |
| `CSE-COMMAND-005` | Crear cliente | `CSE-ACTOR-005` | `CSE-EVENT-007`, `008` | Persistencia y copia a orden. | `Confirmed by legacy code`. |
| `CSE-COMMAND-006` | Registrar equipo | `CSE-ACTOR-005` | `CSE-EVENT-009` | Campos embebidos en reparación. | `Confirmed by legacy code`. |
| `CSE-COMMAND-007` | Documentar condición | `CSE-ACTOR-005` | `CSE-EVENT-010` | Falla/testimonio/condición del alta. | `Confirmed by legacy code`. |
| `CSE-COMMAND-008` | Registrar riesgo y credencial | `CSE-ACTOR-005` | `CSE-EVENT-011` | Campos de riesgo/seguridad. | `Confirmed by legacy code`; tratamiento `Pending security review`. |
| `CSE-COMMAND-009` | Crear orden | `CSE-ACTOR-005` | `CSE-EVENT-012`, `013` | `INSERT` principal. | `Confirmed by legacy code`. |
| `CSE-COMMAND-010` | Registrar anticipo | `CSE-ACTOR-008` | `CSE-EVENT-014` | Petición separada posterior al alta. | `Confirmed by legacy code`. |
| `CSE-COMMAND-011` | Imprimir nota | `CSE-ACTOR-005/018` | `CSE-EVENT-015` | Render actual; sin bitácora. | `Confirmed by legacy code`. |
| `CSE-COMMAND-012` | Añadir evidencia | `CSE-ACTOR-005/007` | `CSE-EVENT-016` | R2, seguimiento y archivos. | `Confirmed by legacy code`. |
| `CSE-COMMAND-013` | Asignar técnico | `CSE-ACTOR-009` | `CSE-EVENT-017` | Sobrescritura textual. | `Confirmed by legacy code`. |
| `CSE-COMMAND-014` | Diagnosticar o trabajar | `CSE-ACTOR-006` | `CSE-EVENT-018` | Sólo puede inferirse desde estado/seguimiento. | `Inferred from combined evidence`. |
| `CSE-COMMAND-015` | Registrar hallazgo | `CSE-ACTOR-006/007` | `CSE-EVENT-019`, `024` | Texto libre opcional. | Hallazgo `Confirmed by Product Owner`; registro `Confirmed by legacy code`. |
| `CSE-COMMAND-016` | Contactar cliente | `CSE-ACTOR-005/006` | `CSE-EVENT-020`, `028` | Llamada no estructurada; WhatsApp abre canal. | `Confirmed by Product Owner`. |
| `CSE-COMMAND-017` | Registrar autorización narrativamente | `CSE-ACTOR-007` | `CSE-EVENT-021`, `024` | Seguimiento libre, separado del total. | `Confirmed by both`. |
| `CSE-COMMAND-018` | Cambiar presupuesto | `CSE-ACTOR-009` | `CSE-EVENT-022` | Sobrescritura en guardado combinado. | `Confirmed by legacy code`. |
| `CSE-COMMAND-019` | Continuar o detener trabajo | `CSE-ACTOR-006/009` | `CSE-EVENT-023`, quizá `025` | No hay comando dedicado; estado/nota libres. | `Inferred from combined evidence`. |
| `CSE-COMMAND-020` | Registrar seguimiento | `CSE-ACTOR-007` | `CSE-EVENT-024` | Inserción independiente. | `Confirmed by legacy code`. |
| `CSE-COMMAND-021` | Cambiar estado | `CSE-ACTOR-009` | `CSE-EVENT-025`, `026` | Texto en guardado combinado. | `Confirmed by legacy code`. |
| `CSE-COMMAND-022` | Enviar webhook | `CSE-ACTOR-015/017` | `CSE-EVENT-027` | Intento anterior al guardado. | `Confirmed by legacy code`. |
| `CSE-COMMAND-023` | Registrar pago | `CSE-ACTOR-008` | `CSE-EVENT-029` | Inserción separada. | `Confirmed by legacy code`. |
| `CSE-COMMAND-024` | Validar legitimación de entrega | `CSE-ACTOR-005/012/013` | `CSE-EVENT-030` | Sólo práctica humana; evidencia opcional genérica. | `Confirmed by Product Owner`. |
| `CSE-COMMAND-025` | Marcar entrega | `CSE-ACTOR-010` | `CSE-EVENT-031`; no prueba `032` | Sobrescritura de custodia. | `Confirmed by legacy code`. |
| `CSE-COMMAND-026` | Reimprimir nota | `CSE-ACTOR-005/018` | `CSE-EVENT-015` | Regenera con presente, sin bitácora. | `Confirmed by legacy code`. |
| `CSE-COMMAND-027` | Reabrir reparación | `CSE-ACTOR-009` | `CSE-EVENT-033` | Seleccionar otro texto de estado. | `Confirmed by legacy code`. |
| `CSE-COMMAND-028` | Indicar posible garantía | `CSE-ACTOR-005/009` | `CSE-EVENT-034` | Bandera, folio previo o etiqueta. | `Confirmed by legacy code`. |

## Información de lectura usada por el proceso

| ID | Información consultada | Fuente actual | Consumidor | Calidad / estado |
|---|---|---|---|---|
| `CSE-READ-001` | Marca, modelo, problema, cómo ocurrió y precios/calidades | Conversación y fuente de precios no identificada | Recepción/persona que consulta | Captura previa `Unknown`; conversación `Confirmed by Product Owner`. |
| `CSE-READ-002` | Coincidencias por nombre o teléfono | Búsqueda legacy de clientes | Recepción/navegador | Teléfono usado para coincidencia. `Confirmed by legacy code`. |
| `CSE-READ-003` | Datos y snapshot del cliente operativo | Cliente seleccionado/creado y reparación | Alta, detalle e impresión | Propiedad/entregador ausentes. `Confirmed by legacy code`. |
| `CSE-READ-004` | Datos, condición, riesgo y credencial del equipo | Fila actual de reparación | Detalle/ticket/webhook | Contrato amplio y secreto expuesto. `Pending security review`. |
| `CSE-READ-005` | Folio visible | Predicción/consulta/registro y sticker | Alta, búsquedas y enlaces laterales | Reserva previa ausente. `Confirmed by legacy code`. |
| `CSE-READ-006` | Falla y situación técnica actuales | Fila principal, estado y seguimiento | Técnico/recepción | Mezcla reporte, narrativa y etiqueta. `Confirmed by legacy code`. |
| `CSE-READ-007` | Teléfono del contacto | Snapshot de la reparación | Llamada/WhatsApp/legitimación | Identidad y consentimiento no demostrados. `Confirmed by both`. |
| `CSE-READ-008` | Presupuesto, filas de pago y saldo visual | Fila, `reparacion_pagos` y cálculo del navegador | Usuario del detalle | Saldo no persistido ni exigible. `Confirmed by legacy code`. |
| `CSE-READ-009` | Seguimientos y evidencias | Consultas separadas y R2 | Detalle | Puede faltar una subsección sin impedir otras. `Confirmed by legacy code`. |
| `CSE-READ-010` | Nota, INE, reconocimiento, llamada o excepción | Pruebas humanas y evidencia genérica | Recepción | No hay lectura/decisión estructurada. `Confirmed by Product Owner`. |
| `CSE-READ-011` | Estado, custodia y saldo al entregar | Controles actuales del modal | Usuario que marca entrega | El backend no los cruza como precondición. `Confirmed by legacy code`. |
| `CSE-READ-012` | Estado, primeras fechas, posible garantía y folio previo | Fila actual | Recepción/detalle | No demuestra ciclo histórico ni cobertura. `Confirmed by legacy code`. |

## Sistemas y fronteras externas observadas

| ID | Sistema/frontera | Interacción actual | Resultado demostrable | Estado |
|---|---|---|---|---|
| `CSE-EXTERNAL-001` | Telefonía / WhatsApp | Llamada humana o apertura de `wa.me` | Intento humano o ventana preparada; entrega del mensaje no demostrada. | Práctica `Confirmed by Product Owner`; apertura `Confirmed by legacy code`. |
| `CSE-EXTERNAL-002` | URLs receptoras de webhook | Endpoint reenvía fila anterior completa | Intento y conteo de respuesta; configuración/receptor activos `Unknown`. | `Confirmed by legacy code`; datos `Pending security review`. |
| `CSE-EXTERNAL-003` | Render de impresión / impresora | Endpoint genera HTML con datos y plantilla actuales | Documento generable; acto físico y copia histórica no demostrados. | `Confirmed by legacy code`. |
| `CSE-EXTERNAL-004` | Persistencia relacional legacy | Registros independientes por folio | Estado actual, pagos, seguimiento, archivo y configuración parciales. | `Confirmed by legacy code`; no prescribe almacenamiento futuro. |
| `CSE-EXTERNAL-005` | Almacenamiento R2 | Carga y lectura de imágenes | Objeto potencialmente referenciado por dos registros. | `Confirmed by legacy code`; retención `Pending security review`. |

## Políticas y comportamientos actuales

Las categorías significan: “política de negocio confirmada” es una regla operativa explícita; “práctica humana” es una actuación actual no estructurada; “comportamiento técnico accidental” es efecto de implementación sin respaldo de negocio; “limitación del legado” es una ausencia/capacidad insuficiente; “intención futura” no forma parte del Current State.

| ID | Política, práctica o comportamiento | Clasificación | Evidencia | Estado |
|---|---|---|---|---|
| `CSE-POLICY-001` | La consulta de precio ocurre antes de la recepción formal. | Política de negocio confirmada | Secuencia del Product Owner. | `Confirmed by Product Owner`. |
| `CSE-POLICY-002` | Recepción puede presentar distintas calidades y precios. | Práctica humana | Ejemplo Incell/OLED. | `Confirmed by Product Owner`. |
| `CSE-POLICY-003` | La orden queda a nombre de la persona indicada por quien entrega. | Política de negocio confirmada | Declaración operativa y snapshot legacy. | `Confirmed by both`; propiedad real `Unknown`. |
| `CSE-POLICY-004` | El teléfono se usa como coincidencia y como contacto de notificaciones/autorización. | Política de negocio confirmada con limitación | Código de búsqueda y declaración PO. | `Confirmed by both`. |
| `CSE-POLICY-005` | La orden conserva un snapshot de nombre y teléfono. | Comportamiento técnico accidental | `LEGACY-NR-FINDING-003`. | `Confirmed by legacy code`; intención `Pending Product Owner validation`. |
| `CSE-POLICY-006` | La orden nace sólo después del `INSERT` exitoso. | Comportamiento técnico accidental | `LEGACY-NR-RULE-001`; declaración PO. | `Confirmed by both`. |
| `CSE-POLICY-007` | Consultar/predecir el siguiente folio no lo reserva. | Comportamiento técnico accidental | `LEGACY-NR-FINDING-001`. | `Confirmed by legacy code`. |
| `CSE-POLICY-008` | El folio se coloca físicamente mediante sticker. | Práctica humana | Declaración PO; aplicación no registrada. | `Confirmed by Product Owner`. |
| `CSE-POLICY-009` | La evidencia fotográfica se captura después de crear e imprimir la orden. | Práctica humana | Declaración PO y endpoints posteriores. | `Confirmed by both`. |
| `CSE-POLICY-010` | El anticipo inicial ocurre en una petición separada; su falla no revierte la orden. | Comportamiento técnico accidental | `LEGACY-NR-FINDING-009`. | `Confirmed by legacy code`. |
| `CSE-POLICY-011` | El técnico se conserva como texto actual y se sobrescribe sin historial. | Limitación del legado | `LEGACY-RD-FINDING-007`. | `Confirmed by legacy code`. |
| `CSE-POLICY-012` | Estado técnico y custodia se administran por separado. | Comportamiento técnico accidental | `LEGACY-RD-FINDING-002`. | `Confirmed by legacy code`; intención de negocio pendiente. |
| `CSE-POLICY-013` | Diagnóstico, hallazgo, llamada y otras actividades pueden compartir seguimiento libre. | Limitación del legado | `LEGACY-RD-FINDING-017`. | `Confirmed by legacy code`. |
| `CSE-POLICY-014` | La autorización puede quedar sólo en seguimiento narrativo. | Limitación del legado | Ejemplo PO y `LEGACY-RD-FINDING-011`. | `Confirmed by both`. |
| `CSE-POLICY-015` | El presupuesto final se sobrescribe sin versión ni vínculo causal. | Limitación del legado | `LEGACY-RD-FINDING-010`. | `Confirmed by legacy code`. |
| `CSE-POLICY-016` | Técnicamente cualquier estado/custodia textual puede combinarse. | Comportamiento técnico accidental | Backend sin allowlist/regla cruzada. | `Confirmed by legacy code`. |
| `CSE-POLICY-017` | El seguimiento transforma mayúsculas/minúsculas y carece de categoría. | Comportamiento técnico accidental | `LEGACY-RD-RULE-026/027`. | `Confirmed by legacy code`. |
| `CSE-POLICY-018` | El webhook se intenta antes del guardado y transmite la fila anterior completa. | Comportamiento técnico accidental | `LEGACY-RD-FINDING-004/005`. | `Confirmed by legacy code`. |
| `CSE-POLICY-019` | Los pagos de reparación no demuestran impacto correcto en caja. | Limitación del legado | Código sin integración y declaración PO. | `Confirmed by both`; conciliación externa `Unknown`. |
| `CSE-POLICY-020` | El saldo sólo se calcula en el navegador. | Comportamiento técnico accidental | `LEGACY-RD-FINDING-014`. | `Confirmed by legacy code`. |
| `CSE-POLICY-021` | Cualquier persona puede recoger si presenta la nota. | Política de negocio confirmada | Declaración PO. | `Confirmed by Product Owner`. |
| `CSE-POLICY-022` | Sin nota, puede usarse INE, reconocimiento o llamada al contacto. | Práctica humana | Declaración PO. | `Confirmed by Product Owner`; tratamiento de INE `Pending security review`. |
| `CSE-POLICY-023` | Sin nota ni INE, no se entrega salvo excepción del dueño o gerente. | Política de negocio confirmada | Declaración PO. | `Confirmed by Product Owner`. |
| `CSE-POLICY-024` | El sistema permite marcar entrega sin validar legitimación, saldo o estado listo. | Limitación del legado | `LEGACY-RD-FINDING-014/015`. | `Confirmed by legacy code`. |
| `CSE-POLICY-025` | Reabrir conserva las primeras fechas de listo y entrega. | Comportamiento técnico accidental | `LEGACY-RD-FINDING-003/016`. | `Confirmed by legacy code`. |
| `CSE-POLICY-026` | Garantía se expresa como bandera, folio previo o etiqueta, no como ciclo validado. | Limitación del legado | `LEGACY-RD-FINDING-022`. | `Confirmed by legacy code`. |
| `CSE-POLICY-027` | Los cobros de reparación deberían afectar caja. | Intención futura | Declaración explícita del Product Owner. | `Desired future behavior`; `Pending finance review`. |
