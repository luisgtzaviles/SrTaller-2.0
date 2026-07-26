# Autorización de implementación de PBI-024

## Resultado

**PASS — PBI-024 IMPLEMENTATION AUTHORIZED**

Esta autorización permite preparar y ejecutar PBI-024 exclusivamente en una
rama funcional. No autoriza integración funcional a `main`, release, deploy o
producción.

## Identidad

| Campo | Valor |
| --- | --- |
| PBI | `PBI-024` |
| Título | Apply trusted tenant, branch and station context |
| Fecha | `2026-07-26` |
| Rama base revisada | `main` |
| SHA formalmente revisado | `5b3ba7fdd27fb135cfe9d559694384a396515922` |
| Commit de refinamiento original | `5ea18b5d787fbd364d71e874007133a95b59aa1b` |
| Commit de remediación | `5b3ba7fdd27fb135cfe9d559694384a396515922` |
| Estado autorizado | `Authorized — implementation may begin; functional merge blocked by DEC-051 C02` |
| Riesgo | alto, fail-closed |

La autoridad competente es el **Responsable del Proyecto**, actuando también
como Responsable de Producto y ejerciendo las funciones de Arquitectura e
Ingeniería necesarias para ampliar el alcance autorizado de R0. Seguridad,
Operaciones y Calidad conservan sus revisiones y gates durante la
implementación y antes de cualquier integración.

## Evidencia de revisión

La secuencia formal fue:

1. el refinamiento original quedó completo en
   `5ea18b5d787fbd364d71e874007133a95b59aa1b`;
2. la primera revisión independiente emitió
   `CONDITIONAL PASS — PBI-024 AUTHORIZATION BLOCKED BY REMEDIATIONS`;
3. se registraron MAJOR-01 sobre ownership de Branch, MAJOR-02 sobre
   linearización, MAJOR-03 sobre AD-05/07/11 y MINOR-01 sobre mutaciones;
4. `5b3ba7fdd27fb135cfe9d559694384a396515922` remedió los cuatro hallazgos;
5. la segunda revisión independiente confirmó los cuatro hallazgos cerrados,
   cero BLOCKER, cero MAJOR y cero MINOR nuevos;
6. el dictamen final fue
   `PASS — PBI-024 IMPLEMENTATION AUTHORIZED`.

La revisión inspeccionó el diff real, el expediente completo y las fuentes
canónicas DEC-005, DEC-044, DEC-049, DEC-051 y DEC-063. También verificó:

- working tree e índice limpios sobre el SHA exacto;
- `git diff --check`, frozen install, typecheck y build;
- 261/261 pruebas de arquitectura;
- 335 pruebas exitosas, 10 skips locales ordinarios y cero fallos;
- Markdown, enlaces, fences y secrets scan;
- [Authoritative Linux CI run
  30220924876](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/30220924876)
  con `VC-024 run-1`, `run-2` y `comparison` en `SUCCESS`;
- artifacts `8637252504`, `8637248633` y `8637254739` válidos, comparación
  equivalente y manifiestos `dist` idénticos.

El [expediente](README.md) y la
[preparación de revisión](FORMAL_REVIEW_READINESS.md) conservan el refinamiento
y sus remediaciones. Este documento registra la decisión posterior sin
reescribir esos snapshots.

## Alcance autorizado

Se autoriza exclusivamente:

- implementación de PBI-024;
- Station y su persistencia mínima;
- station lifecycle;
- station bindings e historial;
- contrato público `Tenancy → Stations` para elegibilidad tenant-scoped de
  Branch;
- reconciliación del ownership físico heredado de PBI-023 con el ownership
  funcional de DEC-005;
- `TrustedStationContext` inmutable;
- reconocimiento y resolución server-side mediante el puerto aprobado;
- link, unlink/relink y revocación dentro del lifecycle aprobado;
- persistencia necesaria y owner-scoped conforme DEC-049;
- `READ COMMITTED`, row locks, revisión optimista y concurrencia conforme al
  expediente;
- traducción y sanitización de errores conforme DEC-044;
- pruebas unitarias, de aplicación, arquitectura, PostgreSQL e aislamiento;
- mutaciones críticas;
- manifests, artifacts, cleanup y evidencia de revisión.

