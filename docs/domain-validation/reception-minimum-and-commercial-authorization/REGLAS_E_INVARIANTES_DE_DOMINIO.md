# Reglas e invariantes de dominio

## Propósito

Este registro concentra las condiciones que deben permanecer verdaderas y separa esas condiciones de las políticas configurables. Los IDs son trazabilidad documental, no nombres de validadores ni componentes técnicos.

## Invariantes validadas

### RMCA-INV-001 — Orden y custodia nacen juntas

No existe custodia formal sin una orden creada correctamente. El mismo éxito que da existencia a la orden inicia la custodia.

### RMCA-INV-002 — Una orden representa un ciclo

La identidad de la orden permanece durante un único ciclo desde la creación correcta hasta la entrega.

### RMCA-INV-003 — Mínimo universal

No puede crearse válidamente una orden sin nombre y problema reportado.

### RMCA-INV-004 — Contexto atribuible

Toda orden debe quedar asociada con tenant, sucursal, usuario receptor, fecha/hora, folio y ubicación inicial de custodia.

### RMCA-INV-005 — Identificación física permanente

Todo dispositivo bajo custodia permanece físicamente identificado con el folio de su orden.

### RMCA-INV-006 — Contingencia sin pérdida de identificación

Una falla de impresora no permite dejar el dispositivo sin identificar; se usa el folio escrito manualmente.

### RMCA-INV-007 — El identificador acompaña al dispositivo

Identificar sólo un contenedor, charola, bolsa o caja no satisface la identificación del dispositivo.

### RMCA-INV-008 — Reposición conserva identidad

Reimprimir o reemplazar el identificador conserva el mismo folio y la misma orden.

### RMCA-INV-009 — Varios trabajos, un ciclo

Una orden puede agrupar varios trabajos o conceptos mientras corresponde al mismo ciclo de custodia.

### RMCA-INV-010 — Nuevo regreso, nueva orden

Después de la entrega, un regreso del mismo dispositivo inicia una orden y un ciclo de custodia nuevos.

### RMCA-INV-011 — Relato y conclusión no se sustituyen

El problema reportado conserva la declaración del cliente y permanece distinguible de hallazgos, diagnóstico, propuestas, decisiones, autorizaciones y ejecución.

### RMCA-INV-012 — Decisión atribuida a un concepto

Una aceptación o rechazo debe referirse a un concepto identificable. Una decisión general no puede ampliar silenciosamente el alcance.

### RMCA-INV-013 — Rechazo preservado

Un hallazgo o trabajo propuesto rechazado permanece en la historia y no forma parte del trabajo autorizado.

### RMCA-INV-014 — Total explicable

El total autorizado debe poder derivarse de los conceptos autorizados y las políticas comerciales aplicables.

### RMCA-INV-015 — Política explícita

La absorción, suma o exclusión de un servicio inicial depende de una política comercial identificable; no puede asumirse como regla universal.

## Reglas validadas

| Regla | Precondición | Resultado esperado | Ejemplo inválido |
|---|---|---|---|
| Crear la orden sólo con mínimos cumplidos | nombre, problema, contexto y requisitos configurables aplicables | orden y custodia nacen con folio | orden creada sin problema |
| Identificar después de crear | existe folio y custodia | folio unido al dispositivo | folio sólo en la caja |
| Usar contingencia manual | impresora no disponible | el equipo sigue identificado | esperar sin identificación |
| Tomar fotos después de crear | orden ya existe | evidencia vinculable a una orden | hacer las fotos precondición universal |
| Registrar relato del cliente | cliente comunica síntoma/necesidad | problema reportado distinguible | convertirlo en diagnóstico |
| Cotizar por conceptos | existen hallazgos o trabajos propuestos | oferta con alcance distinguible | sólo un total sin explicación |
| Decidir por concepto | concepto presentado e identificable | aceptación o rechazo atribuible | “acepta todo” con líneas ambiguas |
| Derivar autorización parcial | al menos un concepto aceptado y otro rechazado | sólo lo aceptado queda autorizado | ejecutar batería rechazada |
| Conservar rechazo | existe decisión negativa | hallazgo, propuesta y rechazo permanecen | borrar la línea |
| Aplicar política comercial | servicio inicial y reparación posterior relacionados | total reconciliable | sumar importes por defecto |
| Abrir nueva orden al regreso | el ciclo anterior terminó por entrega | nuevo ciclo y folio | reusar orden entregada |

## Políticas, no invariantes

Las siguientes decisiones admiten variación controlada:

- obligatoriedad del apellido;
- obligatoriedad de contacto, marca, modelo, IMEI/serie, color y señas;
- alcance tenant o sucursal de esas políticas;
- política fotográfica posterior;
- absorción, suma, cobro condicional o no cobro del servicio inicial;
- requisitos adicionales condicionados a un caso.

Ninguna puede contradecir RMCA-INV-001 a RMCA-INV-015.

## Reglas aún no aprobadas

Este paquete no fija:

- canales o pruebas válidas de autorización;
- quién puede representar al cliente;
- vigencia, cambio o revocación de decisiones;
- versión de cotización;
- impuestos, descuentos, redondeo o moneda;
- pagos, anticipos, saldo o devolución;
- criterios de entrega, abandono, garantía o cierre;
- mecanismo de historia o persistencia.

Estos temas no deben inferirse de las invariantes anteriores.

## Checklist de consistencia

Una propuesta posterior es consistente sólo si puede responder afirmativamente:

1. ¿La orden nace una sola vez y junto con la custodia?
2. ¿Nombre y problema reportado siguen siendo universales?
3. ¿El contexto del sistema no se degrada a casillas opcionales?
4. ¿El dispositivo permanece identificado incluso en contingencia?
5. ¿El relato del cliente no se confunde con el diagnóstico?
6. ¿Cada aceptación o rechazo señala un concepto?
7. ¿Lo rechazado se conserva y no se ejecuta como autorizado?
8. ¿El total se explica con conceptos y política?
9. ¿Un regreso posterior crea otra orden?

Si alguna respuesta es negativa, la propuesta contradice este paquete o requiere una nueva decisión explícita del Product Owner.
