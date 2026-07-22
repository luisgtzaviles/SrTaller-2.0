# Responsabilidades del técnico

## Alcance

Las responsabilidades siguientes describen la operación validada. No definen permisos del sistema, perfiles, puestos contractuales ni una segregación universal para todos los tenants.

## Decisiones validadas

### DTR-DEC-031 — Evaluar antes de concluir

El técnico revisa el equipo con profundidad suficiente para emitir una conclusión responsable. Debe reconocer límites cuando no puede alcanzar certeza.

### DTR-DEC-032 — Producir información técnica

El técnico aporta conclusión, observaciones relevantes, recomendaciones y el resultado del trabajo. No necesita registrar cada razonamiento o prueba si no aporta valor operativo.

### DTR-DEC-033 — Normalmente diagnostica y repara

En la operación descrita, el técnico que diagnostica normalmente también repara. Sin embargo, la orden debe tolerar que otro técnico continúe sin borrar quién participó antes.

### DTR-DEC-034 — No conducir la negociación principal

El técnico no es el actor principal de la negociación comercial. Recepción comunica propuesta, precio, promoción, autorización y rechazo, aunque pueda requerir aclaraciones técnicas.

### DTR-DEC-035 — Respetar alcance autorizado

El técnico ejecuta únicamente trabajos autorizados. Ante una necesidad nueva, detiene la ampliación del alcance y produce información para una nueva decisión comercial.

### DTR-DEC-036 — Cerrar el resultado técnico

Cuando el equipo queda con servicio, el técnico lo arma, registra el seguimiento requerido y lo pasa a segunda revisión. Cuando requiere piezas, concluye, recomienda, registra seguimiento y lo envía a segunda revisión para continuar el proceso comercial.

## Responsabilidades por momento

| Momento | Responsabilidad técnica | Límite |
|---|---|---|
| inicio | comprender problema reportado, condición y acceso permitido | no convertir relato en causa |
| evaluación | revisar, probar y obtener información suficiente | no capturar pruebas sin valor por obligación genérica |
| conclusión | explicar resultado y certeza | no fijar precio |
| recomendación | indicar trabajo o componentes sugeridos | no emitir autorización |
| reparación | realizar alcance autorizado | no ampliar ante hallazgo nuevo |
| cierre técnico | documentar resultado y enviar a segunda revisión | no marcar entrega ni sustituir control de calidad |
| descubrimiento posterior | emitir nueva conclusión y recomendaciones | no sobrescribir historia |

## Responsabilidades de recepción relacionadas

Recepción o atención al cliente:

- interpreta comercialmente la recomendación;
- prepara y comunica la cotización;
- aplica promociones y políticas vigentes;
- registra aceptación total, parcial o rechazo;
- devuelve al taller sólo el alcance autorizado;
- conduce notificación, cobro y entrega conforme a los paquetes ya validados.

Esta distribución describe el flujo validado. ADR-012 fija el modelo ordinario de roles/capacidades y alcance; las excepciones, competencias concretas por rebanada y controles reforzados permanecen abiertos.

## Colaboración entre técnicos

Cuando participan varias personas debe poder distinguirse, sin decidir todavía el mecanismo:

- quién diagnosticó;
- quién emitió cada conclusión;
- quién recomendó;
- quién realizó el trabajo;
- quién apoyó o retomó;
- qué información recibió la siguiente persona.

La asignación vigente no reemplaza la historia de participación definida en [Modelo de asignación técnica](../operational-workflow-and-traceability/MODELO_DE_ASIGNACION_TECNICA.md).

## Riesgos operativos

- Concluir sin revisar el alcance necesario.
- Ocultar incertidumbre para acelerar.
- Convertir toda prueba en carga documental.
- Recomendar sin explicar la conclusión relacionada.
- Comunicar precio como si fuera decisión técnica.
- Continuar trabajo adicional antes de autorización.
- Sobrescribir la conclusión de otro técnico.
- Usar el seguimiento libre como única evidencia de una decisión comercial.

## Decisiones pendientes

Competencia por tipo de reparación, reasignación, doble revisión técnica, firmas, evidencias mínimas, medición de tiempos y autoridad para corregir permanecen en [Preguntas abiertas](PREGUNTAS_ABIERTAS.md).
