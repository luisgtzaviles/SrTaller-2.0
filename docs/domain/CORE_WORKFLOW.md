# Flujo central del taller

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Advertencia

El recorrido completo es una **hipótesis**, no el primer release aprobado ni una descripción confirmada de todos los talleres. Su propósito es hacer visibles decisiones y excepciones. Los nombres de estados, comandos y eventos son candidatos separados.

## Flujo principal preliminar

~~~mermaid
flowchart LR
    A[Identificar cliente] --> B[Registrar dispositivo]
    B --> C[Documentar recepción]
    C --> D[Abrir orden]
    D --> E[Revisar o diagnosticar]
    E --> F[Crear cotización]
    F --> G[Obtener decisión]
    G --> H[Asignar y ejecutar]
    H --> I[Controlar calidad]
    I --> J[Confirmar saldo]
    J --> K[Entregar]
    K --> L[Iniciar garantía]
    L --> M[Cerrar operativamente]
~~~

| Paso | Propósito | Actor candidato | Información necesaria | Resultado esperado | Reglas candidatas | Eventos posibles | Excepciones | Preguntas |
|---:|---|---|---|---|---|---|---|---|
| 1. Identificar o registrar cliente | Saber con quién se establece la relación | Recepcionista | nombre o referencia y contacto mínimo | Cliente localizado o creado | RULE-002 | EVENT-001/002 | sin teléfono, duplicado, propietario distinto | DQ-004 |
| 2. Registrar dispositivo | Distinguir el equipo atendido | Recepcionista | tipo, marca/modelo e identificadores disponibles | Dispositivo relacionado sin inventar identificadores | RULE-003 | EVENT-004 | sin IMEI, dos IMEI, serie ilegible | DQ-005 |
| 3. Documentar recepción | Establecer custodia y condición inicial | Recepcionista y entregante | condición, falla reportada, accesorios, evidencia, secretos opcionales | Recepción trazable | RULE-004/005 | EVENT-005/006 | mojado, desarmado, código no entregado | DQ-006/007 |
| 4. Abrir orden de trabajo | Crear el caso coordinador | Recepcionista | cliente, dispositivo, sucursal, recepción | Orden abierta con folio | RULE-001 | EVENT-007 | cliente anónimo o atención sin custodia | DQ-001/002 |
| 5. Revisar o diagnosticar | Explicar falla y opciones | Técnico | falla reportada, condición y autorización de revisión | Diagnóstico completo o inconcluso | RULE-006 | EVENT-010/011/012 | falla intermitente, daño oculto | DQ-008 |
| 6. Crear cotización | Proponer alcance, precio y condiciones | Recepción, vendedor o técnico según autoridad | diagnóstico, servicios, partes y vigencia | Versión de cotización preparada/emitida | RULE-007 | EVENT-013/014 | varias alternativas o sin diagnóstico formal | DQ-009 |
| 7. Obtener decisión del cliente | Conservar consentimiento atribuible | Cliente, propietario o autorizado | versión, alcance, total, condiciones y canal | aprobación, parcialidad o rechazo | RULE-008 | EVENT-016/017/018 | verbal, mensajería, silencio, aprobación parcial | DQ-011 |
| 8. Asignar y ejecutar trabajo | Realizar sólo el alcance autorizado | Supervisor y técnico | autorización, prioridad, capacidad, partes | intervenciones trazables | RULE-010/011 | EVENT-020/021/022/023/024/025/026 | espera, parte del cliente, externo, reasignación | DQ-013/015/017/023 |
| 9. Controlar calidad | Comprobar resultado y detectar retrabajo | Técnico o supervisor | alcance autorizado y criterios de prueba | aprobado o retrabajo requerido | RULE-012 | EVENT-028/029/030/031 | daño adicional o falla intermitente | DQ-016 |
| 10. Confirmar saldo | Conocer obligación pendiente antes de salida | Cajero/recepción | cotización aplicable, ajustes y pagos | saldo confirmado o excepción pendiente | RULE-013 | EVENT-032/033/035 | múltiples pagos, devolución, contracargo | DQ-012/019 |
| 11. Entregar | Transferir custodia a persona autorizada | Recepción/cajero | identidad o evidencia, condición, saldo, accesorios | entrega documentada | RULE-014/015 | EVENT-036/037/038 | tercero, otra sucursal, saldo pendiente | DQ-014/020 |
| 12. Iniciar periodo de garantía | Establecer elegibilidad temporal y alcance | Proceso operativo autorizado | trabajo/partes cubiertas y fecha de inicio | garantía activa o no aplicable | RULE-016 | EVENT-040 | cobertura parcial, exclusión, plazo distinto | DQ-021 |
| 13. Cerrar operativamente | Terminar responsabilidades activas del caso | Gerente o proceso autorizado | entrega, decisiones, trazabilidad y pendientes | orden cerrada sin borrar historial | RULE-020 | EVENT-039 | abandono, saldo, disputa o follow-up | DQ-018 |

