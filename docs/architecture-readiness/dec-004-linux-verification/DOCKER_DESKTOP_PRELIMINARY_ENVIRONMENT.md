# DEC-004 — Autorización de Docker Desktop como entorno Linux preliminar

## Estado del documento

| Campo | Valor |
| --- | --- |
| Estado | `Preliminary Docker verification executed — Pass` |
| Naturaleza | Anexo operativo local y acotado |
| Host autorizado | macOS `26.5.1`, Apple Silicon `arm64` |
| Commit probado | `056e8695b9b7f1620ecade03081eaf2c824de4e6` |
| Plataforma solicitada | `linux/amd64` con GNU glibc, emulada mediante Docker Desktop |
| Ejecución VC-001 a VC-023 | Completada en dos contenedores independientes |
| Ratificación final | Linux `x86_64` nativo con GNU glibc |

## Relación con el runbook nativo

Este documento complementa la [autorización y runbook de VM efímera](EPHEMERAL_LINUX_VERIFICATION_RUNBOOK.md). No lo reemplaza: aquel documento conserva la ejecución autoritativa nativa y este anexo permite únicamente preparar y validar localmente el procedimiento bajo emulación `linux/amd64`.

No se crea un ADR ni una DEC porque no se selecciona una plataforma permanente. Docker Desktop no queda adoptado como infraestructura de production, staging, despliegue o CI.

## Autoridad y alcance

La autoridad aplicable de [DEC-004](../blocker-closure/DEC-004_BASELINE_TECNICA.md) es **Luis Antonio Gutiérrez Avilés, responsable del proyecto**, desde Arquitectura e Ingeniería. La instrucción que origina este anexo autoriza:

- instalar Docker Desktop localmente en esta Mac Apple Silicon;
- iniciar el daemon local sin habilitar Kubernetes ni funciones experimentales innecesarias;
- ejecutar una prueba básica ARM para confirmar funcionamiento;
- ejecutar una prueba `linux/amd64` con Debian y GNU glibc;
- comprobar aislamiento entre dos contenedores temporales independientes;
- construir la imagen reproducible de verificación;
- ejecutar VC-001 a VC-023 en dos contenedores independientes;
- retirar los recursos temporales creados por estas comprobaciones.

La autorización incorpora un Git bundle temporal como transporte de objetos del
SHA exacto. No incluye usar credenciales Git, modificar código técnico, usar
SSH, desplegar o acceder a infraestructura remota desde los contenedores.

## Autorización de transporte Git bundle

Se autoriza crear fuera del repositorio un bundle canónico que contenga
únicamente la referencia temporal al commit
`056e8695b9b7f1620ecade03081eaf2c824de4e6` y su historia necesaria. El bundle:

- es transporte temporal de objetos Git, no evidencia de ejecución por sí mismo;
- no contiene cambios rastreados o no rastreados ausentes del commit;
- no sustituye la comprobación del SHA ni el detached checkout;
- no permite usar una rama móvil como fuente de verificación;
- se verifica estructuralmente y por SHA-256 antes de usarlo;
- se copia físicamente dos veces y cada contenedor recibe sólo su copia;
- se monta como archivo de sólo lectura, nunca como working tree;
- no contiene ni requiere tokens, llaves SSH o credenciales locales;
- se elimina junto con sus copias al terminar;
- no convierte Docker Desktop emulado en Linux `x86_64` nativo.

## Clasificación de la evidencia

Docker Desktop local con `--platform linux/amd64` puede aportar evidencia **preliminar emulada** para:

- compatibilidad temprana con Linux;
- presencia de GNU glibc;
- instalaciones limpias;
- dos ejecuciones aisladas;
- comparación preliminar de inventarios y hashes;
- detección de problemas de arquitectura o tooling;
- preparación del procedimiento que se repetirá en el servidor o VM nativo.

No demuestra:

- ejecución sobre CPU física `x86_64`;
- reproducibilidad final en Linux `x86_64` nativo;
- sustitución definitiva del servidor o VM Linux;
- aprobación automática de VC-001 a VC-023;
- satisfacción de VC-024;
- resolución de DEC-051;
- selección de CI, production, staging o deploy.

