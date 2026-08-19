# Estrategia de accesibilidad

## Estado del documento

- **Estado:** Dirección V1 aprobada y matriz mínima de PBI-030 definida;
  estrategia transversal de producto aún parcial.
- **Alcance:** Clientes web iniciales y lineamientos reutilizables para móviles futuros.
- **Objetivo aprobado:** WCAG 2.2 AA como referencia de diseño V1, sin afirmar
  certificación formal.
- **Decisión pendiente:** Mercados, requisitos legales, proceso transversal de
  auditoría y ownership. La matriz de PBI-030 no afirma soporte global del
  producto ni pruebas ejecutadas.

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
- Objetivos táctiles de al menos `44 × 44px`; las acciones principales en móvil
  deben resultar cómodas.
- Atajos, si existen, no deben interferir con tecnologías de asistencia y serán configurables cuando aplique.
- Timeout de sesión ofrece aviso y extensión segura según política; excepciones de seguridad explícitas.

### Contenido y formularios

- Jerarquía de encabezados, landmarks, tablas y listas con semántica adecuada.
- Campos con nombre accesible, instrucciones y errores específicos.
- Validación no depende sólo del submit ni borra entradas válidas.
- Fechas, moneda, estados de reparación y pagos se expresan sin ambigüedad.
- Iconos con etiqueta cuando transmiten acción; decorativos se ocultan a asistencia.

### Visual

- Contraste de texto, controles, foco y estados conforme a WCAG 2.2 AA como
  referencia V1.
- Zoom y reflow probados; evitar scroll bidimensional salvo contenido que lo requiere.
- Preferencias de reducción de movimiento respetadas.
- No depender sólo de color para stock, estado de pago, prioridad o alertas.
- Densidad legible mediante los modos controlados default/compact; V1 no ofrece
  selector global de densidad.

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
- Lector de pantalla en las combinaciones objetivo de cada PBI.
- Contraste, reflow/zoom, orientación y tamaño táctil.
- Mensajes, validación, estados de carga/error/vacío/denegación.
- Actualizaciones realtime y timeout.
- Evidencia vinculada a versión y criterio.

### Baseline exigible para PBI-030

La matriz completa y su clasificación están en la
[revisión de readiness](../design-system/PBI_030_READINESS_REVIEW.md#5-matriz-de-navegadores-y-tecnologías-de-asistencia).
Antes de Done se exige:

- Primary: Chrome latest en Windows/macOS, Safari latest en macOS, iOS Safari
  latest y Android Chrome latest;
- Secondary: Edge latest en Windows y NVDA + Chrome latest;
- VoiceOver + Safari en macOS/iOS sobre shell, drawer, tema y navegación
  crítica;
- keyboard-only, focus/restore/Escape, reduced motion, zoom 200 %, reflow a
  320 CSS px o equivalente 400 %, touch targets y viewports
  `390/640/768/1024/1280`;
- evidencia fechada y ligada al SHA, sin convertir automatización en sustituto
  de lector de pantalla o revisión manual.

Firefox latest es best effort; IE, browsers obsoletos y WebViews no gobernados
no son target V1. `latest` se registra con versión exacta al ejecutar la prueba.

### Investigación con usuarios

Se propone incluir personas con discapacidad y contextos reales del taller en investigación y pruebas de usabilidad. Reclutamiento, consentimiento, compensación y privacidad están `TBD`.

## Matriz mínima por flujo

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Sólo teclado | Obligatorio cuando aplique al flujo | Registro manual ligado al SHA |
| Foco y orden | Obligatorio | Registro manual + tests de comportamiento posibles |
| Nombre/rol/estado | Obligatorio | Tests automáticos y revisión AT |
| Error y recuperación | Obligatorio | Catálogo/flujo y prueba del caso |
| Contraste y no sólo color | Obligatorio | Cálculo automático + revisión visual |
| Zoom/reflow/responsive | Obligatorio | 200 %, 320 CSS px/equivalente y viewports del PBI |
| Lector de pantalla | Obligatorio según matriz PBI | VoiceOver/NVDA con versión registrada |
| Movimiento/realtime | Reduced motion obligatorio; realtime según alcance | Test/configuración + registro manual |
| Timeout/autenticación | Según alcance | N/A justificado en PBI-030 |

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

- ¿Qué requisitos legales adicionales se aprobarán por mercado? WCAG 2.2 AA ya
  es la referencia de diseño V1, no una certificación.
- ¿Cuáles son los flujos esenciales de la primera versión?
- ¿Qué combinaciones adicionales requerirá cada flujo futuro fuera de la
  baseline ya definida para PBI-030?
- ¿Quién será owner de accesibilidad y del design system?
- ¿Cómo se incluirán personas con discapacidad en investigación?
- ¿Qué hallazgos bloquearán un release?

## Próxima revisión

- **Fecha:** TBD.
- **Disparador:** definición de mercados/usuarios objetivo o hallazgos al
  ejecutar la matriz de PBI-030.
- **Documentos relacionados:** [Design System & Application Shell V1](../design-system/DESIGN_SYSTEM_AND_APPLICATION_SHELL_V1.md), [PBI-030](../backlog/pbis/PBI-030.md), [Product Principles](../product/PRODUCT_PRINCIPLES.md), [Testing Strategy](./TESTING_STRATEGY.md), [Definition of Done](../delivery/DEFINITION_OF_DONE.md), [QA Evidence Template](./QA_EVIDENCE_TEMPLATE.md).
