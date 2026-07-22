# Reglas de dependencia

## Reglas propuestas y momento de aplicación

| Regla | Momento | Clasificación |
| --- | --- | --- |
| El dominio no depende de controladores, interfaz ni persistencia | Obligatoria desde el primer cambio de código | DAR |
| Un módulo no modifica directamente el estado interno de otro | Obligatoria desde el primer cambio de código | DAR |
| La aplicación coordina casos de uso | Obligatoria desde el primer cambio de código | DAR |
| Infraestructura implementa contratos definidos hacia adentro | Obligatoria desde el primer cambio de código | DAR |
| Tablas de otro módulo no son contrato | Obligatoria desde el primer cambio de código | DAR |
| Eventos no ocultan una transacción que exige consistencia inmediata | Obligatoria desde el primer cambio de código | DAR |
| No usar eventos para todo | Recomendada; revisar en cada caso | DAR |
| No compartir entidades de dominio mutables entre módulos | Obligatoria desde el primer cambio de código | DAR |
| Compartir identificadores, versiones y contratos mínimos, no agregados | Obligatoria desde el primer cambio de código | DAR |
| Evitar un módulo “Común” con lógica de negocio indiscriminada | Obligatoria desde el primer cambio de código | DAR |
| Dinero, identidad, tiempo e identificadores pueden usar núcleo compartido mínimo | Recomendada si reduce duplicación semántica | DAP |
| El núcleo compartido debe ser pequeño y estable | Obligatoria si se crea dicho núcleo | DAR |
| No confiar en filtros de interfaz para reglas o autorización | Obligatoria desde el primer cambio de código | RDD |
| Tenant, sucursal, estación y usuario forman el contexto efectivo de toda operación ordinaria | Obligatoria desde el primer cambio de código | RDD, ADR-010 |
| Toda consulta y mutación respeta aislamiento tenant | Obligatoria desde el primer cambio de código | RDD |
| Todo caso de uso declara si su acción es ordinaria o sensible y aplica el nivel aceptado sin delegar el control a la interfaz | Obligatoria desde la primera rebanada que incluya la acción | ADR-013 |
| Automatizar reglas con herramienta de análisis arquitectónico | Diferible hasta aceptar el conjunto tecnológico | DD |

## Política de excepciones

**[R]** Una excepción no documentada convierte la frontera en aspiracional. Toda excepción temporal debe indicar alcance, riesgo, responsable, fecha de retiro y prueba que impida extenderla.

## Verificación recomendada

- **[DAR]** Pruebas de arquitectura o análisis estático para dirección de dependencias.
- **[DAR]** Revisión de propiedad en cada cambio de persistencia.
- **[DAR]** Pruebas negativas de aislamiento y permisos en contratos públicos.
- **[ADR-013]** Pruebas negativas del nivel de sensibilidad, reautenticación, segundo aprobador distinto, uso único e invalidación cuando apliquen.
- **[DD]** Elegir herramienta concreta después de aceptar lenguaje, marco tecnológico y topología.

## Regla de diseño

**[DAR]** Si un caso de uso necesita demasiados datos internos de otro módulo, primero se revisa la frontera o se define una consulta publicada. No se resuelve compartiendo entidades persistentes.
