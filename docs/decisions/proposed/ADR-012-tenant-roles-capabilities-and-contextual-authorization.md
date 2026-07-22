# ADR-012 — Roles de tenant, capacidades y autorización contextual

**Status: Accepted**
**Fecha:** 2026-07-21
**Autoridad de aceptación:** Responsable de Producto, mediante las decisiones explícitas sobre roles, capacidades, alcance y autorización registradas en la revisión arquitectónica.

## Estado del documento

Decisión arquitectónica aceptada como base de R0 para determinar si un usuario autenticado puede ejecutar una operación protegida dentro de su contexto operativo efectivo. La ruta bajo `proposed/` conserva la convención histórica del repositorio; el estado dentro de este ADR y el [registro de decisiones](../README.md) son autoritativos.

Este ADR define el modelo conceptual, las responsabilidades, las reglas de precedencia y las invariantes de autorización ordinaria. No autoriza implementación ni diseña tablas, SQL, migraciones, endpoints, middleware, guards, políticas de framework, decoradores, atributos de código, interfaces, menús, navegación, tokens o formatos de datos.

## Contexto

[ADR-004](ADR-004-shared-schema-multitenancy.md) establece a qué tenant pertenecen los datos y prohíbe ampliar esa frontera mediante valores aportados por el cliente. [ADR-010](ADR-010-station-bound-operational-context.md) establece tenant, sucursal y estación efectivos. [ADR-011](ADR-011-tenant-user-pin-authentication-and-operational-session.md) establece el usuario autenticado y la sesión operativa vigente.

Esas decisiones responden quién actúa y desde dónde, pero no conceden por sí mismas autoridad para crear, consultar, modificar, cobrar, entregar, cancelar o administrar. Sin un modelo separado, la visibilidad de una pantalla, el nombre de un puesto, un rol enviado por el cliente o una sesión válida podrían convertirse accidentalmente en permisos generales.

R0 necesita una regla simple y explicable que preserve la movilidad de un usuario entre sucursales de su tenant, permita administración mediante agrupaciones reutilizables y falle de forma cerrada. También debe distinguir la autorización ordinaria del control reforzado que ciertas acciones sensibles podrán exigir posteriormente.

## Evidencia y compatibilidad

La decisión considera:

- [ADR-002 — Monolito modular inicial](ADR-002-modular-monolith-first.md);
- [ADR-004 — Multitenancy con base y esquema compartidos](ADR-004-shared-schema-multitenancy.md);
- [ADR-010 — Contexto operativo derivado de estación vinculada](ADR-010-station-bound-operational-context.md);
- [ADR-011 — Identidad, PIN y sesión operativa](ADR-011-tenant-user-pin-authentication-and-operational-session.md);
- el [modelo transversal de identidad, acceso y permisos](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md);
- la [línea base de seguridad](../../architecture/SECURITY_BASELINE.md);
- el [modelo de identidad y atribución](../../architecture-readiness/repair-mvp/MODELO_DE_IDENTIDAD_Y_ATRIBUCION.md);
- la [seguridad y acciones sensibles](../../architecture-readiness/repair-mvp/SEGURIDAD_Y_ACCIONES_SENSIBLES.md);
- los [actores, roles y capacidades del dominio integrado](../../domain-model/integrated-repair-domain-model/ACTORES_ROLES_Y_CAPACIDADES.md);
- los [roles y responsabilidades operativas](../../domain-validation/operational-workflow-and-traceability/ROLES_Y_RESPONSABILIDADES_OPERATIVAS.md);
- el [inventario de bloqueantes](../../architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md).

No se encontró una decisión aceptada incompatible. Las formulaciones anteriores quedan resueltas o delimitadas así:

| Hipótesis previa | Decisión autoritativa desde este ADR |
| --- | --- |
| Un usuario podría recibir permisos directos o ajustes individuales | R0 concede capacidades únicamente mediante roles vigentes; no admite permisos ni denegaciones directas por usuario |
| Las denegaciones podrían tener precedencia sobre concesiones | R0 no introduce denegaciones explícitas; la ausencia de concesión produce denegación por defecto |
| Rol, puesto, actor y responsabilidad podían usarse como equivalentes | Son conceptos distintos; un rol sólo agrupa capacidades |
| Un rol podría fijar la sucursal activa | La estación continúa determinando la sucursal efectiva; una asignación sólo limita dónde puede ejercerse una capacidad |
| Autenticación o menú visible podían implicar acceso | La sesión sólo identifica al actor; el servidor autoriza cada operación protegida |
| La revocación podía esperar al cierre natural de sesión | Una capacidad retirada deja de autorizar operaciones futuras, aun con una sesión todavía activa |
| La matriz completa de roles debía cerrarse antes del modelo | El modelo queda aceptado; los nombres y composición de roles por rebanada se validan sin cambiar estas invariantes |

Los documentos históricos conservan valor como evidencia. Cuando mantengan una alternativa incompatible, prevalece este ADR dentro del alcance de autorización ordinaria.

## Alcance

Este ADR decide:

- el significado de rol, capacidad, permiso, asignación y autorización;
- la pertenencia de los roles al tenant;
- la posibilidad de que un usuario tenga uno o varios roles;
- la unión de capacidades concedidas por roles vigentes;
- la ausencia de permisos y denegaciones directas por usuario en R0;
- el alcance tenant-wide y el alcance restringido por sucursal;
- el cálculo conceptual de capacidades efectivas en la sucursal activa;
- la autorización negativa por defecto;
- la autoridad obligatoria del servidor;
- el efecto de cambios y revocaciones sobre operaciones futuras;
- la atribución histórica independiente del rol actual;
- la frontera entre autorización ordinaria y autorización reforzada;
- la trazabilidad conceptual mínima de una decisión de autorización.

Este ADR no decide:

- nombres y composición definitivos de todos los roles del producto;
- catálogo completo de capacidades de módulos futuros;
- permisos de plataforma, soporte, impersonación o acceso de emergencia;
- autenticación reforzada, reautenticación, aprobación dual o elevación temporal;
- segregación técnica completa de funciones;
- permisos de integraciones externas, APIs públicas u operación offline;
- formato, almacenamiento, integridad, retención o consulta técnica de auditoría;
- modelo físico, caché, propagación, transporte o invalidación de autorizaciones;
- panel de administración, navegación, menús u ocultamiento de controles.

## Vocabulario oficial

- **Actor:** participante humano, externo o automático con responsabilidad en un hecho. No equivale automáticamente a usuario o rol.
- **Usuario:** identidad operativa individual perteneciente exactamente a un tenant conforme a ADR-004 y ADR-011.
- **Usuario autenticado:** usuario identificado por una sesión operativa vigente dentro del contexto efectivo.
- **Sesión operativa:** periodo vigente que establece al usuario activo en una estación; no contiene una concesión irrevocable de permisos.
- **Rol:** agrupación nombrada y administrable de capacidades perteneciente a un tenant.
- **Asignación de rol:** relación vigente entre un usuario y un rol del mismo tenant, con alcance tenant-wide o una restricción explícita de sucursal.
- **Permiso:** término general para una concesión de acceso. En R0 se materializa conceptualmente como una capacidad obtenida mediante un rol; no existe como ajuste directo por usuario.
- **Capacidad:** facultad concreta y verificable para solicitar una operación de negocio o administrativa.
- **Autenticación:** comprobación de quién es el usuario dentro del tenant efectivo.
- **Autorización:** decisión sobre si ese usuario puede ejecutar una operación concreta dentro del contexto y alcance aplicables.
- **Autorización negativa por defecto:** toda operación protegida queda denegada salvo que exista una concesión válida y suficiente.
- **Alcance tenant:** límite máximo dentro del cual una capacidad puede aplicar; nunca incluye otro tenant.
- **Alcance sucursal:** límite que permite ejercer una capacidad únicamente en la sucursal efectiva o en una sucursal expresamente incluida por una asignación válida.
- **Capacidad tenant-wide:** capacidad que puede ejercerse en las sucursales del tenant cuando el caso de uso y la asignación lo permiten.
- **Capacidad local:** capacidad cuyo caso de uso se ejerce sólo en la sucursal efectiva.
- **Recurso protegido:** dato o entidad cuyo acceso exige contexto, pertenencia y capacidad suficientes.
- **Operación protegida:** intención de consulta, cambio o efecto que exige una capacidad explícita.
- **Acción sensible:** operación que puede requerir control reforzado además de la capacidad ordinaria.
- **Autorización reforzada:** control adicional futuro, distinto de autenticación inicial y autorización ordinaria.
- **Revocación:** retiro explícito de un rol, asignación o capacidad para operaciones futuras.
- **Trazabilidad de autorización:** evidencia conceptual del contexto, la operación, la capacidad, el alcance y el resultado evaluados.

