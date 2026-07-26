# Plan de pruebas de aislamiento tenant

## Objetivo

Demostrar en PostgreSQL `18.4` real que el patrón de PBI-023 falla cerrado
cuando falta o se manipula tenant/sucursal. Una prueba positiva aislada no
acredita aislamiento.

## Fixtures

- tenant A y tenant B;
- branch A1/A2 y B1/B2;
- identificadores lógicos iguales cuando el probe lo permita;
- filas propias, ajenas e inexistentes;
- dos contextos inmutables;
- dos operaciones concurrentes;
- correlaciones sintéticas;
- cero PII y cero datos productivos.

Los UUID concretos se fijarán en el manifest de fixtures para reproducibilidad.

## Garantías por capa

| Garantía | Schema | Constraint | Repository/query | Test | Autorización futura |
|---|---|---|---|---|---|
| tenant obligatorio | columna no nula | sí | método exige scope | omisión | contexto confiable PBI-024 |
| branch pertenece al tenant | columnas compuestas | FK compuesta | exige ambos IDs | branch cruzada | estación/ADR-010 |
| lectura aislada | no suficiente | no | filtro tenant/branch | read/list/join | capability futura |
| update/delete aislado | no suficiente | no | predicado tenant/branch | cero filas ajenas | capability futura |
| referencia cross-tenant imposible | diseño compuesto | sí | no acepta scope conflictivo | insert/update FK | reglas de caso futuro |
| consulta global separada | no | no | no existe API ordinaria | static/negative | ruta administrativa futura |
| contexto no contaminado | no | no | objeto inmutable por operación | concurrencia/pool | sesión futura |

El schema no autoriza; la query no reemplaza constraints; las pruebas no
reemplazan autorización futura.

## Matriz negativa mínima

| ID | Caso | Resultado esperado | Capa principal |
|---|---|---|---|
| ISO-001 | repository sin tenant | rechazo antes de query | contrato/API |
| ISO-002 | tenant vacío o mal formado | rechazo antes de pool | validación |
| ISO-003 | list A con contexto B | sólo filas B | query |
| ISO-004 | read ID A con contexto B | no encontrado, sin enumeración | query/error |
| ISO-005 | create con payload tenant distinto | payload no decide scope; rechazo de conflicto | adapter |
| ISO-006 | update ID A con contexto B | cero filas; no modifica A | query |
| ISO-007 | delete ID A con contexto B | cero filas; no elimina A | query |
| ISO-008 | join parte A con parte B | cero filas o FK rechazada | query/constraint |
| ISO-009 | branch B bajo tenant A | FK compuesta rechaza | constraint |
| ISO-010 | misma branch lógica en A/B | cada contexto ve sólo la propia | PK/query |
| ISO-011 | tenant A y branch B enviados juntos | rechazo fail-closed | contract/constraint |
| ISO-012 | context A reutilizado por operación B | operación B no hereda A | lifecycle |
| ISO-013 | dos requests concurrentes A/B | resultados sin contaminación | concurrency |
| ISO-014 | dos jobs/probes concurrentes A/B | no comparten estado mutable | concurrency |
| ISO-015 | pool devuelve conexión reutilizada | no existe tenant residual | lifecycle |
| ISO-016 | método global ordinario importado | architecture gate falla | static |
| ISO-017 | raw SQL fuera del owner | architecture gate falla | static |
| ISO-018 | adapter de módulo accede tabla ajena | architecture gate falla | static |
| ISO-019 | error FK/unique | salida sanitizada, sin SQL/ID ajeno | DEC-044 |
| ISO-020 | rollback tras escritura A | ninguna fila parcial | transaction |

## Casos positivos obligatorios

- A lista/lee/escribe su información.
- B lista/lee/escribe su información.
- branch válida se crea bajo su tenant.
- transacción de varias operaciones del mismo scope hace commit.
- operación idempotente/repetida produce el resultado contractual.

Cada positivo tiene al menos un negativo gemelo.

## CRUD y modelo mínimo

El schema productivo de tenant/branch no debe ganar campos artificiales sólo
para satisfacer CRUD. Los casos completos list/read/create/update/delete y
joins de SPIKE-002 se ejecutan sobre probes desechables. PBI-023 prueba en sus
tablas productivas sólo las operaciones que tengan contrato real.

## Afirmaciones prohibidas

- “Tenemos `tenant_id`, por lo tanto hay aislamiento”.
- “El UUID es secreto”.
- “La UI no ofrece el ID ajeno”.
- “Una prueba positiva demuestra denegación”.
- “RLS protege la base”; RLS no está aceptado.
- “Not found” prueba autorización; sólo evita enumeración.

## Evidencia

Por cada caso:

- ID, commit, versión PostgreSQL y toolchain;
- fixture/tenant aliases sanitizados;
- operación estable, no SQL;
- resultado esperado/real;
- filas afectadas o categoría traducida;
- duración;
- cleanup;
- hash del artefacto.

## Gate

Seguridad + Calidad revisan la matriz completa. Un solo acceso cross-tenant,
scope opcional, query global ordinaria o cleanup inseguro produce `FAIL` y
bloquea PBI-023.
