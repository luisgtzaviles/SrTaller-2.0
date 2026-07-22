# ADR-010 — Contexto operativo derivado de una estación vinculada

**Status: Accepted**
**Fecha:** 2026-07-21
**Autoridad de aceptación:** Responsable de Producto, mediante las decisiones explícitas sobre usuario, estación, sucursal efectiva, cambio de turno y atribución registradas en la revisión de contexto operativo.

## Estado del documento

Decisión arquitectónica aceptada para resolver el contexto operativo de SR Taller 2.0. La ruta bajo `proposed/` sigue la convención histórica del repositorio; el estado dentro de este ADR y el [registro de decisiones](../README.md) son autoritativos.

Este ADR define el modelo conceptual y sus invariantes. No autoriza implementación, no diseña tablas, SQL, migraciones, endpoints, middleware o interfaces, no selecciona criptografía y no implementa autenticación por PIN, roles, permisos ni acciones sensibles.

## Contexto

SR Taller 2.0 necesita atribuir cada operación ordinaria a una organización, una sucursal física, una estación y una persona. [ADR-004](ADR-004-shared-schema-multitenancy.md) ya establece que el tenant es la frontera de aislamiento, que la sucursal es un alcance operativo local y que el usuario ordinario pertenece exactamente a un tenant. También difiere expresamente la forma de resolver una sucursal confiable, una estación y el actor efectivo.

La operación validada usa estaciones compartidas. Un dispositivo permanece físicamente asociado a una sucursal mientras distintas personas toman turno e ingresan su PIN. Permitir que cada persona seleccione la sucursal, derivarla de datos enviados por la interfaz o mantener una sucursal dentro de la identidad del usuario produciría contextos ambiguos y debilitaría el confinamiento de las Órdenes y demás datos locales.

La decisión debe separar:

- quién es el usuario;
- dónde está autorizada a operar la estación;
- qué usuario está activo en este momento;
- bajo qué contexto completo se ejecutó cada acción;
- qué detalles de autenticación, autorización y seguridad siguen pendientes.

## Evidencia y compatibilidad

La decisión considera:

- [ADR-002 — Monolito modular inicial](ADR-002-modular-monolith-first.md);
- [ADR-004 — Multitenancy con base y esquema compartidos](ADR-004-shared-schema-multitenancy.md);
- el [modelo de identidad y atribución](../../architecture-readiness/repair-mvp/MODELO_DE_IDENTIDAD_Y_ATRIBUCION.md);
- el [modelo multitenant del MVP](../../architecture-readiness/repair-mvp/MODELO_MULTITENANT.md);
- el [modelo conceptual de sucursal y dispositivo](../../architecture/BRANCH_AND_DEVICE_MODEL.md);
- el [modelo conceptual de identidad y acceso](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md);
- la [trazabilidad por usuario](../../domain-validation/operational-workflow-and-traceability/TRAZABILIDAD_POR_USUARIO.md);
- el [modelo integrado de trazabilidad](../../domain-model/integrated-repair-domain-model/MODELO_DE_TRAZABILIDAD.md);
- el [inventario de bloqueantes](../../architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md) y la [secuencia de decisiones](../../architecture-readiness/blocker-closure/SECUENCIA_DE_DECISIONES.md).

No se encontró una decisión aceptada incompatible. Las siguientes formulaciones anteriores eran propuestas o preguntas y quedan resueltas o delimitadas así:

| Hipótesis previa | Decisión autoritativa desde este ADR |
| --- | --- |
| El usuario podría elegir una sucursal activa | El usuario nunca elige la sucursal; la estación vinculada la determina |
| Una asignación permanente usuario–sucursal podría habilitar la operación | El usuario ordinario pertenece al tenant y puede operar desde cualquier estación autorizada de ese tenant; no se duplica ni se fija permanentemente a una sucursal |
| Una identidad ordinaria podría alternar entre varios tenants | Un usuario ordinario pertenece exactamente a un tenant, conforme a ADR-004 |
| Cambiar una estación de sucursal podría ser una edición de contexto | Requiere desvinculación y nueva vinculación explícitas, autorizadas y auditadas |
| Cerrar sesión podría retirar la confianza del dispositivo | La inactividad o salida sólo termina la sesión del usuario; la vinculación de la estación permanece |
| El PIN podría aportar tenant o sucursal | El PIN sólo identifica al usuario dentro del tenant ya derivado de la estación |