El resultado se describe como **Linux amd64/glibc emulado mediante Docker Desktop sobre macOS arm64** y queda pendiente de ratificación nativa.

## Restricciones de seguridad

Todos los contenedores y futuras ejecuciones preliminares deberán operar:

- sin `--privileged`;
- sin montar `/var/run/docker.sock`;
- sin `--network host`;
- sin puertos publicados, salvo necesidad técnica futura justificada y documentada;
- sin secretos, archivos `.env`, cookies o datos reales;
- sin credenciales Git persistentes dentro de imágenes;
- sin copiar llaves SSH;
- sin production, staging, DB, redes privadas empresariales o servicios de negocio;
- sin volúmenes con información personal o persistencia innecesaria;
- sin montar el working tree actual como entrada de evidencia;
- con homes, stores pnpm, checkouts, `node_modules/` y `dist/` independientes;
- con eliminación de contenedores, volúmenes e imágenes temporales del ensayo al terminar.

El checkout se obtiene exclusivamente mediante `git clone` del bundle dentro de
cada contenedor. El remoto privado no se contacta desde Docker y no se provee
ninguna credencial. La red bridge se usa sólo para descargar dependencias
públicas durante la instalación frozen.

## Instalación autorizada

Con Homebrew disponible y Docker Desktop ausente, el método autorizado es el cask oficial de Homebrew. No se usa `sudo` con Homebrew. Si Docker Desktop solicita licencia, contraseña de macOS, aprobación de componentes privilegiados o ajustes iniciales, el proceso se detiene para acción expresa del usuario.

No se exige iniciar sesión en Docker Hub ni elegir una organización. No se habilita Kubernetes.

## Validaciones autorizadas

1. Confirmar CLI, daemon, Compose, Buildx y contexto activo.
2. Ejecutar una imagen Alpine ARM sólo como smoke del runtime; Alpine/musl no es válida para DEC-004.
3. Ejecutar Debian estable o Ubuntu LTS con `--platform linux/amd64`.
4. Confirmar kernel Linux, `uname -m`, GNU glibc y distribución.
5. Inspeccionar la imagen base por digest y registrar el digest de la imagen local de verificación.
6. Crear dos contenedores temporales sin working-tree mounts ni volúmenes; cada uno recibe únicamente su bundle read-only.
7. Inspeccionar que ambos estén sin privilegios, sin socket Docker, sin red host y sin puertos publicados.
8. Retirar todos los recursos temporales creados por estas comprobaciones.

## Estrategia de ejecución preliminar

### Imagen

Antes de producir evidencia preliminar VC, la imagen deberá fijarse por digest y usar Debian o Ubuntu con GNU glibc. Deberá contener o instalar exclusivamente:

- Git;
- certificados CA;
- cliente HTTPS como `curl` o equivalente;
- utilidades SHA-256;
- Node.js `24.18.0`;
- Corepack `0.35.0`;
- pnpm `11.15.1`;
- TypeScript local `6.0.3`, instalado desde el lockfile del proyecto.

La infraestructura mínima está en
[`tools/dec-004-verification/`](../../../tools/dec-004-verification/README.md).
No se creó `compose.yaml`, servicio de DB, red personalizada, puerto publicado,
volumen persistente, imagen productiva, pipeline CI ni archivo Kubernetes.

### Dos ejecuciones

Cada ejecución futura deberá:

1. comenzar en un contenedor limpio y distinto;
2. usar home y store pnpm propios;
3. verificar y clonar Git independientemente desde su copia del bundle;
4. hacer detached checkout de `056e8695b9b7f1620ecade03081eaf2c824de4e6`;
5. confirmar SHA, árbol limpio y ausencia de `node_modules/` y `dist/`;
6. instalar con `pnpm install --frozen-lockfile`;
7. ejecutar VC-001 a VC-023 conforme al [contrato canónico](../../decisions/dec-004-toolchain-contract/VERIFICATION_CONTRACT.md);
8. producir inventario normalizado y manifiesto SHA-256;
9. exportar únicamente evidencia sanitizada;
10. destruir el contenedor y cualquier recurso temporal asociado.

No se comparte home, store, cache de proyecto, checkout, `node_modules/`, `dist/` o salida de build entre ejecuciones. Los resultados conservarán clasificación preliminar emulada aunque sean idénticos.

