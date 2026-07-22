# ADR-005 — NestJS para backend y API

**Status: Proposed**
**Fecha:** TBD

## Estado del documento

Propuesta pendiente de decisión; no autoriza scaffold de NestJS. [ADR-001](ADR-001-typescript-as-primary-language.md) ya satisface la dependencia de lenguaje/runtime con TypeScript y Node.js `24.x`, pero no constituye aceptación del framework.

Arquitectura + Ingeniería autorizaron y se ejecutó el 2026-07-22 [SPIKE-009](../../reviews/sprint-00/PROTOTYPE_CANDIDATES.md#spike-009) como `Mandatory before acceptance`. Tras el dictamen `APPROVED FOR ADR REVIEW WITH REQUIRED REMEDIATIONS` (Opción B), la remediación acotada obtuvo `REMEDIATIONS PASS — ready for focused re-review`. Seguridad, Operaciones y Calidad todavía deben re-revisar la [evidencia](../../../spikes/spike-009-nestjs-shell/EVIDENCE.md) antes de que Arquitectura + Ingeniería decidan; por ello el estado continúa `Proposed` y no se habilita implementación de producto.

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

La ejecución y remediación de SPIKE-009 completaron la producción de evidencia, pero ADR-005 no puede pasar de `Proposed` a `Accepted` o `Rejected` hasta concluir la re-revisión enfocada. El experimento usó Node.js `24.18.0`, NestJS `11.1.28`, Express, REST/HTTP JSON mínima, PostgreSQL `18.4` y TypeScript estricto.

NestJS `11.1.28`, Express y REST/HTTP JSON son hipótesis del spike, no decisiones aceptadas por este ADR. El experimento deberá comparar una alternativa más ligera bajo el mismo recorrido y podrá concluir que NestJS debe rechazarse.

El mandato canónico define alcance, exclusiones, fronteras de dominio/aplicación, autorización, tenant context, persistencia, errores, auditoría, pruebas, éxito, fracaso y evidencia. La ejecución original (31/31) y la remediación posterior (48/48 repetidas) se documentan en [EVIDENCE.md](../../../spikes/spike-009-nestjs-shell/EVIDENCE.md); la evaluación vigente y los riesgos se documentan en [RESULTS.md](../../../spikes/spike-009-nestjs-shell/RESULTS.md).

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

- La evidencia favorece NestJS sobre Express directo como shell condicionado y confirma REST/HTTP JSON como interfaz suficiente para el experimento; el contrato definitivo permanece fuera de este ADR.
- ¿Qué reglas de versionado deberá tener la interfaz si se acepta?
- ¿Qué límites se impondrán entre framework, aplicación y dominio?

## Referencias

- [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md)
- [PBI-012](../../backlog/pbis/PBI-012.md)
- [ADR-001](ADR-001-typescript-as-primary-language.md)
- [SPIKE-009 — Mandato de validación](../../reviews/sprint-00/PROTOTYPE_CANDIDATES.md#spike-009)
- [SPIKE-009 — Evidencia](../../../spikes/spike-009-nestjs-shell/EVIDENCE.md)
- [SPIKE-009 — Resultados y condiciones](../../../spikes/spike-009-nestjs-shell/RESULTS.md)
- [Baseline técnica de DEC-004](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md)

## Próxima revisión

Al concluir la revisión obligatoria de la evidencia por Seguridad + Operaciones + Calidad; fecha: TBD.
