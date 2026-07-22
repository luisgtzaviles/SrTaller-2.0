# ADR-009 — Repositorio único evolutivo y workspaces bajo demanda

**Status: Accepted**
**Fecha:** 2026-07-21
**Autoridad de aceptación:** Arquitectura + Ingeniería
**Revisión obligatoria:** Operaciones + Seguridad

## Estado del documento

Decisión aceptada para la topología general del repositorio de SR Taller 2.0. La ruta histórica bajo `proposed/` se conserva para no romper referencias; el estado dentro de este ADR y el [registro de decisiones](../README.md) son autoritativos.

Este ADR acepta un repositorio Git único y evolutivo, con workspaces únicamente bajo demanda. No autoriza implementación, scaffolding, aplicaciones adicionales, packages, despliegues, publicación, versionado independiente, package manager, lockfile, orquestador, caché, CI/CD ni estructura física.

## Contexto

SR Taller 2.0 se encuentra en fundación documental y no contiene todavía código funcional. [ADR-002](ADR-002-modular-monolith-first.md) acepta una sola aplicación backend inicial, un único artefacto desplegable y módulos con fronteras explícitas. La topología del repositorio debe preservar esa simplicidad sin impedir que proyectos futuros expresamente autorizados compartan cambios, contratos públicos, pruebas y documentación.

Un repositorio único facilita cambios atómicos y gobierno común, pero puede ocultar acoplamiento, convertir módulos en packages sin necesidad o introducir tooling anticipatorio. Workspaces, orquestadores y caché sólo aportan valor cuando existe un grafo real con varias unidades; no son sinónimos de monorepo ni condiciones de R0.

## Fuerzas de decisión

- Cambios atómicos entre productores, contratos y consumidores.
- Una sola aplicación backend y un solo artefacto inicial conforme a ADR-002.
- Fronteras de dominio independientes de la organización física y del tooling.
- Ownership y revisión cross-boundary explícitos.
- Onboarding y operación proporcionales al tamaño real del sistema.
- Ausencia de packages, aplicaciones y microservicios anticipatorios.
- Capacidad de evolucionar a varios proyectos sin fijar herramientas prematuramente.
- Supply chain, secretos, CI y caché gobernados antes de su adopción.

## Opciones consideradas

1. **Monorepo con workspaces desde R0:** prepara varios proyectos, pero obliga a introducir un workspace manager cuando sólo existe un proyecto ejecutable previsto.
2. **Repositorio único sin workspaces inicialmente:** conserva atomicidad y simplicidad; permite adoptar workspaces cuando aparezca un segundo proyecto o un package justificado.
3. **Varios repositorios:** ofrece autonomía y permisos separados, pero aumenta coordinación, compatibilidad y versionado sin una necesidad organizacional u operativa demostrada.
4. **Monorepo completo con orquestación desde R0:** ofrece grafo, caché y tareas selectivas, pero selecciona complejidad antes de existir unidades o métricas que la justifiquen.

## Decisión

SR Taller 2.0 utilizará un **repositorio Git único evolutivo**. Los workspaces no serán obligatorios para R0 y sólo podrán incorporarse bajo las condiciones de este ADR.

Para R0 existirán:

- una sola aplicación backend;
- un solo artefacto desplegable;
- un solo flujo coordinado de versión;
- documentación en el mismo repositorio.

El repositorio podrá contener, cuando estén autorizados, documentación, la aplicación backend inicial, pruebas, fixtures, scripts controlados, herramientas internas y proyectos futuros aprobados.

La decisión de repositorio único no implica:

- múltiples aplicaciones, servicios o desplegables;
- packages por módulo;
- workspaces obligatorios;
- publicación de packages;
- versionado independiente;
- microservicios;
- clientes web o móviles;
- design system o SDK;
- orquestador;
- caché local o remota.

## Relación obligatoria con ADR-002

ADR-009 queda subordinado a ADR-002 y conserva:

- una aplicación de servidor inicial;
- un artefacto desplegable inicial;
- módulos con fronteras explícitas;
- dominio y aplicación independientes del framework;
- comunicación mediante contratos y puertos;
- grafo de dependencias acíclico;
- ausencia de acceso arbitrario a internals;
- ausencia de acceso directo a persistencia ajena;
- ausencia de desplegables por módulo;
- ausencia de microservicios anticipatorios.

Un módulo del monolito no tiene que ser un package, workspace, repositorio o servicio. Un package es una unidad técnica; un módulo o bounded context es una frontera semántica, de propiedad y autoridad. No se consideran equivalentes.

## Workspaces

Los workspaces no son obligatorios para R0 mientras exista un solo proyecto ejecutable. Podrán incorporarse cuando exista al menos una de estas condiciones:

1. un segundo proyecto ejecutable expresamente autorizado;
2. un package compartido deliberado con consumidores reales;
3. una necesidad técnica comprobada que no pueda resolverse razonablemente dentro del proyecto existente.

Su adopción deberá registrar:

- problema que resuelve;
- proyectos participantes;
- propietario de cada unidad;
- package manager;
- lockfile;
- dirección de dependencias;
- comprobaciones mínimas;
- impacto de supply chain;
- impacto en CI;
- plan de adopción.

Los workspaces no autorizan por sí mismos nuevas superficies, aplicaciones, packages, desplegables, publicación, versionado independiente, caché u orquestación.

## Categorías conceptuales permitidas

El repositorio podrá contener, cuando estén autorizados:

- aplicación backend inicial;
- clientes aprobados por Producto y Arquitectura;
- herramientas internas controladas;
- packages compartidos deliberados;
- documentación;
- pruebas;
- fixtures;
- scripts operativos o de desarrollo controlados.

Estas categorías son conceptuales. Este ADR no define carpetas, nombres, scaffolding ni estructura física.

## Reglas para crear una aplicación

Toda aplicación nueva deberá contar con:

- superficie y audiencia aprobadas por Producto;
- necesidad que no pueda resolverse dentro de una aplicación existente;
- propietario;
- responsabilidad explícita;
- contratos definidos;
- determinación de si genera un artefacto o desplegable;
- evaluación de seguridad;
- tratamiento de tenant, sucursal, identidad y secretos;
- impacto operativo y de release;
- aprobación de Arquitectura + Ingeniería;
- revisión de Seguridad;
- revisión de Operaciones cuando afecte despliegue o ejecución.

Una aplicación nueva no puede duplicar lógica de dominio, acceder a internals de otra aplicación, introducir otro desplegable de forma implícita ni aparecer por previsión de crecimiento futuro.

## Reglas para crear un package

Un package compartido sólo podrá crearse cuando exista más de un consumidor real o un contrato público estable cuya separación esté justificada. Además deberá tener:

- propietario;
- propósito explícito;
- API pública;
- dirección de dependencia;
- consumidores identificados;
- pruebas propias;
- política de compatibilidad;
- ausencia de ciclos;
- justificación frente a mantener el código dentro del módulo propietario;
- revisión de los owners afectados.

No habrá una convención de “package por módulo”. Un package no se crea únicamente para ordenar carpetas, anticipar reutilización, preparar microservicios, aislar una función usada una sola vez, ocultar dependencias indebidas o compartir internals.

## Packages compartidos permitidos

Con justificación, consumidores y ownership podrán existir packages de:

- contratos públicos;
- tipos estables;
- validadores o esquemas explícitos;
- utilidades técnicas sin semántica de negocio;
- componentes de interfaz cuando exista un cliente autorizado;
- fixtures sintéticos controlados.

## Contenido compartido prohibido

No podrán compartirse como package transversal:

- entidades internas;
- agregados mutables;
- modelos de persistencia;
- servicios de aplicación;
- repositorios;
- lógica privada de dominio;
- detalles de framework;
- implementaciones de infraestructura;
- internals del contexto tenant;
- objetos empleados para evitar contratos formales;
- un ORM o acceso genérico que permita consultar datos de otros módulos;
- `common`, `shared` o equivalentes sin propietario y propósito delimitado.

## Dependencias

El repositorio deberá mantener un grafo explícito, dirigido, acíclico y verificable.

Son reglas obligatorias:

- los contratos no dependen de implementaciones;
- los packages compartidos no dependen de aplicaciones;
- los clientes no importan internals del servidor;
- un módulo no importa repositorios ni infraestructura de otro;
- las herramientas internas no son autoridad de reglas de negocio;
- el dominio no depende de framework, transporte o persistencia;
- las excepciones registran propietario, riesgo, alcance y condición de retiro.

Los cambios atómicos entre productor y consumidores están permitidos, pero no reducen la obligación de conservar compatibilidad, ownership y contratos explícitos.

## Ownership

Toda aplicación, package, herramienta y contrato deberá tener propietario. No podrá existir package huérfano, carpeta compartida sin owner, contrato sin responsable, dependencia cross-boundary sin revisión ni ownership técnico usado como autorización para modificar datos ajenos.

Un cambio que cruce fronteras requiere revisión de:

- owner productor;
- owners consumidores afectados;
- Arquitectura cuando cambie una frontera;
- Seguridad u Operaciones cuando corresponda.

La autoridad sobre datos y repositorios de persistencia continúa pendiente de `DEC-049`.

## Artefactos, versiones y despliegue