La implementación debe seguir
[ARCHITECTURE.md](ARCHITECTURE.md),
[STATION_LIFECYCLE.md](STATION_LIFECYCLE.md),
[IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md),
[TEST_PLAN.md](TEST_PLAN.md) y
[MUTATION_PLAN.md](MUTATION_PLAN.md).

## Exclusiones

Permanecen fuera:

- usuarios, PIN y sesiones;
- roles, capacidades, permisos y reautenticación;
- frontend y endpoints de negocio;
- Reparaciones, clientes, equipos, folios y pagos;
- actor, correlación, tiempo de negocio y observabilidad completa;
- secretos o credenciales productivas;
- RLS, cache y operación offline;
- PBI-025, PBI-026, PBI-027, PBI-028 y PBI-029;
- R1;
- release, deploy y producción.

Una necesidad dentro de estas exclusiones detiene el trabajo y requiere su
propio PBI o decisión.

## Restricción DEC-051 C02

DEC051-C02 permanece canónicamente:

`Pending — external platform enforcement unavailable`

Su evaluación material permanece `Partially satisfied`.

La autorización reconoce expresamente:

- `main` no tiene protección efectiva demostrada;
- no existen checks y aprobación obligatorios impuestos por GitHub;
- no existe prueba verificable de rechazo de una integración incumplida;
- puede desarrollarse PBI-024 en rama;
- puede abrirse un PR Draft cuando corresponda;
- no puede hacerse merge funcional;
- no puede hacerse push funcional directo a `main`;
- antes del primer merge funcional, C02 debe quedar `Satisfied` o DEC-051 debe
  modificarse mediante una decisión formal separada.

El
[tratamiento temporal](DEC_051_C02_TEMPORARY_TREATMENT.md)
permitió refinamiento y revisión y expiró al emitirse este dictamen separado.
Su evidencia histórica permanece intacta; esta autorización ejerce exactamente
la posibilidad que ese tratamiento dejó prevista para trabajo local o en rama.

## Autorización Git

Se permite:

- crear `r0/pbi-024-trusted-station-context` desde el commit documental que
  registra esta autorización;
- crear commits funcionales exclusivamente en esa rama;
- hacer push normal a su upstream;
- ejecutar CI y producir evidencia;
- abrir posteriormente un PR Draft si los gates de implementación lo permiten.

Se prohíbe:

- crear la rama desde un SHA distinto del commit documental autorizado;
- hacer rebase sobre un SHA no revisado sin nueva evaluación;
- push funcional directo a `main`;
- merge, squash merge o rebase merge funcional;
- force push;
- crear un PR dentro de esta tarea de autorización;
- omitir un gate rojo o presentar evidencia incompleta como PASS.

## Impacto en R0

R0 permanece `Authorized` y se amplía únicamente desde el alcance ya cerrado de
PBI-023 hacia la implementación de PBI-024. H1 continúa abierto y esta
ampliación:

- no acepta R0;
- no declara H1 completo;
- no autoriza PBI-025–PBI-029;
- no abre R1;
- no autoriza integración funcional, release, deploy o producción.

La fuente vigente del alcance organizacional es
[R0_AUTHORIZATION.md](../R0_AUTHORIZATION.md).

## Vigencia y expiración

Esta autorización expira o requiere nueva revisión si:

- cambia el alcance de PBI-024;
- cambia una DEC o ADR aplicable;
- `main` avanza con cambios incompatibles;
- cambia el modelo de ownership;
- cambia el mecanismo de concurrencia o punto de linearización;
- cambia el contrato externo de errores;
- se intenta incluir PBI-025–PBI-029;
- se intenta abrir R1;
- la rama deja de derivar del commit documental autorizado sin una evaluación
  explícita.

Un cambio puramente documental compatible en `main` no invalida
automáticamente la rama, pero debe evaluarse antes de cualquier integración.

## Estado y siguiente acción

[PBI-024](../../backlog/pbis/PBI-024.md) queda:

`Authorized — implementation may begin; functional merge blocked by DEC-051 C02`

No está `In progress`, `Done`, `Closed` ni autorizado para merge.

La siguiente acción autorizada es:

**Crear la rama funcional e iniciar la implementación de PBI-024 conforme al
expediente aprobado, preservando el bloqueo de merge de DEC051-C02.**