Los documentos históricos conservan su valor como evidencia. Cuando presenten una alternativa incompatible, prevalecen ADR-004 y este ADR dentro de sus respectivos alcances.

## Alcance

Este ADR decide:

- la relación conceptual entre tenant, sucursal, estación operativa y usuario;
- la fuente autoritativa de tenant y sucursal durante la operación ordinaria;
- el ciclo conceptual de vinculación, desvinculación, reubicación y revocación de una estación;
- la separación entre identidad de usuario y contexto operativo;
- la resolución del contexto del lado del servidor en cada solicitud ordinaria;
- el comportamiento ante inactividad y cambio de turno;
- la información contextual que acompaña comandos, consultas, eventos y auditoría;
- la preservación de la atribución histórica.

Este ADR no decide:

- mecanismos, factores, algoritmos o almacenamiento de credenciales y PIN;
- formatos de sesión, tokens, cookies o secretos de dispositivo;
- roles, permisos, capacidades administrativas o acciones sensibles detalladas;
- endpoints, middleware, contratos HTTP o interfaces de usuario;
- tablas, columnas, índices, constraints, SQL o migraciones;
- protocolo concreto de vinculación, desafío, QR, código o aprobación;
- modo sin conexión, sincronización local o gestión del sistema operativo;
- contexto excepcional de soporte o administración de plataforma;
- selección tecnológica para identidad, persistencia o dispositivos;
- diseño completo de auditoría, retención o integridad de sus registros.

## Definiciones

- **Usuario ordinario:** identidad operativa perteneciente exactamente a un tenant. No representa una cuenta de plataforma ni una identidad reutilizable entre tenants.
- **Estación operativa:** origen físico/técnico reconocido por el servidor desde el que se ejecuta la operación cotidiana. Su identidad no sustituye al usuario.
- **Vinculación:** asociación administrativa vigente, mantenida del lado del servidor, entre una estación y una única sucursal activa.
- **Sucursal efectiva:** sucursal obtenida exclusivamente de la vinculación vigente de la estación.
- **Tenant efectivo:** tenant al que pertenece la sucursal efectiva; nunca se elige de manera independiente en la operación ordinaria.
- **Usuario autenticado:** usuario activo identificado dentro del tenant efectivo conforme a [ADR-011](ADR-011-tenant-user-pin-authentication-and-operational-session.md).
- **Contexto operativo efectivo:** identidad operacional completa e inmutable para una solicitud o acción ordinaria.
- **Cambio de turno:** sustitución explícita del usuario activo sin cambiar estación, sucursal ni tenant.
- **Desvinculación:** retiro explícito de la asociación vigente de una estación con una sucursal.
- **Revocación o deshabilitación:** retiro de la confianza operativa de la estación; cualquier información local deja de ser autoridad.

## Decisión

SR Taller 2.0 resolverá toda operación ordinaria mediante un único contexto efectivo compuesto por:

```text
Tenant
+
Sucursal
+
Estación Operativa
+
Usuario Autenticado
```

Los cuatro elementos son obligatorios para comandos y consultas normales de negocio. El servidor los resuelve y valida como una unidad; la interfaz no puede aportar, sustituir ni mutar libremente ninguno de ellos.

El contexto es inmutable durante la ejecución de una solicitud. Un cambio de usuario, una desvinculación o una nueva vinculación produce un contexto nuevo para operaciones posteriores; nunca reescribe el contexto de una acción ya ocurrida.

## Invariantes organizacionales

