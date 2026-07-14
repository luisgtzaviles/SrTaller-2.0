# ADR-009 — Monorepo con workspaces y orquestación de tareas

**Status: Proposed**
**Fecha:** TBD

## Estado del documento

Propuesta pendiente de definir ownership y pipeline; no autoriza instalar pnpm/Turborepo ni crear scaffolding.

## Contexto

API, workers, aplicaciones web y clientes móviles futuros podrían compartir tooling, contratos públicos y design system. Un único repositorio facilita cambios coordinados, pero puede ocultar acoplamiento y hacer pipelines costosos si no hay límites.

## Fuerzas de decisión

- Cambios atómicos entre contratos y consumidores.
- Ownership, revisión y aislamiento de secretos.
- Builds reproducibles y selectivos.
- Versionado de paquetes y velocidad de CI.
- Capacidad del equipo, todavía TBD.

## Opciones consideradas

1. **Monorepo con workspaces y orquestación de tareas:** coordinación central y ejecución incremental; herramientas por evaluar.
2. **Polyrepo:** autonomía fuerte, mayor coordinación de contratos/versiones.
3. **Monorepo sin orquestador:** menor tooling inicial, pipelines menos eficientes al crecer.
4. **Selección independiente de gestor/orquestador:** comparar pnpm/Turborepo con alternativas después de aprobar la topología del repositorio.

## Decisión propuesta

Usar un monorepo para aplicaciones y paquetes aprobados. Definir límites de importación, ownership, comandos consistentes y caché sin secretos. Compartir contratos y componentes, no internals de dominio ni persistencia. pnpm workspaces y Turborepo permanecen como candidatos preliminares y requieren comparación antes de fijar tooling.

## Consecuencias positivas

- Un cambio puede actualizar contrato, consumidor, pruebas y documentación atómicamente.
- Tooling y estándares centralizados.
- Potencial de CI selectivo por grafo.

## Consecuencias negativas

- Configuración y caché requieren mantenimiento.
- Acceso amplio al repositorio y revisiones pueden convertirse en cuello de botella.
- Riesgo de imports indebidos entre aplicaciones.

## Riesgos

- Caché remota podría capturar datos sensibles; requiere política explícita.
- Grafo acoplado invalida beneficios de builds selectivos; proteger fronteras.

## Criterios para reconsiderar

- Equipos, seguridad o cadencias de release requieren repositorios aislados.
- Métricas de CI muestran que el modelo no escala de forma sostenible.

## Preguntas abiertas

- ¿Qué paquetes compartidos se permitirán y quién será owner?
- ¿Cómo se versionarán contratos consumidos fuera del monorepo?
- ¿Se autorizará caché remota y con qué controles?
- ¿Qué criterios decidirán entre pnpm/Turborepo y sus alternativas?

## Referencias

- [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md)
- [Workflow](../../delivery/DEVELOPMENT_WORKFLOW.md)
- [PBI-010](../../backlog/pbis/PBI-010.md)

## Próxima revisión

Antes de crear estructura ejecutable del repositorio; fecha: TBD.