## Registro de instalación y validación

Esta tabla se completa únicamente con observaciones reales de esta tarea:

| Campo | Resultado |
| --- | --- |
| Método de instalación | Homebrew cask oficial `docker-desktop` |
| Docker Desktop | `4.83.0` (`234302`) |
| Cliente / servidor | `29.6.2` / `29.6.2` |
| Compose | `v5.3.1` |
| Buildx | `v0.35.0-desktop.2` |
| Contexto activo | `desktop-linux` |
| Host | macOS Apple Silicon `arm64` |
| Docker VM | Linux `arm64` |
| Smoke ARM | `aarch64` con Alpine; sólo smoke, no evidencia DEC-004 |
| Prueba `linux/amd64` | Linux visible y emulado correctamente |
| Distribución | Debian GNU/Linux `12` Bookworm |
| `uname -m` del contenedor | `x86_64` |
| GNU glibc | `2.36` |
| Digest base | `sha256:7b140f374b289a7c2befc338f42ebe6441b7ea838a042bbd5acbfca6ec875818` |
| Digest imagen de verificación | `sha256:7c124d629e4f3de3eaddc46eb8431ae8f4d51fa1d05a7755a95664fe85228cd1` |
| Bundle SHA-256 | `872ee96304211f12021c8a8ba613000d665cdd4a9f1ccd9d21136786e5fbc927` |
| Aislamiento básico | Dos filesystems separados; sólo su bundle read-only; sin privileged ni puertos |
| Run 1 | Exit `0`; VC técnicos y build completados |
| Run 2 | Exit `0`; VC técnicos y build completados |
| Comparación | Inventarios, tamaños, modos, inputs y hashes `MATCH` |
| Limpieza | Contenedores y bundles eliminados; sin volúmenes ni redes propias |

### Bloqueo de autenticación anterior y resolución autorizada

El repositorio remoto exige autenticación. El primer contenedor alcanzó GitHub,
pero `git clone` terminó con exit `128` porque los prompts estaban deshabilitados.
No se leyó ni reutilizó una credencial local, no se copió una llave SSH, no se
incrustó un token y no se dejó material de autenticación en la imagen o la
evidencia. Conforme a la autorización, el segundo run y VC-002 a VC-023 se
detuvieron hasta que existiera un mecanismo temporal y seguro aprobado. Esta
tarea autoriza el bundle descrito arriba; el bloqueo anterior permanece como
evidencia histórica y no se reinterpreta como una ejecución completa.

## Estado de gobierno

| Elemento | Estado después de esta autorización |
| --- | --- |
| VC-001 a VC-023 | `Pass` técnico con autoridad preliminar emulada; ratificación nativa pendiente |
| VC-024 | `Pending` por DEC-051 |
| DEC-004 | `Accepted — Selection Approved / Evidence Pending` |
| PBI-021 | `Ready`, no `Done` |
| DEC-051 | `Propuesta`; runner, proveedor y CI sin seleccionar |
| Sprint 00 | Abierto |

La instalación o el smoke de Docker Desktop no modifican estos estados.

## Trazabilidad

- [PBI-021](../../backlog/pbis/PBI-021.md)
- [DEC-004](../blocker-closure/DEC-004_BASELINE_TECNICA.md)
- [Materialización](../dec-004-materialization/IMPLEMENTATION.md)
- [Evidencia diagnóstica macOS](../dec-004-materialization/EVIDENCE.md)
- [Resultado actual](../dec-004-materialization/RESULTS.md)
- [Revisión formal](../../decisions/dec-004-toolchain-contract/FORMAL_REVIEW.md)
- [Contrato VC-001 a VC-024](../../decisions/dec-004-toolchain-contract/VERIFICATION_CONTRACT.md)
- [DEC-051](../blocker-closure/INVENTARIO_DE_BLOQUEANTES.md)
- [Línea base de seguridad](../../architecture/SECURITY_BASELINE.md)

## Siguiente acción exacta

Continuar con la siguiente decisión o gate arquitectónico que impide iniciar R0,
manteniendo pendiente únicamente la ratificación nativa de DEC-004 y VC-024 por
DEC-051.