En el dominio de reparación, **autorización comercial** continúa significando la decisión atribuible del cliente o decisor sobre una cotización. No es sinónimo de autorización de acceso del sistema.

## Principio de decisión

Toda operación protegida exige, de forma conjunta:

**Contexto operativo válido + sesión operativa vigente + usuario autenticado y habilitado + capacidad requerida + alcance autorizado + pertenencia válida del recurso.**

La ausencia o invalidez de cualquier elemento produce denegación. Una sesión válida no concede acceso universal y una capacidad nunca amplía el tenant efectivo ni sustituye las reglas del recurso.

## Modelo de roles

1. Todo rol pertenece exactamente a un tenant.
2. Un rol de un tenant no concede capacidades en otro tenant.
3. Un rol agrupa capacidades; no representa una persona, sesión, sucursal, estación, puesto o responsabilidad temporal.
4. Un usuario puede tener uno o varios roles vigentes dentro de su único tenant.
5. Los roles pueden configurarse de manera coherente y repetible dentro del tenant.
6. Los nombres y la composición concreta de roles se validan por alcance de producto o rebanada; este ADR no inventa una matriz completa.
7. Un actor de dominio, como técnico o recepcionista, sólo se convierte en rol si existe una agrupación estable y explícitamente validada de capacidades.
8. Una responsabilidad temporal, como encargado de turno o técnico asignado, no se convierte automáticamente en rol permanente.
9. La persona responsable de una Orden no obtiene por ese hecho capacidad administrativa sobre el sistema.
10. Crear, modificar, asignar, revocar, desactivar o retirar roles son operaciones protegidas con capacidades administrativas propias.

## Modelo de capacidades

1. Una capacidad expresa una acción verificable del negocio o de administración.
2. Su semántica sigue el lenguaje del dominio y la frontera del caso de uso, no el nombre de una pantalla, menú, ruta o módulo.
3. Ver un recurso no implica modificarlo.
4. Modificar no implica cancelar, cobrar, entregar, devolver, corregir ni administrar.
5. Operar una reparación no implica gestionar roles, estaciones, políticas o datos de plataforma.
6. Capacidades con riesgos o responsabilidades diferentes permanecen separadas.
7. Cada operación protegida declara conceptualmente una capacidad requerida.
8. Los identificadores concretos se fijarán durante el diseño autorizado; ejemplos como `reparacion.crear`, `reparacion.ver` o `reparacion.entregar` sólo ilustran la convención acción–objeto y no constituyen contrato técnico.
9. Un módulo publica las operaciones protegidas de las que es propietario y las capacidades necesarias; no concede acceso general por “poder usar el módulo”.
10. R0 no admite capacidades creadas libremente por el cliente ni expresiones dinámicas de políticas.

## Asignaciones y alcance

La identidad y sus asignaciones pertenecen al tenant. La asignación ordinaria es tenant-wide para preservar movilidad entre sucursales sin duplicar usuarios ni roles.

Una asignación puede restringirse a una sucursal sólo cuando exista una necesidad de negocio explícita. Esa restricción no cambia la sucursal efectiva: la estación sigue determinándola conforme a ADR-010.

R0 admite:

- **asignación tenant-wide:** aporta sus capacidades en cualquier sucursal válida del tenant, sujetas al alcance propio del caso de uso y del recurso;
- **asignación restringida por sucursal:** aporta sus capacidades sólo cuando la sucursal efectiva coincide con la restricción aceptada.

Ambas formas pueden coexistir para un usuario. No se duplican identidades ni roles por sucursal.

Para la sucursal activa, las capacidades efectivas son la unión de las capacidades aportadas por:

1. asignaciones vigentes tenant-wide del usuario;
2. asignaciones vigentes restringidas a esa sucursal efectiva.

Después se aplica el alcance requerido por la operación y se valida la pertenencia de cada recurso. Una asignación restringida a otra sucursal no aporta capacidades en el contexto actual.

