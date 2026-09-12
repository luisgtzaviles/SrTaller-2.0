# ADR-011 — Identidad de usuario, autenticación por PIN y sesión operativa

**Status: Accepted**
**Fecha:** 2026-07-21
**Autoridad de aceptación:** Responsable de Producto, mediante las decisiones explícitas sobre identidad, PIN, autenticación contextual, sesión, cambio de turno, inactividad y atribución registradas en esta revisión.

## Estado del documento

Decisión arquitectónica aceptada para SR Taller 2.0. La ruta bajo `proposed/` conserva la convención histórica del repositorio; el estado dentro de este ADR y el [registro de decisiones](../README.md) son autoritativos.

**Sustitución parcial vigente:** [ADR-014](ADR-014-concurrent-operational-sessions.md)
sustituye desde 2026-09-12 únicamente la exclusividad de una Session/User por
Station, el reemplazo station-wide y la concurrencia antes diferida. Este ADR
conserva autoridad sobre identidad Tenant-scoped, PIN contextual, sesión,
estados, expiración, fail-closed y atribución en todo lo no sustituido. El texto
histórico inferior no se reescribe; debe leerse con esa delimitación.

Este ADR define un contrato conceptual. No autoriza implementación y no diseña tablas, SQL, migraciones, endpoints, middleware, interfaces, tokens, cookies, algoritmos criptográficos ni mecanismos concretos de almacenamiento.

## Contexto

[ADR-004](ADR-004-shared-schema-multitenancy.md) establece al tenant como frontera de aislamiento y al usuario ordinario como identidad perteneciente exactamente a un tenant. [ADR-010](ADR-010-station-bound-operational-context.md) establece que una estación vinculada determina el tenant y la sucursal efectivos y que el usuario no los selecciona.

Faltaba decidir qué usuario puede convertirse en actor dentro de ese contexto, qué representa su PIN, cómo nace y termina su sesión operativa y qué ocurre con la atribución cuando cambia el turno o la sesión deja de ser válida.

La operación diaria requiere baja fricción: en una estación ya vinculada, la persona introduce únicamente su PIN. Esa facilidad no puede convertir al PIN en identidad global, fuente de tenant, permiso universal ni sustituto de la sesión. Tampoco puede permitir que datos enviados por el cliente suplanten al actor resuelto por el servidor.

## Evidencia y compatibilidad

La decisión se consolidó a partir de:

- [ADR-002 — Monolito modular orientado al dominio](ADR-002-modular-monolith-first.md);
- [ADR-004 — Multitenancy con base y esquema compartidos](ADR-004-shared-schema-multitenancy.md);
- [ADR-010 — Contexto operativo derivado de una estación vinculada](ADR-010-station-bound-operational-context.md);
- el [modelo de identidad y atribución del MVP](../../architecture-readiness/repair-mvp/MODELO_DE_IDENTIDAD_Y_ATRIBUCION.md);
- la [arquitectura conceptual de identidad y acceso](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md);
- la [trazabilidad por usuario](../../domain-validation/operational-workflow-and-traceability/TRAZABILIDAD_POR_USUARIO.md);
- el [modelo integrado de trazabilidad](../../domain-model/integrated-repair-domain-model/MODELO_DE_TRAZABILIDAD.md);
- el [inventario de bloqueantes](../../architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md).

No se encontró otro ADR que decidiera conjuntamente identidad, PIN, autenticación contextual y sesión operativa. Tampoco se encontró una decisión aceptada incompatible. Las menciones previas a estos conceptos eran propuestas, restricciones parciales o preguntas; desde este ADR se interpretan dentro de los límites aquí aceptados.

## Autoridad y límites respecto de otros ADRs

Las responsabilidades quedan separadas así:

| Decisión | Autoridad |
| --- | --- |
| Arquitectura inicial y límites modulares | ADR-002 |
| Tenant, propiedad lógica y aislamiento | ADR-004 |
| Estación, vinculación, sucursal efectiva y contexto de origen | ADR-010 |
| Identidad ordinaria, PIN, autenticación, sesión y usuario activo | ADR-011 |
| Roles, permisos, acciones sensibles y reautenticación | Decisiones posteriores |

Este ADR depende de ADR-004 y ADR-010. No redefine el tenant, no permite elegir sucursal, no cambia el ciclo de vinculación de una estación y no convierte autenticación en autorización.

## Alcance

Este ADR decide:

- la identidad conceptual del usuario ordinario dentro de un tenant;
- la independencia entre usuario, PIN, sesión, estación y sucursal;
- el propósito y alcance contextual del PIN;
- las precondiciones conceptuales de autenticación;
- el establecimiento de una sesión operativa y de un usuario activo;
- la regla de una sola sesión operativa activa por estación;
- el cambio de turno y la sustitución del usuario activo;
- el cierre voluntario y la expiración por inactividad;
- el efecto conceptual de estados de usuario y de sesión;
- la atribución histórica mínima de las acciones;
- la separación entre autenticación y autorización;
- el comportamiento cerrado ante contexto, identidad o sesión inválidos.

## Fuera de alcance y decisiones diferidas

Permanecen diferidos:

- atributos, alta, baja administrativa y recuperación completa de identidades;
- identidad global o correlación de una persona entre tenants;
- longitud, composición, rotación, recuperación y experiencia de captura del PIN;
- algoritmo de protección, parámetros, almacenamiento y verificación técnica del PIN;
- limitación de intentos, ventanas, enfriamiento y política exacta de bloqueo;
- duración exacta de inactividad, avisos, renovación y reanudación;
- formato y transporte de sesión, tokens, cookies, JWT, OAuth, SSO o credenciales de estación;
- política de concurrencia de un mismo usuario entre varias estaciones;
- roles, permisos, capacidades, alcance de autorización y denegaciones;
- acciones sensibles, doble autorización, reautenticación, MFA y biometría;
- auditoría técnica, integridad, acceso, retención y exportación de registros;
- operación y sincronización sin conexión;
- autenticación de APIs, integraciones, soporte y superadministración de plataforma;
- tablas, columnas, restricciones físicas, migraciones, endpoints, middleware e interfaces.

Estas decisiones no pueden inferirse de este ADR. Cuando sean necesarias deberán recibir su propia autoridad y evidencia.

## Definiciones

- **Identidad de usuario:** representación estable de una persona operadora dentro de un tenant. Permite referirla sin depender de una credencial o sesión concreta.
- **Usuario ordinario:** identidad operativa perteneciente exactamente a un tenant. No es una cuenta de plataforma ni una identidad que opere ordinariamente en varios tenants.
- **Credencial PIN:** secreto operativo que permite demostrar la identidad de un usuario dentro del tenant ya resuelto. No es la identidad ni una fuente de contexto.
- **Autenticación:** decisión del servidor de que una credencial válida corresponde a un usuario habilitado dentro del tenant efectivo.
- **Sesión operativa:** periodo durante el cual un usuario autenticado es el actor activo de una estación dentro del contexto ya resuelto.
- **Usuario activo:** usuario asociado a la única sesión operativa activa de una estación.
- **Autorización:** decisión separada sobre si el usuario autenticado puede ejecutar una acción específica dentro de un alcance.
- **Cambio de turno:** autenticación satisfactoria de un nuevo usuario que sustituye la sesión activa anterior sin alterar tenant, sucursal, estación ni vinculación.
- **Cierre voluntario:** terminación explícita de la sesión de usuario, sin desvincular la estación.
- **Expiración por inactividad:** terminación de la sesión por la política temporal aplicable, sin desvincular la estación.
- **Sesión sustituida:** sesión anterior cerrada como consecuencia de un cambio de turno exitoso.
- **Sesión invalidada:** sesión que el servidor ya no acepta para nuevas acciones por una condición de seguridad, de usuario o de contexto.
- **Atribución histórica:** evidencia inmutable de qué usuario actuó, mediante qué sesión y dentro de qué contexto cuando se aceptó una acción.

## Decisión

SR Taller 2.0 utilizará una identidad de usuario estable y limitada a un tenant. En la operación cotidiana, el usuario se autenticará introduciendo únicamente su PIN desde una estación previamente vinculada.

El servidor resolverá primero tenant, sucursal y estación conforme a ADR-010. Después evaluará el PIN exclusivamente dentro del tenant efectivo. Una autenticación satisfactoria establecerá al usuario como actor operativo activo mediante la única sesión operativa activa de esa estación.

La identidad, la credencial, la autenticación, la sesión y la autorización son responsabilidades diferentes. Ninguna puede usarse como sustituto implícito de otra.

## Modelo de identidad

