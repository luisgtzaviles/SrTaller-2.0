# Integraciones y adaptadores

## Estrategia

**[DAR]** El dominio expresa intenciones y hechos; adaptadores traducen hacia proveedores. Ningún proveedor externo se vuelve autoridad sobre una orden, autorización, pago o custodia.

## Integraciones del horizonte MVP

| Capacidad/puerto conceptual | Prioridad | Falla y bloqueo | Reintento/idempotencia/alternativa | Datos sensibles | Clasificación |
| --- | --- | --- | --- | --- | --- |
| Archivos/evidencia: almacenar y leer referencia autorizada | Necesaria | Adjuntar puede quedar pendiente; no expone archivo parcial | Reintento por identidad; captura diferida si política lo permite | Fotos, documentos y tenant | DAR |
| Impresión/generación de comprobante o etiqueta | Necesaria con alternativa | No invalida orden | Reimpresión del mismo folio; identificación manual | Folio y datos mínimos impresos | DAR |
| Reloj y zona horaria confiables | Necesaria | Sin tiempo confiable se rechaza acción sensible | Fuente local estable; no reintento externo obligatorio | Actor/tiempos | DAR |
| Notificación | Manual o mínima | No bloquea negocio | Reintento idempotente; aviso manual | Contacto y estado mínimo | DD |
| WhatsApp automático | Diferible | No bloquea | Futuro | Contacto/contenido | DD |
| Correo | Diferible | No bloquea | Futuro | Contacto/contenido | DD |
| Pasarela de pagos | Fuera del MVP | No participa | Registro manual básico | Datos financieros | FMVP |
| Facturación | Fuera del MVP | No participa | Contrato futuro | Datos fiscales | FMVP |
| Inventario externo | Fuera del MVP | No participa | Concepto sin stock | Referencias de pieza | FMVP |
| BI/notificaciones web entrantes | Fuera del MVP | No participa | Eventos futuros sólo con ADR | Datos agregados/eventos | FMVP |
| Identidad externa | Diferible | Autenticación inicial no debe depender de proveedor no decidido | Alternativa local según ADR | Credenciales/tokens | DD |
| Almacenamiento avanzado/firma digital | Diferible | No bloquea flujo básico | Evidencia mínima alternativa | Evidencia legal | DD |

## Reglas de adaptadores

- **[DAR]** Traducen modelos externos a contratos internos y evitan filtrar semántica del proveedor.
- **[DAR]** Tienen tiempo de espera, reintento acotado, idempotencia y observabilidad sin secretos.
- **[DAR]** Fallos laterales no revierten hechos de negocio confirmados.
- **[RDD]** Validan tenant y autorización para archivos y callbacks.
- **[DAR]** Sus credenciales se administran fuera del dominio y nunca se registran en logs.

## Eventos de entrada futuros

**[ADR]** Webhooks, pagos en línea o mensajería bidireccional exigirán autenticidad, replay protection, mapeo de tenant, deduplicación y política de fallo mediante diseño posterior.

## Riesgo evitado

**[R]** Incrustar SDKs de proveedores en casos de uso vuelve el flujo dependiente de disponibilidad externa y dificulta sustitución, pruebas y aislamiento.
