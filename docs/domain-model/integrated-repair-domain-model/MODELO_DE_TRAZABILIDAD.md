# Modelo de trazabilidad

## Objetivo

**DDV:** responder quién hizo qué, cuándo, dentro de qué tenant y sucursal, sobre qué orden y con qué resultado. La trazabilidad apoya operación y explicación; no convierte cada registro en evento de dominio ni prescribe Event Sourcing.

## Tres clases de registro

| Clase | Propósito | Ejemplos | No sustituye |
|---|---|---|---|
| Evento estructurado | demostrar un hecho de negocio con semántica | autorización, QC, pago, entrega | evidencia complementaria o narrativa |
| Nota narrativa | aportar contexto humano no estructurado | comentario técnico, observación del cliente | decisión, pago, entrega o cambio formal |
| Actividad automática | explicar acciones del sistema | intento de notificación, cálculo, impresión | hecho físico/humano no confirmado |

**Clasificación:** DDV, fuente FOT-DEC-016/017.

## Sobre común de atribución

| Dato conceptual | Regla | Clasificación |
|---|---|---|
| Actor | identidad operativa que ejecutó/confirmó | DDV |
| Momento | fecha y hora consistentes | DDV |
| Tenant | organización efectiva | DDV/PM transversal |
| Sucursal | contexto operativo cuando aplica | DDV |
| Estación | origen operativo validado | ADR-010 |
| Orden | referencia al ciclo | DDV |
| Acción/hecho | significado explícito | DDV |
| Resultado | éxito, rechazo, fallo o pendiente | PM |
| Motivo | explicación estructurada cuando es sensible | PM |
| Correlación | vínculo con decisión/trabajo/evidencia relacionado | PM |
| Sesión | evidencia técnica de continuidad, no identidad absoluta | HOV/PM |

ADR-010 establece que tenant, sucursal, estación y usuario forman el contexto efectivo de toda operación ordinaria. Ese contexto se conserva como historia del hecho y no se recalcula después de un cambio de turno o reubicación de estación.

## Participaciones consultables

**DDV:** el historial debe permitir responder quién recibió, diagnosticó, reparó, revisó, notificó, cobró y entregó. **PM:** las etiquetas “recibió”, “técnico principal”, “revisó” y “entregó” son proyecciones derivadas de hechos y reglas explícitas.

## Correcciones

- **DDV:** diagnósticos, recomendaciones, rechazos y movimientos financieros previos no se borran.
- **PM:** una corrección referencia el hecho original, explica motivo, actor y efecto sustituto/compensatorio.
- **RCL:** editar campos legacy puede destruir causalidad y autoría.
- **PA:** definir quién puede corregir cada clase y qué rectificaciones de privacidad son necesarias.

## Evidencia

**IDO:** la evidencia sustenta una condición, decisión o acción, pero su mera existencia no prueba el significado del hecho. Debe conservar propósito, vínculo, actor, momento y política de acceso/retención.

## PIN y sesión

**HOV/RCA:** el PIN de cuatro dígitos y el cierre por inactividad reducen fricción en SR Taller 1.0. **DDV:** el PIN no es prueba absoluta de identidad. **PA:** controles de seguridad, recuperación y autenticación reforzada requieren decisión especializada.

## Resúmenes y timeline

**PM:** un timeline integrado puede combinar eventos, notas y actividad visualmente, pero debe conservar el tipo de cada entrada. No debe mostrar una actividad automática como si fuera decisión humana ni derivar entrega de un comentario.

## Riesgos heredados

- **RCL:** técnico y revisor son textos mutables/ambiguos.
- **RCL:** seguimientos libres cargan hechos que necesitan estructura.
- **RCL:** webhooks pueden intentarse antes de persistencia confirmada.
- **RCL:** entrega puede inferirse de un campo mutable.
- **RCL:** PIN compartido y credenciales del dispositivo implican riesgos de atribución y seguridad.