R0 no introduce herencia de roles, jerarquías profundas, permisos directos por usuario, denegaciones directas, reglas condicionales generales ni precedencias entre concesiones y denegaciones. La ausencia de capacidad suficiente es la regla negativa ordinaria.

## Evaluación de autorización

Antes de ejecutar una operación protegida, producir un efecto externo o aceptar un cambio de estado, el servidor debe validar conceptualmente:

1. que el contexto operativo de ADR-010 es válido y coherente;
2. que la sesión de ADR-011 está vigente;
3. que el usuario activo pertenece al tenant efectivo y conserva un estado habilitado;
4. cuál es la capacidad exigida por el caso de uso;
5. cuáles asignaciones y roles del mismo tenant siguen vigentes;
6. la unión de capacidades aplicable a la sucursal efectiva;
7. que el alcance de la capacidad cubre la operación solicitada;
8. que los recursos pertenecen al tenant y, cuando corresponda, a la sucursal autorizada;
9. si la operación está clasificada como sensible y requiere un control adicional;
10. que la decisión ocurre antes de efectos parciales.

El servidor resuelve o valida las capacidades desde la fuente autoritativa. No acepta como prueba de autorización un rol, una lista de permisos, un usuario, un tenant, una sucursal o un alcance enviados por el cliente.

## Resultados de autorización

- **Permitida:** capacidad y alcance suficientes, contexto y recurso válidos.
- **Denegada por falta de capacidad:** no existe concesión vigente suficiente.
- **Denegada por alcance:** la capacidad existe, pero no cubre la sucursal u operación.
- **Denegada por contexto inválido:** tenant, sucursal o estación no son válidos o coherentes.
- **Denegada por sesión inválida:** no existe sesión vigente para el usuario activo.
- **Denegada por estado del usuario:** el usuario está desactivado, revocado o impedido de operar.
- **Diferida a control reforzado:** la capacidad ordinaria existe, pero la acción sensible exige un control adicional aún no satisfecho.

Una denegación no produce efectos parciales ni revela la existencia o contenido de recursos de otro tenant. La forma técnica del error pertenece al diseño posterior.

## Autoridad del servidor e interfaz

- El servidor es la autoridad final de toda operación protegida.
- La interfaz puede mostrar u ocultar opciones para orientar la experiencia, pero esa visibilidad no concede ni revoca capacidades.
- Invocar directamente una operación oculta obliga a repetir la autorización completa.
- El cliente no declara libremente tenant, sucursal, estación, usuario, sesión, rol, capacidades o alcance.
- Una lista local de capacidades puede servir para presentación, nunca como única fuente de autoridad.
- Consultas, comandos, archivos, exportaciones, trabajos diferidos y efectos externos respetan la misma regla de autorización aplicable.

## Cambios, revocaciones y sesiones activas

1. Los cambios de roles, composición o asignaciones afectan las operaciones futuras.
2. Una revocación explícita impide que la capacidad retirada autorice la siguiente operación protegida, aunque la sesión continúe activa.
3. La autorización se reevalúa en cada operación protegida con información suficientemente vigente.
4. La sesión no contiene una concesión permanente e irrevocable de capacidades.
5. Si todos los roles de un usuario son revocados, conserva identidad e historia, pero no ejecuta operaciones protegidas sin una nueva concesión válida.
6. Desactivar o revocar al usuario impide nuevas operaciones conforme a ADR-011, aunque existan asignaciones registradas.
7. El cambio de turno sustituye al usuario activo y, con él, todas las capacidades efectivas.
8. El nuevo usuario nunca hereda roles, capacidades o decisiones del anterior.
9. El mecanismo de caché, propagación o invalidación queda fuera de alcance, pero no puede contradecir el efecto para la siguiente operación protegida.
10. La historia no se reevalúa ni reescribe cuando un rol cambia después.

## Estados conceptuales

### Rol

- **Activo:** puede aportar capacidades mediante asignaciones vigentes.
- **Desactivado:** no aporta capacidades a operaciones futuras; puede conservarse para administración e historia.
- **Retirado o archivado:** ya no se asigna ni aporta capacidades, pero permanece identificable para trazabilidad histórica cuando sea necesario.

### Asignación de rol

