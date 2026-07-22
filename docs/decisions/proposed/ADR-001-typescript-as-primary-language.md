# ADR-001 — TypeScript como lenguaje principal y Node.js como runtime inicial

**Status: Accepted**
**Fecha:** 2026-07-21
**Autoridad de aceptación:** Arquitectura + Ingeniería, mediante decisión conjunta explícita.

## Estado del documento

Decisión aceptada para el lenguaje principal y el runtime inicial de SR Taller 2.0. La ruta histórica bajo `proposed/` se conserva para no romper referencias; el estado dentro de este ADR y el [registro de decisiones](../README.md) son autoritativos.

Este ADR no autoriza implementación, scaffold, instalación de tooling ni creación de aplicaciones. Tampoco acepta frameworks, persistencia, topología de repositorio, package manager, frontend, contenedores o plataforma de despliegue.

## Contexto

R0 necesita una base ejecutable coherente para dominio, aplicación, adaptadores, procesamiento diferible, pruebas y contratos deliberadamente compartidos. Compartir lenguaje reduce cambios de contexto y permite comprobaciones estáticas, pero no elimina los límites modulares, la validación en runtime, la autorización ni la evidencia exigida por las decisiones aceptadas.

Elegir TypeScript no selecciona por sí solo un runtime, framework, compilador concreto, gestor de paquetes o superficie de producto. Para evitar que Node.js permanezca como supuesto implícito, esta decisión fija también el runtime inicial y su política de soporte sin convertir ADR-001 en una decisión general de stack.

## Fuerzas de decisión

- Consistencia de tipos dentro del backend y entre contratos deliberadamente públicos.
- Compatibilidad con una arquitectura modular y un único artefacto backend inicial.
- Mantenibilidad, contratación y operación por un equipo común.
- Necesidad de validar en runtime toda entrada no confiable.
- Reproducibilidad de compilación y ejecución.
- Ventana de soporte suficiente para construir R0 y R1.
- Evolución futura sin convertir un lenguaje en restricción universal.

## Alternativas consideradas

1. **TypeScript con Node.js como runtime inicial:** lenguaje y runtime explícitos, soporte gobernado y excepciones justificadas.
2. **TypeScript sin runtime decidido:** menor alcance inmediato, pero deja incompleta la base ejecutable de R0 y mantiene Node.js implícito.
3. **JavaScript como fuente principal:** menor configuración inicial y menor protección estática.
4. **Lenguajes por componente:** libertad local con mayor coste operativo, de contratación y de compatibilidad.
5. **Política general de plataforma:** unificar lenguaje, runtime, framework, tooling y despliegue; se descarta por mezclar autoridades y decisiones que ya tienen trazabilidad propia.

## Decisión

TypeScript es el lenguaje obligatorio por defecto para el código fuente nuevo de producto dentro de las superficies y responsabilidades expresamente autorizadas. Node.js `24.x` es el runtime oficial inicial del backend de R0 y de la toolchain TypeScript.

“Lenguaje principal” no significa lenguaje universal. Una excepción justificada continúa siendo posible bajo el gobierno definido en este ADR.

## Alcance obligatorio en R0

TypeScript es obligatorio para:

- dominio;
- capa de aplicación;
- adaptadores e infraestructura del backend inicial;
- procesamiento diferible contenido dentro del mismo backend y artefacto inicial;
- pruebas mantenidas como parte del producto;
- contratos y paquetes compartidos deliberadamente autorizados.

Para un cliente web, TypeScript será obligatorio cuando la superficie correspondiente sea aprobada. Esta decisión no autoriza por sí misma Next.js, múltiples aplicaciones web, clientes móviles ni nuevas superficies de producto.

## Ámbitos preferidos o no cubiertos automáticamente

TypeScript es preferido para automatización e instrumentos internos mantenidos por Ingeniería.

No se aplica automáticamente a:

- dependencias externas;
- infraestructura como código con un lenguaje nativo;
- herramientas de terceros;
- integraciones heredadas;
- servicios especializados todavía no autorizados;
- clientes móviles o superficies futuras no aprobadas.

## Runtime oficial inicial

Node.js `24.x` es el runtime oficial inicial para:

- el backend de R0;
- la ejecución de TypeScript compilado;
- la toolchain TypeScript;
- jobs y procesamiento diferible que permanezcan dentro del backend modular inicial.

Se selecciona Node.js `24.x` porque es una línea LTS vigente al momento de la decisión, ofrece una ventana de soporte compatible con R0 y R1 y evita iniciar sobre una línea Current aún no promovida a LTS.

La versión minor y patch concreta deberá fijarse reproduciblemente al crear el scaffold ejecutable. El ADR no inmortaliza ese valor: se actualizará dentro de `24.x` conforme a mantenimiento, seguridad y compatibilidad.

## Política de soporte de Node.js

