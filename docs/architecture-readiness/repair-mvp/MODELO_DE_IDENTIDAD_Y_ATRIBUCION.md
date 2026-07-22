# Modelo de identidad y atribución

## Separación conceptual

| Concepto | Pregunta que responde | Clasificación |
| --- | --- | --- |
| Identidad | ¿Quién es la persona o cuenta? | DAP |
| Pertenencia | ¿A qué único tenant pertenece el usuario ordinario? | RDD, ADR-004/010 |
| Rol/capacidad | ¿Qué puede intentar y con qué alcance? | DAP |
| Contexto operativo | ¿Bajo qué tenant/sucursal/estación y usuario actúa ahora? | RDD, ADR-010 |
| Verificación adicional | ¿Cómo se confirma una acción sensible? | DAP |
| Actor atribuido | ¿A quién se responsabiliza por el hecho? | RDD |

## Contrato mínimo

**[RDD]** Toda creación, conclusión, autorización, ejecución, QC, movimiento de pago, excepción y entrega conserva tenant, sucursal, estación, usuario y tiempo verificables conforme a [ADR-010](../../decisions/proposed/ADR-010-station-bound-operational-context.md). Una cuenta compartida sin atribución operativa no satisface este contrato.

## PIN y dispositivo

**[RDD]** El PIN identifica al usuario dentro del tenant previamente derivado de la estación; no selecciona tenant/sucursal ni concede permisos. Su protección, límites, recuperación y posible uso para reautenticación siguen pendientes.

**[RDD]** La estación requiere identidad reconocible y vinculación persistente, mantenida del lado del servidor, a una sucursal para operar. El mecanismo técnico, la credencial y la revocación concreta se deciden posteriormente.

## Escenarios que debe cubrir el modelo

| Escenario | Requisito mínimo | Clasificación |
| --- | --- | --- |
| Inicio tradicional | Estación vinculada y usuario del mismo tenant; mecanismo de autenticación pendiente | DAP |
| Acceso operativo por PIN | Tenant resuelto por estación, actor activo y límites pendientes | RDD/DAP |
| Estación compartida | Usuario activo visible y cambio de turno explícito sin cambiar sucursal | RDD |
| Inactividad | Termina usuario, conserva vinculación; duración y reanudación pendientes | RDD/DAR |
| Múltiples roles/sucursales | Mismo usuario por tenant; estación determina sucursal y permisos se evalúan aparte | RDD |
| Acción sensible | Permiso, posible reautenticación, motivo y auditoría | DAR |
| Revocación | Sesión y acceso dejan de ser válidos oportunamente | RDD |

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

- **[PB]** Actores mínimos del MVP y matriz de capacidades por tenant/sucursal.
- **[PB]** Reglas técnicas de inicio, bloqueo, expiración, recuperación y revocación de sesión.
- **[PB]** Acciones que requieren reautenticación o segundo actor.
- **[PB]** Uso permitido de cuentas compartidas y mecanismo de atribución.
- **[PB]** Tratamiento de soporte, propietario y administración de plataforma.
- **[ADR]** [ADR-010](../../decisions/proposed/ADR-010-station-bound-operational-context.md) acepta el contexto y la confianza conceptual de estación. Identidad, protección del PIN, sesión, permisos y acciones sensibles requieren ADRs específicos antes de programar acceso operativo.

## Riesgos

- **[R]** Mezclar identidad, rol y sesión impide revocación y auditoría correctas.
- **[R]** Registrar PIN, secreto o token en logs viola la línea base de seguridad.