1. Un usuario ordinario pertenece exactamente a un tenant.
2. El usuario no pertenece de forma permanente a una sucursal.
3. El mismo usuario puede operar en distintas sucursales de su tenant usando estaciones válidamente vinculadas.
4. El usuario no se duplica por sucursal.
5. El mismo usuario y el mismo PIN deben funcionar para identificar a la persona desde cualquier estación autorizada del mismo tenant, siempre que usuario y estación conserven estados válidos; la autorización de cada acción se evalúa aparte.
6. Una estación sólo puede mantener una vinculación vigente con una sucursal.
7. Una sucursal vinculada debe estar activa y pertenecer exactamente a un tenant.
8. El tenant efectivo de la estación deriva de la sucursal vinculada.
9. Una estación no puede operar simultáneamente en varias sucursales.
10. Una estación vinculada no puede operar datos locales de otra sucursal.
11. Cerrar la sesión del usuario no modifica la vinculación de la estación.
12. La vinculación permanece entre turnos, reinicios e inactividad mientras no sea retirada, revocada o invalidada por el servidor.

## Estado conceptual mínimo de una estación

Una estación mantiene conceptualmente, sin prescribir persistencia:

- identidad de estación;
- sucursal vinculada, cuando exista;
- tenant derivado y coherente con esa sucursal;
- estado de vinculación o confianza;
- vigencia necesaria para que el servidor determine si puede operar.

El servidor es la fuente de verdad de la vinculación y de su estado. Identificadores, caché, configuración o datos conservados localmente no pueden restaurar ni ampliar una autorización retirada.

## Vinculación inicial

1. El primer uso operativo de una estación requiere vinculación previa.
2. La estación sólo se vincula a una sucursal activa.
3. La vinculación debe ser realizada o autorizada por una capacidad administrativa.
4. La autorización concreta, la reautenticación y el mecanismo técnico quedan para ADRs posteriores.
5. La decisión registra al menos la estación, la sucursal resultante, el tenant derivado, el actor que realizó o autorizó, el momento y el resultado.
6. La vinculación no crea un usuario compartido ni concede por sí sola permisos de negocio.
7. Una estación vinculada únicamente aporta origen y alcance; la acción también exige un usuario autenticado y autorización del lado del servidor.

## Desvinculación y cambio físico de sucursal

Cuando una estación cambia físicamente de sucursal:

1. se retira explícitamente la vinculación anterior;
2. se invalida el contexto operativo que dependía de ella;
3. se conserva la historia de la vinculación anterior;
4. se inicia una vinculación nueva con la sucursal destino;
5. se vuelve a derivar y validar el tenant desde la sucursal destino;
6. se registra quién realizó o autorizó cada paso, fecha, hora, motivo y resultado cuando corresponda;
7. la estación no puede operar casos de uso normales durante el intervalo sin vinculación válida.

No existe una selección libre de sucursal, un cambio silencioso de `sucursal_id` ni una continuidad automática del contexto anterior. El tratamiento de operaciones de negocio abiertas durante el cambio pertenece a cada caso de uso y a decisiones posteriores; este ADR no autoriza mover Órdenes ni otros datos entre sucursales.

## Estación desvinculada, revocada o inválida

Una estación sin vinculación válida no ejecuta casos de uso normales. Sólo puede participar en capacidades separadas y limitadas necesarias para recuperar una situación segura, como:

- consultar su estado técnico permitido;
- iniciar o solicitar vinculación;
- mostrar información técnica minimizada;
- cerrar cualquier sesión de usuario residual;
- solicitar soporte por un camino autorizado.

Una estación revocada o deshabilitada tampoco opera datos de negocio, aunque conserve información local o una sesión anterior. El alcance exacto del diagnóstico o soporte seguro se definirá posteriormente y no constituye una excepción implícita.

## Resolución del contexto en cada solicitud

Para cada solicitud ordinaria, el servidor debe resolver conceptualmente el contexto en este orden:

