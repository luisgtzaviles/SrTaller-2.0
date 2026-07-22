# ADR-013 — Acciones sensibles y autorización reforzada

**Status: Accepted**
**Fecha:** 2026-07-21
**Autoridad de aceptación:** Responsable de Producto, mediante las decisiones explícitas sobre acciones sensibles, reautenticación, segundo aprobador, segregación de funciones y trazabilidad registradas en la revisión arquitectónica.

## Estado del documento

Decisión arquitectónica aceptada como base conceptual de R0 para determinar cuándo la autorización ordinaria de ADR-012 no basta y qué clase de control adicional debe satisfacerse antes de ejecutar una operación de mayor riesgo. La ruta bajo `proposed/` conserva la convención histórica del repositorio; el estado dentro de este ADR y el [registro de decisiones](../README.md) son autoritativos.

Este ADR no autoriza implementación. No diseña tablas, SQL, migraciones, endpoints, middleware, controladores, componentes, modales, pantallas, teclado PIN, cookies, tokens, JWT, librerías, formatos de datos, colas, eventos técnicos, criptografía ni tiempos exactos.

## Contexto

[ADR-004](ADR-004-shared-schema-multitenancy.md) fija el tenant y la propiedad lógica. [ADR-010](ADR-010-station-bound-operational-context.md) fija tenant, sucursal y estación efectivos. [ADR-011](ADR-011-tenant-user-pin-authentication-and-operational-session.md) fija el usuario autenticado y la sesión operativa vigente. [ADR-012](ADR-012-tenant-roles-capabilities-and-contextual-authorization.md) fija la capacidad ordinaria, el alcance y la denegación por defecto.

Esas decisiones son necesarias, pero una sesión abierta y una capacidad ordinaria pueden resultar insuficientes ante una operación con impacto financiero, irreversibilidad, alteración de evidencia, cambio de seguridad, afectación masiva, acceso excepcional o riesgo de fraude. R0 necesita una clasificación sencilla que vuelva explícito ese riesgo, impida la elevación permanente y preserve la identidad de quien actúa y de quien aprueba.

La autorización reforzada no sustituye autenticación, contexto, capacidad ordinaria o pertenencia del recurso. Añade una condición previa delimitada a la operación sensible.

## Evidencia y compatibilidad

La decisión considera:

- [ADR-002 — Monolito modular inicial](ADR-002-modular-monolith-first.md);
- [ADR-004 — Multitenancy con base y esquema compartidos](ADR-004-shared-schema-multitenancy.md);
- [ADR-010 — Contexto operativo derivado de estación vinculada](ADR-010-station-bound-operational-context.md);
- [ADR-011 — Identidad, PIN y sesión operativa](ADR-011-tenant-user-pin-authentication-and-operational-session.md);
- [ADR-012 — Roles de tenant, capacidades y autorización contextual](ADR-012-tenant-roles-capabilities-and-contextual-authorization.md);
- la [seguridad y acciones sensibles del MVP](../../architecture-readiness/repair-mvp/SEGURIDAD_Y_ACCIONES_SENSIBLES.md);
- el [modelo transversal de identidad y acceso](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md);
- la [línea base de seguridad](../../architecture/SECURITY_BASELINE.md);
- el [modelo de identidad y atribución](../../architecture-readiness/repair-mvp/MODELO_DE_IDENTIDAD_Y_ATRIBUCION.md);
- el [inventario de bloqueantes](../../architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md);
- el [modelo integrado del dominio](../../domain-model/integrated-repair-domain-model/README.md);
- el [flujo operativo y trazabilidad validados](../../domain-validation/operational-workflow-and-traceability/README.md).

No se encontró una decisión aceptada incompatible. Las formulaciones anteriores quedan resueltas o delimitadas así:

