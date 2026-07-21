# Políticas comerciales de precio

## Alcance

Este documento registra variantes comerciales confirmadas como configurables. No decide su persistencia, interfaz, impuestos, contabilidad ni jerarquía tenant/sucursal.

## Decisión principal

### RMCA-DEC-025 — La absorción es configurable

La relación económica entre un servicio inicial y una reparación posterior aceptada no es universal. Debe depender de una política comercial explícita.

## Variantes validadas

| ID | Política | Efecto comercial declarado |
|---|---|---|
| RMCA-POL-001 | Servicio inicial absorbido cuando se acepta la reparación | la reparación autorizada sustituye el cargo del servicio inicial aplicable |
| RMCA-POL-002 | Servicio inicial siempre agregado | el servicio inicial aplicable se suma a las reparaciones autorizadas |
| RMCA-POL-003 | Servicio inicial cobrado sólo si se rechaza la reparación | al aceptar la reparación no se agrega; al rechazarla puede cobrarse según la condición del servicio |
| RMCA-POL-004 | Servicio inicial nunca cobrado | el servicio inicial no forma parte del total autorizado |
| RMCA-POL-005 | Variante extensible | se admite otra regla explícita, validada y no contradictoria con las invariantes |

La existencia de variantes no aprueba que cualquier usuario pueda crearlas ni define su alcance administrativo.

## Dos evaluaciones diferentes

Para evitar contradicciones, deben distinguirse:

1. **Elegibilidad del servicio inicial:** si las condiciones acordadas hacen que el servicio pueda cobrarse bajo el resultado observado.
2. **Composición comercial:** si un servicio elegible se absorbe, suma o excluye al coexistir con reparaciones autorizadas.

En el ejemplo Avicell, el servicio de $350 MXN sólo es elegible si por sí solo deja funcionando el equipo. Si no lo logra, su importe elegible es cero. Además, cuando se acepta la reparación de pantalla, la política vigente absorbe el servicio inicial.

## Tabla de decisión

Convenciones:

- S: importe del servicio inicial que resulte elegible después de evaluar su condición.
- R: suma de los conceptos de reparación autorizados.
- “Sin reparación aceptada” incluye un rechazo o ausencia de conceptos aceptados; la conducta exacta puede depender de condiciones adicionales.

| Política | Resultado del servicio inicial | Reparación posterior aceptada | Total derivado dentro del alcance validado |
|---|---|---:|---|
| RMCA-POL-001 Absorber | S es elegible | Sí | R |
| RMCA-POL-001 Absorber | S es elegible | No | S, sujeto a términos comunicados |
| RMCA-POL-001 Absorber | S no es elegible | Sí | R |
| RMCA-POL-001 Absorber | S no es elegible | No | 0 |
| RMCA-POL-002 Siempre agregar | S es elegible | Sí | S + R |
| RMCA-POL-002 Siempre agregar | S es elegible | No | S |
| RMCA-POL-002 Siempre agregar | S no es elegible | Sí | R |
| RMCA-POL-002 Siempre agregar | S no es elegible | No | 0 |
| RMCA-POL-003 Sólo si rechaza | S es elegible | Sí | R |
| RMCA-POL-003 Sólo si rechaza | S es elegible | No | S |
| RMCA-POL-003 Sólo si rechaza | S no es elegible | Sí | R |
| RMCA-POL-003 Sólo si rechaza | S no es elegible | No | 0, salvo que una política futura defina otra condición explícita |
| RMCA-POL-004 Nunca cobrar | cualquier resultado | Sí | R |
| RMCA-POL-004 Nunca cobrar | cualquier resultado | No | 0 |

La tabla expresa el efecto validado con S ya evaluado. No resuelve impuestos, descuentos, anticipos, redondeos, cargos de diagnóstico, garantías o cancelaciones.

## Caso Avicell

| Hecho | Valor |
|---|---:|
| Servicio inicial condicionado | $350 MXN |
| El servicio inicial por sí solo deja funcionando el equipo | No |
| Importe elegible del servicio inicial | 0 |
| Reparación de pantalla aceptada | $1,000 MXN |
| Política aplicable | RMCA-POL-001 |
| Total autorizado | $1,000 MXN |

El resultado $1,350 MXN es inválido en este caso.

## Reglas de aplicación

- La política aplicable debe poder identificarse.
- Debe evaluarse primero la condición económica comunicada para el servicio.
- Sólo los conceptos aceptados forman R.
- Los conceptos rechazados permanecen en la historia, pero no forman R.
- Un total debe poder explicarse con conceptos, elegibilidad y política.
- Cambiar de política no debe reescribir silenciosamente decisiones pasadas; la vigencia histórica requiere diseño posterior.

## Preguntas pendientes

- ¿La política pertenece al tenant, a la sucursal o admite precedencia?
- ¿Quién puede seleccionarla o cambiarla?
- ¿Puede variar por tipo de servicio?
- ¿Qué evidencia fija la política aplicable a una orden?
- ¿Cómo se resuelve una frase comercial que entra en conflicto con la política configurada?
- ¿Qué significan exactamente “siempre” y “sólo si rechaza” cuando el servicio falló o no fue concluyente?
- ¿Cómo interactúan impuestos, descuentos, anticipos y reembolsos?

Estas preguntas se consolidan en [Preguntas abiertas](PREGUNTAS_ABIERTAS.md).
