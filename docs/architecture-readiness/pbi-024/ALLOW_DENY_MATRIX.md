# Matriz allow/deny

## Contrato

Todo `Deny` ocurre antes de efectos. Las respuestas públicas son conceptuales:
PBI-024 no crea API. `401` agrupa fallos de reconocimiento/confianza de station;
`404` oculta recursos fuera de scope; `409` expresa revisión stale; `500`
representa una invariante persistente imposible.

| ID | Caso | Resultado | DEC-044 / externo | Anti-enumeración | Evidencia y test |
| --- | --- | --- | --- | --- | --- |
| AD-01 | station válida, tenant correcto, branch correcta | **Allow** | contexto, sin error | sólo IDs opacos internos | resolver + PG positivo |
| AD-02 | station desconocida | **Deny** | Authentication / 401 | mismo envelope que revocada/unlinked | contrato + PG |
| AD-03 | station revocada | **Deny** | Authentication / 401 | no revela revocación | lifecycle + PG |
| AD-04 | station de otro tenant | **Deny** | Authentication / 401 | no lookup global ni tenant ajeno | dos tenants |
| AD-05 | branch de otro tenant | **Deny** | NotFound interno → 404 o Unexpected si corrupción | no revela branch | FK + resolver negativo |
| AD-06 | station `Active` con branch inexistente | **Deny** | Unexpected / 500 | sin IDs/constraint | mutation de integridad |
| AD-07 | tenant inexistente | **Deny** | NotFound interno → 404 o Unexpected si corrupción | no distingue tenant | FK + resolver |
| AD-08 | tenantId cliente contradictorio | **Deny** | Validation / 400 | no confirma cuál es correcto | contract test |
| AD-09 | branchId cliente contradictorio | **Deny** | Validation / 400 | no confirma branch efectiva | contract test |
| AD-10 | ausencia de evidencia station | **Deny** | Authentication / 401 | respuesta genérica | unit + application |
| AD-11 | contexto parcial | **Deny** | Validation / 400 antes de resolver; Authentication / 401 si falta evidencia | no completa valores por fallback | contract test |
| AD-12 | evidencia manipulada | **Deny** | Authentication / 401 | misma forma y sin razón | verifier fake negativo |
| AD-13 | tenants A/B con mismo branchId lógico | **Allow sólo propio** | contexto por PK compuesta | no enumera la gemela | PG positivo/negativo |
| AD-14 | station relinked; contexto de revision anterior | **Deny** | Concurrency / 409 | no revela nueva branch | guard stale + PG |
| AD-15 | resolve concurrente con revoke | **Allow sólo si guard confirma antes; de otro modo Deny** | Concurrency / 409 o Authentication / 401 en resolución nueva | no revela revocación | barrera concurrente PG |
| AD-16 | station `Unlinked` | **Deny** | Authentication / 401 | igual a desconocida/revocada | lifecycle + PG |
| AD-17 | dos bindings abiertos | **Deny** | Unexpected / 500 | no revela branches | unique + mutation |
| AD-18 | source cliente intenta marcarse trusted | **Deny** | Authentication / 401 | source no se parsea desde request | architecture/contract |
| AD-19 | método global o wildcard de stations | **Deny** | gate arquitectónico | no existe API global | fixture/mutation |
| AD-20 | background job sin revision/contexto completo | **Deny** | Validation / 400 interno | no fallback global | application test |

## Igualdad observable

Para AD-02, AD-03, AD-04, AD-12 y AD-16 deben coincidir:

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
