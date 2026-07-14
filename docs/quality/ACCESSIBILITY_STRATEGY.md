# Estrategia de accesibilidad

## Estado del documento

- **Estado:** Propuesta
- **Alcance:** Clientes web iniciales y lineamientos reutilizables para móviles futuros.
- **Hipótesis a validar:** WCAG 2.2 nivel AA puede servir como referencia inicial; el objetivo formal y requisitos legales por mercado son decisiones pendientes.
- **Decisión pendiente:** Mercados, navegadores/tecnologías de asistencia soportados, proceso de auditoría y ownership.

## Objetivo

Permitir que propietarios, recepcionistas, técnicos, vendedores, cajeros, personal de soporte y clientes puedan completar tareas esenciales con distintas capacidades, dispositivos y condiciones del taller.

Accesibilidad se diseña con el flujo y el design system; no se agrega como corrección cosmética al final.

## Contextos relevantes del taller

- Uso rápido en mostrador y equipos compartidos.
- Pantallas pequeñas, zoom y diseño responsive.
- Ruido, interrupciones, brillo variable o conectividad degradada.
- Navegación por teclado, lector de pantalla, voz u otras ayudas.
- Usuarios con baja visión, daltonismo, limitaciones motoras, auditivas o cognitivas.
- Mensajes y actividad realtime que no deben interrumpir o perder contexto.
- Cambio de turno y sesiones temporales en dispositivos autorizados.

Estos contextos son hipótesis operativas por validar con usuarios; no sustituyen investigación.

## Principios de diseño

1. Usar estructura semántica y controles nativos antes de recrearlos.
2. Todo flujo esencial debe funcionar sin mouse.
3. Foco visible, orden lógico y retorno de foco al cerrar overlays.
4. No comunicar estado únicamente mediante color, posición, sonido o animación.
5. Etiquetas, instrucciones y errores deben relacionarse con su campo.
6. Texto y controles deben tolerar zoom/reflow sin pérdida de información o acción.
7. Movimiento y actualizaciones automáticas deben ser controlables cuando puedan distraer.
8. Autenticación y PIN deben evitar cargas cognitivas innecesarias sin debilitar seguridad.
9. Mantener lenguaje claro, consistente y orientado a la acción.
10. Conservar accesibilidad como contrato de componentes del design system.

## Requisitos de producto propuestos

### Navegación e interacción

- Acceso por teclado a acciones y contenido en orden predecible.
- Sin trampas de foco; modales, menús y drawers gestionan foco correctamente.
- Objetivos táctiles con tamaño/espaciado suficiente; umbral exacto depende del estándar aprobado.
- Atajos, si existen, no deben interferir con tecnologías de asistencia y serán configurables cuando aplique.
- Timeout de sesión ofrece aviso y extensión segura según política; excepciones de seguridad explícitas.

### Contenido y formularios

- Jerarquía de encabezados, landmarks, tablas y listas con semántica adecuada.
- Campos con nombre accesible, instrucciones y errores específicos.
- Validación no depende sólo del submit ni borra entradas válidas.
- Fechas, moneda, estados de reparación y pagos se expresan sin ambigüedad.
- Iconos con etiqueta cuando transmiten acción; decorativos se ocultan a asistencia.

### Visual

- Contraste de texto, controles, foco y estados conforme al objetivo que se apruebe.
- Zoom y reflow probados; evitar scroll bidimensional salvo contenido que lo requiere.
- Preferencias de reducción de movimiento respetadas.
- No depender sólo de color para stock, estado de pago, prioridad o alertas.
- Densidad de información ajustable o legible en operaciones complejas, por validar.

### Realtime y notificaciones

- Mensajes nuevos, presencia y cambios de estado no roban foco.
- Regiones live se usan con moderación y prioridad apropiada.
- Existe alternativa visible al sonido y control de notificaciones.
- Orden y contexto se conservan durante actualizaciones.
- El usuario puede revisar eventos perdidos sin depender de una animación efímera.

