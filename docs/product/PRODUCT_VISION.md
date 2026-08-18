# Visión de producto

## Estado del documento

- **Estado:** Borrador inicial.
- **Naturaleza:** Propuesta de producto pendiente de revisión por el propietario del producto.
- **Base utilizada:** Contexto inicial de SR Taller 2.0 y lecciones declaradas del sistema anterior.
- **Aprobación:** No registrada.
- **Alcance de este documento:** Expresa la dirección deseada; no compromete funcionalidades, fechas, métricas ni una primera versión.

## Declaraciones y nivel de certeza

Las afirmaciones de este documento se distinguen así:

- **Hecho conocido:** información proporcionada como contexto del proyecto.
- **Hipótesis:** interpretación que necesita evidencia o validación.
- **Propuesta:** dirección sugerida que requiere aprobación.
- **Decisión pendiente:** asunto que debe resolverse antes de convertir la dirección en compromiso.

## Problema que queremos resolver

**Hechos conocidos**

- Los talleres de reparación de celulares necesitan administrar operaciones que abarcan clientes, reparaciones, inventario, pagos, cajas, comunicación y seguimiento.
- SR Taller 2.0 debe servir a múltiples tenants, con múltiples sucursales, usuarios, roles, permisos y dispositivos autorizados.
- El sistema anterior acumuló acoplamiento entre presentación, backend, SQL y reglas de negocio; filtrado multitenant manual; duplicación visual; mensajería añadida de forma tardía; y procesos de despliegue y validación poco repetibles.
- La nueva plataforma debe ofrecer una API central consumible por aplicaciones web y, en el futuro, por clientes móviles.

**Hipótesis de problema**, pendientes de validación con talleres reales:

- La información operativa fragmentada dificulta conocer el estado de una reparación y coordinar el trabajo entre personas y sucursales.
- La falta de controles de acceso suficientemente explícitos aumenta el riesgo operativo y de exposición de datos.
- La comunicación separada de la operación obliga a duplicar capturas y pierde contexto de clientes y reparaciones.
- La falta de trazabilidad entre movimientos, pagos, cambios y responsables complica la supervisión y la atención de incidencias.
- La evolución del producto se vuelve lenta cuando cada canal cliente depende de reglas incrustadas en una interfaz concreta.

Estas hipótesis no sustituyen investigación de producto. Las preguntas que las validan están centralizadas en [Preguntas abiertas](./OPEN_QUESTIONS.md).

## Público objetivo

**Hecho conocido:** el público principal son talleres de reparación de celulares.

**Hipótesis de segmentación:** la plataforma podría servir a talleres con una o varias sucursales y con distintos grados de especialización de su personal. Aún deben definirse el segmento inicial, el tamaño operativo objetivo, los países de lanzamiento y los requisitos regulatorios aplicables.

Los actores preliminares —personal del taller, clientes, administración de plataforma, servicios externos y dispositivos— se describen en [Actores y personas](./ACTORS_AND_PERSONAS.md).

## Propuesta de valor

**Propuesta pendiente de validación:**

> SR Taller 2.0 busca ofrecer a los talleres de reparación de celulares una plataforma SaaS segura y coherente para coordinar su operación, conservar trazabilidad y comunicarse con sus clientes desde una fuente central de verdad, con aislamiento entre tenants y capacidad de crecer hacia múltiples sucursales y canales.

La propuesta combina cuatro beneficios esperados:

1. **Control operativo:** contexto compartido de clientes, reparaciones, inventario, ventas, pagos y cajas, sujeto al alcance que se priorice.
2. **Acceso adecuado:** usuarios, permisos, sucursales y dispositivos dentro de límites explícitos y auditables.
3. **Continuidad de la experiencia:** reglas expuestas por una API central para clientes web y móviles futuros.
4. **Evolución confiable:** módulos delimitados, pruebas automatizadas, despliegues repetibles, observabilidad y decisiones trazables.

## Visión a largo plazo

**Propuesta:** construir una plataforma operativa para talleres de reparación de celulares capaz de servir de forma segura a 1,000 o más tenants, sin trasladar al nuevo sistema el acoplamiento del producto anterior.

En esa visión:

- cada tenant conserva un contexto de datos aislado y puede operar una o varias sucursales;
- el personal accede únicamente a las capacidades y sucursales permitidas;
- los dispositivos autorizados soportan acceso operativo sin sustituir controles reforzados para acciones sensibles;
- aplicaciones web y clientes móviles futuros usan una API central;
- comunicación, notificaciones e integraciones conservan el contexto de tenant y de la operación;
- la plataforma puede evolucionar por módulos sin requerir microservicios prematuros;
- administración, auditoría, suscripciones y operación de plataforma tienen límites explícitos.

El objetivo de escala es una restricción de diseño, no una predicción de adopción ni un compromiso de capacidad ya demostrado.

## Resultados que buscamos

Los siguientes son **resultados propuestos**; requieren indicadores y líneas base antes de convertirse en metas:

- Reducir pérdida de contexto al recibir, diagnosticar, reparar, entregar y dar seguimiento a un equipo.
- Hacer visible el estado operativo relevante para cada actor autorizado.
- Disminuir capturas duplicadas y discrepancias entre áreas o canales.
- Mantener aislamiento verificable entre tenants y alcance explícito por sucursal.
- Conservar evidencia de acciones relevantes y facilitar investigación de incidencias.
- Permitir que distintos clientes consuman las mismas reglas mediante una API central.
- Hacer que cambios, pruebas, decisiones y versiones puedan rastrearse entre sí.
- Reducir el riesgo y la variabilidad de despliegues entre local, staging y producción.
- Facilitar la incorporación gradual de tiempo real, mensajería e integraciones sin convertirlas en atajos alrededor del dominio.

