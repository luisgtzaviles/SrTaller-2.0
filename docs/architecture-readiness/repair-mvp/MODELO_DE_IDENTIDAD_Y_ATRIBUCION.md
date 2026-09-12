# Modelo de identidad y atribución

## Separación conceptual

| Concepto | Pregunta que responde | Clasificación |
| --- | --- | --- |
| Identidad | ¿Quién es la persona operadora estable dentro del tenant? | RDD, ADR-011 |
| Pertenencia | ¿A qué único tenant pertenece el usuario ordinario? | RDD, ADR-004/011 |
| Rol/capacidad | ¿Qué puede intentar y con qué alcance? | RDD, ADR-012 |
| Contexto operativo | ¿Bajo qué tenant/sucursal/estación y usuario actúa ahora? | RDD, ADR-010/011 |
| Verificación adicional | ¿Cómo se confirma una acción sensible? | RDD, ADR-013 |
| Actor atribuido | ¿A quién se responsabiliza por el hecho? | RDD |

## Contrato mínimo

**[RDD]** Toda creación, conclusión, autorización, ejecución, QC, movimiento de pago, excepción y entrega conserva tenant, sucursal, estación, usuario, sesión y tiempo verificables conforme a [ADR-010](../../decisions/proposed/ADR-010-station-bound-operational-context.md) y [ADR-011](../../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md). Una cuenta compartida sin atribución operativa no satisface este contrato.

## PIN y dispositivo

**[RDD]** ADR-011 acepta que el PIN identifica al usuario únicamente dentro del tenant previamente derivado de la estación; no es identidad, no selecciona tenant/sucursal y no concede permisos. Nunca se almacena en texto plano ni de forma reversible. ADR-013 fija la semántica de reautenticación; protección técnica, factores, límites y recuperación siguen pendientes.

**[RDD]** La estación requiere identidad reconocible y vinculación persistente, mantenida del lado del servidor, a una sucursal para operar. El mecanismo técnico, la credencial y la revocación concreta se deciden posteriormente.

## Escenarios que debe cubrir el modelo

| Escenario | Requisito mínimo | Clasificación |
| --- | --- | --- |
| Inicio tradicional | Estación vinculada, PIN limitado al tenant y usuario cuyo estado permite iniciar | RDD, ADR-011 |
| Acceso operativo por PIN | Tenant resuelto por Station y actor resuelto por cada Session solicitante; concurrencia permitida | RDD, ADR-011/014 |
| Estación compartida | Usuario activo visible y cambio de turno explícito sin cambiar sucursal | RDD |
| Inactividad | Termina la sesión, conserva vinculación y exige autenticación nueva; duración pendiente | RDD, ADR-011 |
| Múltiples roles/sucursales | Mismo usuario por tenant; estación determina sucursal y ADR-012 une capacidades tenant-wide y asignaciones aplicables a esa sucursal | RDD, ADR-012 |
| Acción sensible | Capacidad ordinaria más nivel 2, 3 o 4 conforme a ADR-013; motivo cuando la política lo exija | RDD, ADR-013 |
| Revocación | No inicia sesión; toda sesión invalidada deja de aceptar acciones | RDD, ADR-011 |

## Requisitos mínimos de PIN y sesión

- **[RP]** Nunca almacenar PIN en texto plano ni diseñar criptografía propia en este paquete.
- **[RP]** Limitar intentos y registrar eventos de seguridad apropiados sin registrar el PIN.
- **[RDD]** Aplicar inactividad y cambio explícito de actor/turno sin alterar la vinculación de estación.
- **[RP]** Permitir controles adicionales para acciones sensibles.
- **[R]** Un PIN de cuatro dígitos tiene baja entropía y exige controles compensatorios si se acepta.

## Riesgos operativos

- **[R]** PIN compartido o visible elimina atribución.
- **[R]** Sesión abandonada o cambio de turno incompleto atribuye acciones al usuario anterior.
- **[R]** Suplantación mediante actor enviado por cliente elude autenticación.
- **[R]** Bloqueo excesivo puede generar atajos inseguros y fricción de mostrador.

## Preguntas bloqueantes

- **[PB]** Composición mínima de roles/capacidades y clasificación nivel 1–4 por rebanada; los modelos se rigen por ADR-012/013.
- **[PB]** Reglas técnicas de protección, intentos, duración, recuperación, propagación y revocación de sesión.
- **[PB]** Nivel concreto, motivo y evidencia adicional de cada operación incluida.
- **[PB]** Uso permitido de cuentas compartidas y mecanismo de atribución.
- **[PB]** Tratamiento de soporte, propietario y administración de plataforma.
- **[ADR]** [ADR-010](../../decisions/proposed/ADR-010-station-bound-operational-context.md) acepta contexto; [ADR-011](../../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md) identidad/sesión; [ADR-012](../../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md) autorización ordinaria; [ADR-013](../../decisions/proposed/ADR-013-sensitive-actions-and-reinforced-authorization.md) sensibilidad/refuerzo. Protección técnica, clasificación por rebanada y evidencia de implementación siguen bloqueando el acceso operativo.

## Riesgos

- **[R]** Mezclar identidad, rol y sesión impide revocación y auditoría correctas.
- **[R]** Registrar PIN, secreto o token en logs viola la línea base de seguridad.