1. reconocer la identidad técnica de la estación mediante una fuente confiable;
2. comprobar que la estación conserva una vinculación vigente y un estado operativo permitido;
3. obtener la sucursal exclusivamente de la vinculación mantenida del lado del servidor;
4. comprobar que la sucursal está activa;
5. derivar el tenant desde la sucursal y comprobar su coherencia y estado aplicable;
6. identificar al usuario activo dentro de ese tenant;
7. comprobar que el usuario pertenece al mismo tenant y conserva un estado válido;
8. construir un único contexto efectivo e inmutable;
9. evaluar por separado la autorización de la acción;
10. ejecutar, consultar, registrar o emitir hechos sólo dentro de ese contexto.

La ausencia, ambigüedad, expiración, revocación o conflicto de cualquier elemento falla de forma cerrada. Conocer identificadores o enviar valores de tenant, sucursal, estación o actor no concede autoridad.

## Fuentes confiables y datos no autoritativos

Son fuentes conceptualmente confiables:

- la vinculación y estado de estación reconocidos por el servidor;
- la relación autoritativa sucursal–tenant de ADR-004;
- la identidad y sesión de usuario validadas por el servidor;
- el tiempo y la correlación generados o aceptados por componentes confiables.

No son autoridad suficiente:

- `tenant_id`, `sucursal_id`, `station_id` o `user_id` enviados por la interfaz;
- la opción visible o seleccionada en una pantalla;
- el nombre de host por sí solo;
- la posesión de un identificador, enlace o folio;
- datos locales que afirmen una vinculación anterior;
- el PIN sin una estación vinculada y un tenant ya resuelto;
- un rol o nombre de puesto mostrado por el cliente.

## Identidad del usuario frente a contexto operativo

La identidad responde **quién es la persona dentro de su tenant**. El contexto operativo responde **dónde y desde qué estación está actuando ahora**.

- El usuario conserva su identidad al rotar entre sucursales del mismo tenant.
- La sucursal no forma parte permanente del usuario.
- La estación no se convierte en identidad humana.
- En la operación cotidiana, el usuario se identifica únicamente mediante su PIN dentro del tenant ya resuelto; no elige tenant ni sucursal.
- El PIN no decide tenant ni sucursal; busca o valida al usuario dentro del tenant ya resuelto.
- La vinculación no concede permisos; la autorización se evalúa para la capacidad solicitada.
- El cambio de estación o sucursal no modifica la historia del usuario ni de sus acciones anteriores.

[ADR-011](ADR-011-tenant-user-pin-authentication-and-operational-session.md) acepta identidad, PIN, autenticación contextual y sesión respetando estas invariantes. Recuperación, limitación de intentos, reautenticación y protección técnica del PIN permanecen diferidas.

## Inactividad y cierre de sesión

- La inactividad termina o bloquea la sesión del usuario conforme a la política futura.
- La estación permanece vinculada a la misma sucursal.
- Tenant, sucursal y estación no se transfieren a un usuario residual.
- Para reanudar una operación normal debe existir nuevamente un usuario autenticado.
- El tiempo exacto, la experiencia de reanudación y los controles por riesgo quedan fuera de alcance.

## Cambio de turno

1. El usuario activo anterior deja de ser válido para nuevas operaciones.
2. El nuevo usuario se identifica dentro del tenant ya fijado por la estación.
3. La estación, la sucursal efectiva y el tenant efectivo permanecen sin cambios.
4. Las operaciones posteriores reciben un contexto nuevo con el nuevo usuario.
5. Las acciones anteriores conservan al usuario y contexto originales.
6. No se permite una ventana ordinaria sin actor ni una herencia silenciosa del usuario anterior.

El tratamiento de borradores, cajas, procesos abiertos o acciones sensibles durante el relevo pertenece a sus módulos y ADRs específicos.

## Propagación del contexto

### Comandos

Todo comando normal recibe el contexto efectivo completo. El caso de uso no acepta que la carga útil redefina tenant, sucursal, estación o actor. La autorización y la carga de recursos se evalúan dentro del contexto ya resuelto.

