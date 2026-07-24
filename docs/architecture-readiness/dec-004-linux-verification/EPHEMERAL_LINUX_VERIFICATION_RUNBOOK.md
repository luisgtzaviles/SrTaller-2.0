# DEC-004 — Autorización y runbook de verificación Linux efímera

## Estado del documento

| Campo | Valor |
| --- | --- |
| Estado | `Approved for one manual execution — Not executed` |
| Naturaleza | Autorización operativa puntual y runbook de preparación |
| Decisión verificada | [DEC-004](../blocker-closure/DEC-004_BASELINE_TECNICA.md) |
| PBI | [PBI-021](../../backlog/pbis/PBI-021.md) |
| Commit inmutable | `056e8695b9b7f1620ecade03081eaf2c824de4e6` |
| Ambiente permitido | VM Linux efímera, manual, aislada de local, staging y production |
| Fecha de autorización documental | 2026-07-22 |
| Ejecución real | No iniciada |

## Decisión de formato

Esta autorización se registra como un runbook específico bajo el paquete de verificación de DEC-004 porque prepara una operación puntual, repetible y destruible. Sigue la [plantilla de runbook](../../operations/RUNBOOK_TEMPLATE.md) y no modifica el alcance ni la definición de terminado de PBI-021.

No se crea un ADR ni una DEC nueva: no se selecciona arquitectura permanente, proveedor, plataforma de despliegue, contenedor, CI o mecanismo general de pruebas. Tampoco se incorpora como sección de PBI-021 porque ese PBI ya es la fuente canónica del alcance y de VC-001 a VC-024; duplicar allí el procedimiento operativo mezclaría gobierno de producto con una ejecución efímera.

## Autorización y autoridad

La autoridad aplicable de DEC-004 es **Luis Antonio Gutiérrez Avilés, responsable del proyecto**, desde las funciones conjuntas de Arquitectura e Ingeniería, conforme al registro canónico. Esta autorización permite exclusivamente aprovisionar y destruir una VM efímera para una ejecución manual de VC-001 a VC-023 sobre el commit fijado.

Antes de aprovisionar, el registro de ejecución deberá identificar con datos reales:

- quién autorizó la creación puntual de la VM;
- quién ejecutará el runbook;
- fecha y ventana de ejecución;
- mecanismo aprobado para conservar la evidencia sanitizada.

No se inventan en este documento firmas, identidades adicionales ni aprobaciones de evidencia. Seguridad, Operaciones y Calidad deberán revisar los resultados reales después de la ejecución; esos vistos buenos no se consideran otorgados por esta autorización.

## Separación de alcance

Esta autorización:

- cubre una ejecución manual, puntual y no recurrente;
- autoriza una VM efímera únicamente para verificar DEC-004;
- no selecciona proveedor, región o plataforma permanente;
- no selecciona proveedor, runner, suite o gate de CI;
- no crea pipeline ni workflow;
- no materializa DEC-051 ni satisface VC-024;
- no autoriza Docker, contenedores o infraestructura persistente;
- no autoriza staging, production, deploy ni promoción;
- no autoriza bases de datos, SQL, migraciones o datos de negocio;
- no autoriza credenciales productivas ni secretos de negocio;
- no autoriza funcionalidad, correcciones técnicas o cambios al commit probado.

## Entorno autorizado

La ejecución sólo es válida si la VM cumple todos estos requisitos:

| Área | Requisito obligatorio |
| --- | --- |
| Sistema operativo | Distribución Ubuntu o Debian soportada y registrada con versión exacta |
| Kernel | Linux; versión registrada en evidencia |
| Arquitectura | `x86_64` |
| libc | GNU glibc; musl/Alpine no son válidos |
| Lifecycle | Efímero: crear para el ensayo y destruir al concluir o abortar |
| CPU | Mínimo 2 vCPU |
| Memoria | Mínimo 4 GiB RAM |
| Almacenamiento | Mínimo 20 GiB temporal |
| Red entrante | Ningún servicio público; sólo SSH restringido si resulta necesario |
| Red saliente | HTTPS limitado a Git, distribución aprobada de Node.js y registry de dependencias |
| Herramientas | Git, shell POSIX compatible y utilidades SHA-256 |
| Reloj | UTC funcional y sincronizado |
| Toolchain | Node.js `24.18.0`, Corepack registrado, pnpm `11.15.1`, TypeScript local `6.0.3` |

Una capacidad superior es aceptable, pero no es necesaria ni aumenta la validez del ensayo. La ejecución debe detenerse si el sistema no reporta Linux, `x86_64` y GNU glibc o si la distribución usa musl.

## Aislamiento

La VM deberá:

- pertenecer a un contexto temporal separado de production y staging;
- carecer de conectividad a bases de datos, storage, colas, integraciones o redes privadas de SR Taller;
- no recibir variables, snapshots, backups ni datos de otros ambientes;
- no reutilizar credenciales de local, staging o production;
- no alojar servicios entrantes públicos;
- no ejecutar agentes, runners o pipelines permanentes;
- usar almacenamiento temporal sin persistencia posterior al cierre;
- conservar sólo la evidencia sanitizada extraída mediante el canal autorizado.

