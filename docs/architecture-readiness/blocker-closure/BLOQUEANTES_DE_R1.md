# Bloqueantes de R1 — Recepción

## Resultado que debe producir R1

R1 crea una Orden de Servicio válida, inicia custodia en la misma operación, asigna un folio único en su alcance, identifica físicamente el equipo y permite consultar el resultado sin duplicar la orden ante reintentos.

## Prerrequisito

R0 debe estar cerrado y demostrado. R1 no reimplementa tenant, sucursal, identidad, permisos, tiempo ni auditoría.

## Bloqueantes H2

| Grupo | IDs | Cierre requerido |
| --- | --- | --- |
| Alcance | DEC-003 | Caso de uso, exclusiones y variantes de R1 aprobados |
| Folio | DEC-021 a DEC-025 | Alcance, formato, unicidad, concurrencia e idempotencia |
| Lenguaje y flujo | DEC-026 a DEC-030 | Término visible, estados/ubicación inicial, custodia e inicio atómico |
| Configuración | DEC-032 a DEC-036 | Precedencia, snapshot, vigencia, campos y catálogos configurables |
| Evidencia y archivos | DEC-039 y DEC-040 | Puerto, metadatos, acceso y mínimo fotográfico; foto no bloquea universalmente la creación |
| Identificación física | DEC-041 y DEC-042 | Comprobante/etiqueta conceptual y contingencia manual ya validada |
| Integraciones laterales | DEC-058 | Impresión/archivo fallan de forma visible sin revertir la orden |

## Decisiones de dominio ya firmes

- nombre y problema reportado son mínimos universales;
- tenant, sucursal, receptor, fecha/hora, folio y ubicación inicial son contexto generado;
- contacto, marca, modelo, IMEI/serie, color y rasgos dependen de política;
- las fotografías ocurren después de crear la orden;
- creación exitosa e inicio de custodia son indivisibles para el negocio;
- el dispositivo permanece identificado con el folio;
- falla de impresora usa el mismo folio de forma manual;
- volver después de la entrega crea un nuevo ciclo y nueva orden.

## Preguntas que todavía bloquean

- alcance de folio y si una orden puede trasladarse entre sucursales;
- estados y ubicación inicial que R1 necesita realmente;
- precedencia tenant/sucursal y snapshot de política;
- obligatoriedad condicional del apellido y otros campos;
- contenido y autoridad del comprobante;
- propósito, acceso y retención de evidencia inicial;
- permisos para crear, corregir, reimprimir y exceptuar recepción.

## No exigir a R1

Diagnóstico, cotización, autorización comercial completa, inventario, pagos, entrega, QC, CRM, WhatsApp, portal, BI, operación offline ni SLOs de producción.