### Consultas

Toda consulta operativa normal usa el mismo contexto completo. Una consulta no obtiene alcance adicional por ser de sólo lectura. Los reportes tenant-wide o las funciones administrativas requieren contratos y contextos separados; no reutilizan un contexto de estación para operar otra sucursal.

### Eventos de dominio

Todo evento originado por una acción conserva tenant, sucursal, estación y usuario de origen, además de su correlación y momento confiable cuando corresponda. Un consumidor posterior no sustituye esa autoría con el usuario activo al momento de consumir.

Una reacción automática puede distinguir al ejecutor técnico del actor que originó la cadena, pero no elimina el contexto de origen. Este ADR no define formato de eventos ni infraestructura de publicación.

### Trabajos diferidos

Cuando un hecho origine trabajo posterior, el trabajo conserva el alcance necesario y vuelve a validar que puede actuar dentro de él. No se ejecuta con un contexto global implícito ni con el usuario que casualmente esté activo en la estación más tarde.

### Auditoría

Toda acción relevante debe poder responder:

- tenant efectivo;
- sucursal efectiva;
- estación de origen;
- usuario atribuido;
- acción y objeto afectados;
- fecha y hora confiables;
- resultado;
- correlación y motivo cuando correspondan.

Vinculación, desvinculación, revocación, cambio de sucursal, inicio/cierre de sesión y cambio de turno también son hechos auditables según la política futura. No se registran PIN, secretos, tokens ni credenciales.

## Preservación histórica

- El contexto se conserva como atribución del hecho y no se recalcula con el estado actual.
- Cambiar al usuario activo no cambia la autoría de acciones previas.
- Reubicar una estación no cambia la sucursal histórica de acciones anteriores.
- Desactivar un usuario, estación o sucursal no borra su participación histórica.
- Una corrección de atribución, si se autoriza posteriormente, debe ser explícita y preservar la evidencia original conforme a la política de auditoría.
- Las proyecciones como “recibió”, “reparó”, “revisó” o “entregó” derivan de hechos atribuidos; no sustituyen su historia.

## Responsabilidades conceptuales

| Responsabilidad | Autoridad conceptual |
| --- | --- |
| Propiedad y estado de tenant/sucursal | Tenancy y sucursales, conforme a ADR-004 |
| Identidad, estado y autenticación del usuario | Identidad/autenticación, ADR posterior |
| Vinculación y estado de estación | Gestión de estaciones/dispositivos |
| Resolución del contexto efectivo | Capa de aplicación en un borde confiable |
| Autorización de la acción | Control de acceso y caso de uso, ADR posterior |
| Reglas e invariantes de negocio | Módulo propietario del caso de uso |
| Evidencia de autoría y resultado | Auditoría y módulo propietario, política posterior |

Estas responsabilidades no prescriben módulos físicos ni dependencias de código. Deben respetar el monolito modular de ADR-002 y contratos explícitos entre propietarios.

## Reglas obligatorias

1. Ninguna operación ordinaria se ejecuta sin los cuatro elementos del contexto.
2. Tenant y sucursal provienen de la vinculación de la estación mantenida del lado del servidor.
3. El tenant de la estación debe coincidir con el tenant único del usuario.
4. La interfaz nunca selecciona ni redefine libremente la sucursal efectiva.
5. Un PIN sólo identifica dentro del tenant previamente resuelto.
6. Conocer un ID no concede acceso ni cambia contexto.
7. Un contexto conflictivo o incompleto se rechaza de forma segura.
8. El cierre de usuario no desvincula la estación.
9. El cambio de turno conserva estación/sucursal y sustituye sólo al usuario para acciones posteriores.
10. El cambio físico de sucursal exige desvincular y volver a vincular.
11. Una estación desvinculada, revocada o deshabilitada no ejecuta casos de uso normales.
12. Comandos, consultas, eventos y auditoría preservan el contexto aplicable.
13. La autoría histórica no se recalcula desde el usuario o la vinculación actuales.
14. La autorización se evalúa del lado del servidor y no se infiere de la vinculación.
15. Las excepciones administrativas usan caminos separados, explícitos y auditables.