Si se descubre acceso a production, staging, datos reales o una red privada no prevista, la ejecución se detiene y el recurso se aísla antes de continuar con cualquier análisis.

## Control de acceso y secretos

- El acceso se limita al responsable de ejecución registrado.
- La autenticación administrativa usa una credencial temporal basada en llave.
- La llave privada permanece únicamente bajo control del ejecutor; nunca se copia al repositorio, a la VM como archivo reutilizable ni a la evidencia.
- No se usa una contraseña reutilizada ni una credencial de otro ambiente.
- La parte pública o autorización temporal se retira al terminar.
- Tokens de Git o registry sólo pueden usarse si son imprescindibles, temporales, de mínimo privilegio y nunca aparecen en comandos conservados, logs o documentos.
- Se prefieren fuentes públicas y autenticación sin secretos cuando el repositorio y los paquetes lo permitan.
- No se leen ni copian archivos `.env`, llaves, configuraciones productivas o credenciales de negocio.
- El registro final identifica autorizador y ejecutor reales, pero no conserva material de autenticación.

## Precondiciones

Antes de crear la VM:

- [ ] La autorización puntual sigue vigente y el autorizador real está registrado.
- [ ] El ejecutor real y la ventana están registrados.
- [ ] El commit objetivo sigue disponible e inmutable.
- [ ] La ubicación autorizada para evidencia sanitizada está definida.
- [ ] No se ha seleccionado ni configurado CI.
- [ ] VC-024 permanece `Pending` hasta materializar DEC051-C01/C07.
- [ ] No se requiere acceso a production, staging, DB o datos reales.
- [ ] Existe un procedimiento aprobado para revocar acceso y destruir el recurso.

## Secuencia autorizada de ejecución

1. Crear manualmente una VM efímera con las características de este runbook.
2. Registrar distribución, kernel, `x86_64`, GNU glibc y timestamp UTC antes de instalar dependencias.
3. Instalar únicamente Git, utilidades SHA-256 y la toolchain exacta desde procedencia aprobada.
4. Crear el checkout 1 mediante un clon Git independiente.
5. Crear el checkout 2 mediante otro clon Git independiente; no copiar el checkout 1.
6. Hacer checkout detached de `056e8695b9b7f1620ecade03081eaf2c824de4e6` en ambos y confirmar SHA, árbol limpio y ausencia de `node_modules/` y `dist/`.
7. Ejecutar VC-001 a VC-023 conforme al [contrato de verificación](../../decisions/dec-004-toolchain-contract/VERIFICATION_CONTRACT.md), sin modificar el commit para obtener resultados favorables.
8. Generar por checkout inventario normalizado y manifiesto SHA-256 ordenado de `dist/`.
9. Comparar nombres, cantidades, tamaños, contenido, source maps y SHA-256 de ambos builds; registrar cualquier diferencia sin normalizarla silenciosamente.
10. Sanitizar comandos, códigos de salida, logs, inventarios y hallazgos.
11. Extraer únicamente la evidencia autorizada y verificar que no contiene secretos ni rutas personales innecesarias.
12. Revocar la credencial temporal y destruir la VM y su almacenamiento temporal.
13. Registrar fecha UTC, responsable y confirmación observable de destrucción, sin guardar identificadores sensibles innecesarios.
14. Someter la evidencia a revisión de Seguridad, Operaciones y Calidad y conservar sus resultados reales.

## Independencia de los dos checkouts

Cada checkout deberá:

- obtenerse directamente desde Git;
- quedar detached en el SHA exacto;
- comenzar limpio y sin `node_modules/` o `dist/`;
- usar directorio, home temporal y store de pnpm independientes;
- instalar con `pnpm install --frozen-lockfile` de forma independiente;
- ejecutar los comandos canónicos sin TTY, IDE o herramientas globales no verificadas;
- conservar estado Git inicial y final;
- no consumir salida, cache de build o archivos generados por el otro checkout.

No se permite crear un checkout copiando el otro. Una caché de descargas compartida tampoco se usará en esta ejecución puntual; esta decisión acotada elimina ambigüedad sobre independencia y no establece una política permanente.

## Política de evidencia

La evidencia real se incorporará después de la ejecución bajo este mismo directorio, sin sobrescribir la evidencia histórica macOS. Deberá incluir como mínimo:

- distribución y versión;
- kernel;
- arquitectura;
- implementación y versión de libc;
- timestamp UTC;
- SHA Git exacto por checkout;
- estado Git inicial y final;
- Node.js, Corepack, pnpm y TypeScript;
- comandos sanitizados y códigos de salida;
- resultado individual de VC-001 a VC-023;
- inventario normalizado y ordenado de cada `dist/`;
- SHA-256 por archivo y comparación entre builds;
- inspección de source maps, rutas embebidas y timestamps no deterministas;
- diferencias, fallos y limitaciones sin ocultarlos;
- revisión de ausencia de secretos;
- revocación de acceso y destrucción del entorno.

