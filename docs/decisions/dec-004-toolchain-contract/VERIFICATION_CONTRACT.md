# DEC-004 — Contrato de verificación futura

## Estado y propósito

Este documento define evidencia que deberá ejecutarse después de aceptar la selección y autorizar una baseline técnica. **No registra pruebas ejecutadas ni demuestra reproducibilidad.** DEC-051 decidirá runner, suites y gates generales; aquí sólo se establece la evidencia específica para verificar DEC-004.

## Capas de validación

| Capa | Puede demostrar | No puede demostrar |
| --- | --- | --- |
| Documental | Coherencia, alcance, alternativas, pins y comandos definidos | Compatibilidad o ejecución real |
| Local macOS | Onboarding y feedback del desarrollador | Reproducibilidad autoritativa ni producción |
| Linux autoritativo | Instalación/build/start repetibles sobre la plataforma acordada | Aislamiento, migraciones o release completo |
| CI posterior | Repetición automatizada, evidencia vinculada y enforcement | Aprobación de producción o DoD global |

## Precondiciones

- DEC-004 seleccionada explícitamente por su autoridad, sin afirmar todavía cumplimiento.
- Implementación autorizada y trazada a un PBI.
- Checkout limpio del commit candidato.
- Archivos de pinning, manifiesto, lockfile y configuración TypeScript versionados.
- NestJS `11.x` y referencia efectiva revalidados.
- Runner Linux conocido, aunque el proveedor de CI pertenezca a DEC-051.
- Ningún secreto ni acceso de producción.
- Los experimentos de SPIKE-009 no se copian ni cuentan como evidencia.

## Matriz obligatoria

| ID | Verificación | Procedimiento futuro | Resultado esperado | Evidencia |
| --- | --- | --- | --- | --- |
| VC-001 | Node.js exacto | Ejecutar comprobación de versión con el pin aprobado | Coincidencia exacta; otra major/minor/patch falla | Versión, plataforma y exit code |
| VC-002 | Rechazo de Node incompatible | Ejecutar preflight con Node.js `25.x` o valor controlado distinto | Falla antes de instalar/build/start; mensaje sin secretos | Log sanitizado y exit code no cero |
| VC-003 | pnpm exacto | Consultar binario y comprobar `packageManager`/engine | Coincidencia exacta | Versión y método de bootstrap |
| VC-004 | Rechazo de gestor/version incompatible | Intentar npm/Yarn u otra versión pnpm en entorno aislado | Falla sin crear lockfile alterno ni modificar el repo | Status y log sanitizado |
| VC-005 | Instalación desde clon limpio | Checkout nuevo + instalación congelada | Éxito sin modificar archivos rastreados | Commit, comandos, tiempos informativos y status |
| VC-006 | Lockfile congelado | Modificar sólo una copia temporal del manifest sin actualizar lockfile | Instalación rechazada; lockfile no regenerado | Diff temporal y exit code |
| VC-007 | Lockfile autoritativo | Buscar lockfiles y verificar integridad/formato esperado | Sólo `pnpm-lock.yaml` | Inventario y hash del lockfile |
| VC-008 | Sin globals implícitos | Ejecutar con PATH controlado que sólo exponga Node/pnpm fijados | Todos los comandos resuelven bins locales | PATH sanitizado y resolución de ejecutables |
| VC-009 | Scripts de dependencias | Incluir fixture/paquete de prueba controlado con lifecycle no aprobado | Script no ejecutado; allowlist ausente o efectiva | Log sin payload sensible |
| VC-010 | Typecheck | Ejecutar script canónico | Cero errores, cero emit | Log y verificación de ausencia de salida nueva |
| VC-011 | Typecheck negativo | Introducir error temporal controlado | Exit no cero y sin build utilizable | Log y cleanup del fixture temporal |
| VC-012 | Build limpio | Ejecutar clean + build desde checkout limpio | Sólo salida permitida en `dist/` | Inventario, hashes y status |
| VC-013 | ESM/NestJS | Arrancar shell compilado y cargar controllers/providers mínimos autorizados | Sin error de loader/decorators/metadata | Log de startup sanitizado |
| VC-014 | Artefacto compilado | Ejecutar `start` sin herramientas TypeScript globales | Arranca JavaScript de `dist/` | Comando, PID/exit y log |
| VC-015 | Producción no compila | Retirar fuente/herramientas dev del paquete de prueba autorizado | `start` funciona sólo con artefacto/deps runtime | Inventario del artefacto y smoke |
| VC-016 | Source maps | Provocar error controlado no sensible | Stack mapea a fuente sin servir maps ni incluir contenido inline | Stack sanitizado e inspección de maps |
| VC-017 | Variables válidas | Arrancar con conjunto mínimo válido | Inicio exitoso | Nombres de variables, nunca valores sensibles |
| VC-018 | Variables inválidas/ausentes | Omitir o alterar cada variable obligatoria | Fail closed antes de escuchar | Matriz variable/resultado sanitizada |
| VC-019 | Linux | Ejecutar VC-001 a VC-018 en Linux autoritativo | Todos los obligatorios pasan | OS, arch, libc y logs |
| VC-020 | Dos directorios limpios | Repetir install/typecheck/build en rutas independientes | Mismo inventario y SHA-256 de `dist/` | Dos manifiestos de hashes y comparación |
| VC-021 | Case sensitivity | Introducir import temporal con casing incorrecto | Typecheck/build Linux falla | Caso negativo y exit code |
| VC-022 | No mutación | Revisar Git después de install/verify/start | Ningún cambio rastreado o lockfile actualizado | `git status --short` |
| VC-023 | Comandos no interactivos | Ejecutar comandos canónicos sin TTY | Terminan y propagan exit code | Logs/exit codes |
| VC-024 | Repetición CI | Ejecutar gate dos veces desde entornos limpios | Ambos resultados equivalentes | IDs de ejecución y hashes |

