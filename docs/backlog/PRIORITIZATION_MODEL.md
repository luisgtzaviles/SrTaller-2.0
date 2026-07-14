# Modelo de priorización

## Estado del documento

**Estado:** Propuesta sencilla para facilitar conversación; no es una fórmula automática ni orden aprobado.

## Factores

Cada PBI puede discutirse con una escala cualitativa `Bajo / Medio / Alto`, acompañada de evidencia:

| Factor | Pregunta | Efecto esperado |
|---|---|---|
| Valor | ¿Qué resultado útil habilita para producto, usuario u operación? | Mayor valor adelanta el ítem. |
| Reducción de riesgo | ¿Qué incertidumbre o exposición crítica reduce? | Mayor reducción adelanta el ítem. |
| Urgencia | ¿Existe una ventana o coste real de demora? | Urgencia demostrada adelanta; no inventar fechas. |
| Dependencia | ¿Desbloquea otros resultados o está bloqueado por ellos? | Los habilitadores suelen adelantarse. |
| Esfuerzo | ¿Qué coste relativo prevé el equipo con información actual? | Menor esfuerzo puede favorecer aprendizaje temprano; estimación sigue TBD. |
| Aprendizaje | ¿Qué hipótesis valida y cuánto cambia decisiones posteriores? | Mayor aprendizaje temprano adelanta descubrimiento. |

## Proceso propuesto

1. Confirmar que el problema y valor sean entendibles.
2. Registrar evidencia y nivel por factor, sin sumar números con falsa precisión.
3. Identificar gates de seguridad, multitenancy y cumplimiento que prevalecen sobre conveniencia.
4. Ordenar comparando ítems y hacer explícitos los trade-offs.
5. Product Owner aprueba el orden final; el equipo valida esfuerzo, riesgo y dependencias.
6. Revisar el orden cuando cambie evidencia, no sólo por antigüedad.

## Restricciones

- La prioridad no sustituye la Definition of Ready.
- `Alta` o `Crítica` no asigna automáticamente un sprint.
- Una dependencia arquitectónica propuesta debe aprobarse antes de implementación irreversible.
- No se inventan story points; estimación y técnica permanecen `TBD` hasta acordarse.

## Preguntas abiertas

- ¿Qué escala de esfuerzo adoptará el equipo?
- ¿Qué autoridad resuelve conflictos entre valor, seguridad y operación?

## Próxima revisión

Antes del primer refinamiento de implementación; fecha: TBD.
