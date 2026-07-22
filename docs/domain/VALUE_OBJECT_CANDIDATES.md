# Candidatos a objetos de valor

## Estado documental

- **Estado:** Draft / Discovery
- **Autoridad:** No aprobado
- **Propietario de decisión:** Product Owner
- **Última revisión:** TBD
- **Próxima revisión:** Después de la entrevista de dominio

## Criterio

Un candidato expresa significado y reglas por su valor; no prescribe tipos, almacenamiento ni formato de API. Todos mantienen representación hipotética aunque ADR-004/010 condicionen el alcance de BranchId.

| Candidato | Significado | Propiedades conceptuales | Validaciones posibles | Sensibilidad | Igualdad por valor | Dudas | Estado |
|---|---|---|---|---|---|---|---|
| TenantId | identidad opaca de la organización aislada | estable, sin significado comercial | existe y es coherente con contexto | Alta por aislamiento | Sí | formato y ciclo | Initial hypothesis |
| BranchId | identidad de sucursal dentro de tenant | estable y calificada por tenant | pertenece al mismo tenant | Media/alta | Sí dentro del tenant | derivación desde estación vinculada | Initial hypothesis; alcance condicionado por ADR-004/010 |
| CustomerId | identidad conceptual de cliente | estable dentro de tenant | no se usa como autorización | Personal indirecta | Sí dentro del tenant | fusión y alcance | Initial hypothesis |
| WorkOrderId | identidad estable del caso | no cambia con folio/estado | tenant y orden existentes | Operativa | Sí | visibilidad al cliente | Initial hypothesis |
| Folio | referencia legible de operación | alcance, secuencia o patrón TBD | no ambiguo en su alcance | Baja/media | Sí en alcance declarado | global, tenant o sucursal | Initial hypothesis |
| Money | importe con moneda inseparable | monto y moneda | precisión, signo y reglas del concepto | Financiera | Sí | redondeo y fiscalidad | Initial hypothesis |
| Currency | unidad monetaria | código y reglas conocidas | permitida para contexto | Baja | Sí | múltiples monedas | Initial hypothesis |
| PhoneNumber | medio telefónico normalizado con contexto | número, región/capacidad TBD | forma plausible, no prueba propiedad | Personal | Sí según normalización | sin teléfono, reutilización | Initial hypothesis |
| EmailAddress | dirección de correo declarada | forma y normalización | sintaxis y verificación separadas | Personal | Sí según política | case y unicidad | Initial hypothesis |
| IMEI | identificador móvil declarado/observado | valor y posición SIM TBD | estructura/check digit si aplica | Identificador de equipo | Sí por valor | dual IMEI, ausencia, cambio | Initial hypothesis |
| SerialNumber | identificador de fabricante | emisor/valor quizá necesarios | no vacío si se declara | Identificador de equipo | Sí con emisor/contexto | ilegible o no único | Initial hypothesis |
| DevicePasscode | secreto temporal para pruebas autorizadas | propósito, vigencia y acceso | nunca en claro fuera de custodia segura; opcional | Secreta crítica | Comparación restringida, no exposición | si debe conservarse | Initial hypothesis |
| DateRange | intervalo con significado de negocio | inicio, fin, inclusividad | orden temporal y zona/política | Según uso | Sí | días hábiles y límites | Initial hypothesis |
| WarrantyPeriod | ventana y origen de cobertura | inicio, fin, cobertura | coherente con entrega/servicio | Comercial | Sí | pausa, extensión, ley | Initial hypothesis |
| Quantity | magnitud con unidad | valor y unidad | positiva para consumo/reserva | Baja | Sí | fracciones y conversiones | Initial hypothesis |
| Percentage | proporción contextual | valor y base | rango y significado explícitos | Financiera según uso | Sí | descuento, anticipo o avance | Initial hypothesis |
| Address | ubicación postal declarada | componentes dependientes de país | suficiencia según propósito | Personal | Sí tras normalización discutible | domicilio del cliente o sucursal | Initial hypothesis |
| PersonName | nombre presentado de persona | componentes culturales flexibles | no asumir dos apellidos/nombres | Personal | No fiable para identidad; sí como valor textual | alias, organización | Initial hypothesis |
| FailureDescription | relato de síntoma con origen | texto, autor y momento | propósito, longitud y lenguaje respetuoso | Puede contener datos personales | Sí como snapshot, no semánticamente | estructura vs texto libre | Initial hypothesis |
| ConditionSnapshot | condición observada en un momento | observaciones, momento, actor, evidencia | no sobrescribir historial | Puede contener imágenes/datos | Sí por conjunto y momento | correcciones y granularidad | Initial hypothesis |
| QuoteVersion | referencia a una versión concreta | secuencia/identidad dentro de Quote | no reutilizable ni mutable tras emisión | Comercial | Sí | numeración visible | Initial hypothesis |
| AuthorizationEvidence | evidencia del decisor y alcance | persona, versión, decisión, medio, momento | autoridad, integridad y propósito | Personal/comercial | Sí como snapshot | firma, verbal, mensaje | Initial hypothesis |
| RecipientEvidence | evidencia de la entrega | receptor, autoridad, momento, condición | suficiencia y minimización | Personal | Sí como snapshot | documento, folio o código | Initial hypothesis |
| PartCompatibility | afirmación acotada de compatibilidad | parte, dispositivo, fuente, certeza | evidencia y vigencia | Comercial | Sí por combinación | quién responde por error | Initial hypothesis |
## Sensibilidad

DevicePasscode no debe tratarse como un valor ordinario sólo porque sea candidato conceptual. PhoneNumber, EmailAddress, Address, PersonName, AuthorizationEvidence, RecipientEvidence y ConditionSnapshot requieren propósito, minimización, acceso y retención. Esa política sigue pendiente.