| Hipótesis o incertidumbre previa | Decisión autoritativa desde este ADR |
| --- | --- |
| Una sesión abierta podía bastar para una operación crítica | Una acción sensible exige capacidad ordinaria y control reforzado satisfecho |
| Reautenticación y segunda aprobación podían tratarse como equivalentes | Reautenticación confirma al actor; segunda aprobación aporta una decisión independiente |
| Un segundo PIN podía sustituir al actor activo | El aprobador no sustituye al actor ni a su sesión operativa |
| Una aprobación podía elevar privilegios durante una ventana indefinida | R0 prefiere autorización de un solo uso, ligada a operación, recurso, actor y sesión |
| Toda acción administrativa podía considerarse sensible | La sensibilidad depende del efecto y riesgo, no de la pantalla o módulo |
| Toda acción sensible podía requerir doble aprobación | La política elige nivel; algunas requieren sólo reautenticación y otras segregación |
| El cliente podía informar que ya obtuvo aprobación | El servidor resuelve clasificación y valida evidencia autoritativa antes de cualquier efecto |
| El catálogo completo debía cerrarse con el modelo | El modelo queda aceptado; cada rebanada clasifica sus acciones y permanece cerrada si falta política |

Los documentos históricos conservan valor como evidencia. Cuando mantengan una alternativa incompatible, prevalece este ADR dentro del alcance de autorización reforzada.

## Alcance

Este ADR decide:

- qué distingue una operación ordinaria de una acción sensible;
- qué riesgos pueden volver sensible una operación;
- cuatro niveles conceptuales de control para R0;
- la relación entre capacidad ordinaria y control reforzado;
- el significado de reautenticación;
- cuándo conceptualmente procede un segundo aprobador;
- la separación entre actor y aprobador;
- la capacidad específica de aprobación;
- la prohibición de autoaprobación cuando exista segregación;
- el uso preferente de autorizaciones de una sola operación;
- alcance, vigencia conceptual, consumo, cancelación e invalidación;
- cuándo puede exigirse motivo;
- estados conceptuales mínimos;
- atribución y evidencia conceptual mínima;
- denegación segura y ausencia de efectos parciales;
- la frontera con auditoría técnica e implementación.

Este ADR no decide:

- matriz definitiva de acciones sensibles de todos los módulos;
- umbrales, montos, duraciones o ventanas temporales concretas;
- mecanismo técnico de reautenticación o captura temporal del aprobador;
- persistencia, integridad, retención, consulta o sellado de evidencia;
- firma digital, alertas, detección de fraude o monitoreo de abuso;
- acceso de soporte, superadministrador, impersonación o break-glass;
- operación o aprobación offline;
- cadenas de múltiples aprobadores o jerarquías profundas;
- reglas comerciales exactas de descuentos, devoluciones o excepciones;
- interfaz, transporte o formato de datos.

## Vocabulario oficial

- **Operación ordinaria:** operación protegida que, después de satisfacer ADR-004/010/011/012, no exige control adicional por sensibilidad.
- **Acción sensible:** operación cuyo efecto, riesgo o condición exige control adicional a la capacidad ordinaria.
- **Riesgo operativo:** posibilidad de producir daño financiero, operativo, de seguridad, evidencia, privacidad, cumplimiento o terceros.
- **Clasificación de sensibilidad:** decisión server-side sobre el nivel de control aplicable a una operación y sus condiciones.
- **Autorización reforzada:** decisión adicional y delimitada que confirma que el control exigido por una acción sensible fue satisfecho.
- **Reautenticación:** nueva comprobación de la identidad del usuario activo antes de ejecutar una acción sensible.
- **Actor:** identidad individual que solicita o participa en una operación.
- **Actor principal:** usuario autenticado que posee la capacidad ordinaria y ejecuta la acción.
- **Aprobador:** usuario distinto que, cuando la política lo exige, autentica su propia identidad y decide sobre la acción solicitada.
- **Segundo usuario:** identidad diferente al actor principal; no equivale a cambio de turno ni reemplaza la sesión activa.
- **Segregación de funciones:** separación requerida entre identidades o responsabilidades para evitar que una sola persona controle todas las etapas de alto riesgo.
- **Capacidad ordinaria:** capacidad exigida por ADR-012 para solicitar la operación.
- **Capacidad de aprobación:** capacidad distinta que permite aprobar una clase concreta de acción sensible.
- **Aprobación:** decisión individual del aprobador, ligada a una operación y alcance específicos.
- **Autoaprobación:** intento del actor principal de actuar también como segundo aprobador cuando la política exige identidades diferentes.
- **Motivo:** explicación atribuible vinculada a la operación; no sustituye autorización.
- **Autorización de un solo uso:** control reforzado válido para una única ejecución de la operación aceptada.
- **Vigencia:** periodo o condición limitada durante la cual una autorización aún podría consumirse.
- **Revocación:** invalidación explícita del actor, aprobador, capacidad o autorización antes de la ejecución.
- **Evidencia:** información conceptual que permite explicar quién solicitó, ejecutó y aprobó, qué se autorizó y cuál fue el resultado.
- **Denegación:** resultado sin efectos parciales cuando falta o deja de ser válido algún requisito.
- **Acción no permitida en R0:** operación que permanece inhabilitada por riesgo, falta de política o dependencia todavía diferida.