## Contrato de comandos

La implementación futura debe ofrecer nombres estables:

```text
verify:toolchain
clean
typecheck
build
test
start
dev
verify
```

La instalación canónica es un comando del gestor, no un lifecycle script `install`:

```text
pnpm install --frozen-lockfile
```

Los ejemplos son contratos, no comandos ejecutados en esta tarea.

## Instalación desde clon limpio

La evidencia debe registrar:

1. commit exacto y árbol limpio inicial;
2. OS, arquitectura y libc;
3. Node.js y pnpm exactos;
4. hash del manifest y lockfile;
5. comando congelado;
6. salida sanitizada y exit code;
7. árbol limpio final;
8. inventario del grafo resuelto derivado del lockfile.

No se conservará home directory, token de registry, URL con credenciales, cache path sensible ni environment dump completo.

## Lockfile inconsistente

El caso negativo se ejecuta sólo en una copia temporal aislada:

- cambiar una dependencia ficticia o metadato relevante del manifest;
- no tocar el lockfile;
- ejecutar instalación congelada;
- exigir fallo;
- confirmar que el gestor no corrigió manifest/lockfile;
- destruir la copia temporal, no archivos del repositorio de trabajo.

Que el gestor regenere el lockfile y termine verde es `FAIL`.

## Typecheck y build

- `typecheck` usa el TypeScript local exacto y `--noEmit`.
- `build` parte de `dist/` ausente y usa `tsconfig.build.json`.
- cualquier diagnóstico TypeScript produce exit code no cero.
- no se permite transpile-only como build autoritativo.
- el build no descarga dependencias, actualiza lockfile, ejecuta migraciones ni conecta servicios externos.
- el resultado no contiene pruebas, fixtures, documentación, secretos, `.env`, caches ni archivos fuente TypeScript.

## Ejecución del artefacto

El smoke técnico futuro debe:

- iniciar con `NODE_ENV`, `HOST` y `PORT` controlados;
- ejecutar `node --enable-source-maps` contra el entrypoint compilado;
- comprobar que el listener abre y responde a un health mínimo cuando éste sea autorizado;
- enviar SIGTERM y confirmar cierre del listener sin handles residuales;
- no requerir TypeScript, IDE, watcher o Nest CLI en runtime;
- no contactar producción, migrar DB ni usar datos reales.

