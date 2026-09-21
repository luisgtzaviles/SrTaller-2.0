# Definition of Done

## Estado del documento

- **Estado:** contrato operativo vigente, basado en
  [DEC-063](../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md).
- **Propósito:** definir predicados materiales de terminación sin exigir copias
  manuales de evidencia derivable.
- **Alcance:** Work Units y PBIs; los contratos de riesgo, release y ambiente
  añaden sus gates especializados cuando aplican.

## Principio

`Done` significa que el alcance previsto está integrado y verificable, sus
riesgos requeridos están resueltos y la evidencia única necesaria se conserva.
No significa `Released`. `Accepted`, `Materialized`, `Formally Verified`,
`Done`, `Released` y el estado operacional `CLOSED` son conceptos distintos.

La aplicación es proporcional al tipo y riesgo del cambio. `N/A` exige una
razón objetiva; no convierte un ambiente ausente o un test omitido en `PASS`.

## Predicado base de una Work Unit

Una Work Unit puede quedar técnicamente `CLOSED` cuando la autoridad aplicable
demuestra todos los puntos pertinentes:

1. alcance y criterios cumplidos sin expansión material;
2. verificación focalizada y de promoción requerida aprobada;
3. review técnico proporcional sin hallazgos bloqueantes;
4. PR, merge y CI exact-main satisfechos cuando hubo integración remota;
5. riesgos o excepciones requeridos resueltos o aceptados por la autoridad
   correcta;
6. validación de ambiente completada cuando el alcance incluyó deployment;
7. contratos permanentes afectados actualizados;
8. evidencia no derivable preservada cuando existe.

El cierre se deriva de esas autoridades conforme al
[Work Unit Lifecycle](./WORK_UNIT_LIFECYCLE.md). No requiere un estado `Done
Candidate`, un segundo PR, ni un commit posterior dedicado a copiar SHAs,
runs, merge o wording de estado.

## Perfil por tipo de cambio

### Producto y comportamiento

- criterios de aceptación, errores, límites y permisos relevantes verificados;
- estados de carga, vacío y error evaluados cuando existe UI;
- aceptación de producto en el evento donde el comportamiento puede evaluarse:
  review o validación de Preview/Staging según el alcance;
- un registro Markdown adicional sólo si la aceptación contiene contexto no
  derivable o una decisión/riesgo duradero.

### Ingeniería

- typecheck, build, unitarias, integración y E2E según el cambio y sus gates;
- errores, timeouts, retries e idempotencia cubiertos cuando aplican;
- límites de módulos y contratos arquitectónicos respetados;
- review normal puede hacerlo otra persona, agente o contexto competente. No
  se presenta como independencia organizacional inexistente.

### Seguridad, autorización y datos

- aislamiento tenant y branch probado con casos negativos cuando aplica;
- autorización backend y auditoría verificadas para acciones sensibles;
- secretos y datos personales fuera de logs/evidencia;
- migraciones y compatibilidad material verificadas;
- cambios `SENSITIVE` reciben una segunda revisión deliberada técnica o de
  seguridad y aprobación Owner cuando el riesgo lo exige.

### Arquitectura

- impacto y alternativas resueltos mediante ADR/DEC cuando corresponda;
- segunda revisión deliberada;
- aprobación Owner de la decisión material;
- enforcement y documentación permanente consistentes.

### Experiencia, operación y release

- accesibilidad, responsive, navegadores y design system según el riesgo;
- rendimiento, observabilidad y recuperación cuando corresponden;
- artefacto y rollout/rollback cuando el cambio alcanza release;
- Staging, Production, backup/restore y smoke sólo son gates si el alcance o el
  release los requiere expresamente.

## Evidencia

La política completa está en
[`SOURCE_OF_TRUTH.md`](./SOURCE_OF_TRUTH.md). Git, GitHub, CI y runtime son la
evidencia de rama, SHA, PR, review, merge, resultados automatizados,
deployment/provenance y health. No se exige transcribir esos hechos en otro
archivo.

Se crea evidencia narrativa únicamente para información no derivable, por
ejemplo QA manual, aceptación de riesgo, excepción de seguridad, rationale
arquitectónico, incidente o resultado externo sin historial durable. Evidencia
histórica existente se conserva y no se vuelve requisito universal.

## Producto, PBI y Sprint

- El trabajo de producto normalmente enlaza roadmap/backlog/PBI.
- Bugs, recovery, mantenimiento o governance pueden cerrar como Work Unit
  explícitamente autorizada sin inventar un PBI.
- Un Sprint es un timebox/capacity construct opcional; no es un gate universal
  de ingeniería.
- La aceptación Owner se exige cuando aporta juicio de producto, ambiente,
  riesgo o arquitectura, no como frase Markdown duplicada.
- El siguiente PBI nunca comienza automáticamente por cerrar el anterior.

## Cierre e integración

Un PR de cierre separado sólo existe si hay un cambio real de repositorio:
governance independiente, ADR/DEC, corrección documental descubierta después o
reconciliación histórica. No es el mecanismo normal para cambiar wording o
copiar evidencia ya disponible.

`Done` y `Released` permanecen separados. Un release exige su propia autoridad,
artefacto, ambiente y validación. Los gates técnicos actuales, incluido el
pipeline completo cuando corresponde, no se reducen por esta simplificación.

## Trabajo diferido

Un pendiente descubierto durante el cierre conserva ID, impacto, owner y
prioridad propuesta cuando necesita seguimiento. Crear trabajo futuro no
convierte automáticamente en aceptable un incumplimiento actual.

## Próxima revisión

Cuando cambien DEC-063, la clasificación de riesgo, los gates técnicos, los
ambientes materializados o la política de release.
