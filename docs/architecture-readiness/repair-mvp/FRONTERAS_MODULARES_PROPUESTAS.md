# Fronteras modulares propuestas

## Criterio

**[DAP]** El MVP se organiza en módulos lógicos dentro de un monolito modular. Las fronteras siguen la propiedad de reglas e invariantes, no pantallas ni tablas. Los nombres son conceptuales y requieren validación; no prescriben carpetas ni espacios de nombres.

## Evaluación de fronteras conceptuales

“Integrar inicialmente” conserva una frontera conceptual aunque comparta módulo físico durante el MVP.

| Frontera | Responsabilidad, lenguaje y datos gobernados | Comandos y eventos candidatos | Dependencias permitidas / prohibidas | MVP y diferido | Riesgo y madurez | Clasificación |
| --- | --- | --- | --- | --- | --- | --- |
| Identidad y acceso | Autenticación, sesión y membresía; credenciales y sesiones | Iniciar/cerrar sesión; SesiónIniciada/Revocada | Usa tenancy; no reparaciones | Sesión MVP; federación diferida | Separar de roles duplica controles; fusionar todo crea módulo dios. **Candidato fuerte** | DAP |
| Multitenancy y sucursales | Tenant, sucursal activa y alcance; organizaciones y pertenencia | Seleccionar sucursal; SucursalActivaSeleccionada | Consultado por todos; no órdenes | Contexto MVP; enrutamiento avanzado diferido | Fragmentarlo causa contexto incoherente; fusionarlo oculta propiedad. **Candidato fuerte** | DAP |
| Usuarios, roles y permisos | Usuario, rol, capacidad y atribución; membresías/concesiones | Conceder/revocar; PermisoCambiado | Usa identidad/tenancy; no muta dominio operativo | Matriz mínima MVP; administración avanzada diferida | Separación prematura duplica datos; fusión mezcla autenticación/autorización. **Integrar inicialmente con Identidad** | DAP |
| Configuración de recepción | Requisito, política efectiva y versión; políticas de captura | Publicar política; PoliticaRecepcionPublicada | Usa tenancy; no lee órdenes | Campos/política MVP; motor general fuera | Un módulo por política fragmenta; JSON global acopla. **Candidato fuerte en Configuración** | DAP |
| Clientes y contactos | Cliente, nombre y contacto; identidad/contacto comercial | Registrar/actualizar; ClienteRegistrado | Referenciado por órdenes; no custodia | Cliente mínimo MVP; CRM diferido | Separarlo complica recepción; incrustarlo duplica clientes. **Candidato fuerte mínimo** | DAP |
| Órdenes de Servicio | Orden, folio, problema y equipo; identidad/recepción | Crear orden; OrdenCreada | Usa contexto, cliente y política; no pagos/diagnósticos | Núcleo MVP | Absorber el ciclo crea agregado gigante. **Confirmar para MVP** | DAP |
| Custodia y ubicaciones | Custodia, ubicación y movimiento; historial físico | Iniciar/terminar/mover; CustodiaIniciada/EquipoMovido | Referencia orden; no deriva de estado | Núcleo MVP; traslados diferidos | Separación física prematura coordina de más; fusión confunde estado/ubicación. **Candidato fuerte, integrado inicialmente** | DAP |
| Diagnóstico técnico | Evaluación, conclusión y recomendación; revisiones | Registrar/concluir; RecomendacionTecnicaEmitida | Consulta orden/asignación; no precios | Núcleo MVP | Una entidad por nota fragmenta; mezclar con cotización pierde semántica. **Candidato fuerte** | DAP |
| Cotización y autorizaciones | Propuesta, versión, concepto, precio y decisión; historia comercial | Emitir/autorizar; CotizacionAutorizadaParcialmente | Consume recomendación; no ejecuta ni cobra | Núcleo MVP; promociones avanzadas diferidas | Separar autorización sin versión rompe coherencia; incrustar vuelve precios mutables. **Confirmar para MVP** | DAP |
| Ejecución técnica | Trabajo, revisión y participación; ejecución autorizada | Iniciar/registrar/terminar; TrabajoTerminado | Consulta autorización; no modifica cotización | Núcleo MVP | Fragmentar por técnico complica; fusionar con diagnóstico confunde etapas. **Candidato fuerte** | DAP |
| Control de calidad | Segunda revisión, criterio y resultado; revisiones repetibles | Solicitar/aprobar/rechazar; ControlCalidadAprobado/Rechazado | Consume trabajo; solicita transición, no la fuerza | Núcleo MVP; plantillas diferidas | Separarlo añade coordinación; una bandera pierde historia. **Candidato fuerte, puede compartir módulo físico** | DAP |
| Pagos básicos | Movimiento, anticipo, reverso y saldo; historia financiera | Registrar/revertir; PagoRecibido/PagoRevertido | Usa orden/propuesta; no entrega/Caja | Núcleo MVP; Caja diferida | Saldo mutable es riesgoso; fusionar con Orden impide evolución. **Confirmar para MVP** | DAP |
| Entrega | Elegibilidad, receptor, evidencia y momento; acto de entrega | Entregar/corregir; EquipoEntregado | Consulta custodia, resolución y política financiera; no reescribe pagos | Núcleo MVP | Fusionar pago/entrega impone regla universal. **Candidato fuerte** | DAP |
| Evidencias y documentos | Evidencia, metadatos, clasificación y documento; referencias seguras | Adjuntar/retirar/generar; EvidenciaAdjuntada | Sirve por puerto; no decide negocio | Evidencia/comprobante MVP; firma digital diferida | Un módulo por tipo fragmenta; almacenamiento global filtra datos. **Candidato fuerte de soporte** | DAP |
| Notas y línea temporal | Nota, hecho visible y próxima acción; notas/proyección | Agregar nota; NotaAgregada/HechoProyectado | Consume hechos; no autoriza ni sustituye fuentes | Notas/historial MVP; analítica diferida | Separar notas empobrece contexto; usarlas como verdad acopla todo. **Integrar inicialmente** | DAP |
| Notificaciones | Intención, canal y entrega; intentos de aviso | Solicitar/reintentar; NotificacionEnviada/Fallida | Consume hechos; no bloquea negocio | Aviso manual/mínimo; automatización diferida | Módulo vacío anticipado; proveedor acoplado bloquea flujo. **Diferible como módulo; puerto en MVP** | DD |
| Reportes operativos | Lista, alerta y carga de trabajo; proyecciones | Actualizar/reconstruir; ProyeccionActualizada | Lee contratos/hechos; no modifica agregados | Listas MVP; BI diferido | Un reporte por módulo fragmenta; unir tablas rompe propiedad. **Lecturas publicadas inicialmente** | DAP |