## Diferenciadores por validar

No se consideran ventajas demostradas todavía. Son **hipótesis de diferenciación**:

- aislamiento multitenant tratado como propiedad verificable del sistema y no como filtro opcional;
- contexto explícito tenant, sucursal, estación operativa y usuario conforme a ADR-010;
- operación de reparaciones conectada con inventario, pagos, comunicación y auditoría mediante límites de módulo claros;
- experiencia consistente sustentada por un design system propio;
- API central preparada para más de un tipo de cliente;
- trazabilidad desde una necesidad de producto hasta decisión, cambio, prueba, evidencia y release;
- arquitectura modular que favorece evolución gradual antes de distribuir el sistema.

La relevancia comercial de estos diferenciadores debe contrastarse con alternativas usadas por el segmento objetivo.

## Restricciones conocidas

**Hechos conocidos de la evolución del proyecto:**

- La restricción exclusivamente documental correspondió a Sprint 00 y ya no
  describe la baseline actual.
- Existe una foundation ejecutable con backend NestJS, Visual Slice 0 en
  React/Vite, contenedor OCI, Preview en Dokploy y PostgreSQL 18.4.
- Esa foundation no implica que los recorridos funcionales completos del
  taller estén implementados ni aceptados.
- La arquitectura inicial es un monolito modular; no se crearán microservicios
  sin presión demostrable y una decisión explícita.
- Las decisiones aceptadas y las selecciones que aún permanecen abiertas se
  distinguen en ADRs y documentos arquitectónicos vigentes.
- No se copiará código del sistema anterior ni se asumirá compatibilidad sin justificación.
- No se asumirán reglas de negocio, fechas, responsables, estimaciones ni métricas no confirmadas.
- La arquitectura debe considerar desde el inicio múltiples tenants, sucursales, usuarios, roles, permisos, dispositivos, API central y crecimiento a 1,000 o más tenants.
- Los límites temporales y funcionales adicionales se registran en [Fuera de alcance](./OUT_OF_SCOPE.md).

## Métricas de producto pendientes de definir

No existen metas numéricas aprobadas. La instrumentación y los valores objetivo son **decisiones pendientes**.

| Área de resultado | Qué sería útil comprender | Definición pendiente |
|---|---|---|
| Flujo de reparación | Tiempo y fricción entre recepción, trabajo y entrega | Inicio, fin, pausas, excepciones y segmento comparable |
| Visibilidad operativa | Capacidad de localizar estado y responsable sin reconstrucción manual | Evento observable, actor, ventana y criterio de éxito |
| Calidad de datos | Registros incompletos, duplicados o contradictorios | Campos críticos y regla de validez por proceso |
| Adopción | Uso sostenido de las capacidades prioritarias | Actor, tenant elegible, frecuencia y periodo |
| Comunicación | Entrega y atención de conversaciones vinculadas a la operación | Canal, estados, ventana de respuesta y exclusiones |
| Seguridad multitenant | Evidencia de aislamiento y de accesos dentro de alcance | Controles, pruebas, incidentes y severidad |
| Confiabilidad | Disponibilidad y comportamiento correcto de flujos críticos | Flujos críticos, SLO, ventanas y exclusiones |
| Entrega de software | Capacidad de promover cambios pequeños y verificables | Lead time, frecuencia, fallos y criterio de recuperación |
| Satisfacción | Percepción de valor de personal y clientes del taller | Método, población, momento y sesgos aceptables |
| Resultado comercial | Relación entre uso, plan, retención y costo de servicio | Modelo comercial, cohortes y fuentes de datos |

No se instrumentará información sensible sin propósito, minimización, retención y acceso definidos.

## Preguntas abiertas

- [QUESTION-001](./OPEN_QUESTIONS.md#question-001): ¿qué segmento de talleres será el primero en atenderse?
- [QUESTION-002](./OPEN_QUESTIONS.md#question-002): ¿cuáles son los resultados de negocio y operación que determinarán el éxito inicial?
- [QUESTION-003](./OPEN_QUESTIONS.md#question-003): ¿qué recorrido operativo debe resolver primero una versión utilizable?
- [QUESTION-024](./OPEN_QUESTIONS.md#question-024): ¿qué modelo comercial de planes y suscripciones se investigará primero?
- [QUESTION-032](./OPEN_QUESTIONS.md#question-032): ¿qué evidencia visual y de accesibilidad debe aprobar el producto?

## Documentos relacionados

- [Principios de producto](./PRODUCT_PRINCIPLES.md)
- [Alcance de producto](./PRODUCT_SCOPE.md)
- [Mapa preliminar de módulos](./MODULE_MAP.md)
- [Lecciones de SR Taller](./LEGACY_SR_TALLER_LESSONS.md)
- [Arquitectura objetivo](../architecture/TARGET_ARCHITECTURE.md)
- [Backlog de producto](../backlog/PRODUCT_BACKLOG.md)

## Próxima revisión

Revisar con el propietario del producto antes de priorizar una primera versión o aprobar prototipos técnicos. La revisión debe validar el segmento, las hipótesis de problema, los resultados buscados, los diferenciadores y la forma de medirlos. **Fecha: TBD.**
