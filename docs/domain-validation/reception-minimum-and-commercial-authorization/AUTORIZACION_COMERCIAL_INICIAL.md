# Autorización comercial inicial

## Propósito

Este documento aclara el significado comercial que el legacy suele expresar mediante “presupuesto inicial” sin convertir ese campo histórico en el modelo futuro.

## Decisiones validadas

### RMCA-DEC-016 — Interpretación del dato legacy

En la operación observada, “presupuesto inicial” frecuentemente representa una autorización comercial inicial: una condición económica aceptada para intentar un servicio o continuar una evaluación bajo reglas conocidas. No necesariamente representa una cotización final, detallada ni compuesta por todas las reparaciones posteriores.

**Estado terminológico:** Propuesta. “Autorización comercial inicial” es el término descriptivo adoptado en este paquete para conservar el significado validado del dato legacy. Su promoción al lenguaje canónico y su nombre visible requieren una decisión terminológica posterior.

### RMCA-DEC-017 — No equivale a cotización final

Una autorización inicial no prueba por sí sola:

- el diagnóstico;
- todos los trabajos que serán necesarios;
- el precio final;
- una autorización para cualquier reparación futura;
- que el servicio inicial sea cobrable bajo todos los resultados;
- un pago, anticipo o saldo.

### RMCA-DEC-018 — Ejemplo Avicell validado

Para el servicio inicial de un equipo mojado:

1. el monto es $350 MXN sólo si ese servicio por sí solo deja funcionando el equipo;
2. si el servicio no deja funcionando el equipo, no se cobra ese servicio;
3. si después se descubre daño de pantalla, se cotiza la pantalla como concepto posterior;
4. si el cliente autoriza la pantalla por $1,000 MXN, el total autorizado es $1,000 MXN, no $1,350 MXN;
5. bajo la política vigente de Avicell, el servicio inicial queda absorbido o sustituido por la reparación aceptada.

La absorción de Avicell no es una regla universal para todos los tenants.

## Secuencia conceptual

| Momento | Hecho | Lo que no demuestra |
|---|---|---|
| Recepción | se registra el problema reportado | causa técnica |
| Acuerdo inicial | se acepta una condición comercial inicial | reparación final completa |
| Revisión/servicio | se ejecuta o evalúa el servicio permitido | éxito garantizado |
| Hallazgo | aparece una necesidad adicional | autorización automática |
| Cotización | se propone uno o más conceptos | decisión del cliente |
| Decisión | el cliente acepta o rechaza cada concepto | ejecución |
| Ejecución | se realiza el trabajo autorizado | cobro liquidado |

## Precondiciones de una autorización inicial válida

Se necesita conocer, como mínimo:

- el servicio o alcance al que se refiere;
- la condición que determina si genera cobro;
- el importe o regla económica comunicada;
- una decisión atribuible del cliente o persona autorizada;
- la política comercial aplicable.

Los canales, evidencia, vigencia y autoridad exacta de la persona son preguntas abiertas.

## Resultados esperados

- El alcance inicial queda separado de trabajos descubiertos después.
- Un hallazgo adicional no amplía silenciosamente la autorización.
- El monto cobrable se evalúa contra el resultado y la política aplicable.
- Una reparación posterior requiere su propia propuesta y decisión.
- El total autorizado no se obtiene sumando indiscriminadamente todos los importes mencionados.

## Casos inválidos

- Tratar $350 MXN como cargo seguro aunque la condición decía “sólo si funciona”.
- Interpretar la aceptación del servicio inicial como autorización ilimitada de reparaciones posteriores.
- Sumar $350 MXN y $1,000 MXN en el ejemplo Avicell validado.
- Usar un total final aislado sin poder explicar qué conceptos fueron autorizados.
- Confundir autorización comercial con pago recibido.
- Borrar el intento o hallazgo inicial cuando una reparación posterior lo sustituye comercialmente.

## Relación con políticas de precio

El comportamiento de absorción, suma o no cobro se documenta en [Políticas comerciales de precio](POLITICAS_COMERCIALES_DE_PRECIO.md). La autorización inicial establece el acuerdo; la política determina su efecto económico bajo un resultado.