- **Vigente:** participa en el cálculo de capacidades efectivas.
- **Revocada:** no participa en operaciones futuras y conserva su historia.

R0 no introduce asignaciones temporales ni estado expirado. Si una necesidad validada exige vigencias temporales, deberá documentarse sin convertir el tiempo en permiso implícito.

## Administración de roles

Administrar roles y asignaciones exige capacidades administrativas explícitas. No se infiere autoridad por nombre, correo, antigüedad, posición del registro, puesto cotidiano, visibilidad de un panel, haber creado a otro usuario u operar desde una estación vinculada.

La eliminación lógica, desactivación o cambio de un rol no borra la atribución histórica. La clasificación de estas operaciones como sensibles y cualquier reautenticación, doble aprobación o segregación de funciones quedan para el ADR especializado.

## Acciones sensibles y autorización reforzada

Una acción sensible puede exigir **capacidad ordinaria + control reforzado**.

Este ADR sólo fija la frontera. No decide el control reforzado. Son candidatas a revisión posterior, sin constituir todavía un catálogo definitivo:

- gestionar roles o asignaciones;
- vincular, desvincular o revocar estaciones;
- cambiar configuraciones críticas;
- cancelar reparaciones o eliminar información;
- autorizar descuentos extraordinarios;
- devolver o ajustar pagos;
- modificar cierres;
- exportar datos masivos;
- acceder a información especialmente sensible.

Reautenticación, motivo obligatorio, aprobación de otra identidad, doble control, elevación temporal, acceso de soporte, impersonación y break-glass quedan diferidos. Poseer la capacidad ordinaria no obliga al futuro ADR a considerar satisfecho el control reforzado.

## Atribución y trazabilidad

Toda acción autorizada conserva, como mínimo, los elementos aceptados por ADR-010 y ADR-011:

- tenant;
- sucursal;
- estación;
- usuario;
- sesión;
- operación;
- fecha y hora.

Cuando sea relevante para seguridad, administración o explicación del resultado, también debe poder identificarse:

- capacidad evaluada;
- resultado de autorización;
- alcance aplicado;
- recurso afectado.

La trazabilidad identifica al usuario individual, no a un rol genérico. El rol actual del usuario no reescribe la historia. El formato técnico, persistencia, integridad, retención, consulta y registro de denegaciones quedan para el ADR de auditoría.

## Invariantes

1. Ninguna operación protegida se ejecuta sin contexto operativo válido.
2. Ninguna operación protegida se ejecuta sin sesión vigente.
3. Ninguna operación protegida se ejecuta sin capacidad suficiente.
4. La ausencia de capacidad produce denegación.
5. La autorización es negativa por defecto.
6. El servidor es la autoridad final.
7. La interfaz nunca es la única barrera de seguridad.
8. El cliente no puede elegir sus permisos, roles o alcance.
9. Una capacidad no amplía el tenant efectivo.
10. Una capacidad no sustituye la sucursal efectiva derivada de la estación.
11. Un rol pertenece exactamente a un tenant.
12. Un rol de un tenant no concede acceso en otro.
13. Una capacidad no elimina restricciones de propiedad de datos o recursos.
14. Los roles agrupan capacidades; no sustituyen identidad, puesto o responsabilidad.
15. Las capacidades de varios roles vigentes se combinan por unión.
16. R0 no admite permisos ni denegaciones directas por usuario.
17. Los cambios de roles y asignaciones afectan operaciones futuras.
18. La atribución histórica no cambia al modificar roles.
19. El cambio de turno reemplaza también las capacidades efectivas.
20. Una sesión anterior no autoriza acciones del usuario nuevo.
21. Autenticación, autorización ordinaria y autorización reforzada son responsabilidades distintas.
22. Las cuentas compartidas no se usan para eludir atribución individual.
23. Toda operación se autoriza conforme al contexto resuelto por el servidor.
24. Una operación denegada no produce efectos parciales.

## Escenarios mínimos

