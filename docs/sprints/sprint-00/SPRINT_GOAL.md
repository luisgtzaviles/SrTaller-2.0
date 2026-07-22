# SPRINT-00 — Discovery and Architecture Foundation

## Estado del documento

**Estado:** Propuesto / en revisión documental.
**Fechas:** TBD.
**Responsables:** TBD.
**Implementación funcional permitida:** no.

## Objetivo

Establecer una base documental, de producto, arquitectura, calidad y entrega antes de iniciar implementación.

## Resultado esperado

Una fuente navegable y trazable que permita revisar qué problema se resuelve, qué sigue abierto, qué arquitectura se propone, cómo se decidirá y qué evidencia será necesaria. SPRINT-00 no promete resolver todas las preguntas ni caber en la duración de un sprint tradicional; puede dividirse con aprobación y sin perder el gate.

## Alcance

- Visión, principios, actores, alcance, glosario, módulos y lecciones legacy.
- Modelos conceptuales de arquitectura, multitenancy, identidad, dispositivos, datos, realtime, seguridad, observabilidad y despliegue.
- ADR-001 a ADR-009 registrados inicialmente como `Proposed`; sus decisiones posteriores se consultan en el [registro oficial](../../decisions/README.md).
- Epics, PBI-001 a PBI-020, workflow, calidad, operaciones y trazabilidad.
- Consolidación de preguntas y revisiones humanas pendientes.

## Fuera de alcance

- Frontend, backend, base de datos, infraestructura, migraciones o código funcional.
- Instalación de dependencias, Dockerfiles, scaffolding o despliegues.
- Sprint de implementación, estimaciones, responsables o fechas no aprobados.
- Aceptación automática de decisiones técnicas.

## Criterio de salida

SPRINT-00 sólo puede cerrarse cuando:

- [ ] La visión del producto haya sido revisada.
- [ ] Los actores principales estén identificados.
- [ ] El mapa inicial de módulos exista.
- [ ] Las preguntas críticas estén visibles.
- [ ] El modelo multitenant preliminar esté documentado.
- [ ] El modelo de identidad y permisos esté documentado.
- [ ] La vinculación de dispositivos esté descrita.
- [ ] La arquitectura objetivo preliminar exista.
- [ ] Las alternativas principales estén registradas en ADRs `Proposed`.
- [ ] Los ambientes estén definidos.
- [ ] El flujo de trabajo esté definido.
- [ ] La estrategia de pruebas esté definida.
- [ ] El backlog inicial esté creado.
- [ ] No existan decisiones críticas ocultas en conversaciones o únicamente en código.
- [ ] El Product Owner haya aprobado explícitamente comenzar prototipos técnicos.

Que un documento exista satisface sólo la creación; los puntos que exigen revisión o aprobación permanecen abiertos hasta que exista evidencia trazable.

## Preguntas abiertas

- ¿SPRINT-00 debe dividirse en incrementos documentales?
- ¿Quiénes revisan producto, arquitectura, seguridad, calidad y operaciones?
- ¿Dónde se conservará la aprobación explícita del Product Owner?

## Próxima revisión

En la review de SPRINT-00; fecha: TBD.