1. Un usuario ordinario pertenece exactamente a un tenant.
2. No pertenece permanentemente a una sucursal.
3. Puede operar en distintas sucursales de su tenant mediante estaciones válidamente vinculadas.
4. Conserva la misma identidad y el mismo PIN en las estaciones autorizadas de su tenant.
5. No se duplica por sucursal.
6. Su identidad es independiente de la estación, la sucursal efectiva, la sesión y el PIN.
7. Cambiar o retirar una credencial no reescribe la identidad ni la historia atribuida.
8. Una posible identidad global o relación entre identidades de tenants distintos queda fuera de alcance.

## Contrato conceptual del PIN

1. El PIN es únicamente una credencial operativa.
2. No determina tenant, sucursal ni estación.
3. No concede permisos ni demuestra autorización para una acción.
4. Se evalúa sólo después de resolver una estación vinculada y su tenant.
5. La búsqueda o comparación queda limitada al tenant efectivo.
6. Un PIN igual en otro tenant no puede autenticar a ese usuario en el tenant actual.
7. Dentro del tenant, el resultado debe identificar sin ambigüedad a un único usuario elegible; ausencia o ambigüedad fallan de forma cerrada.
8. El usuario no introduce otro identificador durante el flujo cotidiano aprobado.
9. El PIN nunca se almacena en texto plano ni de manera reversible.
10. La protección técnica concreta y la política de intentos quedan diferidas.

La ausencia de un algoritmo concreto no debilita la invariante de confidencialidad. Cualquier diseño posterior debe demostrar que preserva esa prohibición.

## Resolución de la autenticación

La autenticación cotidiana sigue este orden conceptual:

1. el servidor reconoce la estación mediante una fuente confiable;
2. valida que la estación conserve una vinculación vigente y estado operativo permitido;
3. obtiene la sucursal exclusivamente de esa vinculación;
4. deriva el tenant desde la sucursal conforme a ADR-004 y ADR-010;
5. recibe el PIN como única credencial cotidiana del usuario;
6. limita la evaluación de la credencial al tenant efectivo;
7. identifica de forma no ambigua a un usuario de ese tenant;
8. comprueba que el estado del usuario permite iniciar sesión;
9. establece una nueva sesión operativa válida para esa estación;
10. convierte al usuario autenticado en actor activo;
11. evalúa por separado la autorización de cada acción posterior.

La ausencia, conflicto, ambigüedad, expiración o revocación de cualquier precondición falla de forma cerrada. Un identificador de usuario, tenant, sucursal, estación o sesión enviado por el cliente no altera el resultado.

## Sesión operativa y usuario activo

1. La sesión representa un periodo de operación autenticada; no es una identidad humana.
2. La sesión queda contenida en un único tenant, sucursal y estación efectivos.
3. Una estación mantiene como máximo una sesión operativa activa.
4. La sesión activa identifica al actor actual para operaciones nuevas.
5. Establecer, cerrar, expirar, sustituir o invalidar una sesión no cambia la vinculación de la estación.
6. Reiniciar la autenticación no cambia tenant ni sucursal efectivos.
7. Una sesión no puede ampliar el alcance definido por ADR-004 y ADR-010.
8. Una sesión inválida no ejecuta ni autoriza nuevas acciones.
9. El servidor, no el estado visible del cliente, determina la vigencia de la sesión.
10. La política sobre un mismo usuario activo simultáneamente en varias estaciones queda diferida; esta decisión sólo limita cada estación a un usuario activo.

## Estados conceptuales de sesión

| Estado | Significado | ¿Acepta nuevas acciones? | Efecto sobre la estación |
| --- | --- | --- | --- |
| Activa | Usuario autenticado vigente en la estación | Sí, sujeto a autorización | Ninguno |
| Cerrada | El usuario terminó voluntariamente su sesión | No | La vinculación permanece |
| Expirada | La política de inactividad terminó la sesión | No | La vinculación permanece |
| Sustituida | Un cambio de turno exitoso reemplazó al usuario | No | La vinculación permanece |
| Invalidada | El servidor retiró su vigencia por una condición aplicable | No | Depende de la condición; no redefine ADR-010 |

Estos estados describen semántica, no una máquina de estados física ni un modelo de persistencia.

## Inicio normal

Cuando no existe una sesión activa, una autenticación válida establece una sesión nueva. Si falla la autenticación, la estación conserva su vinculación pero no obtiene un usuario activo nuevo.

Cuando ya existe una sesión activa, un intento fallido de otro usuario no sustituye silenciosamente al actor actual. Sólo una autenticación satisfactoria puede completar un cambio de turno.

## Cambio de turno

Un cambio de turno exitoso:

