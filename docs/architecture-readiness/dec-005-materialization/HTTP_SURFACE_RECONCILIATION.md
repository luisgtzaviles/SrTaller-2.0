# Reconciliación de superficies HTTP con DEC-005

## Vigencia de policy 4 — PBI-034

La materialización de PBI-034 amplía de forma cerrada el registry HTTP, sin
convertir la reconciliación histórica de Repairs en una autorización general.
`architecture/dec-005-policy.json` registra ahora exactamente estas superficies
modulares:

- `AccessSessionController`, compuesto por `AccessModule` desde
  `./presentation/access-session.controller.js`;
- `AccessAdministrationController` y `BranchSettingsAdministrationController`,
  compuestos por `AccessModule` desde sus adapters de administración exactos;
- `RepairsController`, compuesto por `RepairsModule` desde
  `./presentation/repairs.controller.js`;
- `LocalStationBootstrapController`, compuesto por `StationsModule` desde
  `./presentation/local-station-bootstrap.controller.js`.

La última superficie es exclusivamente un bootstrap local/de prueba autorizado
por PBI-034; su presencia en el registry no crea enrollment productivo. Health
conserva su contrato técnico independiente. Para cada controller modular, el
checker sigue exigiendo owner, archivo, clase, import y composición exactos. Un
controller adicional, una composición implícita o un registro incompleto falla
cerrado.

El apartado histórico «Lo que no cambia» describe el alcance de la
reconciliación original. Su frase sobre una única superficie queda superseded
únicamente por las entradas exactas anteriores; no existe una autorización
abierta para nuevos endpoints o controllers.

## Extensión cerrada de Timezone Foundation

La policy v6 incorpora exclusivamente `BranchSettingsAdministrationController`
como adapter HTTP de Access. La lectura y escritura de la zona horaria se
autoriza por Access y deriva tenant/Branch del contexto de Station confiable;
el controller no acepta scope de cliente. Este registry no abre una superficie
genérica de configuración.

## Estado

- Resultado arquitectónico: `CONTRACT EVOLUTION` con una guarda estructural obsoleta.
- Alcance: enforcement, policy, evidencia y una corrección de layering sin cambio observable del contrato HTTP de Repairs.
- Rama local evaluada: `feature/branch-brand-color-owner-iteration`.
- Baseline de la rama: `483110c0afe8574d0bde8355e0f16a7155ac50c2`.
- Integración, commit, push, PR, merge y deploy: no autorizados por esta tarea.

## Contrato histórico

[DEC-005](../../decisions/dec-005-modular-monolith-organization/DECISION_PROPOSAL.md)
definió desde su selección un árbol modular con `presentation/http`, ubicó
controllers y DTOs dentro del módulo propietario, permitió a presentation
consumir su propia aplicación y prohibió acceso directo a repositories, SQL,
adapters e internals de otros módulos. D5-R035 estableció además que la sola
aceptación de DEC-005 no iniciaba código funcional.

[PBI-022](../../backlog/pbis/PBI-022.md) materializó únicamente estructura y
enforcement. En esa fase no había autoridad para endpoints de producto, por lo
que el shell sin controllers y la guarda `health-only` eran correctos. Esa
fotografía se conserva en [IMPLEMENTATION](IMPLEMENTATION.md); no se reescribe
como si PBI-022 hubiera autorizado Repairs.

## Autoridad vigente

[ADR-005](../../decisions/proposed/ADR-005-nestjs-backend.md) está aceptado y
define REST/HTTP JSON como interfaz inicial, controllers como adapters delgados
y la delegación a casos de uso. ADR-005 tampoco autorizó por sí mismo un
endpoint funcional.

PBI-023 a PBI-030 no aportan una autorización retrospectiva de Repairs: sus
exclusiones, estados o alcances se conservan. Las superficies de Repairs
presentes en esta rama provienen de iteraciones locales de producto autorizadas
posteriormente por el Owner. La presente reconciliación autoriza expresar en
policy el contrato arquitectónico de esas superficies ya materializadas, no
agregar rutas ni comportamiento.

La lectura vigente combina ambas condiciones:

1. existe autoridad funcional separada para la superficie;
2. la superficie satisface DEC-005 y ADR-005 mediante registro arquitectónico exacto y fail-closed.

## Causa raíz

`verify:structure` conservaba una búsqueda textual global que rechazaba todo
`@Controller` y decorador HTTP fuera de Health. El checker AST había acumulado
después una excepción específica para cualquier archivo bajo Repairs
presentation. Ambos extremos eran incorrectos para el estado actual:

- la búsqueda textual seguía materializando la fase `health-only` de PBI-022;
- la excepción por módulo era demasiado amplia y no demostraba ownership, source autorizado ni composición.

La evolución contractual dejó por tanto una `STALE GUARD`. No existe una
excepción nueva a DEC-005.

## Política canónica

`architecture/dec-005-policy.json` mantiene un registry cerrado:

- layer permitida: `presentation`;
- path del controller: exacto;
- owner: módulo autorizado exacto;
- clase: exacta y decorada desde `@nestjs/common`;
- source: presente en `productModuleFiles`;
- composición: módulo, import y registro único en `controllers` exactos.

Health permanece como superficie técnica exacta independiente. Un archivo no
registrado falla aunque esté bajo `modules/`. Un controller bajo
`infrastructure`, `shared` o un módulo no declarado falla. El registry no
neutraliza ninguna regla de imports, autoridad, contexto o persistencia.

## Distribución de enforcement

- `verify:structure` verifica roots, artefactos y los contratos técnicos exactos de Health y Preview static.
- `verify:architecture` es la autoridad para placement, ownership, layer, identidad AST y composición de superficies HTTP modulares.
- `verify` ejecuta ambos gates; retirar la búsqueda textual duplicada no reduce la cobertura del gate canónico.

El checker conserva resolución directa, alias, namespace, wrappers,
shadowing, imports locales y diagnósticos deterministas.

## Revisión de Repairs

`repairs.controller.ts`:

- pertenece a `repairs/presentation`;
- delega a use cases de `repairs/application`;
- no importa repository, Kysely adapter, DB runtime, SQL ni storage;
- no consume internals de otro módulo;
- no deriva tenant/sucursal desde input del cliente;
- se compone exactamente una vez desde `RepairsModule`.

El catálogo de labels y tones usado para adaptar respuestas HTTP se mantiene
en presentation. Esto elimina el import directo de presentation hacia domain
sin cambiar códigos, labels, tones, rutas ni payloads.

## Evidencia negativa y positiva

La suite exige:

1. controller bajo infrastructure: D5-R035;
2. controller bajo shared: D5-R019 y D5-R035;
3. controller en módulo sin ownership: D5-R002 y D5-R035;
4. controller registrado importando adapter Kysely: D5-R011;
5. controller registrado importando DB runtime: D5-R011;
6. controller registrado cruzando internals de otro módulo: D5-R014;
7. Repairs presentation registrado: PASS;
8. Health exacta: PASS.

Las mutaciones copian el árbol real, introducen la violación, exigen reglas y
paths exactos, restauran el archivo y vuelven a exigir PASS.

## Lo que no cambia

- No se agregan endpoints ni métodos HTTP.
- No cambian Worklist, Detail, D1, D2, D3, D4 ni su UI.
- No cambian status, technician, financials, delivery o persistencia.
- No se autoriza una segunda superficie ni un controller global.
- No se modifica Preview, Dokploy, DNS o infraestructura remota.
