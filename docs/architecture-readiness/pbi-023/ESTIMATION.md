# Estimación y compromiso controlado

## Resultado

| Campo | Valor |
|---|---|
| Método | Story Points Fibonacci |
| Estimación | **13 SP** |
| Complejidad | alta |
| Riesgo | alto, fail-closed |
| Incertidumbre | media-alta |
| Volumen de evidencia | alto |
| Estado de compromiso | gate de validación R0 comprometido; implementación no comprometida |

No existe un método de estimación canónico materializado en el repositorio.
Se aplicó Fibonacci y se evaluaron complejidad, incertidumbre, riesgo,
dependencias, implementación, pruebas y documentación.

## Factores de complejidad

1. Primera dependencia de acceso a datos y primera extensión del checker
   arquitectónico después de H0.
2. Lifecycle real de PostgreSQL `18.4` en desarrollo y Linux CI.
3. Migrador, lock, journal, fallo parcial, recuperación y promoción.
4. Dos identidades de base, configuración fail-fast y sanitización.
5. Ownership por objeto y fronteras de infraestructura raíz/módulo.
6. Dos tenants y sucursales con constraints negativas reales.
7. Repositorios sin métodos globales y transaction runner de misma conexión.
8. Evidencia DEC-049/050/051/063, doble run y cleanup determinista.

## Desglose relativo

El desglose no suma horas ni crea mini-PBIs; explica el tamaño:

| Área | Peso relativo |
|---|---|
| dependencia/configuración/conexión | medio |
| migrador y lifecycle | alto |
| schema mínimo y ownership | medio |
| aislamiento negativo y transacciones | alto |
| PostgreSQL real y CI | alto |
| checker, fixtures y mutaciones | alto |
| evidencia y revisión | medio |

## Supuestos

- DEC-050 permanece aceptada sin cambio material.
- SPIKE-002 confirma el patrón candidato sin exigir RLS.
- PostgreSQL `18.4` está disponible como servicio efímero en Linux CI.
- Las versiones candidatas siguen publicadas y compatibles al instalar.
- `tenants` y `branches` son suficientes para la fundación productiva mínima;
  los probes del spike son desechables.
- No entra API, auth, contexto runtime, negocio ni ambiente compartido.
- El checker puede ampliarse sin reemplazar su contrato ni sus mutaciones.
- No se requiere DDL no transaccional ni datos destructivos.

## Dependencias

- DEC-004/005/044/049/050/051/063 aceptadas.
- ADR-003/004 aceptadas.
- SPIKE-002 ejecutable y favorable.
- DEC050-C01 antes de instalar.
- DEC051-C02/C03/C04/C06 y DEC063-C02/C05/C06 antes del primer merge
  persistente, conforme a sus triggers.

## Incertidumbre

La incertidumbre principal no está en escribir una conexión: está en demostrar
que el contrato tenant-scoped falla cerrado bajo CRUD, joins, constraints y
concurrencia real. La segunda incertidumbre es el costo de ampliar D5-R014,
D5-R022, D5-R032 y D5-R033 sin abrir falsos negativos.

## ¿Debe dividirse?

**No antes del spike.** PBI-023 conserva un slice coherente: una fundación de
persistencia usable sólo tiene valor cuando conexión, migración, schema mínimo,
aislamiento y evidencia funcionan juntos. Dividirlos en PBIs independientes
crearía estados intermedios sin una garantía consumible.

La ejecución sí debe usar checkpoints pequeños descritos en
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md). Se debe reconsiderar una
división formal si el spike demuestra que:

- se necesita RLS o un mecanismo distinto de repositorios tenant-aware;
- el lifecycle de PostgreSQL requiere una plataforma no autorizada;
- la infraestructura de sucursales exige decisiones de PBI-024;
- el checker necesita una sustitución y no una extensión;
- la primera migración no puede ser transaccional;
- hacen falta más de dos objetos productivos;
- el trabajo supera 13 SP manteniendo el mismo alcance.

## Condiciones de reestimación

También obligan a reestimar:

- cambio de versión mayor de Kysely o `pg`;
- nueva dependencia de tooling;
- Testcontainers o Docker Compose seleccionados;
- proveedor compartido o secretos reales;
- schema de usuarios/sesiones/roles/reparaciones;
- backfill, datos reales o cambio destructivo;
- release/deploy incluido;
- nueva política de RLS, pooling o operaciones administrativas.

## Compromiso

SPIKE-002 quedó ejecutado y revisado con `PASS`. El **siguiente gate de R0** es
el checkpoint del checker/boundaries. PBI-023 sigue sin asignarse a un sprint
de implementación; esta distinción conserva la autorización de R0 sin
convertir un plan en `In progress`.
