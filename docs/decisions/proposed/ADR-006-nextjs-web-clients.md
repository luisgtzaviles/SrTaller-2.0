# ADR-006 — Next.js para clientes web

**Status: Proposed**
**Fecha:** TBD

## Estado del documento

Propuesta pendiente de evaluar necesidades de cada superficie; no autoriza crear aplicaciones Next.js.

## Contexto

La plataforma requerirá aplicaciones web consistentes y una API central compartida con móviles futuros. Las necesidades de rendering público, portal operativo y administración todavía deben separarse; Next.js no debe convertirse en una segunda fuente de reglas de negocio.

## Fuerzas de decisión

- Productividad React y routing.
- Seguridad de sesiones y límites servidor/cliente.
- Design system compartido y accesibilidad.
- Despliegue independiente de superficies.
- Consumo explícito de la API central.

## Opciones consideradas

1. **Next.js:** framework React full-stack usado como cliente/BFF acotado cuando se apruebe.
2. **React SPA con Vite:** arquitectura cliente simple, con trade-offs de rendering y routing.
3. **Otro framework web:** distintas convenciones y ecosistema.
4. **Aplicación server-rendered desde backend:** menor separación respecto de la API central.

## Decisión propuesta

Adoptar Next.js y React para clientes web. Las reglas de negocio y autoridad de datos permanecerán en la API; cualquier lógica server-side del cliente tendrá límites documentados. Cada aplicación podrá desplegarse de manera independiente. Tailwind CSS y un design system propio permanecen como hipótesis separadas que deberán compararse y aprobarse antes de fijar tooling visual.

## Consecuencias positivas

- Ecosistema React compartido con conceptos móviles futuros.
- Soporte flexible de rendering y routing.
- Base para componentes y patrones visuales consistentes.

## Consecuencias negativas

- Complejidad de fronteras server/client y cachés.
- Riesgo de duplicar lógica o crear endpoints ad hoc.
- Ritmo de actualización del framework exige mantenimiento.

## Riesgos

- Fuga de datos por caché no segregada por tenant.
- Fragmentación visual si varias aplicaciones evitan el design system.

## Criterios para reconsiderar

- Requisitos de aplicación demuestran que una SPA u otra alternativa ofrece menor riesgo total.
- Limitaciones operativas o de seguridad verificadas en un prototipo autorizado.

## Preguntas abiertas

- ¿Cuántas aplicaciones web existirán y qué audiencias atenderá cada una?
- ¿Qué rendering y caching se permitirán para vistas tenant-scoped?
- ¿Tailwind CSS y un design system propio son la opción adecuada frente a alternativas, y quién tendrá ownership?

## Referencias

- [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md)
- [Accesibilidad](../../quality/ACCESSIBILITY_STRATEGY.md)
- [PBI-013](../../backlog/pbis/PBI-013.md)

## Próxima revisión

Al completar PBI-013 y definir superficies web; fecha: TBD.