No deben intercambiarse autenticación y reautenticación, capacidad y aprobación, actor y aprobador, motivo y autorización, segundo usuario y cambio de turno, ni autorización reforzada y auditoría.

## Principio de decisión

Toda acción sensible exige, de forma conjunta:

**Contexto operativo válido + sesión vigente + usuario autenticado + capacidad ordinaria suficiente + clasificación explícita de sensibilidad + control reforzado satisfecho.**

Cuando la política lo requiera, también exige:

**Segundo usuario autorizado + separación entre actor y aprobador + motivo explícito + evidencia de autorización.**

La ausencia o invalidez de cualquier elemento produce denegación. El servidor valida todos los elementos antes de producir efectos.

## Clasificación conceptual mínima para R0

| Nivel | Clasificación | Requisitos conceptuales |
| --- | --- | --- |
| 1 | Operación ordinaria | Sesión vigente y capacidad ordinaria conforme a ADR-012 |
| 2 | Acción sensible con reautenticación | Nivel 1 más reautenticación del mismo actor |
| 3 | Acción sensible con segundo aprobador | Nivel 1 más usuario diferente, capacidad específica de aprobación y aprobación vinculada |
| 4 | Acción no permitida en R0 | Operación no habilitada por riesgo, falta de definición o dependencia técnica |

Los nombres son conceptuales y no prescriben identificadores técnicos.

Una política por acción puede añadir motivo y evidencia específica a los niveles 2 o 3. Una acción sensible sin clasificación concreta y política suficiente se trata como nivel 4; no se degrada silenciosamente a nivel 1.

## Clasificación de sensibilidad

Una operación se clasifica por su efecto real. Puede ser sensible por:

- impacto financiero;
- irreversibilidad o dificultad de compensación;
- alteración, retiro o destrucción de evidencia;
- modificación de seguridad, identidad, roles, capacidades o estaciones;
- afectación masiva;
- modificación de configuración crítica;
- acceso excepcional;
- riesgo de fraude o abuso;
- incumplimiento de segregación de funciones;
- cambio material de estado, volumen, recurso, momento o relación entre actor y recurso.

Una operación no es sensible sólo por aparecer en una pantalla administrativa. Una operación ordinaria puede volverse sensible bajo condiciones explícitas. El servidor obtiene esas condiciones desde fuentes autoritativas; no confía en una clasificación, monto, nivel o indicador enviado libremente por el cliente.

Los umbrales concretos se deciden en la política funcional de la rebanada.

## Capacidad ordinaria y control reforzado

1. Toda acción sensible exige primero la capacidad ordinaria correspondiente.
2. El control reforzado no crea ni sustituye esa capacidad.
3. Un segundo usuario no puede conceder al actor una capacidad que no posee.
4. Una aprobación no se convierte en rol, asignación o privilegio permanente.
5. El control sólo habilita la operación y condiciones aceptadas.
6. La autorización continúa siendo negativa por defecto.
7. El servidor es la autoridad final.
8. La interfaz puede guiar, pero nunca acreditar por sí sola el control.

## Reautenticación del actor

La reautenticación vuelve a comprobar que la persona presente continúa siendo el usuario activo. No crea otra identidad ni cambia tenant, sucursal, estación, usuario, roles o capacidades.

Reglas:

1. Corresponde al actor principal y usa una credencial propia de ese actor.
2. La credencial de otro usuario no reautentica al actor.
3. Se realiza antes de ejecutar la acción sensible.
4. Para R0 se aplica a una sola operación, salvo necesidad posterior expresamente validada.
5. No eleva privilegios ni autoriza otra operación.
6. Cambiar de usuario invalida el control ligado al anterior.
7. Expirar o invalidar la sesión invalida el control pendiente.
8. El mecanismo, factor, límite de intentos y tiempo exacto permanecen diferidos.

El nivel 2 procede cuando la política determina que el mismo actor puede conservar responsabilidad completa, pero el riesgo exige confirmar nuevamente su presencia e intención. No procede cuando la política exige una decisión independiente.

## Segundo usuario aprobador

El nivel 3 procede cuando el riesgo o la política exige una decisión independiente y segregación de funciones.

Reglas:

1. Actor y aprobador son identidades diferentes.
2. Ambos pertenecen al mismo tenant efectivo.
3. El aprobador autentica su propia identidad.
4. El aprobador posee la capacidad específica para aprobar esa clase de acción.
5. Una capacidad operativa equivalente no implica capacidad de aprobación.
6. El aprobador conoce operación, recurso, actor y condiciones relevantes.
7. La aprobación se vincula a operación, recurso, actor, tenant, sucursal, contexto, fecha y hora.
8. La aprobación no se reutiliza para otra operación ni se transfiere a otro actor.
9. El aprobador no sustituye al actor ni necesita reemplazar la sesión operativa principal.
10. La acción se atribuye al actor; la aprobación se atribuye adicionalmente al aprobador.
11. El mecanismo técnico de autenticación temporal del aprobador queda diferido.

## Segregación de funciones y autoaprobación

La segregación evita que una identidad controle todas las etapas de una operación de alto riesgo. Cuando una política la exige:

- actor y aprobador son diferentes;
- ambos quedan identificados individualmente;
- el aprobador tiene capacidad suficiente;
- la autoaprobación se deniega;
- la aprobación no se reutiliza;
- el actor conserva responsabilidad sobre la ejecución.

Puede aplicar a creación y aprobación, cobro y cancelación, ajuste y autorización, solicitud y ejecución, operación y cierre, o administración y revisión. Este ADR no convierte todas esas parejas en reglas universales ni define una matriz completa.

No toda acción sensible exige segundo usuario. La política de la rebanada decide entre nivel 2, nivel 3 o nivel 4 conforme al riesgo validado.

## Motivo obligatorio

El motivo puede ser obligatorio para cancelaciones, ajustes, revocaciones, cambios excepcionales, anulaciones, modificaciones posteriores al cierre y operaciones con impacto financiero cuando la política aplicable lo determine.

El motivo:

- se vincula a la operación concreta;
- no concede capacidad ni sustituye control reforzado;
- no puede reducirse a una confirmación genérica cuando la política exige explicación;
- permanece atribuible al actor y, cuando corresponda, visible al aprobador.

Catálogo, longitud, formato y validaciones concretas quedan diferidos.

## Alcance, vigencia y consumo

Toda autorización reforzada se limita conceptualmente por:

- tenant;
- sucursal, cuando aplique;
- actor;
- aprobador, cuando exista;
- operación;
- recurso;
- condiciones materiales;
- sesión;
- fecha y hora.

No amplía tenant, sucursal, capacidad ordinaria o propiedad del recurso. Para R0 se prefiere una autorización de un solo uso. Una ventana reutilizable requiere una necesidad explícita y decisión posterior.

La autorización queda consumida cuando se ejecuta exitosamente la operación aceptada. Un reintento técnico no obtiene por sí mismo una aprobación nueva ni autoriza duplicar efectos; idempotencia y recuperación pertenecen al diseño posterior.

## Invalidación y revocación

Una autorización reforzada pendiente deja de ser válida cuando:

- cambia el usuario activo;
- expira o se invalida la sesión del actor;
- se revoca o desactiva al actor;
- el actor pierde la capacidad ordinaria;
- se revoca o desactiva al aprobador;
- el aprobador pierde la capacidad de aprobación;
- cambia materialmente la operación, monto, recurso o condición aprobada;
- cambia el tenant o la sucursal efectiva;
- se ejecuta la acción;
- se cancela el flujo;
- expira la vigencia que la política haya definido.

