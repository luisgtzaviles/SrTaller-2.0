# Actores, roles y capacidades

## Principio

**DDV:** recibir, diagnosticar, reparar, revisar, notificar, cobrar y entregar son participaciones distinguibles y pueden ser ejecutadas por personas diferentes. Actor, puesto, responsabilidad, identidad, rol y capacidad no son equivalentes. **ADR-012:** un rol pertenece al tenant y sólo agrupa capacidades. **ADR-013:** reautenticar al actor y aprobar como segundo usuario son decisiones distintas y atribuibles.

## Actores del ciclo

| Actor | Responsabilidad de dominio | Información que aporta/decide | Clasificación |
|---|---|---|---|
| Cliente operativo | deja la orden a su nombre y participa comercialmente | identidad operativa, problema, decisiones según autoridad | DDV |
| Contacto | recibe o participa en comunicaciones | canal, disponibilidad, respuestas | DDV; autoridad no inferida |
| Persona entregante | entrega físicamente el equipo al taller | relación contextual y condición de ingreso | DDV |
| Decisor autorizado | autoriza o rechaza conceptos | decisión, alcance, evidencia | DDV; reglas de autoridad abiertas |
| Receptor de entrega | recibe físicamente el equipo | legitimación y aceptación de salida | DDV; puede ser tercero |
| Recepcionista/atención | recibe, comunica, cotiza, notifica y entrega según capacidad | hechos operativos y comerciales | HOV |
| Técnico | evalúa, concluye, recomienda, ejecuta y documenta | información y resultados técnicos | DDV/HOV |
| Revisor de calidad | ejecuta segunda revisión | resultado, observaciones y momento | DDV; en Avicell suele ser recepción |
| Cajero/actor de cobro | registra movimientos financieros | monto, medio, referencia y momento | DDV/HOV |
| Gerente/responsable autorizado | decide excepciones y ajustes dentro de límites | motivo, alcance y aprobación | PC/PA |
| Proveedor o técnico externo | ejecuta trabajo especializado fuera del flujo interno | resultado, custodia y evidencia por definir | PA |
| Sistema | genera contexto, proyecciones y actividad automática | folio, fechas, correlación y cálculos | DDV/PM |

## Capacidades de dominio candidatas

ADR-012 acepta el criterio semántico de capacidad por operación y la autorización negativa server-side, pero esta tabla sigue siendo evidencia para componer roles por rebanada, no una matriz de permisos aceptada ni un contrato técnico.

| Capacidad | Actores típicos | Condición | Sensibilidad |
|---|---|---|---|
| Crear orden y recibir equipo | recepción | política y sucursal vigentes | alta: inicia custodia |
| Consultar una orden | personal autorizado | tenant/sucursal/propósito | media/alta por datos |
| Diagnosticar | técnico | orden bajo custodia y contexto técnico | alta |
| Emitir recomendación | técnico | conclusión suficiente | media |
| Cotizar | recepción/comercial | política de precios | alta comercial |
| Ajustar precio/promoción | gerente o actor autorizado | rango, motivo y política | alta financiera |
| Registrar autorización | recepción/comercial | decisor, versión y evidencia | alta |
| Ejecutar trabajo | técnico | alcance autorizado | alta |
| Aprobar/rechazar QC | revisor | trabajo vigente y criterios | alta |
| Mover equipo | personal autorizado | custodia y ubicaciones válidas | alta de custodia |
| Registrar anticipo/pago | recepción/caja | medio y contexto financiero | alta financiera |
| Notificar | atención | propósito y contacto permitidos | media/privacidad |
| Entregar | recepción/actor autorizado | legitimación, cobro y equipo | crítica |
| Corregir hechos | autoridad por contexto | motivo y compensación | crítica |
| Configurar políticas | administrador autorizado | alcance y vigencia | crítica transversal |

**Clasificación:** PM para asignación de capacidades; DDV para precondiciones conceptuales; PC para configuración.

## Modelo de acceso aceptado

- **ADR-012:** un usuario puede tener uno o varios roles vigentes del mismo tenant.
- **ADR-012:** las capacidades se combinan por unión de asignaciones tenant-wide y de las restringidas a la sucursal efectiva.
- **ADR-012:** R0 no admite permisos ni denegaciones directas por usuario.
- **ADR-012:** el servidor deniega por defecto y valida capacidad, alcance y pertenencia del recurso.
- **ADR-012:** una responsabilidad temporal o participación en una Orden no concede capacidades administrativas.
- **ADR-013:** una candidata sensible sin política concreta permanece en nivel 4; niveles 2 y 3 no conceden capacidades permanentes.
- **PA:** faltan composición y clasificación concreta por rebanada.

## Atribución por usuario

- **HOV/RCA:** SR Taller 1.0 usa PIN de cuatro dígitos y cierre por inactividad para baja fricción y atribución.
- **DDV/ADR-010/011:** cada acción relevante conserva usuario, sesión, tenant, sucursal, estación, fecha, hora y contexto de origen.
- **ADR-011/014:** una sesión operativa aporta contexto temporal sin
  convertirse en identidad; una Station puede tener varias Sessions y cada
  request conserva un solo actor mediante su SessionId.
- **ADR-013:** reautenticación confirma al actor; un segundo aprobador debe ser diferente y tener capacidad específica.
- **PA:** longitud, recuperación, rate limiting, factores, tiempos y aplicación técnica.
- **RCL:** compartir PIN o usar un nombre textual puede atribuir incorrectamente acciones.

## Participación histórica

**DDV:** un equipo puede pasar por varios técnicos y debe preservarse quién participó, en qué momento y con qué contribución. **PM:** “técnico principal” puede ser una proyección con regla explícita; no reemplaza asignaciones ni participaciones.

## Decisiones abiertas de composición y refuerzo

- **PA:** quién puede autorizar trabajo y recoger un equipo en cada caso.
- **PA:** si QC debe ser realizado siempre por persona distinta al técnico.
- **PA:** quién puede declarar excepciones de bajo costo, crédito, descuento o entrega.
- **PA:** significado operativo de técnico principal y simultaneidad de técnicos.
- **ADR-012:** el personal multisucursal conserva una identidad; las asignaciones tenant-wide y restringidas se recalculan en la sucursal efectiva.
- **PA:** composición de roles de R0/R1 y capacidades de proveedores externos.
- **PA:** nivel 1–4, motivo y evidencia adicional de cada operación concreta; el modelo se rige por ADR-013.
