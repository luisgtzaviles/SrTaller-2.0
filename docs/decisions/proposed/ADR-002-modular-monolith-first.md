# ADR-002 — Monolito modular como punto de partida

**Status: Proposed**
**Fecha:** TBD

## Estado del documento

Propuesta arquitectónica pendiente de validar contra límites de dominio y necesidades operativas.

## Contexto

SR Taller 2.0 necesita numerosas capacidades, pero parte sin cargas ni equipos independientes comprobados. El sistema anterior sufrió acoplamiento; distribuir procesos desde el inicio no garantiza modularidad y agregaría coordinación operativa.

## Fuerzas de decisión

- Límites claros y aislamiento multitenant.
- Velocidad de aprendizaje con un equipo inicial aún por definir.
- Transacciones y consistencia entre capacidades.
- Despliegue y observabilidad sostenibles.
- Posible escala a 1,000 o más tenants sin asumir un patrón prematuro.

## Opciones consideradas

1. **Monolito modular:** un backend desplegable con módulos y contratos explícitos; workers separados por proceso.
2. **Microservicios desde el inicio:** aislamiento desplegable, con complejidad distribuida inmediata.
3. **Monolito sin límites formales:** simplicidad inicial, alto riesgo de repetir acoplamiento.

## Decisión propuesta

Comenzar con un monolito modular. Separar conceptualmente dominio, aplicación, adaptadores e infraestructura, y hacer desplegables independientes la API, los workers y clientes. La comunicación entre módulos deberá respetar ownership y contratos; una extracción futura requerirá evidencia.

## Consecuencias positivas

- Menor coste de operación y depuración inicial.
- Transacciones locales donde sean justificadas.
- Límites de módulo preparan extracción selectiva.

## Consecuencias negativas

- Un despliegue de backend puede contener cambios de varios módulos.
- Requiere enforcement para no degenerar en acoplamiento.
- Escalado independiente por módulo será limitado al inicio.

## Riesgos

- Dependencias circulares y acceso directo a datos ajenos; mitigar con reglas de arquitectura y pruebas.
- Confundir modularidad lógica con carpetas; cada módulo necesita ownership y contratos verificables.

## Criterios para reconsiderar

- Perfil de carga, aislamiento de fallos, regulación o cadencia de equipo que exija despliegue independiente.
- Un módulo con fronteras maduras y costes medidos que justifiquen extracción.

## Preguntas abiertas

- ¿Qué reglas automatizadas protegerán dependencias entre módulos?
- ¿Qué consistencia requieren los flujos que cruzan módulos?

## Referencias

- [Mapa de módulos](../../product/MODULE_MAP.md)
- [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md)
- [PBI-005](../../backlog/pbis/PBI-005.md)
- [PBI-010](../../backlog/pbis/PBI-010.md)

## Próxima revisión

Después de validar el mapa de módulos y antes del diseño ejecutable; fecha: TBD.
