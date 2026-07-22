# Trazabilidad por usuario

## Hechos validados de autenticación operativa

### FOT-DEC-018 — PIN de baja fricción

SR Taller 1.0 utiliza un PIN de cuatro dígitos para reducir fricción. Cada usuario operativo debe usar su propio PIN.

El PIN permite atribución operacional, pero no constituye prueba absoluta de identidad, firma ni no repudio.

### FOT-DEC-019 — Cierre por inactividad

La sesión se cierra por inactividad para reducir el riesgo de atribuir acciones al usuario equivocado.

### FOT-DEC-020 — Actor de la acción

Una acción relevante se atribuye al usuario autenticado cuando se realizó. La atribución mínima requiere:

- usuario activo;
- sesión válida;
- tenant;
- sucursal;
- estación operativa;
- fecha y hora confiables;
- acción y objeto afectados.

[ADR-010](../../decisions/proposed/ADR-010-station-bound-operational-context.md) acepta que tenant/sucursal provienen de la estación vinculada. [ADR-011](../../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md) acepta PIN/sesión/cambio de turno. [ADR-012](../../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md) acepta roles/capacidades/alcance y exige autorización server-side en cada operación protegida. Protección técnica, formato de sesión, composición por rebanada y reautenticación para acciones sensibles siguen abiertos.

## Acciones que requieren atribución

| Acción | Actor que debe poder responderse | Contexto adicional |
|---|---|---|
| Recibir orden | quién recibió | sucursal y momento |
| Escanear/consultar equipo | quién consultó | terminal o sesión si aporta valor |
| Registrar diagnóstico | quién diagnosticó | hallazgos y pruebas |
| Terminar trabajo | quién ejecutó | alcance y resultado |
| Revisar | quién revisó | tipo, resultado y observaciones |
| Registrar seguimiento | quién escribió | fecha de captura y comentario |
| Notificar | quién contactó | destinatario, canal y resultado |
| Registrar autorización/rechazo | quién registró | decisor y cómo se obtuvo |
| Recibir anticipo | quién recibió | importe, moneda, sucursal y momento |
| Cambiar estado | quién cambió | anterior, nuevo y motivo si aplica |
| Cambiar ubicación | quién movió/registró | origen y destino |
| Asignar técnico | quién asignó | anterior, nuevo y alcance |
| Entregar | quién entregó | receptor y evidencia por definir |

## Resúmenes de cabecera

### FOT-PROP-008 — Proyecciones de participantes

“Recibió”, “reparó”, “revisó” y “entregó” pueden mostrarse como resúmenes derivados. La regla de derivación permanece abierta cuando hubo múltiples participantes, reentregas o varios controles.

Un resumen nunca debe:

- reemplazar el historial;
- ocultar más de un técnico;
- usar al último usuario como autor de todo el ciclo;
- confundir actor interno que entrega con persona receptora;
- presentar al usuario que registró una nota como autor necesario del hecho narrado.

## Riesgos de atribución

| Riesgo | Consecuencia |
|---|---|
| Compartir PIN | acciones atribuidas a persona incorrecta |
| Dejar sesión abierta | siguiente operador hereda identidad |
| Actuar desde cuenta ajena | historia falsa de participación |
| PIN observable por terceros | suplantación operativa |
| Dispositivo compartido | confusión entre sesión, terminal y turno |
| Reloj o zona incorrectos | orden temporal no confiable |
| Usuario desactivado con sesión vigente | acción fuera de autoridad actual |

## Controles de seguridad no diseñados

Quedan abiertos:

- intentos fallidos y bloqueo;
- rotación del PIN;
- auditoría de sesiones;
- revalidación para acciones sensibles;
- PIN combinado con credencial de dispositivo;
- seguridad diferenciada por rol;
- mecanismo técnico de cambio de turno y terminales compartidas; su semántica contextual ya está fijada por ADR-010/011.

ADR-011 prohíbe almacenar el PIN en texto plano o de forma reversible. Este paquete no especifica algoritmos, cifrado, hashing, tokens o mecanismos criptográficos.

## Sesión y responsabilidad

Una sesión válida permite atribuir una acción; no demuestra automáticamente:

- que la persona tenía autoridad de negocio;
- que el dispositivo estaba físicamente con ella;
- que ejecutó lo narrado por otra persona;
- que la decisión del cliente fue auténtica;
- que un cambio de estado correspondió a una acción física.

Autenticación, autorización ordinaria, autorización reforzada, custodia y evidencia son conceptos distintos conforme a ADR-011/012.

## Correcciones

### FOT-PROP-009 — Corrección sin borrado

Corregir una atribución mediante un hecho compensatorio, preservando el original, es una propuesta. No se decide todavía qué datos pueden corregirse, quién lo autoriza ni qué historial debe ser inmutable.

## Ejemplos inválidos

- PIN compartido como identidad colectiva de recepción.
- Estado cambiado sin registrar usuario y momento.
- Anticipo con monto pero sin actor.
- Entrega con receptor narrado pero sin usuario interno que la realizó.
- Control de calidad firmado por el técnico resumen aunque otra persona revisó.
- Afirmar identidad legal sólo porque el PIN fue aceptado.
