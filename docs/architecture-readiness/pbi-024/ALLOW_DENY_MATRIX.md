# Matriz allow/deny

## Contrato

Todo `Deny` ocurre antes de efectos. Las respuestas públicas son conceptuales:
PBI-024 no crea API. `401` agrupa fallos de reconocimiento/confianza de station;
`404` oculta recursos fuera de scope; `409` expresa revisión stale; `500`
representa una invariante persistente imposible.

Los 20 IDs base permanecen estables. Los sufijos separan causas internas y son
casos de prueba obligatorios; ninguna fila contiene categorías alternativas.

| ID | Entrada/precondición | Decisión | Categoría interna DEC-044 | Código/status externo | Anti-enumeración | Evidencia y test |
| --- | --- | --- | --- | --- | --- | --- |
| AD-01 | station válida, tenant y branch elegibles | **Allow** | sin error | contexto | sólo IDs opacos internos | resolver + PG positivo |
| AD-02 | station desconocida dentro del scope reconocido | **Deny** | `Authentication` | `AUTHENTICATION_REQUIRED` / 401 | igual a revocada/unlinked | contrato + PG |
| AD-03 | station revocada | **Deny** | `Authentication` | `AUTHENTICATION_REQUIRED` / 401 | no revela revocación | lifecycle + PG |
| AD-04 | station de otro tenant | **Deny** | `Authentication` | `AUTHENTICATION_REQUIRED` / 401 | no lookup global | dos tenants |
| AD-05A | branch candidata de link no pertenece/no es visible en tenant | **Deny** | `NotFound` | `RESOURCE_NOT_FOUND` / 404 | no confirma existencia ajena | tenancy eligibility negativo |
| AD-05B | binding persistido apunta a branch de otro tenant pese a FK compuesta | **Deny** | `Unexpected` | `INTERNAL_ERROR` / 500 | no expone IDs/constraint | integridad + mutación |
| AD-06 | station `Active` apunta a branch inexistente | **Deny** | `Unexpected` | `INTERNAL_ERROR` / 500 | sin IDs/constraint | integridad + mutación |
| AD-07A | evidencia server-side no permite reconocer tenant | **Deny** | `Authentication` | `AUTHENTICATION_REQUIRED` / 401 | no distingue tenant | recognition contract |
| AD-07B | station/binding persistido referencia tenant inexistente | **Deny** | `Unexpected` | `INTERNAL_ERROR` / 500 | no expone tenant/FK | integridad + PG |
| AD-08 | tenantId cliente contradice evidencia verificada | **Deny** | `Validation` | `VALIDATION_FAILED` / 400 | no confirma valor correcto | contract test |
| AD-09 | branchId cliente contradice contexto verificado | **Deny** | `Validation` | `VALIDATION_FAILED` / 400 | no confirma branch efectiva | contract test |
| AD-10 | operación protegida no recibe `TrustedStationContext` | **Deny** | `Authentication` | `AUTHENTICATION_REQUIRED` / 401 | respuesta genérica | application contract |
| AD-11A | evidencia de station ausente en recognition boundary | **Deny** | `Authentication` | `AUTHENTICATION_REQUIRED` / 401 | no completa por fallback | contract test |
| AD-11B | evidencia presente pero estructuralmente malformada | **Deny** | `Validation` | `VALIDATION_FAILED` / 400 | no devuelve el valor recibido | contract test |
| AD-11C | evidencia bien formada pero no reconocida | **Deny** | `Authentication` | `AUTHENTICATION_REQUIRED` / 401 | igual a evidence rechazada | verifier negativo |
| AD-12 | evidencia manipulada/firma rechazada | **Deny** | `Authentication` | `AUTHENTICATION_REQUIRED` / 401 | no explica motivo | verifier negativo |
| AD-13 | tenants A/B con mismo branchId lógico | **Allow sólo propio** | sin error | contexto propio | no enumera gemela | PG positivo/negativo |
| AD-14 | station relinked; contexto con revision anterior | **Deny** | `Concurrency` | `CONCURRENCY_CONFLICT` / 409 | no revela nueva branch | row-lock guard + PG |
| AD-15A | efecto obtiene lock antes que revoke y confirma | **Allow** | sin error | resultado del efecto | orden interno no público | barrera PG efecto-primero |
| AD-15B | revoke confirma antes de que efecto obtenga lock | **Deny** | `Concurrency` | `CONCURRENCY_CONFLICT` / 409 | no revela revocación | barrera PG revoke-primero |
| AD-15C | resolución nueva comienza después de revoke | **Deny** | `Authentication` | `AUTHENTICATION_REQUIRED` / 401 | igual a station no confiable | resolver posterior |
| AD-16 | station `Unlinked` | **Deny** | `Authentication` | `AUTHENTICATION_REQUIRED` / 401 | igual a desconocida/revocada | lifecycle + PG |
| AD-17 | dos bindings abiertos | **Deny** | `Unexpected` | `INTERNAL_ERROR` / 500 | no revela branches | unique + mutation |
| AD-18 | source cliente intenta marcarse trusted | **Deny** | `Authentication` | `AUTHENTICATION_REQUIRED` / 401 | source no se parsea | architecture/contract |
| AD-19 | método global o wildcard de stations | **Deny** | gate arquitectónico | no existe contrato público | no existe API global | fixture/mutation |
| AD-20 | job sin revision/contexto completo | **Deny** | `Validation` | `VALIDATION_FAILED` / 400 interno | no fallback global | application test |

## Contrato detallado de causas separadas

| ID | Código interno | Mensaje público sanitizado | Logging interno | Evidencia |
| --- | --- | --- | --- | --- |
| AD-05A | `STATION_BRANCH_NOT_ELIGIBLE` | “El recurso no está disponible.” | `debug/info`; operación y causa, sin branch ajena | resultado negativo de `tenancy` + 404 contract |
| AD-05B | `STATION_REFERENCE_INTEGRITY_BROKEN` | “Ocurrió un error interno.” | `error`; correlación y operación lógica, sin IDs/constraint | FK, fixture imposible/mutación y 500 |
| AD-07A | `STATION_TENANT_NOT_RECOGNIZED` | “Se requiere autenticación.” | `warn`; resultado de recognition, sin evidencia | fake server-side negativo + 401 |
| AD-07B | `STATION_REFERENCE_INTEGRITY_BROKEN` | “Ocurrió un error interno.” | `error`; correlación y operación, sin tenant/FK | integridad PostgreSQL + 500 |
| AD-11A | `STATION_EVIDENCE_REQUIRED` | “Se requiere autenticación.” | `warn`; ausencia, sin payload | contract + 401 |
| AD-11B | `STATION_EVIDENCE_MALFORMED` | “La solicitud no es válida.” | `info`; `warn` ante abuso, nunca valor | contract + 400 |
| AD-11C | `STATION_EVIDENCE_REJECTED` | “Se requiere autenticación.” | `warn`; rechazo genérico, sin razón/evidencia | verifier + 401 |

## Igualdad observable

Para AD-02, AD-03, AD-04, AD-07A, AD-11A, AD-11C, AD-12, AD-15C y
AD-16 deben coincidir:

- código público;
- categoría;
- status;
- mensaje;
- ausencia de details;
- headers relevantes;
- shape y longitud estructural razonable.

Las pruebas no imponen igualdad criptográfica de tiempo, pero deben evitar
diferencias deterministas creadas por paths separados.

## Criterio de fallo

Un solo `Allow` inesperado, lookup global, fallback, contexto mutable, ID ajeno
expuesto o efecto confirmado después de guard stale produce `FAIL`. Una prueba
positiva no compensa un negativo fallido.
