# Fuera de alcance

## Estado del documento

- **Estado:** Borrador inicial.
- **Naturaleza:** Límites explícitos para la etapa de fundación y no objetivos preliminares.
- **Aprobación:** Pendiente del propietario del producto.
- **Efecto:** Estar fuera de alcance no elimina una posibilidad futura; impide asumirla o implementarla sin volver a priorizarla.

## Propósito

Este documento protege la etapa documental frente a implementación prematura y protege el producto frente a compromisos no validados. Una exclusión sólo puede cambiar mediante una decisión visible, actualización del backlog e impacto documentado.

## Fuera de alcance durante la fundación

Los siguientes son **límites conocidos de la tarea actual**:

- frontend, backend, base de datos, infraestructura o código funcional;
- aplicaciones Next.js, NestJS, React Native u otros clientes ejecutables;
- instalación de dependencias o scaffolding de frameworks;
- Dockerfiles, Docker Compose ejecutable, pipelines u otra automatización operativa;
- esquemas de base de datos ejecutables, migraciones o datos semilla;
- implementación de módulos, endpoints, workers, WebSockets o integraciones;
- prototipos funcionales;
- inicio del Sprint 1;
- decisiones técnicas marcadas como aceptadas sin revisar alternativas y consecuencias;
- reglas de negocio inferidas de forma no confirmada;
- fechas, responsables, presupuestos, story points o estimaciones presentados como aprobados;
- copia de código del SR Taller anterior;
- commits, push, despliegues o cambios en sistemas externos.

El resultado de la fundación son documentos revisables, preguntas, propuestas y gates de decisión.

## No objetivos preliminares del producto

### Aplicaciones móviles completas

**Exclusión temporal:** la arquitectura puede prepararse para clientes iOS y Android futuros, pero no se construirán prematuramente. Su entrada requiere validar actores, recorridos móviles, capacidades offline, distribución, seguridad y retorno esperado.

### Microservicios

**Exclusión arquitectónica inicial:** no se distribuirán módulos como microservicios por anticipación. La propuesta es comenzar con un monolito modular y reevaluar extracción sólo ante evidencia de límites de escalamiento, aislamiento operativo, ownership o frecuencia de cambio.

### Kubernetes

**Exclusión de infraestructura inicial:** no existe evidencia de que su complejidad sea necesaria. Cualquier evaluación futura requiere necesidades operativas, competencias, costos y alternativas comparables.

### Personalización ilimitada por tenant

**No objetivo:** el producto no prometerá lógica, interfaz o flujos arbitrarios para cada tenant. Se podrán explorar configuraciones acotadas y versionables cuando exista una necesidad común y ownership claro.

### Base independiente para cada tenant

**Exclusión de la dirección preliminar:** no se diseñará una base de datos separada por tenant como punto de partida. La estrategia compartida con `tenant_id` y la evaluación de Row-Level Security permanecen propuestas sujetas a ADR; cualquier excepción debe justificar aislamiento, costo y operación.

### Marketplace

**Exclusión temporal:** no se construirán catálogo, publicación, revisión, instalación ni monetización de extensiones de terceros durante el alcance inicial.

### Inteligencia artificial como dependencia central

**No objetivo:** ningún recorrido crítico dependerá de IA sin problema validado, evaluación de datos, seguridad, costo, explicabilidad y mecanismo alternativo. Esto no impide experimentos futuros aprobados.

### Migración automática completa desde SR Taller

**Exclusión explícita:** no se asumirá que toda la información, comportamiento o complejidad anterior deba migrarse. Primero deben definirse datos necesarios, calidad, transformación, reconciliación, coexistencia y rollback.

### Soporte para todos los canales de mensajería

**Exclusión temporal:** la arquitectura puede contemplar adaptadores, pero cada canal necesita un caso prioritario, restricciones del proveedor, consentimiento, costos y modelo operativo.

### Facturación de todos los países

**Exclusión explícita:** no se prometerá cobertura fiscal universal. Países, comprobantes, impuestos, moneda, proveedores y responsabilidades regulatorias siguen pendientes.

### Implementación antes de aprobar arquitectura y backlog

**Gate de proceso:** no se inicia implementación funcional hasta que se cumpla el criterio de salida de Sprint 00 y el propietario del producto apruebe comenzar prototipos técnicos.

## Capacidades contempladas, pero no comprometidas

La presencia de CRM, Messaging, Payments, Cash Register, Notifications, Reporting, Integrations, suscripciones o aplicaciones móviles en la visión y el mapa modular significa que sus límites deben considerarse; no significa que formen parte de una primera versión. Véase [Alcance de producto](./PRODUCT_SCOPE.md).

## Criterio propuesto para reingresar una exclusión

Una capacidad o enfoque excluido sólo debería regresar al alcance cuando exista:

1. problema y actor concretos;
2. evidencia o aprendizaje que cambie el contexto;
3. resultado esperado y prioridad aprobados;
4. alternativas y costo de oportunidad visibles;
5. impactos de tenant, sucursal, permisos, datos, seguridad, operación y migración analizados;
6. PBI con criterios de aceptación y dependencias;
7. ADR aprobado cuando cambie una decisión arquitectónica.

## Preguntas abiertas

- ¿Qué condiciones concretas autorizan pasar de documentación a prototipos técnicos? Véanse el [Sprint 00](../sprints/sprint-00/SPRINT_GOAL.md) y [QUESTION-004](./OPEN_QUESTIONS.md#question-004).
- ¿Qué segmento, país y recorrido inicial permiten delimitar una primera versión? Véanse [QUESTION-001](./OPEN_QUESTIONS.md#question-001), [QUESTION-003](./OPEN_QUESTIONS.md#question-003) y [QUESTION-030](./OPEN_QUESTIONS.md#question-030).
- ¿Qué información del sistema anterior debe preservarse por obligación o valor operativo? Véase [QUESTION-033](./OPEN_QUESTIONS.md#question-033).

## Documentos relacionados

- [Visión de producto](./PRODUCT_VISION.md)
- [Principios de producto](./PRODUCT_PRINCIPLES.md)
- [Alcance de producto](./PRODUCT_SCOPE.md)
- [Lecciones de SR Taller](./LEGACY_SR_TALLER_LESSONS.md)
- [Backlog de producto](../backlog/PRODUCT_BACKLOG.md)

## Próxima revisión

Revisar al proponer la primera versión, al responder una pregunta que cambie un límite o antes de aceptar un ADR que contradiga una exclusión. **Fecha: TBD.**