La invalidación impide una nueva ejecución, pero no reescribe acciones ya realizadas ni su atribución histórica. El mecanismo técnico de propagación queda diferido.

## Estados conceptuales mínimos

### Solicitud de autorización reforzada

- **Pendiente:** espera el control requerido.
- **Aprobada:** satisface el control, aún no se consume.
- **Denegada:** el control fue rechazado.
- **Expirada:** perdió vigencia antes de ejecutarse.
- **Revocada:** una autoridad o condición invalidó la solicitud.
- **Consumida:** se utilizó para la operación aceptada.
- **Cancelada:** el flujo terminó sin ejecutar la acción.

### Reautenticación

- **Requerida:** la operación no puede continuar sin nueva comprobación.
- **Satisfecha:** la identidad del actor fue comprobada para el alcance aceptado.
- **Fallida:** la comprobación no fue válida.
- **Expirada:** perdió vigencia antes de ejecutarse.
- **Invalidada:** un cambio de sesión, actor, capacidad u operación la volvió inaplicable.

### Aprobación

- **Pendiente:** todavía no existe decisión independiente.
- **Concedida:** el aprobador aceptó la operación y alcance.
- **Rechazada:** el aprobador negó la solicitud.
- **Expirada:** perdió vigencia antes de consumirse.
- **Revocada:** el aprobador o su autoridad dejaron de ser válidos.
- **Utilizada:** se consumió al ejecutar la acción aceptada.

Estos estados no obligan a crear tablas, campos o estructuras técnicas.

## Evidencia y atribución conceptual

Toda acción sensible ejecutada conserva conceptualmente:

- tenant;
- sucursal;
- estación;
- actor principal;
- sesión del actor;
- capacidad ordinaria;
- clasificación de sensibilidad;
- tipo de control reforzado;
- resultado de reautenticación, cuando aplique;
- aprobador, cuando exista;
- capacidad de aprobación;
- operación;
- recurso;
- motivo, cuando corresponda;
- fecha y hora;
- resultado final.

La evidencia debe permitir distinguir quién solicitó, quién ejecutó, quién aprobó, qué se autorizó, cuándo se autorizó y qué se ejecutó finalmente. No se atribuye una acción únicamente a un rol. Los cambios posteriores de roles no reescriben el pasado.

Formato, integridad, retención, consulta, correlación técnica y protección contra alteraciones corresponden al futuro ADR de auditoría y observabilidad.

## Candidatas respaldadas por la documentación

La documentación permite clasificar categorías, no fijar todavía todos sus niveles concretos.

| Categoría | Relación con R0 | Decisión desde este ADR |
| --- | --- | --- |
| Operaciones ordinarias con capacidad y alcance válidos | Base de R0 | Nivel 1 |
| Gestionar roles, composición o asignaciones | Fundación R0 | Candidata sensible; nivel 2 o 3 requiere política de la rebanada; nivel 4 mientras falte |
| Revocar o desactivar usuarios | Fundación R0 | Candidata sensible; nivel 2 o 3 requiere política; nivel 4 mientras falte |
| Vincular, desvincular o revocar estaciones | Fundación R0 | Candidata sensible; nivel 2 o 3 requiere política; nivel 4 mientras falte |
| Cambiar configuración crítica | R0 o rebanada posterior según configuración | Candidata sensible; no habilitar sin política y nivel explícitos |
| Ajustar precios o aplicar descuentos extraordinarios | MVP posterior | Candidata sensible por impacto financiero; umbrales y nivel diferidos |
| Cancelar, corregir o devolver pagos | MVP posterior | Candidata sensible; sólo mediante hechos compensatorios y política todavía pendiente |
| Entrega excepcional o sin condiciones ordinarias | MVP posterior | Candidata sensible; legitimación, evidencia y nivel pendientes |
| Modificar después del cierre o reabrir estado terminal | MVP posterior | Candidata sensible; reapertura aún no aprobada por el dominio |
| Retirar, alterar o eliminar evidencia | MVP posterior | Candidata sensible; borrado destructivo no se autoriza por defecto |
| Exportar datos masivos o anonimizar | Futuro | Candidata sensible; alcance, privacidad y control pendientes |
| Cambiar propiedad o tenant de un recurso | R0 | Nivel 4 cuando contradiga ADR-004/010; una aprobación no amplía contexto ni transfiere propiedad |
| Impersonación, break-glass o soporte privilegiado | Fuera de R0 | Nivel 4; requiere decisión separada |
| Aprobaciones offline, elevación permanente o ventanas largas | Fuera de R0 | Nivel 4; no habilitadas |