1. autentica al nuevo usuario dentro del mismo tenant efectivo;
2. finaliza la sesión anterior como sustituida;
3. establece una sesión nueva como única sesión activa de la estación;
4. conserva tenant, sucursal, estación y vinculación;
5. no hereda identidad, permisos ni atribución de la sesión anterior;
6. aplica el nuevo actor únicamente a acciones posteriores;
7. conserva sin cambios la historia de ambos usuarios.

El tratamiento de borradores, cajas, operaciones en curso o acciones sensibles durante el relevo pertenece a sus respectivos casos de uso y decisiones posteriores.

## Cierre voluntario e inactividad

- El cierre voluntario termina la sesión del usuario y deja la estación vinculada.
- La inactividad expira la sesión del usuario y deja la estación vinculada.
- Después del cierre o expiración no existe actor válido para nuevas acciones hasta una nueva autenticación.
- La reanudación exige autenticar nuevamente al usuario.
- La duración, avisos, tolerancias y experiencia de reanudación quedan diferidos.
- Ninguno de estos eventos modifica tenant, sucursal o estación efectivos.

## Estado del usuario, bloqueo, desactivación y revocación

Los estados del usuario no se confunden con los de su sesión ni con el estado de la estación:

| Condición | Regla aceptada | Decisión todavía diferida |
| --- | --- | --- |
| Usuario bloqueado | No inicia una nueva sesión mientras la condición le impida autenticarse | Causas, duración, desbloqueo y efecto exacto sobre sesiones existentes |
| Usuario desactivado | No inicia nuevas sesiones | Flujo administrativo, motivo y propagación sobre sesiones existentes |
| Usuario revocado | No inicia nuevas sesiones y una sesión invalidada por la revocación no acepta acciones | Alcance, propagación y latencia concreta de la revocación |
| Sesión expirada, cerrada o sustituida | No acepta nuevas acciones | Representación y transporte técnicos |
| Estación revocada | Se aplica ADR-010; no es un estado del usuario | Recuperación y soporte técnico |

El sistema debe poder invalidar sesiones desde una decisión autoritativa del servidor. La política exacta que relaciona cada estado de usuario con sesiones ya abiertas queda diferida, pero nunca puede permitir que una sesión declarada inválida continúe operando.

## Autenticación frente a autorización

Autenticarse sólo demuestra quién es el usuario dentro del tenant efectivo. No responde qué puede hacer.

Toda acción requiere después una decisión de autorización del lado del servidor. Los roles, permisos, alcances, denegaciones, acciones sensibles, doble autorización y reautenticación se resolverán en decisiones posteriores. La interfaz puede explicar un resultado, pero no es autoridad para concederlo.

Una estación vinculada, un PIN válido o una sesión activa no conceden por sí solos acceso general a datos ni acciones.

## Atribución de acciones

Toda acción relevante aceptada por el sistema debe conservar al menos:

- tenant efectivo;
- sucursal efectiva;
- estación operativa;
- usuario autenticado;
- sesión operativa;
- fecha y hora del hecho.

La atribución se fija con el contexto válido en el momento autoritativo de la acción. Cerrar, expirar, sustituir o invalidar después una sesión no elimina, reasigna ni reescribe la atribución histórica.

La sesión enlaza la acción con un periodo operativo, pero nunca sustituye a la identidad del usuario. Los detalles de almacenamiento, integridad, retención, consulta y exportación se definirán en la decisión de auditoría correspondiente.

## Sesión que pierde vigencia durante una operación

Una acción sólo puede aceptarse con una sesión válida en el punto autoritativo en que el sistema reconoce el hecho. Si la sesión ya no es válida en ese punto, la acción falla de forma cerrada y no se atribuye a otro usuario ni a una sesión posterior.

Si la acción ya fue aceptada válidamente antes de que la sesión terminara, su historia conserva la atribución original. Los límites transaccionales, la idempotencia y la recuperación específica se definirán por caso de uso; este ADR no inventa resultados de negocio.

## Fuentes confiables y datos no autoritativos

Son fuentes conceptualmente confiables:

- la vinculación y estado de estación reconocidos por el servidor;
- la relación autoritativa sucursal–tenant;
- la identidad, estado y credencial evaluados dentro del tenant efectivo;
- la vigencia de sesión determinada por el servidor;
- el tiempo autoritativo que adopte la arquitectura posterior.

No son autoridad suficiente:

- identificadores de tenant, sucursal, estación, usuario o sesión enviados por el cliente;
- el nombre o rol mostrado en la interfaz;
- un PIN fuera del contexto de una estación vinculada;
- una sesión conservada localmente que el servidor ya considera inválida;
- conocer un identificador, folio o enlace;
- el estado visual de una pantalla.

## Invariantes

1. Ningún usuario ordinario se autentica fuera de su tenant.
2. El tenant efectivo proviene de la estación conforme a ADR-010.
3. La sucursal efectiva proviene de la estación conforme a ADR-010.
4. El PIN identifica únicamente dentro del tenant efectivo.
5. El PIN no es la identidad del usuario.
6. El PIN nunca se almacena en texto plano ni de manera reversible.
7. Una estación tiene como máximo un usuario operativo activo.
8. Una sesión inválida no ejecuta nuevas acciones.
9. La inactividad finaliza la sesión del usuario y no desvincula la estación.
10. El cambio de turno no modifica estación, sucursal, tenant ni vinculación.
11. Un usuario bloqueado, desactivado o revocado no inicia nuevas sesiones mientras su condición lo impida.
12. La atribución histórica nunca cambia por terminar una sesión.
13. Autenticación y autorización son decisiones independientes.
14. El servidor siempre resuelve y valida el contexto efectivo.
15. Datos manipulados por el cliente no sustituyen al usuario autenticado.

## Escenarios mínimos

| Escenario | Resultado requerido |
| --- | --- |
| Inicio normal | Una estación vinculada resuelve contexto, valida el PIN dentro del tenant y establece al usuario como actor de una sesión activa |
| PIN existente en otro tenant | El usuario del otro tenant no participa en la búsqueda ni puede autenticarse; sólo cuenta el tenant efectivo |
| Usuario rotando entre sucursales | Conserva identidad y PIN; cada estación aporta su propia sucursal efectiva |
| Cambio de turno | La autenticación exitosa del nuevo usuario sustituye la sesión anterior sin cambiar estación, sucursal ni tenant |
| Expiración por inactividad | La sesión deja de aceptar acciones; la estación permanece vinculada y exige nueva autenticación |
| Usuario bloqueado o desactivado | No inicia una sesión mientras su estado no lo permita |
| Usuario revocado | No inicia una sesión y cualquier sesión invalidada por esa revocación deja de aceptar acciones |
| Estación desvinculada | No comienza autenticación ordinaria ni se usa una sesión residual; prevalece ADR-010 |
| Sesión expirada durante una operación | El sistema valida vigencia en el punto autoritativo y falla cerrado si ya no es válida, sin reasignar actor |
| Manipulación de usuario desde el cliente | El servidor ignora la identidad propuesta como autoridad y conserva el usuario resuelto por la sesión válida |

## Alternativas consideradas

### Usuario selecciona tenant o sucursal al autenticarse

Rechazada. Contradice ADR-010, permite contexto manipulable y mezcla identidad con ubicación operativa.

### Usuario duplicado por sucursal

Rechazada. Fragmenta la identidad, dificulta revocación y atribución y contradice la pertenencia al tenant aceptada en ADR-004.

### PIN como identidad global

Rechazada. Un secreto corto no es una identidad estable y no debe ampliar el alcance entre tenants.

### Estación compartida sin sesión de usuario

Rechazada. Haría imposible distinguir al actor actual y degradaría la atribución histórica.

### Varias sesiones activas simultáneas en una estación

Rechazada para la operación ordinaria. Introduce ambigüedad sobre el actor de cada acción y rompe el cambio de turno explícito.

### Cierre de usuario desvincula la estación

Rechazada. Mezcla dos ciclos de vida independientes y contradice ADR-010.

### Autenticación concede permisos generales

Rechazada. Identificar al usuario no demuestra autoridad para cada acción.

## Consecuencias positivas

- La operación cotidiana conserva el flujo de un solo PIN.
- El PIN queda confinado al tenant antes de buscar al usuario.
- La identidad sobrevive cambios de estación, sucursal, credencial y sesión.
- El relevo de turno tiene un límite explícito de atribución.
- La estación compartida mantiene un único actor actual.
- La inactividad reduce atribución residual sin perder la vinculación física.
- Las acciones históricas permanecen explicables después del cierre o revocación.
- Autenticación y autorización pueden evolucionar sin confundirse.

## Costos y riesgos residuales