El repositorio único no implica múltiples artefactos. Para R0:

- existirá un solo artefacto backend;
- los futuros packages internos formarán parte del artefacto salvo decisión contraria;
- los packages internos no se publicarán por defecto;
- no existirá versionado independiente por defecto;
- no se creará un desplegable desde un package sin una decisión explícita.

Crear otro artefacto, desplegable, servicio o repositorio requiere una decisión arquitectónica adicional. [ADR-007](ADR-007-containerized-deployments.md) continúa `Proposed` y conserva autoridad sobre empaquetado, promoción y despliegue.

## Tooling deliberadamente diferido

ADR-009 no selecciona:

- pnpm;
- npm workspaces;
- Yarn;
- Turborepo;
- Nx;
- Changesets;
- semantic-release;
- registry;
- caché local o remota;
- runner de CI;
- herramienta de análisis arquitectónico;
- generador de código;
- estructura `apps/`;
- estructura `packages/`.

El primer scaffold ejecutable de Node.js requerirá package manager, lockfile, versión reproducible y controles mínimos de supply chain. Esa elección se registrará como baseline técnica reversible asociada a `DEC-004`, no como consecuencia automática de ADR-009.

## Enforcement

Sin seleccionar herramientas concretas, debe ser posible comprobar:

- imports inválidos;
- ciclos;
- violaciones entre capas;
- consumo de internals;
- ownership;
- packages sin consumidores;
- aplicaciones no autorizadas;
- desplegables no autorizados;
- excepciones vencidas o sin propietario.

Desde R0 serán obligatorias las convenciones documentadas, revisión de código, pruebas y evidencia de dependencias. La automatización podrá incorporarse progresivamente conforme a ADR-002, `DEC-005` y la estrategia de pruebas.

## Evolución gobernada

### Adoptar workspaces

Requiere varios proyectos reales o packages justificados y cumplir el registro definido en este ADR.

### Adoptar un orquestador

Requiere grafo real con varias unidades, costo relevante de build o pruebas, evidencia de beneficio y evaluación de complejidad, caché y secretos.

### Publicar un package

Requiere consumidor externo real, contrato público, política de compatibilidad, soporte, ownership, seguridad y operación.

### Separar un repositorio

Requiere evidencia de aislamiento de acceso, cadencia independiente, ownership organizacional, autonomía operativa, seguridad, cumplimiento o necesidad de permisos separados.

### Crear un desplegable o extraer un servicio

Requiere evidencia conforme a ADR-002 sobre escalado, resiliencia, seguridad, operación, cadencia, aislamiento y ownership independientes. El tamaño de una carpeta o módulo no constituye evidencia suficiente.

## Escenarios normativos

| Escenario | Resultado |
| --- | --- |
| Backend único y documentación en el mismo repositorio | Permitido |
| Package para una función usada una sola vez | Prohibido |
| Compartir entidad interna entre módulos | Prohibido |
| Package de contratos públicos | Permitido con condición |
| Package sin propietario | Prohibido |
| Import circular | Prohibido |
| Cliente web importando internals del backend | Prohibido |
| Módulo importando repositorio de otro módulo | Prohibido |
| Herramienta interna con lógica de negocio | Prohibido |
| Nueva aplicación sin superficie aprobada | Prohibido |
| Nuevo desplegable creado desde un package | Requiere decisión |
| Package interno publicado sin necesidad | Prohibido |
| Directorio `shared` sin reglas y owner | Prohibido |
| Fixtures comunes sintéticos | Permitido con condición |
| Migración futura a varios repositorios | Requiere decisión |
| Adopción posterior de Turborepo o equivalente | Requiere decisión |
| Cambio atómico entre backend y contrato | Permitido con condición |
| Package de UI sin cliente autorizado | Prohibido |
| Package de validadores con consumidores reales | Permitido con condición |
| Package ORM compartido entre módulos | Prohibido |
| Workspaces con un solo proyecto sin necesidad adicional | Prohibido |
| Segundo proyecto autorizado | Permite evaluar workspaces |
| Package por cada módulo del monolito | Prohibido |
| Microservicio anticipatorio | Prohibido |
| Separación por necesidad operativa demostrada | Requiere decisión |

## Autoridad