## Aislamientos fuertes desde el inicio

- **[DAR]** Identidad/acceso y contexto tenant/sucursal deben preceder toda operación.
- **[DAR]** Pagos conserva un libro básico de movimientos independiente del estado mutable de la orden.
- **[DAR]** Autorización comercial no puede quedar embebida como bandera en trabajo técnico.
- **[DAR]** Custodia y entrega conservan su propia semántica aunque colaboren con flujo y pagos.
- **[DAR]** Evidencia almacena referencias y metadatos; no se permite acceso directo al proveedor desde el dominio.
- **[DAR]** Configuración publica políticas resueltas; los consumidores no leen almacenamiento ajeno.

## Fronteras que pueden empezar juntas

**[DAR]** Para la primera rebanada, identidad/usuarios/permisos pueden compartir un módulo físico; orden/custodia y notas/línea temporal pueden compartir otro; configuración puede residir junto a tenancy. Se conservan contratos y propiedad para separar después. Juntas no significa fusionadas conceptualmente.

## Tensiones pendientes

- **[PB]** Determinar si estado, ubicación y QC forman un módulo único o dos módulos coordinados.
- **[PB]** Determinar si entrega es parte del agregado de custodia o un proceso propio coordinado.
- **[DD]** Separar evidencia y línea temporal en módulos distintos cuando sus ciclos y controles diverjan.
- **[ADR]** Cualquier extracción a servicio desplegable requerirá evidencia operativa y un ADR posterior.