- SR Taller 2.0 soportará una sola línea major como baseline ordinaria por release.
- La línea soportada deberá encontrarse en Active LTS o Maintenance LTS.
- No se iniciarán releases de producción sobre una versión EOL.
- La actualización deberá completarse antes del fin de soporte de la línea vigente.
- Durante una migración controlada podrán validarse temporalmente la línea anterior y la nueva.
- La coexistencia temporal no constituye soporte permanente de dos líneas.
- Seguridad u Operaciones podrán exigir actualización anticipada ante vulnerabilidades críticas o riesgo operativo.
- Cambiar esta política o introducir otro runtime requiere decisión conjunta de Arquitectura + Ingeniería.

## Seguridad de tipos y validación en runtime

La implementación deberá aplicar strictness conceptual:

- no se permite `implicit any`;
- se usan `unknown` y narrowing en límites no confiables;
- cualquier `any`, cast inseguro o escape hatch queda localizado y justificado;
- las coerciones relevantes son explícitas;
- los paquetes mantienen compatibilidad verificable de compilador y contratos;
- los tipos de TypeScript nunca sustituyen validación en runtime.

Antes de convertirse en un valor confiable del dominio o la aplicación, se valida en runtime toda entrada procedente de:

- HTTP;
- eventos;
- jobs y colas;
- persistencia;
- archivos;
- variables de entorno;
- integraciones externas;
- datos manipulables por clientes.

Este ADR no selecciona una librería de validación ni una configuración concreta de `tsconfig`.

## Política de JavaScript

Se permite:

- JavaScript generado como salida compilada;
- configuración JavaScript exigida por herramientas;
- código generado;
- scripts pequeños, no dominiales y controlados cuando TypeScript añada complejidad desproporcionada.

Se prohíbe:

- código fuente JavaScript de producto sin excepción previa;
- lógica de dominio dentro de scripts JavaScript excepcionales;
- usar JavaScript para eludir strictness o validación;
- introducir silenciosamente otro runtime o artefacto desplegable mediante una excepción menor.

## Excepciones y otros lenguajes

Una excepción de lenguaje dentro del artefacto existente debe justificarse por al menos uno de estos motivos:

- dependencia externa mantenida;
- herramienta de infraestructura con lenguaje nativo;
- requisito operativo verificable;
- procesamiento especializado con evidencia;
- integración heredada sin reemplazo razonable.

Toda excepción registra:

- necesidad;
- alcance;
- propietario;
- riesgo;
- controles;
- duración o fecha de revisión;
- impacto operativo;
- razón por la que TypeScript no resulta adecuado.

Introducir otro runtime, un servicio nuevo, un artefacto desplegable adicional, una librería interna relevante en otro lenguaje o persistencia/procesamiento externo especializado requiere una decisión arquitectónica explícita. No puede aprobarse como excepción local.

## Paquetes compartidos

Se permite compartir únicamente:

- contratos públicos deliberados;
- tipos estables;
- validadores o esquemas explícitos;
- utilidades técnicas sin semántica de dominio propia;
- componentes con propiedad y dirección de dependencias definidas.

No se autoriza compartir indiscriminadamente:

- entidades internas;
- modelos de persistencia;
- detalles privados de módulos;
- repositorios;
- servicios de aplicación;
- internals de dominio;
- tipos que creen acoplamiento transversal.

La topología del repositorio, workspaces, ownership y enforcement permanecen pendientes de ADR-009, DEC-005 y DEC-049.

## Compatibilidad con decisiones aceptadas

ADR-001 queda subordinado a:

- ADR-002: el backend inicial continúa siendo un monolito modular, una sola aplicación y un único artefacto;
- ADR-004: el aislamiento tenant no depende del lenguaje;
- ADR-010: la estación sigue siendo autoridad del contexto operativo;
- ADR-011: identidad, PIN y sesión mantienen sus invariantes;
- ADR-012: roles, capacidades y autorización contextual son independientes del framework;
- ADR-013: las acciones sensibles conservan su clasificación y autorización reforzada.

Ningún tipo, decorator, guard, interceptor o contrato de TypeScript sustituye validación, autorización o evidencia exigidas por esas decisiones.

## Límites de la decisión

ADR-001 no decide:

- NestJS;
- Next.js;
- PostgreSQL;
- package manager;
- monorepo, workspaces o Turborepo;
- bundler o test runner;
- librería de validación;
- ORM;
- contenedores o plataforma de despliegue;
- CI/CD o proveedor cloud;
- Redis, BullMQ o almacenamiento compatible con S3;
- superficies futuras de producto.

Esas decisiones conservan su propia autoridad y trazabilidad.

## Gobierno

- **Aceptación de ADR-001:** Arquitectura + Ingeniería.
- **Excepción local dentro del artefacto existente:** Arquitectura + Ingeniería.
- **Actualización minor o patch dentro de Node.js `24.x`:** Ingeniería, con pruebas y compatibilidad verificadas.
- **Migración futura a otra línea LTS:** Ingeniería propone y Arquitectura valida compatibilidad normativa.
- **Cambio de runtime o incorporación de otro desplegable:** nueva decisión arquitectónica.
- **Riesgos, EOL, vulnerabilidades o cambios operativos:** participan Seguridad y Operaciones.
- **Cambio de alcance, coste, operación o superficie entregable:** participa Producto.