| Escenario | Resultado requerido |
| --- | --- |
| Acción autorizada | Contexto, sesión, usuario, capacidad, alcance y recurso son válidos; el servidor permite y atribuye la operación |
| Usuario autenticado sin capacidad | El servidor deniega y no produce efectos parciales |
| Botón o cliente manipulado | El servidor reevalúa; rol o permisos enviados por el cliente no cambian el resultado |
| Recurso de otra sucursal | Una capacidad local o asignación restringida no cubre el recurso y la operación se deniega |
| Recurso de otro tenant | La operación siempre se deniega, aun con una capacidad homónima |
| Cambio de turno | El usuario nuevo obtiene sólo sus capacidades y no hereda las del anterior |
| Revocación de rol | La siguiente operación protegida ya no usa las capacidades retiradas; la historia permanece |
| Usuario con varios roles | Las capacidades vigentes se combinan por unión dentro del alcance aplicable |
| Acción sensible | La capacidad ordinaria no basta cuando falta el control reforzado requerido |
| Usuario desactivado | Las asignaciones registradas no permiten nuevas operaciones; la historia permanece |
| Cambio de sucursal | Se recalculan asignaciones tenant-wide y las restringidas a la nueva sucursal sin crear otra identidad |
| Rol modificado | Las operaciones futuras usan la composición vigente y las históricas no se reescriben |

## Alternativas consideradas

### Un único rol por usuario

Rechazada. Obliga a crear roles combinatorios o duplicar usuarios cuando una persona cumple varias funciones.

### Permisos y denegaciones directos por usuario

Rechazada para R0. Aumenta excepciones, precedencias, soporte y dificultad para explicar autorizaciones. Podrá reconsiderarse sólo con una necesidad validada.

### Roles por sucursal como única forma

Rechazada. Duplica configuración y contradice la movilidad del usuario dentro de su tenant. Las restricciones por sucursal se expresan en la asignación cuando sean necesarias.

### Rol jerárquico o herencia de roles

Rechazada para R0. Introduce precedencias implícitas y combinaciones difíciles de auditar sin evidencia de negocio.

### Permiso por módulo o pantalla

Rechazado. Es ambiguo, acopla seguridad a la interfaz y no distingue acciones con riesgos diferentes.

### Autorización sólo en la interfaz

Rechazada. Un cliente puede manipularse o invocar operaciones directamente; el servidor debe ser la autoridad.

### ABAC generalizado o lenguaje dinámico de políticas

Rechazado para R0. Añade condiciones, expresiones y evaluación difíciles de gobernar antes de demostrar su necesidad.

### Capacidades congeladas en la sesión

Rechazado. Una revocación no podría impedir nuevas acciones mientras la sesión siguiera vigente.

## Consecuencias positivas

- Autenticación y autorización quedan separadas.
- La regla de acceso es explicable y falla de forma cerrada.
- Varios roles evitan duplicar usuarios o crear combinaciones rígidas.
- La movilidad entre sucursales se conserva con restricciones explícitas cuando sean necesarias.
- La interfaz puede adaptarse sin convertirse en autoridad.
- Las revocaciones protegen operaciones futuras sin reescribir historia.
- Las capacidades siguen casos de uso y fronteras del dominio.
- La autorización reforzada puede evolucionar sin contaminar el modelo ordinario.

## Costos y riesgos residuales

- Cada rebanada debe definir sus operaciones protegidas y capacidades mínimas.
- Los tenants necesitan roles coherentes para evitar privilegios excesivos.
- Una restricción por sucursal mal configurada puede impedir movilidad esperada.
- La revalidación requiere una estrategia técnica que evite permisos obsoletos.
- La administración de roles puede ser una acción sensible, todavía sin control reforzado definido.
- Falta decidir el catálogo inicial de acciones sensibles y la evidencia técnica de auditoría.
- Los permisos de plataforma y soporte permanecen fuera de este modelo ordinario.

## Verificación conceptual requerida

La implementación futura deberá demostrar, como mínimo:

- denegación de toda operación protegida sin capacidad;
- autorización server-side aunque la interfaz sea manipulada;
- aislamiento entre tenants aun con capacidades homónimas;
- alcance local frente a recurso de otra sucursal;
- movilidad tenant-wide entre sucursales del mismo tenant;
- asignación restringida que sólo aporta en la sucursal correspondiente;
- unión de capacidades de varios roles;
- ausencia de permisos y denegaciones directas por usuario;
- revocación efectiva en la siguiente operación protegida;
- cambio de turno sin herencia de capacidades;
- usuario desactivado sin acceso nuevo;
- operación denegada sin efectos parciales;
- preservación de atribución histórica;
- separación entre capacidad ordinaria y control reforzado.

