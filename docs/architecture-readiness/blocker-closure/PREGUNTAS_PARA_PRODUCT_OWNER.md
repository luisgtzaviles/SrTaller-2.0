# Preguntas para Product Owner

## Uso

Estas preguntas requieren autoridad de Producto u Operaciones. No incluyen elecciones de framework, base de datos, patrones o proveedores. Cada respuesta debe registrar ejemplos, excepciones, alcance y autoridad; un “sí” aislado no cierra la decisión.

## Prioridad 0 — antes de programar R0

| ID | Pregunta | Decisiones | Bloquea |
| --- | --- | --- | --- |
| PO-001 | ¿Cuál es el resultado observable de R0, qué demuestra y qué queda explícitamente fuera? | DEC-002 | Primer commit/H0 |
| PO-002 | ¿Qué escenarios felices, negativos y de denegación debe aceptar Producto para declarar R0 terminado? | DEC-062, DEC-063 | Primer commit/H0 |
| PO-003 | ¿Qué datos son globales del SaaS, cuáles pertenecen al tenant y cuáles a una sucursal? | DEC-007, DEC-008 | R0/H1 |
| PO-004 | ¿Una persona puede pertenecer a varios tenants o sólo a uno, y quién gobierna esa pertenencia? | DEC-008, DEC-013 | R0/H1 |
| PO-005 | ¿Un usuario puede operar en varias sucursales del mismo tenant y con permisos diferentes en cada una? | DEC-011, DEC-017, DEC-018 | R0/H1 |
| PO-006 | ¿Cómo se elige la sucursal activa, existe una sucursal predeterminada y qué ocurre si no hay una válida? | DEC-010 | R0/H1 |
| PO-007 | ¿Puede cambiarse de sucursal durante una sesión y qué operaciones abiertas deben bloquear, conservar o revalidar ese cambio? | DEC-012 | R0/H1 |
| PO-008 | ¿Qué reparaciones puede ver un usuario: sólo su sucursal activa, todas sus sucursales autorizadas o todo el tenant? | DEC-011, DEC-018 | R0/H1 |
| PO-009 | ¿Las políticas operativas pueden variar por sucursal? Si sistema, tenant y sucursal difieren, ¿qué autoridad prevalece? | DEC-032 | R0/R1 |
| PO-010 | ¿La zona horaria pertenece al tenant o a cada sucursal, y qué debe ocurrir cuando un usuario consulta otra zona? | DEC-037 | R0/H1 |
| PO-011 | ¿Qué significa el acceso por PIN, quién puede usarlo, en qué estación y qué acciones nunca autoriza por sí solo? | DEC-014, DEC-019, DEC-020 | R0/H1 |
| PO-012 | ¿Cuándo debe terminar o bloquearse una sesión inactiva en una estación compartida? | DEC-015 | R0/H1 |
| PO-013 | ¿Cuáles son los actores mínimos de R0/R1 y qué acciones sensibles requieren permiso, motivo o reautenticación? | DEC-017 a DEC-020 | R0/H1 |

## Prioridad 1 — antes de programar R1

| ID | Pregunta | Decisiones | Bloquea |
| --- | --- | --- | --- |
| PO-014 | ¿Cuál es exactamente la rebanada R1 y qué variantes debe demostrar sin incluir diagnóstico o venta completos? | DEC-003 | R1/H2 |
| PO-015 | ¿El folio es único en todo el SaaS, por tenant o por sucursal, y debe seguir siéndolo si una orden cambia de sucursal? | DEC-021, DEC-023 | R1/H2 |
| PO-016 | ¿Una orden puede moverse entre sucursales? ¿Antes o después de iniciar custodia, quién autoriza y qué conserva el folio? | DEC-010, DEC-021, DEC-029 | R1/H2 |
| PO-017 | ¿Cuál es el formato visible del folio y qué debe seguir funcionando cuando no se puede imprimir una etiqueta? | DEC-022, DEC-041, DEC-042 | R1/H2 |
| PO-018 | ¿Qué estados, ubicaciones físicas y condición inicial de custodia son imprescindibles en recepción? | DEC-027 a DEC-030 | R1/H2 |
| PO-019 | ¿Qué requisitos de recepción son universales y cuáles puede configurar tenant o sucursal sin desactivar invariantes? | DEC-032 a DEC-035 | R1/H2 |
| PO-020 | Si una política cambia con órdenes abiertas, ¿se conserva la regla aplicada al iniciar, se revalida o requiere una excepción explícita? | DEC-033, DEC-034 | R1/H2 |
| PO-021 | ¿Marca/modelo y catálogo de equipos son compartidos globalmente, propios del tenant o propios de la sucursal? ¿Se permite texto libre? | DEC-036 | R1/H2 |
| PO-022 | ¿La identidad del cliente es única por tenant o sucursal y qué visibilidad existe entre sucursales? | DEC-007, DEC-011, DEC-036 | R1/H2 |
| PO-023 | ¿Qué fotografías/evidencias son obligatorias, para qué riesgo y en qué casos pueden omitirse con autoridad? | DEC-040 | R1/H2 |

## Prioridad 2 — antes del piloto

| ID | Pregunta | Decisiones | Bloquea |
| --- | --- | --- | --- |
| PO-024 | ¿Cómo termina la custodia, quién puede entregar a un tercero y cómo se corrige una entrega registrada por error? | DEC-031 | Piloto/H3 |
| PO-025 | ¿SR Taller 1.0 coexistirá, migrará por completo o se cortará por tenant/sucursal/orden, y cuál será la fuente de verdad? | DEC-059 | Piloto/H3 |
| PO-026 | ¿Qué tenant, sucursal, usuarios, volumen y recorridos forman el piloto, y cuáles son sus criterios de éxito, aborto y salida? | DEC-060 | Piloto/H3 |
| PO-027 | ¿Qué pérdida de información y tiempo de recuperación son tolerables para el piloto? | DEC-053, DEC-054, DEC-061 | Piloto/H3 |
| PO-028 | ¿Qué recorrido o tiempo de respuesta vuelve inutilizable el piloto aun si el resultado es correcto? | DEC-065 | Piloto/H3 |

## Prioridad 3 — antes de producción o diferible

| ID | Pregunta | Decisiones | Bloquea |
| --- | --- | --- | --- |
| PO-029 | ¿Qué planes y límites comerciales existirán al salir a producción y qué ocurre al excederlos? | DEC-067 | Producción/H4 |
| PO-030 | ¿Qué significa suspender un tenant para usuarios, trabajos abiertos, datos, exportación y reactivación? | DEC-069 | Producción/H4 |
| PO-031 | ¿Cómo se cierra un tenant y qué datos deben exportarse, retenerse o eliminarse? | DEC-056, DEC-070 | Producción/H4 |
| PO-032 | ¿Qué reportes son imprescindibles para operar y cuáles pueden esperar después del MVP? | DEC-074 | Diferible/H5 |
| PO-033 | ¿Existe una necesidad real de trabajar sin conexión? ¿Qué actor, dispositivo, duración y conflictos justificarían reabrirla? | DEC-081 | Diferible/H5 |

## Forma mínima de respuesta

Cada respuesta debería incluir: decisión, alcance tenant/sucursal, actor con autoridad, casos normales, excepciones, evidencia de aceptación y fecha. Las respuestas que cambien seguridad, datos o invariantes pasan luego al ADR técnico correspondiente; no lo sustituyen.