## Flujos alternativos para entrevista

| Alternativa | Cambio frente al flujo | Riesgo o decisión pendiente |
|---|---|---|
| Diagnóstico antes de cotizar | Conserva secuencia principal | costo y autorización del diagnóstico |
| Cotización inmediata sin diagnóstico formal | Omite o difiere diagnóstico | quién asume incertidumbre |
| Trabajo preautorizado | Autoriza límites antes de conocer hallazgos | monto, alcance y evidencia |
| Reparación sin refacción | Sólo mano de obra o ajuste | criterio de cotización |
| Refacción del cliente | Parte fuera del stock del taller | compatibilidad y garantía |
| Reparación externa | Tercero ejecuta trabajo | custodia, costo y responsabilidad |
| Equipo irreparable | Diagnóstico no conduce a intervención | cobro, entrega y cierre |
| Cliente rechaza cotización | No se autoriza trabajo | costo de diagnóstico y devolución |
| Abandono del dispositivo | No se concreta entrega | aviso, custodia y disposición legal |
| Cancelación | Se detiene el caso | estados permitidos, costo y reversas |
| Devolución sin reparar | Se entrega tras rechazo/cancelación | condición y evidencia |
| Entrega con saldo pendiente | Excepción financiera | autoridad y seguimiento |
| Múltiples pagos | Saldo cambia varias veces | aplicación, reversa y caja |
| Garantía | Se reclama cobertura tras entrega | caso relacionado o reapertura |
| Reingreso no relacionado | Nueva falla después de entrega | nueva orden y vínculo histórico |
| Daño adicional detectado | Cambia riesgo o alcance | evidencia y nueva autorización |
| Cambio de cotización | Versión anterior deja de ser vigente | anticipo y aprobación previa |
| Autorización parcial | Sólo algunas partidas se aprueban | estados y resultado esperado |
| Reparación parcial | No se corrigen todas las fallas | conformidad y garantía |
| Varias fallas | Una orden coordina resultados distintos | cotización, estados y cierre por falla |
| Varias intervenciones | El trabajo ocurre en etapas | ownership, secuencia y retrabajo |

## Puntos de decisión

- **Decisión pendiente:** si orden de trabajo y reparación tienen ciclos separados.
- **Decisión pendiente:** si diagnóstico y cotización son obligatorios o admiten rutas abreviadas.
- **Decisión pendiente:** qué autorización puede representar al propietario.
- **Decisión pendiente:** qué mínimo de inventario, pagos y caja pertenece al recorrido.
- **Decisión pendiente:** si Delivered y Closed son hitos distintos.
- **Decisión pendiente:** si una garantía abre un caso relacionado.

## Evidencia requerida

Para validar el recorrido se necesitan al menos un caso normal completo, uno con rechazo, uno cancelado, uno con cambio de cotización, uno con tercero en entrega y uno de garantía, narrados por personas que realizan la operación.
