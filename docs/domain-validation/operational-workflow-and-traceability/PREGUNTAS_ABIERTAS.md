# Preguntas abiertas

## Regla

Las preguntas siguientes no deben resolverse mediante el comportamiento accidental del legacy, una preferencia de interfaz ni una interpretación arquitectónica. Su cierre requiere autoridad, evidencia, fecha, alcance normal y excepción.

## Estados y ubicaciones

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| FOT-PREG-001 | ¿Cuál es el catálogo definitivo de estados? | Product Owner + Operaciones | flujo |
| FOT-PREG-002 | ¿Los estados serán universales, configurables o híbridos? | Product Owner | gobernanza |
| FOT-PREG-003 | ¿Cuál es el catálogo definitivo de ubicaciones físicas? | Product Owner + Operaciones | localización |
| FOT-PREG-004 | ¿Cada sucursal puede crear sus áreas, cajas, estantes o mesas? | Product Owner + Operaciones | configuración |
| FOT-PREG-005 | ¿Cada movimiento físico debe confirmarse mediante escaneo? | Operaciones | fricción/trazabilidad |
| FOT-PREG-020 | ¿En tienda/Entregado seguirá como campo o se derivará de custodia? | Product Owner + Arquitectura | semántica |
| FOT-PREG-021 | ¿Cómo se representan salidas temporales, proveedores externos o trabajo subcontratado? | Operaciones + Legal | custodia externa |
| FOT-PREG-022 | ¿Cómo se representan traslados entre sucursales? | Product Owner + Operaciones | pertenencia y responsabilidad |
| FOT-PREG-023 | ¿Cómo se representa un dispositivo extraviado o con ubicación desconocida? | Operaciones + Legal | riesgo |
| FOT-PREG-024 | ¿Qué ocurre si la ubicación física difiere de la registrada? | Operaciones | reconciliación |
| FOT-PREG-025 | ¿Cómo se corrigen movimientos o eventos erróneos sin borrar trazabilidad? | Product Owner + Auditoría | historia |

## Asignación y participación

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| FOT-PREG-006 | ¿Tomar el equipo de pendientes asigna automáticamente al técnico? | Product Owner + Operaciones | asignación |
| FOT-PREG-007 | ¿El técnico debe aceptar explícitamente una asignación? | Operaciones | responsabilidad |
| FOT-PREG-008 | ¿Puede haber varios técnicos asignados simultáneamente? | Product Owner + Técnicos | colaboración |
| FOT-PREG-009 | ¿Qué significa exactamente el campo resumen “técnico”? | Product Owner | proyección |
| FOT-PREG-033 | **Respondida por ADR-012:** un usuario puede tener varios roles; sus capacidades se unen desde asignaciones vigentes aplicables | Product Owner + Seguridad | composición por rebanada pendiente |
| FOT-PREG-034 | ¿Cómo se implementa el cambio de turno conservando estación/sucursal y sustituyendo sólo al usuario conforme a ADR-010? | Operaciones + Seguridad | continuidad; semántica resuelta, mecanismo pendiente |
| FOT-PREG-035 | ¿Cómo se transfiere responsabilidad sin mover físicamente el equipo? | Operaciones | colas |
| FOT-PREG-039 | ¿“Quién reparó” admite varios usuarios? | Product Owner | resumen |
| FOT-PREG-040 | ¿Cómo se distingue técnico principal de colaboradores? | Product Owner + Técnicos | participación |

## Segunda revisión

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| FOT-PREG-010 | ¿La segunda revisión debe hacerla siempre una persona distinta? | Product Owner + Operaciones | independencia |
| FOT-PREG-011 | ¿Qué pruebas conforman una segunda revisión? | Operaciones + Técnicos | criterio |
| FOT-PREG-012 | ¿Habrá plantillas por tipo de dispositivo o reparación? | Operaciones | consistencia |
| FOT-PREG-013 | ¿Se requiere evidencia fotográfica en segunda revisión? | Product Owner + Seguridad | evidencia |
| FOT-PREG-014 | ¿Recepción puede aprobar técnicamente todos los tipos de reparación? | Product Owner + Técnicos | competencia |

## Autenticación, permisos y sesiones

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| FOT-PREG-015 | **Respondida conceptualmente por ADR-013:** toda candidata se clasifica nivel 1–4 y permanece en nivel 4 sin política concreta | Product Owner + Seguridad | clasificación por rebanada pendiente |
| FOT-PREG-016 | **Respondida conceptualmente por ADR-013:** nivel 2 reautentica al actor y nivel 3 exige aprobador diferente con capacidad específica | Seguridad + Product Owner | factor, tiempo y mecanismo pendientes |
| FOT-PREG-032 | ¿Cómo se manejan sesiones en dispositivos compartidos de recepción? | Seguridad + Operaciones | atribución |

Además permanecen abiertos intentos fallidos, bloqueo, rotación, auditoría técnica, combinación PIN/dispositivo y clasificación concreta por rebanada. No reabren los modelos de ADR-012/013.

## Eventos, actividad y proyecciones

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| FOT-PREG-017 | ¿Qué retención tendrá la actividad automática? | Seguridad + Auditoría | historia/costo |
| FOT-PREG-018 | ¿Qué eventos serán visibles al cliente? | Product Owner + Legal | transparencia |
| FOT-PREG-019 | ¿Qué eventos generan notificaciones? | Product Owner | comunicación |
| FOT-PREG-036 | ¿El historial completo debe ser inmutable? | Product Owner + Legal + Arquitectura | corrección |
| FOT-PREG-037 | ¿Qué datos pueden corregirse y mediante qué hechos compensatorios? | Product Owner + Auditoría | fidelidad |
| FOT-PREG-038 | ¿Qué proyecciones aparecerán en la cabecera del detalle? | Product Owner + Operaciones | resumen |

## Entrega y dinero

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| FOT-PREG-026 | ¿Cómo se registran entregas autorizadas por excepción? | Product Owner + Legal | custodia |
| FOT-PREG-027 | ¿Cómo se registran devoluciones de anticipos? | Finanzas | reversas |
| FOT-PREG-028 | ¿Cómo se relacionan anticipos con Caja? | Finanzas | conciliación |

También siguen abiertas las reglas de saldo, crédito, cortesía, métodos, recibos, cierres y contabilidad; este paquete no diseña Caja completa.

## Métricas y tiempo

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| FOT-PREG-029 | ¿Se miden tiempos por etapa, ubicación o responsable? | Product Owner + Operaciones | métricas |
| FOT-PREG-030 | ¿Deben existir SLA y alertas por tiempo detenido? | Product Owner + Operaciones | seguimiento |
| FOT-PREG-031 | ¿Escanear inicia automáticamente cronometraje técnico? | Product Owner + Técnicos | medición |

## Criterio de cierre

Una pregunta sólo puede cerrarse cuando se registra:

1. respuesta explícita;
2. autoridad que decide;
3. fecha y evidencia;
4. alcance por tenant/sucursal cuando aplica;
5. ejemplo normal y excepción;
6. reglas, escenarios y documentos afectados;
7. contradicciones o decisiones sustituidas;
8. revisiones de Seguridad, Legal o Finanzas cuando correspondan.