La etiqueta “candidata sensible” confirma que no debe tratarse silenciosamente como nivel 1. La política funcional posterior decide nivel 2 o 3, motivo y evidencia adicional. Si no existe esa decisión, se aplica nivel 4.

## Acciones expresamente no habilitadas en R0

- autoaprobación cuando se exige segundo usuario;
- aprobación por identidad de otro tenant;
- aprobación que amplíe sucursal o propiedad del recurso;
- aprobación reutilizable sin política expresa;
- elevación permanente o privilegio extraordinario implícito;
- impersonación, break-glass o soporte privilegiado;
- aprobaciones offline;
- cadenas de múltiples aprobadores;
- operaciones sensibles sin clasificación y control explícitos;
- cambios de tenant o propiedad que contradigan ADR-004/010.

## Resultados de autorización reforzada

- **Permitida:** todos los requisitos ordinarios y reforzados son válidos para la operación.
- **Denegada por control ausente:** falta reautenticación o aprobación requerida.
- **Denegada por identidad:** actor o aprobador no son válidos para el contexto.
- **Denegada por autoaprobación:** la política exige identidades distintas y coinciden.
- **Denegada por capacidad:** actor o aprobador carecen de su capacidad correspondiente.
- **Denegada por alcance:** tenant, sucursal, recurso, operación o condición no coinciden.
- **Denegada por invalidación:** sesión, usuario, capacidad, aprobación o vigencia dejaron de ser válidos.
- **No permitida en R0:** falta una decisión necesaria o el riesgo se excluyó expresamente.

Toda denegación ocurre antes de efectos parciales y no revela datos de otro tenant.

## Invariantes

1. Ninguna acción sensible se ejecuta sin capacidad ordinaria.
2. La autorización reforzada no concede capacidades permanentes.
3. La ausencia del control requerido produce denegación.
4. El servidor es la autoridad final.
5. El cliente no declara válidamente que una acción ya fue aprobada.
6. El cliente no elige libremente actor o aprobador.
7. Actor y aprobador pertenecen al mismo tenant efectivo.
8. Una aprobación no amplía tenant.
9. Una aprobación no amplía sucursal.
10. Una aprobación no se reutiliza libremente.
11. Una aprobación se vincula a una operación concreta.
12. Cuando existe segregación, actor y aprobador son distintos.
13. La reautenticación corresponde al actor activo.
14. El cambio de turno invalida controles pendientes del usuario anterior.
15. La expiración de sesión invalida controles reforzados pendientes.
16. La revocación impide nuevas ejecuciones.
17. Perder la capacidad ordinaria invalida el control antes de ejecutar.
18. Perder la capacidad de aprobación invalida aprobaciones pendientes.
19. Una acción denegada no produce efectos parciales.
20. La evidencia histórica no se reescribe.
21. La interfaz no constituye la barrera de seguridad.
22. Autorización reforzada y auditoría técnica son responsabilidades distintas.
23. Un motivo no reemplaza autorización.
24. Un aprobador no sustituye al actor principal.
25. Un cambio material de operación invalida la aprobación previa.

## Escenarios mínimos