| Acción | Autoridad decisora | Revisión obligatoria |
| --- | --- | --- |
| Aceptar ADR-009 | Arquitectura + Ingeniería | Operaciones + Seguridad |
| Crear nueva aplicación | Producto + Arquitectura + Ingeniería | Seguridad; Operaciones si afecta ejecución |
| Crear package compartido | Arquitectura + Ingeniería + owners afectados | Seguridad cuando trate contratos sensibles |
| Publicar package | Arquitectura + Ingeniería + Operaciones | Seguridad; Producto si crea compromiso externo |
| Separar repositorio | Arquitectura + Ingeniería + Operaciones | Seguridad; Producto si afecta entrega |
| Introducir desplegable | Arquitectura + Ingeniería + Operaciones | Seguridad + Producto |
| Cambiar package manager | Ingeniería con validación de Arquitectura | Seguridad + Operaciones |
| Introducir orquestador | Arquitectura + Ingeniería + Operaciones | Seguridad si existe caché o credenciales |
| Aprobar dependencia excepcional | Arquitectura + Ingeniería + owners afectados | Seguridad u Operaciones según riesgo |

## Relación con DEC-005

ADR-009 no define estructura física, carpetas, capas, nombres, ubicación de módulos, bootstrap, convenciones de archivos, alias ni enforcement concreto. Todo ello permanece pendiente de `DEC-005`.

## Relación con DEC-049

ADR-009 no define repositorios de persistencia, puertos de datos, ORM, query builder, driver, adaptadores, ownership de tablas, acceso tenant-aware ni modificación de datos entre módulos. Todo ello permanece pendiente de `DEC-049`.

## Impacto en DEC-004

La aceptación de ADR-009 cierra dentro de `DEC-004` únicamente:

- repositorio único frente a múltiples repositorios;
- workspaces bajo demanda;
- categorías conceptuales de proyectos;
- reglas generales para aplicaciones y packages;
- principios de ownership y dependencias;
- relación entre repositorio y artefacto único.

`DEC-004` continúa abierta y pendiente de:

- selección de package manager;
- versión del package manager;
- política de lockfile;
- política de scripts de instalación;
- módulos y compilación TypeScript;
- baseline técnica integrada y ejecutable;
- primera ejecución real de CI Linux;
- reproducibilidad final entre Node.js 24.x, NestJS 11.x y PostgreSQL 18.x.

La aceptación de este ADR no cierra `DEC-004`, `DEC-005` ni `DEC-049`, no autoriza scaffolding y no desbloquea el primer cambio ejecutable de R0.

## Consecuencias positivas

- Conserva cambios atómicos y una única fuente documental.
- Mantiene mínima la complejidad de R0.
- Evita packages, workspaces y orquestación sin consumidores reales.
- Define condiciones verificables de evolución.
- Refuerza ownership y fronteras de ADR-002.
- Permite incorporar proyectos futuros sin comprometerlos anticipadamente.

## Consecuencias negativas y riesgos

- Adoptar workspaces posteriormente requerirá una reorganización controlada.
- Un repositorio único amplía visibilidad del código y necesita revisión de accesos.
- La atomicidad puede ocultar cambios incompatibles si no se mantienen contratos.
- Directorios `shared` o packages genéricos pueden erosionar ownership.
- La falta inicial de orquestación puede volver lineal el CI; sólo importa cuando exista evidencia de costo.
- Un package manager elegido después debe integrarse sin contradecir esta decisión.

## Criterios para reconsiderar

- Necesidad demostrada de permisos o aislamiento de acceso por repositorio.
- Equipos con ownership y cadencias realmente independientes.
- Requisitos regulatorios o de seguridad incompatibles con el repositorio único.
- CI o grafo de proyectos que haga necesaria otra topología.
- Consumidores externos que requieran publicación y versionado propios.
- Evidencia de que la evolución bajo demanda genera más riesgo que una separación explícita.

## Referencias

- [ADR-001 — TypeScript y Node.js](ADR-001-typescript-as-primary-language.md)
- [ADR-002 — Monolito modular](ADR-002-modular-monolith-first.md)
- [ADR-005 — Backend y API](ADR-005-nestjs-backend.md)
- [ADR-007 — Despliegues](ADR-007-containerized-deployments.md)
- [Baseline técnica de DEC-004](../../architecture-readiness/blocker-closure/DEC-004_BASELINE_TECNICA.md)
- [Arquitectura de aplicaciones](../../architecture/APPLICATION_ARCHITECTURE.md)
- [Arquitectura objetivo](../../architecture/TARGET_ARCHITECTURE.md)
- [Estrategia de versionado](../../delivery/VERSIONING_STRATEGY.md)
- [Estrategia de pruebas](../../quality/TESTING_STRATEGY.md)
- [PBI-010](../../backlog/pbis/PBI-010.md)

## Próxima revisión

Al autorizar un segundo proyecto, proponer el primer package compartido, adoptar workspaces u orquestación, publicar un package, crear otro artefacto/desplegable o considerar separar un repositorio. Toda revisión conserva las autoridades definidas en este ADR.
