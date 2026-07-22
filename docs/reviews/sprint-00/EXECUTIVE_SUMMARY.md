# Resumen ejecutivo de Sprint 00

## Estado del documento

- **Estado:** Preparado para revisión humana.
- **Naturaleza:** Evaluación y recomendación; no es acta de aprobación.
- **Estimación cualitativa:** **Partially ready**.

**Actualización posterior:** este documento conserva la evaluación histórica de Sprint 00. Varios ADR fueron aceptados posteriormente; las afirmaciones históricas sobre nueve ADRs `Proposed` describen únicamente el momento de esta evaluación. El [registro oficial](../../decisions/README.md) es la fuente del estado vigente.

## Lectura ejecutiva

Sprint 00 produjo una fundación documental extensa: visión y principios, catálogo inicial de actores, glosario, mapa de 21 módulos, modelos conceptuales de arquitectura, controles de entrega/calidad/operación, 15 epics, 20 PBIs y nueve ADRs propuestos. Product Backlog y Sprint Backlog contienen los mismos 20 PBIs. No existe código funcional, infraestructura ni dependencia instalada.

En la fecha de esta evaluación, la existencia de esos documentos no significaba que el producto estuviera decidido: las 34 preguntas canónicas seguían abiertas; no había evidencia de aprobación del Product Owner; los 100 criterios de aceptación de los PBIs continuaban sin marcar; los nueve ADRs estaban en `Proposed`; Review y Retrospective estaban pendientes. Esta oración es una fotografía histórica y no reemplaza estados o decisiones posteriores.

## Qué está suficientemente documentado para revisión

- intención del producto, principios y lecciones del sistema anterior;
- vocabulario y límites modulares iniciales;
- modelos conceptuales de tenant, sucursal, identidad, dispositivo, datos, seguridad y mensajería;
- alternativas arquitectónicas principales y consecuencias iniciales;
- workflow, calidad, observabilidad, ambientes, recuperación y trazabilidad deseada;
- backlog documental y riesgos explícitos.

“Suficientemente documentado” significa que existe material concreto para decidir. No significa que sus reglas o tecnologías estén aprobadas.

## Qué permanece abierto

- segmento y tipo de taller prioritario, problema principal, métricas y recorrido inicial;
- frontera tenant/sucursal y datos compartidos o locales;
- identidad, roles, acciones sensibles, dispositivos, PIN, revocación y soporte excepcional;
- flujo de reparación, inventario, pagos, cajas y garantía;
- presencia de CRM/mensajería y canal o proveedor inicial;
- planes, suscripciones, retención, jurisdicción, migración y administración central;
- superficies web, restricciones operativas, perfil de carga y niveles de servicio;
- autoridad y evidencia requeridas para aceptar ADRs.

## Qué impide comenzar implementación

1. No hay un recorrido ni un primer release aprobado; implementar ahora convertiría hipótesis en reglas de negocio.
2. Decisiones de aislamiento, identidad y PIN aún necesitan respuestas de producto y evidencia de seguridad.
3. Algunas propuestas —hostname, contenedores y Next.js para todas las webs— aparecen como obligación fuera de ADRs todavía propuestos.
4. Shared-schema, wildcard subdomains y el modelo operativo de dispositivo/PIN requieren validación antes de implementar sus partes de riesgo.
5. No existe todavía autoridad formal para aceptar ADRs ni autorización para ejecutar prototipos.

## Decisiones principales

Las decisiones de producto deben seguir los Gates 1 a 6 de la [secuencia](./DECISION_SEQUENCE.md): producto inicial, organización, identidad/operación, dominio central, CRM/mensajería y comercialización. El Gate 7 técnico sólo puede completarse formalmente después de resolver los gates que condicionan cada ADR.

Actualización posterior: ADR-001 aceptó TypeScript y Node.js `24.x`, ADR-002 el monolito modular, ADR-003 PostgreSQL con baseline 18.x y ADR-004 la topología shared-schema el 2026-07-21. Wildcard sigue propuesto; NestJS necesita validación técnica; Next.js debe dividirse o limitarse a una superficie aprobada; contenedores y monorepo no obligan a Docker Compose, GitHub Actions, pnpm ni Turborepo.

## Riesgo de comenzar demasiado pronto

El mayor riesgo no es elegir una librería imperfecta: es construir límites de datos, permisos y recorridos equivocados y después descubrir que no corresponden al taller, al mercado o al modelo comercial elegido. Eso amplificaría retrabajo, riesgo de fuga entre tenants, migraciones difíciles y alcance innecesario de CRM o infraestructura.

## Recomendación

1. Realizar una sesión dirigida con el Product Owner usando el [cuestionario](./PRODUCT_OWNER_QUESTIONNAIRE.md) y resolver primero los gates de producto.
2. Usar **Opción A — Foundation only** como hipótesis inicial de reducción, condicionada a que el recorrido prioritario la valide.
3. Registrar la autoridad de aceptación de ADRs y decidir cuáles validaciones técnicas se autorizan; no ejecutar todos los spikes por defecto.
4. Como recomendación de cierre, **Close documentation foundation and open a separate decision sprint**, sólo después de registrar la decisión del Product Owner. No cerrar Sprint 00 ni crear otro sprint desde esta revisión.

## Clasificación de preparación

**Partially ready:** existe material suficiente para una revisión ejecutiva y técnica ordenada, pero no para implementación. Tampoco se clasifica todavía como `Ready for technical prototypes`: los candidatos están definidos, pero sus gates, prioridades y autorización siguen pendientes.

## Próxima revisión

Durante la sesión de decisión de Sprint 00; fecha y participantes: **TBD**.