Estas verificaciones son criterios conceptuales. No eligen herramientas, contratos, datos de prueba ni autorizan ejecución.

## Cierre documental de bloqueantes

Este ADR cierra conceptualmente:

- `DEC-017` en el modelo de roles como agrupaciones tenant-scoped y múltiples roles por usuario;
- `DEC-018` en el modelo de capacidades, alcance, combinación, denegación por defecto y autoridad server-side.

También delimita `DEC-019`: acepta que una acción sensible puede requerir capacidad ordinaria más control reforzado, pero no cierra el catálogo por rebanada ni el mecanismo adicional.

No cierra `DEC-020`: reautenticación, vigencia, segundo actor y demás controles reforzados requieren un ADR específico. Tampoco cierra la implementación, las pruebas, la matriz concreta por rebanada ni el ADR técnico de auditoría.

## Decisiones diferidas

- catálogo y composición de roles iniciales por alcance de producto;
- catálogo definitivo de capacidades de módulos futuros;
- permisos de plataforma, soporte e integraciones;
- acciones sensibles definitivas;
- reautenticación y factores reforzados;
- aprobación dual y segregación de funciones;
- elevación temporal, impersonación y break-glass;
- asignaciones temporales;
- overrides o denegaciones directas por usuario;
- herencia o jerarquía de roles;
- autorización offline;
- persistencia, caché, propagación e invalidación;
- auditoría técnica, integridad, retención y consulta.

## Relación con otros ADRs

- **ADR-002** conserva autoridad sobre el monolito modular y las fronteras internas.
- **ADR-004** conserva autoridad sobre tenant, propiedad e aislamiento; ninguna capacidad amplía el tenant.
- **ADR-010** conserva autoridad sobre estación, sucursal y contexto; ninguna asignación cambia la sucursal efectiva.
- **ADR-011** conserva autoridad sobre identidad, PIN, autenticación, sesión y cambio de turno; este ADR evalúa las capacidades del usuario autenticado.
- **Futuro ADR de acciones sensibles** decidirá reautenticación, aprobación reforzada, doble control, elevación y segregación.
- **Futuro ADR de auditoría** decidirá formato, persistencia, integridad, retención, consulta y evidencia de decisiones permitidas o denegadas.

## Criterios para reconsiderar

Se requiere un ADR que reemplace o modifique esta decisión si:

- R0 necesita permisos o denegaciones directas por usuario;
- la unión de capacidades resulta insuficiente por conflictos validados;
- una asignación necesita condiciones más complejas que tenant o sucursal;
- aparecen asignaciones temporales como requisito de negocio;
- un usuario ordinario debe operar en varios tenants;
- la autorización debe funcionar sin conexión con garantías equivalentes;
- obligaciones regulatorias exigen segregación o aprobación reforzada dentro del modelo ordinario;
- los permisos de plataforma deben integrarse con los roles de tenant.

## Trazabilidad

- **Arquitectura inicial:** [ADR-002](ADR-002-modular-monolith-first.md).
- **Propiedad y aislamiento:** [ADR-004](ADR-004-shared-schema-multitenancy.md).
- **Contexto operativo:** [ADR-010](ADR-010-station-bound-operational-context.md).
- **Identidad y sesión:** [ADR-011](ADR-011-tenant-user-pin-authentication-and-operational-session.md).
- **Bloqueantes relacionados:** `DEC-017` a `DEC-020` en el [inventario](../../architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md).
- **Modelo transversal:** [identidad, acceso y permisos](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md).
- **Dominio integrado:** [actores, roles y capacidades](../../domain-model/integrated-repair-domain-model/ACTORES_ROLES_Y_CAPACIDADES.md).
- **Autoridad:** Responsable de Producto.
- **Fecha de aceptación:** 2026-07-21.

## Resultado

ADR-012 queda `Accepted` como autoridad conceptual sobre roles de tenant, capacidades, asignaciones, alcance y autorización ordinaria. ADR-004 conserva la frontera de datos, ADR-010 el contexto operativo y ADR-011 el usuario autenticado y la sesión. Acciones sensibles, autorización reforzada, auditoría técnica y detalles de implementación permanecen explícitamente diferidos.