- La baja fricción del PIN exige protección, limitación de intentos y recuperación que aún deben decidirse.
- La invalidación de sesiones necesita una semántica técnica y evidencia de propagación.
- La concurrencia de un usuario en varias estaciones puede afectar políticas futuras.
- El cambio de turno puede interactuar con borradores, cajas y operaciones multipaso.
- La atribución mínima no sustituye una política completa de auditoría e integridad.
- Sin una matriz de permisos, una sesión válida todavía no basta para programar acciones protegidas.

## Verificación conceptual requerida

La implementación futura deberá demostrar, como mínimo:

- autenticación satisfactoria desde una estación vinculada;
- rechazo de estación ausente, desvinculada o revocada;
- aislamiento ante PIN idéntico en otro tenant;
- rechazo seguro de PIN ausente, incorrecto o ambiguo;
- rotación del mismo usuario entre sucursales de su tenant;
- una sola sesión activa por estación;
- cambio de turno sin herencia de actor ni modificación de vinculación;
- expiración y cierre sin desvinculación;
- rechazo de sesiones cerradas, expiradas, sustituidas o invalidadas;
- rechazo de usuario cuyo estado impide una nueva sesión;
- resistencia a manipulación de usuario o contexto desde el cliente;
- conservación de atribución después del término de la sesión;
- evaluación separada de autorización.

Estas verificaciones son criterios conceptuales; no seleccionan herramientas ni autorizan pruebas sobre un entorno de ejecución.

## Cierre documental de bloqueantes

Este ADR cierra conceptualmente:

- `DEC-013` en identidad ordinaria, pertenencia al tenant y autenticación contextual;
- `DEC-014` en propósito del PIN, alcance tenant y flujo cotidiano;
- `DEC-015` en efecto de la inactividad y necesidad de nueva autenticación;
- `DEC-016` en el conjunto mínimo de atribución que incluye sesión.

No cierra la implementación ni las pruebas de esas decisiones. Tampoco cierra recuperación, protección técnica del PIN, política exacta de bloqueo, autorización, acciones sensibles, reautenticación, auditoría detallada o retención. Esos elementos conservan sus hitos y autoridades.

## Criterios para reconsiderar

Se requiere un ADR que reemplace o modifique esta decisión si:

- un usuario ordinario debe operar en varios tenants;
- la sucursal deja de derivarse de una estación vinculada;
- la operación cotidiana requiere otra identidad además del PIN;
- una estación necesita varios usuarios activos simultáneos;
- el cierre de sesión debe alterar la vinculación de estación;
- aparece un modo offline que no puede validar contexto y sesión con autoridad equivalente;
- una obligación legal o de seguridad hace insuficiente el modelo conceptual aceptado.

Una decisión técnica sobre hash, tokens, cookies, transporte o persistencia no reemplaza este ADR mientras preserve sus invariantes.

## Trazabilidad

- **Decisión previa de arquitectura:** [ADR-002](ADR-002-modular-monolith-first.md).
- **Autoridad de pertenencia y aislamiento:** [ADR-004](ADR-004-shared-schema-multitenancy.md).
- **Autoridad de estación y contexto:** [ADR-010](ADR-010-station-bound-operational-context.md).
- **Bloqueantes relacionados:** `DEC-013` a `DEC-020` y `DEC-046` en el [inventario](../../architecture-readiness/blocker-closure/INVENTARIO_DE_BLOQUEANTES.md).
- **Modelo de preparación:** [identidad y atribución](../../architecture-readiness/repair-mvp/MODELO_DE_IDENTIDAD_Y_ATRIBUCION.md).
- **Modelo transversal:** [identidad, acceso y permisos](../../architecture/IDENTITY_ACCESS_AND_PERMISSIONS.md).
- **Dominio validado:** [trazabilidad por usuario](../../domain-validation/operational-workflow-and-traceability/TRAZABILIDAD_POR_USUARIO.md).
- **Modelo integrado:** [trazabilidad](../../domain-model/integrated-repair-domain-model/MODELO_DE_TRAZABILIDAD.md).
- **Autoridad:** Responsable de Producto.
- **Fecha de aceptación:** 2026-07-21.

## Resultado

ADR-011 queda `Accepted` como autoridad conceptual sobre identidad del usuario ordinario, PIN, autenticación contextual, sesión operativa y usuario activo. ADR-004 conserva la autoridad sobre tenant y propiedad; ADR-010 conserva la autoridad sobre estación, sucursal y contexto de origen. Las decisiones técnicas y de autorización enumeradas permanecen explícitamente diferidas.
