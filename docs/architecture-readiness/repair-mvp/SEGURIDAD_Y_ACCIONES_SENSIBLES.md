# Seguridad y acciones sensibles

La autorización ordinaria se rige por [ADR-012](../../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md) y la reforzada por [ADR-013](../../decisions/proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md). Este documento conserva como propuesta la clasificación concreta por acción: una candidata sin política suficiente permanece en nivel 4 y no se habilita.

## Acciones sensibles del MVP

| Acción | Sensibilidad respaldada | Control concreto | Estado |
| --- | --- | --- | --- |
| Modificar precio o descuento extraordinario | Impacto financiero | Nivel 2 o 3 y umbral por política | Candidata MVP; nivel 4 mientras falte política |
| Cancelar, corregir o devolver pago | Impacto financiero y compensación | Nivel 2 o 3, motivo y evidencia por política | Candidata MVP; nivel 4 mientras falte política |
| Corregir entrega o entregar por excepción | Custodia, tercero y posible irreversibilidad | Nivel 2 o 3 por política | Candidata MVP; nivel 4 mientras falte política |
| Reabrir orden o modificar después del cierre | Estado terminal e historia | Reapertura no aprobada; decisión funcional requerida | Nivel 4 |
| Saltar segunda revisión o mínimos de evidencia | Excepción a control operativo | Nivel 3 si una política futura lo permite | Nivel 4 mientras falte política |
| Gestionar roles o asignaciones | Modificación de seguridad | Nivel 2 o 3 por política de R0 | Candidata R0; nivel 4 mientras falte política |
| Revocar usuario | Modificación de seguridad | Nivel 2 o 3 por política de R0 | Candidata R0; nivel 4 mientras falte política |
| Vincular, desvincular o revocar estación | Contexto operativo y seguridad | Nivel 2 o 3 por política de R0 | Candidata R0; nivel 4 mientras falte política |
| Retirar, alterar o eliminar evidencia | Alteración de evidencia | Nivel 2 o 3; borrado destructivo no autorizado por defecto | Candidata futura; nivel 4 mientras falte política |
| Modificar políticas críticas | Afectación transversal | Nivel 2 o 3 por política | Candidata; nivel 4 mientras falte política |
| Suplantar usuario o acceso break-glass | Acceso excepcional | Decisión separada | Fuera de R0, nivel 4 |
| Cambiar técnico responsable | Cambio operativo atribuible | Nivel 1 salvo condición sensible explícita | Candidata ordinaria; motivo según política |
| Reemplazar cotización autorizada | Nueva versión y nueva decisión comercial | No se edita la versión previa | La sustitución sigue el flujo ordinario; excepción sensible pendiente |
| Ver o adjuntar evidencia | Acceso por propósito y recurso | Nivel 1 salvo categoría/condición sensible explícita | Clasificar por rebanada |

## Controles obligatorios antes de implementación funcional

- **[RP]** Modelo de amenazas inicial de multitenancy, identidad/PIN, archivos y primera integración.
- **[RP]** Composición de roles/capacidades y clasificación nivel 1–4 por rebanada conforme a ADR-012/013.
- **[RP]** Estrategia de secretos y ambientes.
- **[RP]** Pruebas negativas para aislamiento, autorización y archivos.
- **[ADR]** Decisiones críticas registradas y aceptadas por el proceso aplicable.

## Controles antes de producción

- **[RP]** Pruebas de aislamiento y bypass de autorización.
- **[RP]** Revisión de cargas de archivos, referencias directas y exposición de datos.
- **[RP]** Backups/restauración y revocación ensayados.
- **[RP]** Observabilidad y procedimientos operativos mínimos.
- **[RP]** Riesgos residuales aceptados por autoridad competente.

## Prohibiciones

- **[R]** No registrar secretos, PIN, tokens o evidencia sensible en logs.
- **[R]** No conceder bypass permanente a soporte o plataforma.
- **[R]** No confiar en ocultamiento de la interfaz de usuario como autorización.
- **[R]** No exponer archivos mediante rutas predecibles sin control de acceso.
- **[R]** No usar borrado destructivo para ocultar correcciones financieras, comerciales, de entrega o evidencia sujeta a retención.