## Escenarios normativos mínimos

| Escenario | Resultado |
| --- | --- |
| Nuevo código backend en TypeScript | Permitido y obligatorio por defecto |
| Dominio acoplado a decorators del framework | Prohibido |
| Tipos TypeScript usados como única validación HTTP | Prohibido |
| Paquete compartido con contrato explícito y validación runtime | Permitido con condición |
| Compartir entidades internas entre módulos | Prohibido |
| JavaScript compilado | Permitido |
| Código fuente JavaScript de producto sin excepción | Prohibido |
| Script operativo pequeño sin lógica de dominio | Permitido con condición |
| Dependencia externa implementada en otro lenguaje | Permitido con condición |
| Servicio especializado en otro runtime | Requiere nueva decisión |
| Actualización patch de Node.js `24.x` | Permitida con validación |
| Permanecer en una versión EOL | Prohibido |
| Usar Node.js `26.x` antes de adoptarlo formalmente | No permitido como baseline de R0 |
| Cliente web futuro en TypeScript | Obligatorio cuando la superficie sea autorizada |
| Interpretar ADR-001 como aceptación de NestJS | Prohibido |

## Consecuencias positivas

- Lenguaje y runtime dejan de depender de supuestos implícitos.
- Los contratos y refactors obtienen comprobación estática coherente.
- R0 dispone de una baseline LTS reproducible y gobernada.
- Se reducen divergencias de compilación y soporte entre responsabilidades del backend.
- Las excepciones conservan evolución tecnológica sin fragmentación accidental.

## Consecuencias negativas

- Compilación, configuración y disciplina adicionales.
- Ingeniería debe mantener versiones y actualizar la línea antes de EOL.
- El gobierno de excepciones añade revisión explícita.
- Un uso indiscriminado de paquetes compartidos todavía podría crear acoplamiento.

## Riesgos y mitigaciones

- **Confundir tipos con validación:** exigir validación en runtime en toda frontera no confiable.
- **Acoplar dominio a framework:** prohibir decorators y tipos de transporte en dominio/aplicación.
- **Divergencia entre paquetes:** verificar compatibilidad de compilador y contratos.
- **Permanecer sobre runtime sin soporte:** mantener una sola baseline LTS y migrar antes de EOL.
- **Excepciones permanentes:** exigir propietario, controles y fecha de revisión.
- **Expandir TypeScript a superficies no aprobadas:** aplicar la decisión sólo al alcance expresamente autorizado.

## Criterios para reconsiderar

- Necesidad demostrada de un runtime o ecosistema no servido adecuadamente por TypeScript/Node.js.
- Requisito operativo, de soporte o procesamiento especializado con evidencia.
- Coste de rendimiento, seguridad o mantenibilidad comprobado mediante evaluación autorizada.
- Cambio relevante en las superficies, el modelo operativo o la unidad desplegable inicial.

Reconsiderar no autoriza una excepción ni un runtime nuevo: requiere la autoridad definida en este ADR.

## Impacto en R0 y decisiones relacionadas

La dependencia de lenguaje/runtime de ADR-005 queda satisfecha, pero ADR-005 permanece `Proposed` y requiere revisión y evidencia propias. ADR-001 tampoco acepta ADR-003, ADR-006, ADR-007, ADR-008 ni ADR-009.

DEC-004 continúa abierta hasta que ADR-003, ADR-005 y ADR-009 alcancen un estado explícito compatible y se verifiquen las demás restricciones del gate. El primer cambio ejecutable de R0 permanece bloqueado por DEC-004 y los demás gates aplicables.

## Referencias

- [Registro de decisiones](../README.md)
- [ADR-002 — Monolito modular inicial](ADR-002-modular-monolith-first.md)
- [ADR-004 — Multitenancy con base y esquema compartidos](ADR-004-shared-schema-multitenancy.md)
- [ADR-005 — NestJS para backend y API](ADR-005-nestjs-backend.md)
- [ADR-009 — Estrategia monorepo](ADR-009-monorepo-strategy.md)
- [Arquitectura objetivo](../../architecture/TARGET_ARCHITECTURE.md)
- [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md)
- [Estrategia de pruebas](../../quality/TESTING_STRATEGY.md)
- [Estrategia de despliegue](../../architecture/DEPLOYMENT_STRATEGY.md)
- [Criterios de salida de R0](../../architecture-readiness/blocker-closure/CRITERIOS_DE_SALIDA_DE_R0.md)
- [PBI-010](../../backlog/pbis/PBI-010.md)
- [PBI-012](../../backlog/pbis/PBI-012.md)

## Próxima revisión

- **Fecha:** antes de que Node.js `24.x` entre en Maintenance LTS o ante un disparador de reconsideración.
- **Autoridad:** Arquitectura + Ingeniería; Seguridad y Operaciones participan según riesgo.
- **Evidencia esperada:** matriz de compatibilidad, pruebas de actualización, riesgos operativos y justificación de cualquier excepción.