| Escenario | Resultado requerido |
| --- | --- |
| Acción ordinaria | Sesión y capacidad ordinaria válidas; ADR-012 permite sin control adicional |
| Acción sensible con reautenticación | El mismo actor comprueba identidad; el servidor ejecuta una vez y consume el control |
| Reautenticación fallida | Se deniega sin efectos parciales |
| Segundo aprobador | Usuario diferente, autenticado y con capacidad de aprobación; se conserva evidencia de ambos |
| Autoaprobación | Se rechaza cuando la política exige segundo usuario |
| Aprobador sin capacidad | La autenticación no basta; se deniega la aprobación |
| Aprobación reutilizada | El alcance no coincide o ya fue consumida; se rechaza |
| Cambio de turno | El control pendiente no se transfiere y debe iniciarse nuevamente |
| Sesión expirada | La operación no se ejecuta; requiere sesión y control nuevos |
| Revocación del actor | La operación y aprobación pendiente quedan inválidas |
| Revocación del aprobador | La aprobación pendiente no puede consumirse |
| Operación modificada | Cambiar monto, recurso o condición material invalida la aprobación |
| Indicador manipulado por cliente | El servidor ignora la declaración sin evidencia autoritativa y deniega |
| Recurso de otro tenant | Se deniega siempre; el control reforzado no amplía ADR-004 |
| Recurso de otra sucursal | Se deniega cuando el alcance no cubre la sucursal; la aprobación no amplía ADR-010/012 |

## Alternativas consideradas

### Sesión y capacidad ordinaria suficientes para toda acción

Rechazada. No confirma presencia e intención ante operaciones de alto impacto ni permite segregación.

### Reautenticación para toda acción sensible

Rechazada como regla universal. Confirma al mismo actor, pero no aporta independencia cuando el riesgo exige otro decisor.

### Segundo aprobador para toda acción sensible

Rechazada. Introduce fricción innecesaria cuando basta confirmar al actor y no existe necesidad de segregación.

### Ventana reforzada reutilizable por defecto

Rechazada para R0. Facilita reutilización accidental y amplía el impacto de una sesión abandonada.

### Aprobación que otorgue temporalmente una capacidad

Rechazada. Mezcla autorización ordinaria con refuerzo y dificulta revocación y explicación.

### Clasificación controlada por la interfaz

Rechazada. El cliente puede manipularse; la autoridad debe permanecer en el servidor.

### Motor general de riesgo o políticas dinámicas

Rechazado para R0. Añade expresiones, precedencias y condiciones sin necesidad demostrada.

## Consecuencias positivas

- Una sesión abierta deja de ser suficiente para acciones de alto impacto.
- Capacidad ordinaria y control reforzado conservan responsabilidades separadas.
- R0 dispone de cuatro niveles explicables y negativos por defecto.
- Reautenticación y aprobación independiente no se confunden.
- La autoaprobación queda prohibida cuando la política exige segregación.
- La autorización de un solo uso reduce privilegios residuales.
- Actor y aprobador conservan atribución individual.
- El modelo puede aplicarse por rebanada sin inventar un catálogo global.

## Costos y riesgos residuales

- Cada rebanada debe clasificar sus operaciones antes de habilitarlas.
- Sin una política concreta, candidatas sensibles permanecen en nivel 4.
- Falta definir el mecanismo y factor de reautenticación.
- Falta definir persistencia, integridad y retención de evidencia.
- La experiencia puede degradarse si se sobrerrepresenta el nivel 3.
- La revocación exige propagación técnica verificable.
- Umbrales y categorías financieras requieren decisiones de negocio.
- Acceso de plataforma y emergencias siguen sin modelo aceptado.

## Verificación conceptual requerida

La implementación futura deberá demostrar, como mínimo:

- acción ordinaria sin control reforzado innecesario;
- acción sensible denegada sin el control requerido;
- reautenticación correcta del actor y rechazo de credencial ajena;
- segundo usuario diferente y con capacidad específica;
- rechazo de autoaprobación;
- rechazo de aprobador sin capacidad;
- autorización ligada a operación, recurso, actor y sesión;
- consumo de un solo uso;
- rechazo de reutilización;
- invalidación por cambio de turno o sesión expirada;
- invalidación por revocación del actor o aprobador;
- invalidación al perder capacidades;
- invalidación por cambio material de operación;
- aislamiento de tenant y sucursal;
- manipulación de cliente sin efecto;
- denegación sin efectos parciales;
- atribución individual del actor y aprobador.

Estas verificaciones no seleccionan herramientas, datos físicos o contratos técnicos y no autorizan ejecución.

## Cierre documental de bloqueantes

Este ADR cierra conceptualmente `DEC-019` en:

- definición y clasificación de acciones sensibles;
- niveles 1 a 4;
- relación entre capacidad ordinaria y control reforzado;
- separación entre reautenticación y aprobación independiente;
- motivo y evidencia conceptual;
- regla de no habilitar una candidata sin política concreta.

También cierra conceptualmente `DEC-020` en:

- significado de reautenticación;
- preferencia de un solo uso para R0;
- segundo usuario y capacidad específica de aprobación;
- prohibición de autoaprobación;
- alcance, consumo, invalidación y revocación.

No cierra la aplicación, las pruebas, los factores técnicos, tiempos exactos, matriz definitiva por rebanada, umbrales, auditoría técnica ni acceso privilegiado. Esos elementos conservan sus hitos y autoridades.

## Decisiones diferidas

- matriz concreta de acciones sensibles por rebanada;
- nivel 2 o 3 exacto para cada candidata;
- umbrales y montos;
- mecanismo y factor de reautenticación;
- tiempos exactos o ventanas reutilizables;
- persistencia y transporte de aprobaciones;
- formato, integridad, retención y consulta de evidencia;
- firma digital y sellado de tiempo;
- detección de fraude, alertas y monitoreo de abuso;
- acceso de soporte, superadministrador, impersonación y break-glass;
- aprobaciones y operación offline;
- segregación completa de funciones;
- cadenas de múltiples aprobadores;
- interfaz y experiencia concreta;
- políticas comerciales, financieras y operativas específicas.

## Relación con otros ADRs

- **ADR-002** conserva autoridad sobre el monolito modular y responsabilidades internas.
- **ADR-004** conserva autoridad sobre tenant, propiedad e aislamiento; ningún refuerzo amplía tenant.
- **ADR-010** conserva autoridad sobre estación, sucursal y contexto; ningún refuerzo cambia la sucursal efectiva.
- **ADR-011** conserva autoridad sobre identidad, PIN, sesión, cambio de turno y expiración; la reautenticación respeta esa identidad.
- **ADR-012** conserva autoridad sobre roles, capacidades, alcance y autorización ordinaria; este ADR sólo agrega el control sensible.
- **Futuro ADR de auditoría y observabilidad** definirá estructura, integridad, retención, correlación, consulta, evidencia de aprobaciones/denegaciones y eventos de seguridad.

## Criterios para reconsiderar

Se requiere un ADR que reemplace o modifique esta decisión si:

- R0 necesita autorizaciones reforzadas reutilizables o de larga vigencia;
- se necesita una cadena de más de un aprobador;
- una aprobación debe operar fuera de línea;
- el aprobador debe pertenecer a otro tenant;
- una operación requiere elevación temporal de capacidades;
- aparece acceso break-glass o impersonación;
- una obligación regulatoria exige firma, factor o segregación distinta;
- la clasificación de cuatro niveles resulta insuficiente con evidencia real.

## Trazabilidad

- **Arquitectura inicial:** [ADR-002](ADR-002-modular-monolith-first.md).
- **Propiedad y aislamiento:** [ADR-004](ADR-004-shared-schema-multitenancy.md).
- **Contexto operativo:** [ADR-010](ADR-010-station-bound-operational-context.md).
- **Identidad y sesión:** [ADR-011](ADR-011-tenant-user-pin-authentication-and-operational-session.md).
- **Autorización ordinaria:** [ADR-012](ADR-012-tenant-roles-capabilities-and-contextual-authorization.md).
- **Bloqueantes relacionados:** `DEC-019` y `DEC-020` en el [inventario](../../architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md).
- **Modelo transversal:** [identidad, acceso y permisos](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md).
- **Dominio integrado:** [actores, roles y capacidades](../../domain-model/integrated-repair-domain-model/ACTORES_ROLES_Y_CAPACIDADES.md).
- **Autoridad:** Responsable de Producto.
- **Fecha de aceptación:** 2026-07-21.

## Resultado

ADR-013 queda `Accepted` como autoridad conceptual sobre acciones sensibles, reautenticación, segundo aprobador, segregación, autorización de un solo uso, invalidación y evidencia mínima. ADR-012 continúa gobernando la capacidad ordinaria. Las políticas concretas por rebanada, mecanismos técnicos, auditoría, acceso privilegiado y runtime permanecen explícitamente diferidos.
