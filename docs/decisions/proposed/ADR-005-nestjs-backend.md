# ADR-005 — NestJS para backend y API

**Status: Proposed**
**Fecha:** TBD

## Estado del documento

Propuesta pendiente de evaluación; no autoriza scaffold de NestJS. [ADR-001](ADR-001-typescript-as-primary-language.md) ya satisface la dependencia de lenguaje/runtime con TypeScript y Node.js `24.x`, pero no constituye evidencia ni aceptación del framework.

Arquitectura + Ingeniería autorizaron el 2026-07-22 la ejecución futura de [SPIKE-009](../../reviews/sprint-00/PROTOTYPE_CANDIDATES.md#spike-009) como `Mandatory before acceptance`. El mandato autoriza el experimento, no lo ejecuta, no acepta NestJS y no habilita implementación de producto. Seguridad, Operaciones y Calidad deberán revisar la evidencia antes de que Arquitectura + Ingeniería decidan este ADR.

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

## Gate obligatorio de evidencia

ADR-005 no puede pasar de `Proposed` a `Accepted` o `Rejected` hasta completar y revisar SPIKE-009. El experimento parte de Node.js `24.x`, NestJS `11.x` —referencia `11.1.28` revalidada antes de ejecutar—, Express, REST/HTTP JSON mínima, PostgreSQL `18.x` —referencia `18.4` revalidada antes de ejecutar— y TypeScript estricto.

NestJS `11.1.28`, Express y REST/HTTP JSON son hipótesis del spike, no decisiones aceptadas por este ADR. El experimento deberá comparar una alternativa más ligera bajo el mismo recorrido y podrá concluir que NestJS debe rechazarse.

El mandato canónico define alcance, exclusiones, fronteras de dominio/aplicación, autorización, tenant context, persistencia, errores, auditoría, pruebas, éxito, fracaso y evidencia. Cualquier experimento que omita esos controles no satisface el gate de ADR-005.

## Consecuencias positivas

- Convenciones comunes para módulos y pruebas.
- Integración con TypeScript y Node.js `24.x` aceptados por ADR-001.
- Puntos claros para políticas transversales.

## Consecuencias negativas

- Abstracciones y dependencias adicionales del framework.
- Posible acoplamiento del dominio al framework.
- El framework no impide módulos mal delimitados.

## Riesgos

- Guard/interceptor global incompleto podría omitir controles tenant; requiere capas de defensa.
- Endpoints con demasiadas responsabilidades pueden reaparecer pese al framework.

## Criterios para reconsiderar

- Spike autorizado muestra limitaciones críticas de rendimiento, soporte o arquitectura.
- El equipo no puede operar el framework con el nivel de disciplina requerido.

## Preguntas abiertas

- ¿La evidencia de SPIKE-009 confirma REST/HTTP JSON mínima como interfaz inicial o favorece una alternativa?
- ¿Qué reglas de versionado deberá tener la interfaz si se acepta?
- ¿Qué límites se impondrán entre framework, aplicación y dominio?

## Referencias

- [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md)
- [PBI-012](../../backlog/pbis/PBI-012.md)
- [ADR-001](ADR-001-typescript-as-primary-language.md)
- [SPIKE-009 — Mandato de validación](../../reviews/sprint-00/PROTOTYPE_CANDIDATES.md#spike-009)
- [Baseline técnica de DEC-004](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md)

## Próxima revisión

Al concluir SPIKE-009 y la revisión obligatoria de su evidencia; fecha: TBD.
