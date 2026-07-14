# ADR-001 — TypeScript como lenguaje principal

**Status: Proposed**
**Fecha:** TBD

## Estado del documento

Propuesta pendiente de validación técnica; no autoriza crear aplicaciones ni instalar tooling.

## Contexto

La plataforma contempla API, workers, clientes web y móviles futuros. Compartir un lenguaje podría reducir cambios de contexto y permitir contratos reutilizables, pero no elimina la necesidad de límites entre aplicaciones ni de validar datos en runtime.

## Fuerzas de decisión

- Consistencia de tipos entre clientes y API sin acoplar dominios.
- Ecosistema de NestJS, Next.js, React Native y tooling.
- Mantenibilidad por un equipo y múltiples superficies.
- Coste de compilación, configuración y capacitación.

## Opciones consideradas

1. **TypeScript principal:** un lenguaje para aplicaciones y paquetes, con excepciones justificadas.
2. **JavaScript:** menor configuración inicial, menor protección estática.
3. **Lenguajes por componente:** libertad local, mayor coste operativo y de contratación.

## Decisión propuesta

Usar TypeScript como lenguaje principal de API, workers, clientes y paquetes compartidos. Mantener validación de entradas en runtime y permitir excepciones documentadas para automatización o componentes cuya plataforma lo exija.

## Consecuencias positivas

- Contratos más explícitos y refactors asistidos.
- Alineación con el stack preliminar.
- Menor cambio de contexto entre superficies.

## Consecuencias negativas

- Tooling y disciplina adicionales.
- Riesgo de confundir tipos compilados con validación de seguridad.
- Posible acoplamiento si se comparten modelos internos indiscriminadamente.

## Riesgos

- Una configuración divergente entre paquetes puede erosionar consistencia; se mitigaría con una base común revisada.
- Los tipos compartidos pueden filtrar detalles de persistencia; se requieren contratos públicos separados.

## Criterios para reconsiderar

- Necesidad demostrada de un runtime o ecosistema no servido adecuadamente por TypeScript.
- Coste de rendimiento o soporte comprobado mediante un PBI de evaluación.

## Preguntas abiertas

- ¿Qué excepciones de lenguaje estarán permitidas y quién las aprueba?
- ¿Qué contratos podrán compartirse entre servidor y clientes?

## Referencias

- [Arquitectura objetivo](../../architecture/TARGET_ARCHITECTURE.md)
- [PBI-010](../../backlog/pbis/PBI-010.md)
- [PBI-012](../../backlog/pbis/PBI-012.md)

## Próxima revisión

Durante el gate técnico previo a Engineering Foundation; fecha: TBD.
