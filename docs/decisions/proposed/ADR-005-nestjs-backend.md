# ADR-005 — NestJS para backend y API

**Status: Proposed**
**Fecha:** TBD

## Estado del documento

Propuesta pendiente de evaluación; no autoriza scaffold de NestJS.

## Contexto

La API central debe servir web, móviles futuros e integraciones, además de coordinar trabajos asíncronos y tiempo real. Se busca una estructura que haga visibles módulos, dependencias y políticas transversales sin mezclar presentación, aplicación, dominio y persistencia.

## Fuerzas de decisión

- Encaje con TypeScript y arquitectura modular.
- Validación, autorización, observabilidad y testabilidad consistentes.
- Soporte de HTTP, WebSockets y workers sin concentrar responsabilidades.
- Complejidad, rendimiento y curva de aprendizaje.

## Opciones consideradas

1. **NestJS:** convenciones y dependency injection; riesgo de sobreuso del framework.
2. **Fastify/Express con arquitectura propia:** control y ligereza; más decisiones y disciplina interna.
3. **Otro framework TypeScript:** viable, requiere evaluación equivalente de madurez y capacidades.
4. **Backend en otro lenguaje:** ecosistema diferente y mayor diversidad operativa.

## Decisión propuesta

Usar NestJS como shell de API y procesos de backend, manteniendo el dominio independiente de decorators y detalles de transporte. Definir contratos versionables y una política consistente de autenticación, tenant context, errores e idempotencia.

## Consecuencias positivas

- Convenciones comunes para módulos y pruebas.
- Integración con el stack TypeScript propuesto.
- Puntos claros para políticas transversales.

## Consecuencias negativas

- Abstracciones y runtime adicionales.
- Posible acoplamiento del dominio al framework.
- El framework no impide módulos mal delimitados.

## Riesgos

- Guard/interceptor global incompleto podría omitir controles tenant; requiere capas de defensa.
- Endpoints con demasiadas responsabilidades pueden reaparecer pese al framework.

## Criterios para reconsiderar

- Spike autorizado muestra limitaciones críticas de rendimiento, soporte o arquitectura.
- El equipo no puede operar el framework con el nivel de disciplina requerido.

## Preguntas abiertas

- ¿REST será el estilo inicial y qué reglas de versionado tendrá?
- ¿Qué límites se impondrán entre framework, aplicación y dominio?

## Referencias

- [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md)
- [PBI-012](../../backlog/pbis/PBI-012.md)
- [ADR-001](ADR-001-typescript-as-primary-language.md)

## Próxima revisión

Al concluir PBI-012; fecha: TBD.
