# Lecciones del sistema anterior SR Taller

## Estado del documento

- **Estado:** Borrador inicial.
- **Naturaleza:** Registro de evidencia proporcionada y lecciones propuestas; no es una evaluación de personas ni una decisión de migración.
- **Aprobación:** Pendiente de revisión con quienes conocen la operación y el sistema anterior.
- **Límite de evidencia:** No se inspeccionó código, base de datos, infraestructura, métricas, incidencias ni documentación del legado para esta versión.

## Enfoque

El sistema anterior se construyó bajo un contexto, restricciones y necesidades que este documento no reconstruye. Sus fricciones son información para mejorar SR Taller 2.0, no un juicio sobre el trabajo o las personas que lo hicieron.

Se distinguen:

- **Hechos conocidos:** observaciones incluidas en el contexto inicial.
- **Hipótesis:** explicaciones o riesgos que necesitan evidencia.
- **Lecciones propuestas:** prácticas para la nueva plataforma sujetas a revisión.
- **Decisiones pendientes:** migración, compatibilidad y preservación de datos o comportamientos.

## Contexto conocido

**Hecho conocido:** existió una versión anterior denominada SR Taller. El contexto inicial identifica fricciones de arquitectura, aislamiento multitenant, tiempo real, experiencia visual, documentación, entrega y trazabilidad.

**Hecho conocido:** SR Taller 2.0 parte como un proyecto nuevo y no debe copiar código del sistema anterior ni asumir una migración automática completa.

**Información no disponible:** usuarios y tenants activos, funciones utilizadas, volumen y calidad de datos, contratos, obligaciones de conservación, componentes, costos, disponibilidad, incidentes y flujos valorados. Cualquier conclusión sobre estos asuntos sería una hipótesis.

## Decisiones que funcionaron

No existe evidencia suficiente en el material inicial para declarar una decisión técnica concreta del sistema anterior como exitosa. Registrar esta ausencia evita convertir precedencia en aprobación.

Sí pueden reconocerse dos resultados sin atribuirles una causa técnica no demostrada:

1. **Aprendizaje acumulado:** la existencia del sistema produjo conocimiento sobre el dominio y dejó visibles problemas que la nueva fundación puede tratar de forma explícita.
2. **Base para investigación:** vocabulario, datos, recorridos y comportamientos del legado pueden servir como insumos de descubrimiento, siempre que usuarios y propietario del producto los validen.

**Candidatos por validar**, no hechos confirmados:

- recorridos que las personas siguen usando y consideran valiosos;
- datos históricos necesarios para continuidad, garantía, auditoría o atención al cliente;
- reglas del negocio que siguen vigentes por razones operativas o legales;
- integraciones o reportes cuya necesidad persiste;
- patrones de interfaz familiares que reduzcan fricción sin heredar inconsistencias.

La revisión humana debe identificar qué decisiones o prácticas sí funcionaron, con evidencia y contexto.

## Decisiones y prácticas que generaron fricción

Los siguientes son **hechos conocidos proporcionados por el proyecto**:

- frontend, backend, SQL y reglas de negocio mezclados;
- módulos altamente acoplados;
- filtrado multitenant aplicado manualmente;
- riesgo de exposición de información entre tenants;
- archivos PHP actuando simultáneamente como vistas, controladores y acceso a datos;
- dificultad para consumir el mismo backend desde otros clientes;
- mensajería en tiempo real añadida mediante soluciones externas y hacks;
- inconsistencias visuales y componentes duplicados;
- documentación creada después de la implementación;
- despliegues lentos o manuales;
- dificultad para validar cambios entre local, staging y producción;
- ausencia de gestión formal de backlog, PBIs, sprints y decisiones arquitectónicas.

El documento no atribuye causa raíz ni frecuencia a estas fricciones porque no existe evidencia adicional.

## Riesgos identificados

| Riesgo | Evidencia disponible | Consecuencia posible para SR Taller 2.0 | Tratamiento propuesto |
|---|---|---|---|
| Exposición entre tenants | Filtrado multitenant manual y riesgo de exposición declarados | Incidente de confidencialidad o modificación cruzada | Contexto de tenant obligatorio, defensas por capas y pruebas automáticas de aislamiento |
| Cambio con efectos inesperados | Módulos altamente acoplados | Regresiones y dificultad para desplegar cambios pequeños | Límites modulares, contratos, ownership y pruebas por riesgo |
| Reglas divergentes por cliente | Dificultad para consumir el mismo backend desde otros clientes | Comportamientos distintos entre web, móvil e integraciones | API central como fuente de verdad |
| Pérdida o duplicación de mensajes | Tiempo real añadido tardíamente mediante soluciones externas y hacks | Estados inconsistentes, reintentos inseguros o conversaciones incompletas | Diseñar persistencia, idempotencia, colas y entrega en tiempo real desde el inicio |
| Experiencia inconsistente | CSS y componentes duplicados | Errores de uso, mayor costo de cambio y accesibilidad irregular | Design system con ownership y evidencia visual |
| Variabilidad de ambientes | Validación difícil entre local, staging y producción | Fallos tardíos y diagnósticos lentos | Ambientes definidos, configuración separada y promoción de artefactos versionados |
| Cambios no rastreables | Ausencia de backlog y decisiones formales | Imposibilidad de explicar propósito, alcance o versión de un cambio | Trazabilidad entre goal, epic, PBI, ADR, cambio, prueba, evidencia y release |
| Migrar deuda como requisito | Nuevo proyecto relacionado con un sistema existente | Replicar complejidad o datos de baja calidad sin valor | Inventario, selección, transformación y criterios de aceptación antes de migrar |