## Casos obligatorios

### Caso 1 — Rotación entre sucursales

Un usuario de Avicell trabaja hoy desde una estación vinculada a Centro y mañana desde otra vinculada a Centenario. Conserva el mismo usuario y PIN; cada estación determina automáticamente su sucursal y las acciones quedan atribuidas al contexto correcto.

### Caso 2 — Intento de selección manual

La interfaz envía una sucursal distinta a la vinculada. El servidor ignora ese valor como autoridad y rechaza cualquier conflicto sin revelar datos de la otra sucursal.

### Caso 3 — Cambio de turno

Una estación de Centro cambia del usuario Ana al usuario Luis. Tenant, sucursal y estación permanecen; las nuevas acciones se atribuyen a Luis y las anteriores siguen atribuidas a Ana.

### Caso 4 — Inactividad

La sesión de Ana termina por inactividad. La estación continúa vinculada a Centro, pero no ejecuta nuevas operaciones normales hasta autenticar a un usuario válido.

### Caso 5 — Reubicación física

Una estación se mueve de Centro a Centenario. Primero se desvincula, se invalida el contexto anterior y después se vincula explícitamente a Centenario. La historia conserva ambas vinculaciones y sus actores.

### Caso 6 — Estación revocada

Una estación conserva datos locales que indican Centro, pero el servidor la marca revocada. Toda operación normal se rechaza; la información local no restaura confianza.

### Caso 7 — Usuario de otro tenant

Una estación de Avicell recibe un PIN que sólo corresponde a un usuario de Tecnicell. La identificación falla dentro del tenant de Avicell y no revela la existencia del usuario externo.

### Caso 8 — Evento procesado después del relevo

Una acción de Ana genera un proceso diferido que termina después de que Luis toma turno. El evento y la auditoría conservan a Ana y el contexto original como origen; Luis no hereda autoría.

### Caso 9 — Estación desvinculada

Una estación sin sucursal puede consultar únicamente su estado permitido o iniciar el proceso de vinculación. No puede consultar clientes, crear Órdenes ni ejecutar operaciones normales.

### Caso 10 — Usuario válido sin permiso

Un usuario pertenece al tenant correcto y está en una estación vinculada, pero carece de la capacidad requerida. La acción se rechaza. Contexto válido no equivale a autorización.

## Alternativas consideradas

### Estación vinculada como fuente de tenant y sucursal — aceptada

Preserva el origen físico, elimina selección manual, mantiene baja fricción en el cambio de turno, permite rotación de personal sin duplicar usuarios y crea una única fuente del lado del servidor para el alcance local.

Su costo es administrar el ciclo de vida de estaciones, revocación y auditoría, además de exigir un mecanismo de vinculación seguro que se decidirá posteriormente.

### Sucursal elegida por cada usuario al iniciar sesión — descartada

Facilita trabajar desde cualquier dispositivo, pero permite errores de selección, confunde identidad con ubicación y exige confiar en estado aportado por el cliente. También facilita intentar operar datos de una sucursal distinta desde una estación físicamente ubicada en otra.

### Usuario asignado permanentemente a una sucursal — descartada

Simplifica ciertos permisos, pero contradice la rotación real, produce cuentas duplicadas o administración innecesaria y vuelve a la identidad una fuente incorrecta de ubicación física.

### Tenant y sucursal derivados del nombre de host — descartada como fuente completa

El nombre de host puede aportar un candidato de tenant según ADR-008, pero no prueba sucursal, estación, usuario ni autorización. No reemplaza la vinculación ni el contexto efectivo.

### Estación como usuario compartido — descartada

Reduce autenticaciones, pero destruye atribución individual, impide cambios de turno confiables y convierte una credencial técnica en identidad humana.