Los detalles de health/lifecycle deben respetar ADR-005 y no sustituyen DEC-044 o DEC-051.

## Ausencia de dependencias globales implícitas

La prueba debe demostrar que:

- `tsc` se resuelve desde el proyecto;
- ningún script invoca `nest`, `tsx`, `ts-node`, formatter o test runner global;
- pnpm es la única excepción de bootstrap y su versión se verifica antes de uso;
- el build funciona con home temporal y PATH mínimo;
- el IDE cerrado no altera el resultado.

## Dos builds independientes

1. Crear dos directorios nuevos desde el mismo commit.
2. Usar el mismo runner Linux limpio, sin compartir `node_modules`.
3. Permitir cache de descargas sólo si se verifica integridad y no se comparte salida construida.
4. Instalar con frozen lockfile.
5. Ejecutar `verify`.
6. Generar inventario relativo ordenado de `dist/`.
7. Calcular SHA-256 por archivo.
8. Comparar inventarios y hashes.
9. Registrar cualquier diferencia; timestamps y permisos no se incluyen en hashes de contenido, pero los permisos ejecutables requeridos sí se validan aparte.

Una segunda ejecución en el mismo directorio no satisface VC-020.

## Evidencia a conservar

- commit, rama y estado Git;
- versiones exactas de Node.js, pnpm, TypeScript y NestJS;
- OS, kernel, arquitectura y libc sin datos de usuario innecesarios;
- hashes de manifest, lockfile y configuraciones;
- comandos canónicos y exit codes;
- logs sanitizados;
- inventario y hashes de `dist/` para ambos builds;
- resultado de casos negativos;
- duración sólo como dato diagnóstico, no criterio sin SLO;
- IDs de CI cuando DEC-051 adopte la plataforma;
- aprobaciones y riesgos residuales.

No se conservan tokens, secretos, passwords, connection strings, variables completas ni rutas personales cuando puedan normalizarse.

## Estados

### PASS

- todas las validaciones obligatorias documentales y Linux pasan;
- dos directorios limpios producen hashes iguales;
- casos negativos fallan como se espera;
- no hay globals, lockfiles alternos, mutaciones ni scripts no autorizados;
- NestJS/ESM/TypeScript efectivo inicia y cierra correctamente;
- evidencia completa y revisada por Arquitectura, Ingeniería, Seguridad, Operaciones y Calidad según autoridad.

### CONDITIONAL PASS

- la selección funciona, pero queda una limitación no crítica explícita;
- macOS pasa y Linux todavía no se ejecuta;
- los hashes difieren únicamente por una causa entendida, no riesgosa, con remediación y autoridad pendientes;
- una revisión obligatoria no bloqueante está pendiente.

`CONDITIONAL PASS` no cierra reproducibilidad ni autoriza declarar DEC-004 cumplida.

### FAIL

- versión incorrecta no se rechaza;
- instalación frozen modifica o regenera lockfile;
- build depende de globals, red no declarada, cache de salida o IDE;
- falla ESM/NestJS/TypeScript;
- artefacto no inicia o compila en producción;
- hashes de contenido difieren sin explicación aceptable;
- el gate sólo se ejecuta en macOS;
- se filtran secretos o se requieren decisiones no autorizadas.

## Relación con CI y decisiones posteriores

- DEC-004 define **qué evidencia de toolchain** debe ejecutarse.
- DEC-051 define runner, proveedor, frecuencia, suites, cobertura y gate canónico.
- DEC-063 define cuándo la evidencia permite declarar terminado un cambio.
- ADR-007 define empaquetado/promoción si se acepta; un contenedor no es requisito de este contrato.
- DEC-049/050 añadirán PostgreSQL y migraciones a la matriz sin reescribir las pruebas puras de toolchain.

## Validación documental realizada ahora

En esta tarea sólo corresponde verificar:

- presencia de secciones exigidas;
- coherencia con ADR aceptados;
- enlaces relativos;
- whitespace y fences Markdown;
- ausencia de archivos ejecutables o configuración real.

No corresponde marcar VC-001 a VC-024 como ejecutadas.