La estructura esperada después de una ejecución real es:

```text
ENVIRONMENT.md
RUN-1.md
RUN-2.md
COMPARISON.md
VC-RESULTS.md
RESULTS.md
linux-build-1.sha256
linux-build-2.sha256
linux-build-1.inventory
linux-build-2.inventory
```

No se conserva:

- llave privada, token, contraseña o credencial;
- IP o identificador del recurso cuando no sean necesarios;
- nombre real del home o ruta personal;
- contenido de `.env` o dump de variables;
- cache, `node_modules/` o store de pnpm;
- contenido completo de `dist/`, salvo excepción justificada y revisada;
- logs redundantes, payloads o URLs con credenciales.

## Condiciones de paro

Detener la ejecución sin corregir el commit si:

- la plataforma no es Linux `x86_64` con GNU glibc;
- el SHA, pins o toolchain no coinciden;
- un checkout no comienza limpio o comparte salida/instalación;
- aparece acceso a staging, production, DB o datos reales;
- un comando solicita o revela un secreto;
- la instalación frozen modifica archivos rastreados;
- un caso negativo no falla según el contrato;
- los builds difieren sin explicación aceptada;
- no puede demostrarse la posterior revocación y destrucción.

El resultado se registra como `Fail` o `Blocked` según el contrato; no se cambia código, versión, lockfile, ESM o tooling para forzar éxito.

## Destrucción y cierre

Después de extraer y revisar la evidencia sanitizada:

- revocar la llave pública o autorización temporal;
- terminar la VM mediante el mecanismo manual aprobado;
- eliminar su almacenamiento temporal y snapshots, si existieran;
- comprobar desde el plano de control autorizado que el recurso ya no está activo;
- registrar timestamp UTC, ejecutor y resultado de la destrucción;
- confirmar que no permanecen IP, disco, snapshot, credencial o servicio facturable asociados al ensayo;
- conservar sólo los documentos y manifiestos permitidos.

Si la ejecución aborta, se aplica la misma política de revocación y destrucción antes de cerrar el intento.

## Estado de verificaciones y gobierno

Esta autorización no convierte ninguna prueba en ejecutada:

| Elemento | Estado después de esta autorización |
| --- | --- |
| VC-001 a VC-023 | `Blocked` hasta ejecución Linux real |
| VC-024 | `Pending` por materialización/evidencia de DEC051-C01/C07 |
| DEC-004 | `Accepted — Selection Approved / Evidence Pending` |
| PBI-021 | No `Done` |
| Sprint 00 | Abierto |
| Funcionalidad de R0 | No autorizada |

[DEC-051](../../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md)
está `Accepted`. La decisión define runner base, frecuencia, suites, cobertura
por riesgo y gates generales de CI sin seleccionar proveedor; C01 a C10 siguen
pendientes. La VM
manual no es CI, no satisface VC-024 y no crea precedente de plataforma
permanente.

## Revisiones posteriores

Después de la ejecución real:

- Seguridad revisará procedencia, lifecycle scripts, credenciales, sanitización y destrucción;
- Operaciones revisará plataforma, aislamiento, lifecycle del recurso, artefacto y repetibilidad;
- Calidad revisará cobertura VC-001 a VC-023, casos negativos, independencia, hashes y completitud;
- Arquitectura e Ingeniería emitirán la recomendación técnica aplicable sin cerrar automáticamente DEC-004.

La ausencia de cualquiera de estas revisiones se registra como bloqueo o condición; nunca se convierte en aprobación implícita.

## Trazabilidad

- [PBI-021](../../backlog/pbis/PBI-021.md)
- [DEC-004](../blocker-closure/DEC-004_BASELINE_TECNICA.md)
- [Implementación materializada](../dec-004-materialization/IMPLEMENTATION.md)
- [Evidencia diagnóstica macOS](../dec-004-materialization/EVIDENCE.md)
- [Resultado actual](../dec-004-materialization/RESULTS.md)
- [Revisión formal de DEC-004](../../decisions/dec-004-toolchain-contract/FORMAL_REVIEW.md)
- [Contrato VC-001 a VC-024](../../decisions/dec-004-toolchain-contract/VERIFICATION_CONTRACT.md)
- [Estrategia de pruebas](../../quality/TESTING_STRATEGY.md)
- [Ambientes](../../delivery/ENVIRONMENTS.md)
- [Línea base de seguridad](../../architecture/SECURITY_BASELINE.md)

## Resultado de esta preparación

La VM efímera manual queda autorizada bajo estas condiciones. No ha sido aprovisionada y ningún VC ha sido ejecutado.

## Siguiente acción exacta

Aprovisionar manualmente una VM efímera conforme a esta autorización y ejecutar VC-001 a VC-023 sobre dos clones independientes del SHA publicado.