## Consecuencias positivas

- Una sola fuente del lado del servidor determina la sucursal operativa.
- El usuario rota entre sucursales del tenant sin cuentas duplicadas.
- El cambio de turno conserva la ubicación y cambia sólo la persona atribuida.
- La inactividad no obliga a volver a vincular el equipo.
- Comandos, consultas, eventos y auditoría comparten el mismo contexto.
- La historia permanece explicable aunque cambien usuarios o vinculaciones.
- El confinamiento por sucursal de ADR-004 recibe una fuente operativa concreta.
- Un dispositivo perdido o revocado puede dejar de operar sin revocar usuarios.

## Consecuencias negativas

- Toda estación debe administrarse y vincularse antes de operar.
- Una vinculación incorrecta atribuiría operaciones a la sucursal equivocada hasta ser detectada y corregida.
- La indisponibilidad del estado de estación mantenido por el servidor puede bloquear operación normal.
- Reubicar equipos exige un proceso explícito, no una selección instantánea.
- Cambio de turno, inactividad y procesos en curso necesitan políticas adicionales.
- La implementación futura debe evitar que cachés o estado local prolonguen confianza revocada.
- Auditoría y pruebas deben cubrir una matriz adicional de usuario–estación–sucursal–tenant.

## Riesgos y controles conceptuales

| Riesgo | Consecuencia | Control obligatorio |
| --- | --- | --- |
| Vinculación errónea | Acciones atribuidas a otra sucursal | Autorización administrativa, confirmación y auditoría |
| Contexto enviado por cliente | Escalada o cruce de alcance | Resolver del lado del servidor y rechazar discrepancias |
| PIN buscado globalmente | Enumeración o cruce de tenant | Resolver primero tenant desde la estación |
| Sesión anterior residual | Acciones atribuidas al usuario equivocado | Cierre por inactividad y cambio explícito de turno |
| Revocación no aplicada | Estación perdida continúa operando | Estado del servidor validado en cada solicitud |
| Reubicación silenciosa | Historia y datos en sucursal incorrecta | Desvinculación más nueva vinculación |
| Evento sin contexto de origen | Autoría histórica falsa | Sobre contextual obligatorio y correlación |
| Contexto válido tratado como permiso | Acciones no autorizadas | Autorización independiente en servidor |
| Datos locales tratados como autoridad | Operación después de revocación | Rechazo cuando el servidor no confirma vigencia |

## Controles y pruebas requeridos para una implementación futura

- estación válida, desvinculada, revocada, deshabilitada y vinculada a sucursal inactiva;
- usuario válido del tenant, usuario de otro tenant, usuario inactivo y ausencia de usuario;
- manipulación de tenant, sucursal, estación y actor en la solicitud;
- misma persona operando en dos sucursales del mismo tenant sin duplicación;
- cambio de turno sin heredar actor, datos temporales o permisos;
- inactividad que termina usuario y conserva vinculación;
- reubicación que exige desvinculación y nueva vinculación;
- evento o trabajo diferido procesado después de un cambio de turno;
- consulta, mutación, archivo, caché y reporte con alcance conflictivo;
- auditoría de vinculación, revocación, turno y acciones de negocio sin secretos;
- denegación de una acción para un usuario con contexto válido pero sin permiso;
- funciones limitadas de una estación desvinculada sin acceso a datos de negocio.

Este ADR exige esa evidencia antes de declarar completa la fundación correspondiente; no implementa las pruebas.

## Decisiones separadas y diferidas

### Identidad, autenticación, PIN y sesión

[ADR-011](ADR-011-tenant-user-pin-authentication-and-operational-session.md) acepta identificación, propósito del PIN, autenticación contextual, sesión, cambio de turno, inactividad y atribución mínima. Almacenamiento y protección técnica del PIN, intentos, recuperación, política exacta de bloqueo, formato de sesión y reautenticación permanecen diferidos.

