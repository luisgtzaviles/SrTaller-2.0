# Actores, roles y capacidades

## Principio

**DDV:** recibir, diagnosticar, reparar, revisar, notificar, cobrar y entregar son participaciones distinguibles y pueden ser ejecutadas por personas diferentes. Rol operativo, identidad de usuario y permiso técnico no son equivalentes.

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

## Capacidades candidatas

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

## Atribución por usuario

- **HOV/RCA:** SR Taller 1.0 usa PIN de cuatro dígitos y cierre por inactividad para baja fricción y atribución.
- **DDV/ADR-010:** cada acción relevante conserva usuario, tenant, sucursal, estación, fecha, hora y contexto de origen.
- **IDO:** una sesión operativa puede aportar contexto temporal sin convertirse en identidad absoluta.
- **PA:** longitud, recuperación, rate limiting, vigencia y acciones que requieren autenticación reforzada.
- **RCL:** compartir PIN o usar un nombre textual puede atribuir incorrectamente acciones.

## Participación histórica

**DDV:** un equipo puede pasar por varios técnicos y debe preservarse quién participó, en qué momento y con qué contribución. **PM:** “técnico principal” puede ser una proyección con regla explícita; no reemplaza asignaciones ni participaciones.

## Decisiones abiertas de rol

- **PA:** quién puede autorizar trabajo y recoger un equipo en cada caso.
- **PA:** si QC debe ser realizado siempre por persona distinta al técnico.
- **PA:** quién puede declarar excepciones de bajo costo, crédito, descuento o entrega.
- **PA:** significado operativo de técnico principal y simultaneidad de técnicos.
- **PA:** capacidades de proveedores externos y personal multisucursal.