Los tratamientos son **propuestas**; sus mecanismos concretos pertenecen a arquitectura, calidad y ADRs.

## Deuda arquitectónica observada

### Separación de responsabilidades insuficiente

**Observación conocida:** algunos archivos PHP actuaban a la vez como vista, controlador y acceso a datos; SQL y reglas de negocio se mezclaban con otras capas.

**Deuda resultante — inferencia:** cambiar una responsabilidad podía requerir comprender y probar varias otras, y reutilizar reglas desde otro cliente era difícil.

### Límites modulares débiles

**Observación conocida:** existían módulos altamente acoplados.

**Deuda resultante — inferencia:** ownership y contratos eran difíciles de identificar, lo que aumentaba alcance de cambios y riesgo de ciclos.

### Aislamiento multitenant dependiente de disciplina manual

**Observación conocida:** el filtrado se aplicaba manualmente y existía riesgo de exposición cruzada.

**Deuda resultante — inferencia:** una omisión local podía vulnerar una propiedad global de seguridad.

### Tiempo real incorporado como adaptación tardía

**Observación conocida:** la mensajería en tiempo real se añadió mediante soluciones externas y hacks.

**Deuda resultante — inferencia:** persistencia, orden, deduplicación, reconexión y ownership pudieron quedar fuera del diseño central; debe verificarse antes de asumir detalles.

### Sistema visual sin ownership suficiente

**Observación conocida:** hubo inconsistencias visuales y componentes duplicados.

**Deuda resultante — inferencia:** patrones paralelos elevaban el costo de mantener coherencia y accesibilidad.

### Entrega y documentación tardías

**Observación conocida:** documentación posterior a la implementación, despliegues lentos/manuales y validación difícil entre ambientes.

**Deuda resultante — inferencia:** decisiones, estado real y proceso repetible eran difíciles de recuperar.

## Lecciones para SR Taller 2.0

### Separar presentación, aplicación, dominio y persistencia

**Lección propuesta:** cada capa debe tener una razón de cambio clara. La interfaz solicita casos de uso; aplicación coordina; dominio expresa reglas; persistencia implementa almacenamiento detrás de contratos.

**Evidencia futura:** dependencias revisables, reglas probables sin interfaz/base real y ausencia de SQL o detalles de transporte en el dominio.

### No depender de filtros manuales de tenant

**Lección propuesta:** el tenant debe ser contexto obligatorio, propagado y verificado. Repositorios, caché, archivos, colas, WebSockets, logs y pruebas deben incorporarlo por diseño.

**Evidencia futura:** pruebas negativas de acceso cruzado y defensas que fallen cerradas cuando falte contexto.

### Diseñar tiempo real desde el inicio

**Lección propuesta:** separar la fuente de verdad persistida de la entrega en tiempo real y definir recepción, normalización, idempotencia, orden, reintentos, reconexión y aislamiento de rooms antes de integrar un canal.

**Evidencia futura:** arquitectura y pruebas de duplicados, desconexiones y eventos fuera de orden.

### Evitar CSS y componentes paralelos sin ownership

**Lección propuesta:** un design system debe tener tokens, componentes, estados, accesibilidad, documentación y responsable de evolución.

**Evidencia futura:** reutilización verificable y proceso explícito para crear una variante.

### Evitar endpoints con demasiadas responsabilidades

**Lección propuesta:** cada endpoint debe representar un caso de uso acotado y delegar reglas al módulo propietario, sin mezclar render, SQL, integración y decisiones de negocio.

**Evidencia futura:** contratos pequeños, autorización visible, errores definidos y pruebas por caso.

### Distinguir procesos síncronos de trabajos asíncronos

**Lección propuesta:** responder síncronamente sólo lo necesario para el usuario y modelar por separado trabajos con reintento, idempotencia, estado y contexto de tenant.

**Evidencia futura:** ownership, política de error y correlación de cada trabajo.

### Evitar despliegues manuales

**Lección propuesta:** producir artefactos versionados mediante automatización y promover el mismo artefacto probado entre ambientes.

**Evidencia futura:** historial reproducible, gates, rollback y ausencia de cambios manuales por FTP.

### Documentar staging y producción

**Lección propuesta:** propósito, datos, credenciales, acceso y proceso de despliegue de cada ambiente deben ser explícitos. Local no es staging.

**Evidencia futura:** configuraciones separadas, datos reales restringidos y runbooks verificables.