### Roles, permisos y acciones sensibles

Debe definir capacidades, alcance, autorizaciones administrativas para vincular/desvincular y controles reforzados. Una estación válida no concede permisos automáticamente.

### Mecanismo de vinculación

Debe evaluar la prueba concreta de autorización y posesión, vigencia, revocación, recuperación y amenazas. Requiere una decisión de dispositivos separada sin cambiar las invariantes de este ADR ni de ADR-011.

### Auditoría y retención

Debe definir integridad, disponibilidad, acceso, retención, correcciones y fallos al registrar evidencia. Este ADR sólo fija el contexto mínimo atribuible.

### Operaciones abiertas y cambio de turno

Cada módulo debe decidir quién puede continuar borradores, cajas, diagnósticos, pagos u otras operaciones abiertas y cómo conserva al iniciador. No se resuelve mediante transferencia automática de autoría.

### Soporte y plataforma

El contexto excepcional de plataforma, soporte o recuperación no utiliza una estación ordinaria como vía de evasión. Requiere decisión separada con propósito, alcance, duración y auditoría.

### Modo sin conexión

Credenciales locales, vigencia, cifrado, revocación diferida, sincronización y conflictos están fuera de alcance. Este ADR no autoriza operación sin conexión.

## Criterios para reconsiderar

Revisar esta decisión si aparece evidencia de:

- operación prioritaria fuera de una estación física vinculada;
- dispositivos personales que no representen ubicación de sucursal;
- necesidad legítima de un usuario ordinario en varios tenants;
- operación sin conexión imprescindible e incompatible con validación del lado del servidor;
- sucursales virtuales o trabajo remoto que invaliden el origen físico;
- requisito regulatorio o contractual que exija otra forma de atribución;
- costos operativos medidos de vinculación superiores a sus controles de riesgo.

Un disparador abre una evaluación; no autoriza selección manual ni debilitamiento silencioso del aislamiento. Cualquier cambio incompatible requiere un ADR nuevo que reemplace este documento y reconcilie ADR-004.

## Trazabilidad

- [Registro de ADRs](../README.md)
- [ADR-002 — Monolito modular inicial](ADR-002-modular-monolith-first.md)
- [ADR-004 — Multitenancy con base y esquema compartidos](ADR-004-shared-schema-multitenancy.md)
- [Modelo de identidad y atribución](../../architecture-readiness/repair-mvp/MODELO_DE_IDENTIDAD_Y_ATRIBUCION.md)
- [Modelo multitenant del MVP](../../architecture-readiness/repair-mvp/MODELO_MULTITENANT.md)
- [Seguridad y acciones sensibles](../../architecture-readiness/repair-mvp/SEGURIDAD_Y_ACCIONES_SENSIBLES.md)
- [Observabilidad y auditoría](../../architecture-readiness/repair-mvp/OBSERVABILIDAD_Y_AUDITORIA.md)
- [Modelo de sucursal y dispositivo](../../architecture/BRANCH_AND_DEVICE_MODEL.md)
- [Identidad, acceso y permisos](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md)
- [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md)
- [Arquitectura objetivo](../../architecture/TARGET_ARCHITECTURE.md)
- [Mapa de ADRs requeridos](../../architecture-readiness/blocker-closure/MAPA_DE_ADRS_REQUERIDOS.md)
- [Trazabilidad por usuario](../../domain-validation/operational-workflow-and-traceability/TRAZABILIDAD_POR_USUARIO.md)
- [Modelo integrado de trazabilidad](../../domain-model/integrated-repair-domain-model/MODELO_DE_TRAZABILIDAD.md)
- [Trazabilidad de dominio](../../domain/TRACEABILITY.md)

## Próxima revisión

Al aparecer un criterio observable de reconsideración o antes de aceptar una decisión de identidad, vinculación, permisos o auditoría incompatible. Aceptar ADR-010 cierra el modelo de contexto operativo, pero no autoriza código ni cierra los demás hitos H0/H1.
