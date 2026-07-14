# Actores del dominio

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Criterio

Actor significa participante con intención o responsabilidad en el negocio; no equivale automáticamente a usuario, rol o persona. Las capacidades descritas son hipótesis y no conceden permisos.

| Actor | Objetivo | Responsabilidades | Decisiones que toma | Información que aporta | Acciones que puede solicitar | Acciones que no debería realizar | Preguntas abiertas |
|---|---|---|---|---|---|---|---|
| Cliente | Resolver una necesidad y conocer costo/estado | dar información y responder propuestas | aceptar, rechazar o cancelar según autoridad | contacto, falla, preferencias | cotización, avance, entrega, reclamo | acceder a casos ajenos o aprobar sin autoridad | ¿persona u organización? DQ-004 |
| Propietario del dispositivo | Proteger su bien y autorizar intervención | declarar propiedad y límites | autorizar trabajo, datos y entrega | identidad, titularidad, condición conocida | corrección, entrega, garantía | atribuirse derechos de tercero | ¿qué evidencia basta? DQ-004/011 |
| Contacto | Facilitar comunicación operativa | mantener medio y propósito vigentes | confirmar disponibilidad; autorización sólo si se delega | teléfono, email, horario | recibir avisos o responder | consentir por propietario sin delegación | ¿contacto puede aprobar? DQ-004 |
| Persona autorizada para recoger | Retirar el equipo legítimamente | presentar evidencia y confirmar recepción | aceptar entrega dentro de su mandato | identidad o clave acordada | entrega | cambiar alcance, pago o garantía sin autoridad | ¿cómo se autoriza? DQ-014 |
| Recepcionista | Recibir y dar continuidad al caso | identificar, registrar, custodiar y comunicar | aceptar recepción y escalar excepciones | condición, accesorios, relato y evidencia | abrir orden, emitir cotización, marcar lista según rol | alterar diagnóstico, pago o autorización sin atribución | ¿qué acciones combina en talleres pequeños? |
| Técnico | Diagnosticar e intervenir con trazabilidad | evaluar, ejecutar, documentar y probar | declarar hallazgos y resultado técnico | diagnóstico, intervención, partes y pruebas | iniciar/pausar/completar trabajo | aprobar su propio gasto o borrar evidencia | ¿puede cotizar y declarar listo? DQ-016 |
| Técnico externo | Ejecutar trabajo especializado acordado | custodiar, informar y devolver | aceptar/rechazar encargo y reportar resultado | referencia, hallazgos, costos | recibir encargo o aclaración | acceder al resto del tenant | ¿quién responde por daño? DQ-017 |
| Supervisor técnico | Coordinar y validar riesgo/calidad | asignar, resolver bloqueos y revisar | prioridad, reasignación, retrabajo, excepción técnica | criterio de calidad y motivo | reasignar, aprobar retrabajo, escalar | cambiar decisión comercial sin autoridad | ¿QC requiere independencia? DQ-016 |
| Vendedor | Convertir necesidad en oferta comprensible | preparar opciones y comunicar condiciones | seleccionar propuesta dentro de políticas | servicios, partidas, vigencia | crear/emitir/revisar cotización | diagnosticar o autorizar por el cliente | ¿existe como actor separado? |
| Cajero | Registrar cobros y controlar valores | identificar obligación, medio y evidencia | aceptar medio permitido y escalar diferencias | pago, referencia, conteo | registrar pago, devolución autorizada, cierre de caja | anular o condonar sin permiso | ¿caja y recepción se combinan? Q022 |
| Gerente de sucursal | Mantener operación local controlada | supervisar excepciones, cargas y custodia | prioridades, permisos delegados y excepciones locales | motivo y aprobación | transferir, autorizar excepción, revisar auditoría | actuar fuera del tenant o borrar trazabilidad | ¿qué es tenant-wide? Q006–Q010 |
| Administrador del tenant | Administrar organización y acceso | membresías, sucursales, configuración | altas, roles y alcance permitidos | estructura y responsables | invitar, suspender, configurar | intervenir datos de otra organización | ¿puede operar negocio? Q005/Q010 |
| Proveedor | Suministrar bienes o servicios | cumplir oferta, entrega y garantía acordadas | disponibilidad y condiciones propias | producto, compatibilidad, costo, entrega | recibir pedido o devolución | consumir stock o cerrar orden | ¿proveedor y técnico externo son distintos? |
| Canal de mensajería | Transportar comunicaciones según capacidades | entregar estados externos y límites | ninguna decisión de negocio del taller | referencias y resultados del canal | aceptar envío o reportar recepción | autorizar reparación o interpretar silencio | ¿qué canal y evidencia valen? Q019–Q020 |
| Sistema externo | Colaborar en un proceso delimitado | cumplir contrato y reportar resultado | decisiones propias del proveedor | referencia, estado, fallo | procesar pago, mensaje o servicio | convertirse en fuente única del dominio | ¿qué integraciones entran al alcance? |
| Plataforma SaaS | Aplicar aislamiento, acceso y ciclo comercial | proteger tenants y ejecutar políticas aprobadas | denegar acceso por reglas; no decide reparación | contexto, auditoría y estado comercial | validar, notificar o suspender según política | mezclar tenants o confundir billing con pagos | Q005, Q023–Q025 |

## Variaciones que requieren observación

- En un taller pequeño, recepcionista, vendedor, cajero, técnico y gerente pueden ser la misma persona; las responsabilidades siguen siendo distintas.
- Un propietario puede no ser cliente, contacto ni quien entrega o recoge.
- Un canal o sistema externo transporta evidencia, pero no reemplaza la autoridad humana.
- Un dispositivo autorizado del sistema no es un actor equivalente al dispositivo del cliente.
- Los nombres de puestos no deben convertirse directamente en roles o permisos.

## Decisiones pendientes

El Product Owner debe confirmar actores existentes en el segmento inicial, responsabilidades combinables, segregaciones obligatorias, autoridades para excepciones y participantes externos reales.
