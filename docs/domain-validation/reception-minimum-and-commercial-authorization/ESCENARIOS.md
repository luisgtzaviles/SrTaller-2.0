# Escenarios de validación

## Convención

Los escenarios expresan comportamiento de dominio mediante precondición, acción y resultado. No describen interfaz, API ni persistencia. Los importes sólo aparecen cuando fueron aportados por el Product Owner.

## RMCA-ESC-001 — Servicio inicial resuelve equipo mojado

**Dado** un equipo mojado, una autorización comercial inicial de $350 MXN condicionada a que ese servicio por sí solo deje funcionando el equipo y la política Avicell aplicable.

**Cuando** el servicio inicial deja funcionando el equipo y no se requiere una reparación posterior.

**Entonces** el servicio es elegible y el total autorizado es $350 MXN.

**Invariantes:** RMCA-INV-014 y RMCA-INV-015.

**Sería inválido:** cobrar un concepto posterior inexistente o afirmar que 350 era una cotización completa de reparaciones futuras.

## RMCA-ESC-002 — Servicio inicial no resuelve y pantalla aceptada

**Dado** el mismo acuerdo inicial de $350 MXN, un resultado que no deja funcionando el equipo, un hallazgo posterior de daño de pantalla y una cotización de pantalla por $1,000 MXN.

**Cuando** el cliente acepta el reemplazo de pantalla.

**Entonces** el servicio inicial no es elegible por su condición; bajo la política Avicell de absorción, el total autorizado es $1,000 MXN.

**Invariantes:** RMCA-INV-012, RMCA-INV-014 y RMCA-INV-015.

**Sería inválido:** cobrar $1,350 MXN.

## RMCA-ESC-003 — Pantalla aceptada y batería rechazada

**Dado** una orden con hallazgos que originan dos conceptos: reemplazo de pantalla y reemplazo de batería inflada.

**Cuando** el cliente acepta la pantalla y rechaza la batería.

**Entonces** la cotización queda parcialmente autorizada; sólo la pantalla integra el alcance y total autorizados; el hallazgo, propuesta y rechazo de batería permanecen en la historia.

**Invariantes:** RMCA-INV-012, RMCA-INV-013 y RMCA-INV-014.

**Sería inválido:** borrar la batería, ejecutarla o cobrarla como autorizada.

## RMCA-ESC-004 — Pantalla y batería aceptadas

**Dado** una cotización con conceptos identificables de pantalla y batería y sus importes comunicados.

**Cuando** el cliente acepta ambos conceptos.

**Entonces** ambos integran el alcance autorizado y el total se deriva de sus importes más o menos las políticas aplicables.

**Invariantes:** RMCA-INV-012 y RMCA-INV-014.

**Sería inválido:** conservar sólo un total sin poder demostrar que ambas líneas fueron aceptadas.

El importe de la batería no fue validado y no se asigna un total numérico.

## RMCA-ESC-005 — Falla de impresora

**Dado** una orden creada correctamente, custodia iniciada y una impresora no disponible.

**Cuando** debe identificarse físicamente el dispositivo.

**Entonces** se escribe manualmente el mismo folio de la orden y se fija al dispositivo. La custodia e identidad no cambian.

**Invariantes:** RMCA-INV-005 a RMCA-INV-008.

**Sería inválido:** dejar el equipo sin identificación, identificar sólo una bolsa o crear otro folio.

## RMCA-ESC-006 — El mismo dispositivo regresa

**Dado** un dispositivo cuya orden anterior terminó con la entrega.

**Cuando** el dispositivo regresa meses después por otra atención, continuación o posible garantía.

**Entonces** se crea una nueva orden, un nuevo folio y un nuevo ciclo de custodia. La posible relación histórica con la orden anterior no sustituye la nueva identidad.

**Invariantes:** RMCA-INV-002 y RMCA-INV-010.

**Sería inválido:** reabrir el ciclo de custodia terminado usando el folio anterior.

## RMCA-ESC-007 — Datos configurables sin IMEI

**Dado** nombre y problema reportado válidos, contexto generado completo y una política aplicable que no exige IMEI o serie.

**Cuando** se recibe un dispositivo cuyo identificador técnico no está disponible.

**Entonces** la orden puede crearse y el dispositivo se identifica físicamente con el folio.

**Invariantes:** RMCA-INV-003 a RMCA-INV-007.

**Sería inválido:** bloquearlo por una supuesta regla universal de IMEI.

## RMCA-ESC-008 — Fotografías posteriores

**Dado** un dispositivo presente y los datos mínimos capturados.

**Cuando** la orden todavía no se ha creado correctamente.

**Entonces** no existe custodia formal ni una obligación universal de tener fotografías como condición de creación.

**Y cuando** la creación termina correctamente, puede realizarse la evidencia fotográfica posterior conforme a la política que se defina.

**Invariantes:** RMCA-INV-001 y RMCA-INV-003.

**Sería inválido:** declarar que la custodia inició por tomar una foto antes del éxito o bloquear universalmente la orden por no tenerla.

## Cobertura

| Dimensión | Escenarios |
|---|---|
| Servicio condicionado y absorción | RMCA-ESC-001/002 |
| Decisión total o parcial por concepto | RMCA-ESC-003/004 |
| Identificación y contingencia | RMCA-ESC-005 |
| Ciclos sucesivos | RMCA-ESC-006 |
| Configuración de recepción | RMCA-ESC-007 |
| Momento de evidencia | RMCA-ESC-008 |

Los primeros seis escenarios satisfacen el mínimo solicitado; los dos últimos hacen explícitos límites relevantes de recepción.
