# Principios de producto

## Estado del documento

- **Estado:** Borrador inicial.
- **Naturaleza:** Principios propuestos; ninguno se considera decisión aceptada por aparecer aquí.
- **Aprobación:** Pendiente del propietario del producto y, cuando exista impacto técnico irreversible, del proceso de ADR.
- **Uso previsto:** Guiar alcance, diseño, arquitectura, backlog y revisión de cambios.

## Cómo aplicar estos principios

Cada principio expresa una preferencia predeterminada, no una regla que permita ignorar contexto. Una excepción necesita:

1. necesidad concreta y evidencia;
2. alternativas consideradas;
3. impacto en aislamiento, seguridad, datos, operación y experiencia;
4. decisión trazable en el PBI y, cuando corresponda, en un ADR;
5. criterio para retirar o revisar la excepción.

La prioridad entre principios en conflicto es una **decisión pendiente**. Aislamiento y seguridad no deben debilitarse sólo por conveniencia o velocidad.

## Principios propuestos

### 1. Aislamiento multitenant antes que conveniencia

**Propuesta:** toda operación con datos de tenant debe ejecutarse en un contexto de tenant verificable. El aislamiento no debe depender de que cada desarrollador recuerde agregar un filtro manual.

**Implicación práctica:** diseño de repositorios, trabajos asíncronos, cachés, archivos, WebSockets, logs y pruebas con contexto de tenant. Las defensas concretas siguen pendientes de los ADRs y del [modelo multitenant](../architecture/MULTITENANCY_MODEL.md).

### 2. API central como fuente de verdad

**Propuesta:** las reglas de aplicación y las transiciones válidas deben exponerse mediante una API central para clientes web, móviles futuros e integraciones autorizadas.

**Implicación práctica:** ninguna interfaz debe convertirse en fuente paralela de reglas ni acceder directamente a persistencia. “Central” no implica un único proceso desplegable para siempre.

### 3. Módulos con responsabilidades claras

**Propuesta:** cada módulo debe tener un propósito, ownership conceptual de datos y contratos explícitos con otros módulos.

**Implicación práctica:** evitar consultas o escrituras cruzadas que eludan al módulo propietario. Los límites iniciales se exploran en el [mapa de módulos](./MODULE_MAP.md).

### 4. Seguridad por defecto

**Propuesta:** negar acceso cuando falte contexto o autorización, minimizar privilegios y exigir controles reforzados para acciones sensibles según riesgo.

**Implicación práctica:** autenticación, autorización, revocación, auditoría y manejo de secretos forman parte del diseño, no tareas posteriores. Los mecanismos específicos no quedan decididos en este documento.

### 5. Diseño consistente

**Propuesta:** patrones visuales y de interacción compartidos deben pertenecer a un design system con ownership, criterios de accesibilidad y proceso de evolución.

**Implicación práctica:** evitar CSS y componentes paralelos que resuelvan el mismo patrón sin justificación documentada.

### 6. Móvil preparado, no construido prematuramente

**Propuesta:** diseñar contratos y flujos que puedan ser consumidos por clientes móviles, sin construir aplicaciones iOS o Android completas antes de validar alcance y necesidad.

**Implicación práctica:** separar reglas del cliente web y documentar restricciones móviles; la aplicación móvil sigue en un horizonte posterior.

### 7. Automatización de pruebas

**Propuesta:** convertir riesgos importantes en comprobaciones repetibles, especialmente aislamiento multitenant, permisos, contratos e integraciones.

**Implicación práctica:** un cambio no debe depender exclusivamente de verificación manual. La cobertura y los tipos de prueba se determinarán por riesgo.

### 8. Despliegues repetibles

**Propuesta:** construir artefactos versionados que puedan probarse y promoverse entre ambientes mediante procesos automatizados y observables.

**Implicación práctica:** evitar despliegues manuales por FTP, diferencias no registradas entre ambientes y reconstrucciones distintas para producción.

### 9. Observabilidad desde el inicio

**Propuesta:** identificar señales necesarias para comprender salud, comportamiento y fallos desde el diseño de cada capacidad.

**Implicación práctica:** logs estructurados, métricas, trazas y correlación deben considerar tenant y privacidad; sus tecnologías y objetivos siguen pendientes.

### 10. Documentación antes de decisiones irreversibles

**Propuesta:** registrar contexto, alternativas y consecuencias antes de comprometer una decisión difícil o costosa de revertir.

