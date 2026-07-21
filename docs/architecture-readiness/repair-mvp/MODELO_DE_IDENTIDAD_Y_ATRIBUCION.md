# Modelo de identidad y atribución

## Separación conceptual

| Concepto | Pregunta que responde | Clasificación |
| --- | --- | --- |
| Identidad | ¿Quién es la persona o cuenta? | DAP |
| Membresía | ¿En qué tenant participa? | DAP |
| Rol/capacidad | ¿Qué puede intentar y con qué alcance? | DAP |
| Sesión operativa | ¿Bajo qué tenant/sucursal/dispositivo actúa ahora? | DAP |
| Verificación adicional | ¿Cómo se confirma una acción sensible? | DAP |
| Actor atribuido | ¿A quién se responsabiliza por el hecho? | RDD |

## Contrato mínimo

**[RDD]** Toda creación, conclusión, autorización, ejecución, QC, movimiento de pago, excepción y entrega conserva actor y tiempo verificables. Una cuenta compartida sin atribución operativa no satisface este contrato.

## PIN y dispositivo

**[DAP]** Un PIN puede servir como reautenticación o cambio rápido de actor dentro de una sesión controlada, pero no se asume como identidad completa ni como sustituto universal de autenticación.

**[DD]** La identidad global persistente del dispositivo puede diferirse si existe una sesión segura, revocable y atribuible para la primera rebanada.

## Escenarios que debe cubrir el modelo

| Escenario | Requisito mínimo | Clasificación |
| --- | --- | --- |
| Inicio tradicional | Autenticación y membresía verificadas | DAP |
| Acceso operativo por PIN | Sesión base confiable, actor activo y límites | DAP |
| Estación compartida | Usuario activo visible y cambio de turno explícito | DAP |
| Inactividad | Bloqueo o reautenticación según riesgo | DAR |
| Múltiples roles/sucursales | Capacidad y sucursal activa explícitas | RDD |
| Acción sensible | Permiso, posible reautenticación, motivo y auditoría | DAR |
| Revocación | Sesión y acceso dejan de ser válidos oportunamente | RDD |

## Requisitos mínimos de PIN y sesión

- **[RP]** Nunca almacenar PIN en texto plano ni diseñar criptografía propia en este paquete.
- **[RP]** Limitar intentos y registrar eventos de seguridad apropiados sin registrar el PIN.
- **[RP]** Aplicar inactividad, revocación y cambio explícito de actor/turno.
- **[RP]** Permitir controles adicionales para acciones sensibles.
- **[R]** Un PIN de cuatro dígitos tiene baja entropía y exige controles compensatorios si se acepta.

## Riesgos operativos

- **[R]** PIN compartido o visible elimina atribución.
- **[R]** Sesión abandonada o dispositivo compartido atribuye acciones al usuario anterior.
- **[R]** Suplantación mediante actor enviado por cliente elude autenticación.
- **[R]** Bloqueo excesivo puede generar atajos inseguros y fricción de mostrador.

## Preguntas bloqueantes

- **[PB]** Actores mínimos del MVP y matriz de capacidades por tenant/sucursal.
- **[PB]** Reglas de inicio, bloqueo, expiración y revocación de sesión.
- **[PB]** Acciones que requieren reautenticación o segundo actor.
- **[PB]** Uso permitido de cuentas compartidas y mecanismo de atribución.
- **[PB]** Tratamiento de soporte, propietario y administración de plataforma.
- **[ADR]** Modelo de identidad/PIN, confianza de estación y sesión requieren decisión específica antes de programar acceso operativo.

## Riesgos

- **[R]** Mezclar identidad, rol y sesión impide revocación y auditoría correctas.
- **[R]** Registrar PIN, secreto o token en logs viola la línea base de seguridad.