### Autenticación, PIN y seguridad

- Labels e instrucciones no revelan datos sensibles.
- Errores equilibran claridad y prevención de enumeración.
- No exigir memoria, transcripción o rompecabezas como único camino sin alternativa accesible; el diseño final requiere threat modeling.
- Bloqueo, reautenticación y recuperación deben ser comprensibles y operables con asistencia.
- Acciones sensibles muestran consecuencia y confirmación apropiada sin patrones engañosos.

## Design system

Cada componente compartido debería documentar:

- semántica y roles;
- nombre/descripcion/estado accesibles;
- interacción de teclado y foco;
- contraste y estados visuales;
- errores, loading, disabled y read-only;
- uso correcto e incorrecto;
- pruebas automatizadas y manuales;
- limitaciones conocidas.

Componentes nuevos no deben crear un sistema visual paralelo sin ownership. Las excepciones se documentan y trazan.

## Proceso de validación

### En refinamiento

- Identificar flujo esencial, contexto y tecnología de asistencia relevante.
- Incluir criterios de teclado, error, zoom, anuncios y responsive.
- Diseñar estados no felices, no sólo mockup principal.

### Durante diseño/desarrollo futuro

- Revisar semántica y orden antes de estilizar.
- Usar componentes compartidos validados.
- Ejecutar herramientas automáticas como feedback temprano, sin asumir cobertura completa.
- Probar teclado y zoom en cada cambio visual significativo.

### QA

- Teclado completo, foco y lectura de controles.
- Lector de pantalla en combinaciones objetivo `TBD`.
- Contraste, reflow/zoom, orientación y tamaño táctil.
- Mensajes, validación, estados de carga/error/vacío/denegación.
- Actualizaciones realtime y timeout.
- Evidencia vinculada a versión y criterio.

### Investigación con usuarios

Se propone incluir personas con discapacidad y contextos reales del taller en investigación y pruebas de usabilidad. Reclutamiento, consentimiento, compensación y privacidad están `TBD`.

## Matriz mínima por flujo

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Sólo teclado | TBD | TBD |
| Foco y orden | TBD | TBD |
| Nombre/rol/estado | TBD | TBD |
| Error y recuperación | TBD | TBD |
| Contraste y no sólo color | TBD | TBD |
| Zoom/reflow/responsive | TBD | TBD |
| Lector de pantalla | TBD | TBD |
| Movimiento/realtime | TBD | TBD |
| Timeout/autenticación | TBD | TBD |

## Hallazgos y excepciones

Los hallazgos se registran como bugs, con impacto sobre tarea esencial y personas afectadas. Una excepción necesita razón, alternativa, riesgo, aprobador, vencimiento y plan de corrección. El nivel de severidad y qué hallazgos bloquean release quedan por definir; la imposibilidad de completar un flujo esencial debe tratarse como riesgo alto.

## Métricas candidatas

- flujos esenciales revisados con teclado y tecnología de asistencia;
- defectos por componente compartido versus uso aislado;
- tiempo de resolución y reincidencia;
- excepciones abiertas y vencidas;
- resultados cualitativos de investigación.

No se establecen objetivos numéricos todavía.

## Preguntas abiertas

- ¿Qué nivel de conformidad y requisitos legales se aprobarán por mercado?
- ¿Cuáles son los flujos esenciales de la primera versión?
- ¿Qué combinaciones de navegador, sistema operativo y lector de pantalla se soportarán?
- ¿Quién será owner de accesibilidad y del design system?
- ¿Cómo se incluirán personas con discapacidad en investigación?
- ¿Qué hallazgos bloquearán un release?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** definición de mercados/usuarios objetivo o antes de aprobar el design system.
- **Documentos relacionados:** [Product Principles](../product/PRODUCT_PRINCIPLES.md), [Testing Strategy](./TESTING_STRATEGY.md), [Definition of Done](../delivery/DEFINITION_OF_DONE.md), [QA Evidence Template](./QA_EVIDENCE_TEMPLATE.md).