**Implicación práctica:** la documentación orienta una decisión; no reemplaza evidencia ni vuelve aceptada una propuesta. Véase el [registro de decisiones](../decisions/README.md).

### 11. Monolito modular antes de microservicios

**Propuesta:** comenzar con el monolito modular aceptado en [ADR-002](../decisions/proposed/ADR-002-modular-monolith-first.md): una sola aplicación backend y un único artefacto/despliegue iniciales, con separación lógica entre módulos y responsabilidades internas, conservando límites que permitan reevaluar la distribución futura.

**Implicación práctica:** un módulo no es un microservicio; API, procesamiento diferible y tiempo real tampoco son desplegables iniciales separados. Extraer un servicio requerirá evidencia operativa o de escalamiento y un ADR aprobado.

### 12. Cambios pequeños y trazables

**Propuesta:** relacionar cada cambio con una necesidad, PBI, decisión, prueba, evidencia y versión, y mantener el alcance lo bastante pequeño para revisarlo y revertirlo.

**Implicación práctica:** evitar cambios de propósito múltiple sin una justificación explícita.

### 13. No heredar compatibilidad innecesaria

**Propuesta:** conservar conocimiento valioso del sistema anterior, pero no copiar código, estructuras ni complejidad únicamente por precedencia.

**Implicación práctica:** toda compatibilidad o migración debe responder a un caso de negocio, datos que deban preservarse y criterios de aceptación. Véanse las [lecciones del sistema anterior](./LEGACY_SR_TALLER_LESSONS.md).

### 14. Procesos síncronos y asíncronos explícitos

**Propuesta:** distinguir la respuesta que un usuario necesita inmediatamente del trabajo que puede ejecutarse fuera de la solicitud.

**Implicación práctica:** colas, reintentos, idempotencia y fallos parciales se diseñan como parte del proceso; no se usan para ocultar responsabilidades indefinidas.

### 15. Datos y contratos con ownership

**Propuesta:** un dato o contrato importante debe tener un responsable conceptual, una fuente autoritativa y reglas de cambio.

**Implicación práctica:** Reporting y clientes pueden proyectar información, pero no convertirse silenciosamente en fuentes paralelas de verdad.

### 16. Alcance validado antes que amplitud

**Propuesta:** priorizar recorridos completos que resuelvan un problema validado sobre acumular módulos parcialmente terminados.

**Implicación práctica:** la presencia de una capacidad en la visión o el mapa modular no la compromete para la primera versión.

### 17. Privacidad y minimización de datos

**Propuesta:** recolectar, exponer y retener sólo la información necesaria para un propósito conocido y autorizado.

**Implicación práctica:** cada capacidad que maneje información personal debe aclarar finalidad, alcance, retención, exportación y eliminación conforme al contexto regulatorio que se defina.

## Comprobación durante refinamiento

Antes de considerar listo un PBI de implementación, debería poder explicarse:

- qué principio guía el diseño;
- qué principios podrían estar en tensión;
- qué impacto tiene en tenant, sucursal, permisos, datos y experiencia;
- qué evidencia demostrará su cumplimiento;
- qué excepción o decisión relacionada requiere trazabilidad.

## Preguntas abiertas

- ¿Quién puede aprobar una excepción a un principio y qué evidencia mínima debe presentar? Véase [QUESTION-004](./OPEN_QUESTIONS.md#question-004).
- ¿Qué principios se consideran bloqueantes para iniciar un prototipo técnico? Véase [QUESTION-004](./OPEN_QUESTIONS.md#question-004).
- ¿Qué restricciones regulatorias deben convertirse en principios no negociables? Véanse [QUESTION-026](./OPEN_QUESTIONS.md#question-026) y [QUESTION-030](./OPEN_QUESTIONS.md#question-030).
- ¿Qué nivel de accesibilidad se adoptará como base? Véase [QUESTION-032](./OPEN_QUESTIONS.md#question-032).

## Documentos relacionados

- [Visión de producto](./PRODUCT_VISION.md)
- [Alcance de producto](./PRODUCT_SCOPE.md)
- [Fuera de alcance](./OUT_OF_SCOPE.md)
- [Estrategia de calidad](../quality/QUALITY_STRATEGY.md)
- [Flujo de desarrollo](../delivery/DEVELOPMENT_WORKFLOW.md)

## Próxima revisión

Revisar junto con la visión y los criterios de entrada a implementación, y después de cualquier decisión que cree una excepción. **Fecha: TBD.**