### Mantener trazabilidad entre cambios y versiones

**Lección propuesta:** relacionar goal, epic, PBI, tarea, ADR, pull request, pruebas, evidencia de QA y release.

**Evidencia futura:** un cambio y una versión pueden explicarse en ambas direcciones sin depender de memoria informal.

### No migrar toda la complejidad anterior sin justificarla

**Lección propuesta:** seleccionar datos y comportamientos por valor, obligación y uso; transformar únicamente con reglas verificables; no conservar una anomalía sólo para replicar el legado.

**Evidencia futura:** inventario, mapeo, calidad, reconciliación, aprobación y rollback por conjunto migrado.

## Prácticas que conviene conservar

Estas son **propuestas condicionadas a validación**, no afirmaciones de que ya existían correctamente:

- conservar conocimiento del dominio mediante entrevistas, ejemplos y vocabulario revisado;
- conservar sólo recorridos y reglas cuya utilidad actual pueda demostrarse;
- preservar datos cuando exista obligación, valor operativo o necesidad de continuidad;
- comparar resultados del sistema anterior y del nuevo con casos reales antes de un corte;
- involucrar a usuarios conocedores del legado en criterios de aceptación y reconciliación;
- mantener referencias al origen de una regla migrada y a la decisión que la justifica.

## Prácticas que no deben repetirse

- mezclar presentación, coordinación, dominio y persistencia en una misma unidad;
- permitir consultas de tenant sin contexto obligatorio o confiar sólo en filtros manuales;
- permitir que un módulo modifique directamente datos propiedad de otro;
- añadir tiempo real como transporte paralelo que eluda la fuente de verdad;
- crear CSS, componentes o endpoints duplicados sin ownership y razón de cambio;
- ejecutar trabajo lento o recuperable dentro de una solicitud sin distinguirlo como asíncrono;
- desplegar manualmente o mantener diferencias no registradas entre ambientes;
- documentar decisiones sólo después de implementarlas;
- aceptar cambios sin relación con PBI, pruebas, evidencia y versión;
- migrar código, datos, reglas o excepciones sólo por compatibilidad histórica.

## Preguntas sobre posible migración

- ¿Qué instancias, versiones y fuentes de datos existen realmente?
- ¿Quién es propietario de cada fuente y quién puede autorizar acceso o exportación?
- ¿Qué datos deben preservarse por operación, garantía, contrato o regulación? Véase [QUESTION-033](./OPEN_QUESTIONS.md#question-033).
- ¿Qué calidad, duplicados, codificaciones, identificadores y relaciones tiene cada conjunto?
- ¿Qué reglas siguen vigentes y cómo se demuestra su uso?
- ¿Qué datos pueden archivarse, anonimizarse o descartarse?
- ¿Habrá coexistencia, piloto por sucursal, corte por tenant o ejecución paralela? Véase [QUESTION-034](./OPEN_QUESTIONS.md#question-034).
- ¿Cómo se reconciliarán conteos, saldos, estados, archivos y referencias después de una migración?
- ¿Qué rollback es posible sin perder escrituras nuevas?
- ¿Cómo se comunicará el cambio y qué soporte necesitarán usuarios del legado?

## Criterios propuestos antes de reutilizar algo del legado

1. Identificar el problema actual que resuelve.
2. Confirmar uso y valor con evidencia, no sólo presencia en código o base de datos.
3. Revisar aislamiento, seguridad, privacidad y alcance por sucursal.
4. Comparar alternativas, incluida no migrar o rediseñar.
5. Registrar ownership, regla y criterio de aceptación.
6. Probar transformación, reconciliación y rollback con datos controlados.
7. Obtener aprobación del propietario del producto y del dueño de los datos.

## Preguntas abiertas

- [QUESTION-033](./OPEN_QUESTIONS.md#question-033): datos y conocimiento que deben preservarse.
- [QUESTION-034](./OPEN_QUESTIONS.md#question-034): coexistencia, corte y reconciliación.
- [QUESTION-025](./OPEN_QUESTIONS.md#question-025): retención, exportación, corrección y eliminación.
- [QUESTION-030](./OPEN_QUESTIONS.md#question-030): obligaciones regulatorias y de seguridad.

## Documentos relacionados

- [Principios de producto](./PRODUCT_PRINCIPLES.md)
- [Glosario de dominio](./DOMAIN_GLOSSARY.md)
- [Modelo multitenant](../architecture/MULTITENANCY_MODEL.md)
- [Arquitectura de tiempo real y mensajería](../architecture/REALTIME_AND_MESSAGING.md)
- [Política de migración](../operations/MIGRATION_POLICY.md)
- [Estrategia de despliegue](../architecture/DEPLOYMENT_STRATEGY.md)
- [Modelo de trazabilidad](../delivery/TRACEABILITY_MODEL.md)

## Próxima revisión

Revisar con personas que conozcan el sistema anterior antes de definir una estrategia de migración. Incorporar evidencia de uso, inventario de datos, obligaciones y decisiones que sí funcionaron. **Fecha: TBD.**
