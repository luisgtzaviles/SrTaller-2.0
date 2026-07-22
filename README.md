# SR Taller 2.0

> **ALTO — etapa documental:** todavía no debe iniciarse implementación funcional, scaffolding, instalación de dependencias ni infraestructura. El inicio de prototipos técnicos requiere cerrar los gates de [SPRINT-00](docs/sprints/sprint-00/SPRINT_GOAL.md) y aprobación explícita del Product Owner.

SR Taller 2.0 es la evolución planificada de una plataforma SaaS para administrar talleres de reparación de celulares. La intención es ofrecer una API central y clientes consistentes para operar tenants, sucursales, personas, dispositivos, reparaciones, inventario, CRM, mensajería, pagos y otras capacidades, con aislamiento multitenant como requisito transversal.

## Estado actual

- **Fase:** descubrimiento y arquitectura.
- **Código funcional:** no iniciado.
- **Decisiones técnicas:** ADR-002, ADR-004 y ADR-010 aceptados; las demás decisiones técnicas permanecen propuestas.
- **Sprint actual:** [SPRINT-00 — Discovery and Architecture Foundation](docs/sprints/sprint-00/SPRINT_GOAL.md).
- **Estimaciones, responsables y fechas:** TBD; requieren aprobación.

## Navegación

- [Índice completo de documentación](docs/README.md)
- [Visión del producto](docs/product/PRODUCT_VISION.md)
- [Product backlog](docs/backlog/PRODUCT_BACKLOG.md)
- [Sprint backlog actual](docs/sprints/sprint-00/SPRINT_BACKLOG.md)
- [Registro de decisiones](docs/decisions/README.md)
- [Preguntas abiertas](docs/product/OPEN_QUESTIONS.md)
- [Cómo contribuir](CONTRIBUTING.md)
- [Historial documental](CHANGELOG.md)

## Organización documental

`docs/product` define el propósito y vocabulario; `docs/architecture` describe límites y modelos conceptuales; `docs/decisions` conserva alternativas y consecuencias; `docs/backlog` organiza epics y PBIs; `docs/sprints` hace visible el trabajo acordado; `docs/delivery`, `docs/quality` y `docs/operations` establecen los controles para construir, verificar y operar.

## Reglas para comenzar trabajo

1. Partir de un PBI que cumpla la [Definition of Ready](docs/delivery/DEFINITION_OF_READY.md).
2. Confirmar alcance, dependencias, impactos multitenant, permisos y datos.
3. Registrar como ADR toda decisión arquitectónica significativa antes de tratarla como aceptada.
4. Mantener trazabilidad entre epic, PBI, tareas futuras, decisiones, cambios, pruebas, evidencia y release.
5. No asumir reglas de negocio, métricas, fechas, responsables ni estimaciones no aprobadas.
6. Durante SPRINT-00 sólo producir entregables documentales y revisiones.

## Estado del documento

**Estado:** Borrador para revisión.
**Hecho conocido:** el repositorio se encuentra en fundación documental.
**Decisión pendiente:** autorización para iniciar prototipos técnicos.

## Próxima revisión

Al revisar el criterio de salida de SPRINT-00; fecha: TBD.
