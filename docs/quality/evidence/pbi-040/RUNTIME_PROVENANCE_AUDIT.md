# PBI-040 — Runtime Provenance and PBI-039 Visual Baseline Audit

## Veredicto

**PASS sujeto al reinicio gobernado final del candidato documentado.** La UI
desplegada en Preview proviene exactamente de `0d1c5760ce962d17a8292b841f5de43a8cb453a7`.
Ese commit contiene los merges #42 y #43, integra el hotfix de runtime mediante
PR #44 y es padre directo de la baseline documental #45
`40684d7554cdf02551f941e5e3f0beabbe563125`.

La comparación anterior de blobs era correcta pero incompleta: no identificaba
el proceso ni el build que veía el navegador. Esta auditoría añadió una prueba
runtime contra runtime con el mismo read model y un contrato permanente para
que frontend y backend publiquen y validen su SHA sin exponer paths, branch,
datos de negocio o secretos.

No se modificó funcionalidad de Lista de precios, Repairs ni otro dominio.

## 1. Identidad exacta de Preview

| Evidencia | Resultado observado |
|---|---|
| Checkout operativo de Dokploy | `/etc/dokploy/applications/srtaller-app-nvpkjj/code` |
| Branch / HEAD del checkout | `main` / `0d1c5760ce962d17a8292b841f5de43a8cb453a7` |
| Container | `4dcd2beabe4e…`, creado `2026-09-11T16:10:46Z` |
| Imagen | `srtaller-app-nvpkjj:latest`, ID `sha256:42254c98ec016056dfbe8e2e1904e5e96f9a5091553e4a758807074806e579ef` |
| Inicio del build | checkout clonado a las `2026-09-11T16:09:57Z`; imagen creada `16:10:39Z` |
| HTML | `index.html`, SHA-256 `7cded9ca1fd8b77d5e0c1ae082eee8a2050594a3260202ba292650bc35c5fb71` |
| JS principal | `index-DS8bXBDs.js`, SHA-256 `d53e534649f5019b20bb5d4507ab64be18882d006b64365a662f13200f2fefa1` |
| CSS principal | `index-Bvx2xg7B.css`, SHA-256 `ecf01cb45a2cd54332c8d08d8a6e20540e6ce3b05c10e602b3571da3f106024f` |
| Backend entry | `dist/main.js`, SHA-256 `c3c05542f9a1ddbb97fdacae17518cc5a4f8483ab268a3e02e0d117458823bcc` |

Un worktree temporal limpio en el commit `0d1c576…`, construido con Node
`24.18.0` y pnpm `11.15.1`, produjo exactamente los mismos nombres y hashes de
HTML/JS/CSS que las respuestas descargadas de Preview. No fue una inferencia
por nombre de PR ni sólo una comparación de source.

Genealogía real:

| Hito | SHA | Relación con Preview |
|---|---|---|
| PR #42 | `6c04e57c8a5d3bf8600cd4a2a3a191958aa0f0c2` | ancestro |
| PR #43 | `5ccc525a09d29fd6dcabbbfaabff9b811677c985` | ancestro directo antes del hotfix de runtime |
| PR #44 | `0d1c5760ce962d17a8292b841f5de43a8cb453a7` | commit exacto desplegado |
| PR #45 | `40684d7554cdf02551f941e5e3f0beabbe563125` | hijo documental de Preview; `main`/`origin/main` actual |

## 2. Identidad local antes de remediar

| Runtime | Proceso y fecha | CWD/worktree | Identidad demostrable |
|---|---|---|---|
| Frontend `127.0.0.1:4173` | Vite PID `47961`, iniciado `2026-09-08 16:57:56` | `apps/dev-preview-web` del worktree `feature/pbi-040-catalog-pricing-core` | el módulo transformado de Repair Detail correspondía al working tree en `1487dcfaf8e1c274593bf41051c72b17ae423ae6`, pero el proceso no publicaba SHA; no era posible probar automáticamente qué revisión veía una pestaña ya cargada |
| Backend `127.0.0.1:3000` | Node PID `59506`, iniciado `2026-09-11 21:36:22` | raíz del mismo worktree/branch | ejecutaba `dist` emitido `2026-09-11 21:35:45`; pertenecía al candidato PBI-040 de ese checkout |

No había listeners alternos en `3000`/`4173`, otro Vite activo, otro backend
activo ni worktree oculto sirviendo esos puertos. Sí existía una asimetría de
lifecycle: el frontend llevaba varios días vivo y el backend se había
reconstruido/reiniciado después. Éste era un riesgo real de runtime stale aunque
la petición directa al módulo Vite devolvía source actual.

El build producido durante la auditoría desde `1487dcf…` generó
`index-CxVd27r4.js` y `index-HgGiKGH9.css`; no coincidía por diseño con Preview
porque incluye las adiciones legítimas de PBI-040. El bundle sí contiene el
material vigente de `RepairDetailPage`. Vite no emitió source maps públicos;
el backend conserva source maps compilados sólo en `dist`.

## 3. Cache y SPA

- Preview responde el entrypoint HTML con `Cache-Control: no-store` y ETag
  derivado de su contenido, conforme al hotfix PR #43.
- Los assets JS/CSS tienen nombre content-hashed y `max-age=0` en el runtime
  observado.
- Vite local responde HTML y módulos con `no-cache`.
- El perfil de QA inspeccionado no tenía Service Workers registrados ni
  entradas en Cache Storage.
- No se borró ni reemplazó la sesión Owner. Un segundo perfil no pudo abrir otra
  Operational Session por la restricción vigente de sesión/Station; se usó
  interceptación de red aislada para la comparación sin tocar PostgreSQL.

No hay evidencia de un Service Worker o Cache Storage reteniendo PBI-039. La
pestaña y el proceso Vite longevos sí impedían demostrar procedencia; el nuevo
launcher elimina esa ambigüedad.

## 4. Comparación runtime contra runtime con datos controlados

Se sirvió el build exacto y byte-identical de Preview `0d1c576…` en un puerto
loopback temporal y se comparó con Vite local. En ambos navegadores se interceptó
únicamente el read model de sesión/Repair con la misma identidad y payload
sintético completo. No se compararon dos Repairs distintas ni se escribieron
fixtures en Preview.

| Superficie PBI-039 | Preview exacto `0d1c576…` | Local PBI-040 | Resultado |
|---|---|---|---|
| Header | identidad/equipo, recepción, promesa, presupuesto, estado, técnico, custodia y ubicación | mismos campos y orden | Igual |
| Recepción | problema/contexto, relato, clasificación, estado físico, equipo recibido, Tipo, IMEI/serie, SIM, memoria, acceso, condiciones especiales y recibido por | mismos campos y orden | Igual |
| Historial | compositor arriba, cronología, evento de recepción, timestamp, actor, notas/markers y empty state | misma jerarquía | Igual |
| Conceptos | placeholder final aceptado | mismo placeholder | Igual |
| Evidencias | superficie separada | misma superficie separada | Igual |
| Shell | navegación existente | añade únicamente `Listas` autorizada por PBI-040 | Diferencia legítima PBI-040 |

Ambos documentos tuvieron cero overflow horizontal a 1440 px. Las capturas
temporales fueron `srtaller-preview-baseline-repair-detail.png` y
`srtaller-current-local-repair-detail.png`; su valor es evidencia de ejecución
local, no aceptación humana.

## 5. Diferencia de datos observada

Preview contiene una Repair sintética `SR-2026-1000` con read model escaso:
Tipo ausente, identificador no disponible, SIM/memoria falsas, sin relato,
presupuesto ni promesa, dos eventos y cero evidencias. Local contiene 15 Repairs
históricas; `SR-2026-003` materializa relato, estado físico, riesgo, técnico,
ubicación, seis eventos y cinco evidencias.

Por tanto, dos pantallas con Repairs distintas ocultan o muestran secciones
condicionales distintas aunque ejecuten el mismo componente. La comparación
controlada prueba que la diferencia visual reportada no es pérdida del
componente PBI-039. La auditoría anterior invirtió esta explicación al describir
Local como el registro escaso y Preview como el enriquecido; queda corregida.

## 6. Causa raíz

1. El dictamen anterior protegía ancestry y blobs, pero no enlazaba pestaña,
   proceso, build, backend y checkout.
2. El Vite local era un proceso longevo sin manifest de SHA; frontend y backend
   no podían demostrar automáticamente que pertenecían al mismo candidato.
3. La comparación visual original usó Repairs con densidad de datos distinta.
4. No apareció una divergencia real del source o componente Repair Detail.

## 7. Corrección operativa

- detener sólo los PIDs/árboles locales identificados;
- regenerar `dist` con la toolchain gobernada;
- reiniciar frontend/backend desde el worktree autorizado;
- comprobar que manifest frontend, headers backend y `git HEAD/status`
  coinciden antes de declarar el runtime listo;
- dejar el navegador en la Repair local rica sin eliminar la sesión Owner.

El SHA final se consulta directamente con:

```sh
./scripts/pnpm-governed run verify:runtime-provenance
```

## 8. Guard permanente

1. `local:dev` y `local:backend` inyectan el SHA/estado obtenido del worktree.
2. Vite sirve `/runtime-provenance.json` con rol, SHA y `clean|dirty`, y lo
   emite también en el build productivo.
3. Nest sirve la misma identidad en headers acotados de todas sus respuestas;
   `/readyz` es la prueba canónica del backend.
4. `local:dev` espera ambos runtimes y termina fail-closed si alguno difiere del
   worktree o del otro.
5. El Dockerfile exige `SR_BUILD_GIT_SHA`, lo graba en frontend/backend y en la
   label OCI `org.opencontainers.image.revision`; un build sin SHA exacto falla.
6. El verificador OCI comprueba label, environment, manifest y headers contra
   una sola revisión.
7. El baseline guard conserva los 16 blobs y ahora registra por separado que
   el SHA materializado de Preview `0d1c576…` es ancestro de la baseline
   integrada/documental `40684d7554…`.

La respuesta pública queda limitada a una revisión Git de 40 hex, estado y rol.
No publica branch, cwd, nombres de host, variables, datos ni secretos. Un
runtime histórico como el Preview actual, construido antes de este guard, debe
identificarse mediante el checkout/artefacto del deploy; el próximo build
autorizado deberá materializar el contrato nuevo.

## 9. Límites

- no se desplegó ni modificó Preview;
- no se cambió Product, Pricing, Catalog ni Repairs;
- no se inició PBI-041/PBI-042;
- no hubo push, PR, merge, release ni Owner Acceptance;
- el guard no convierte Local en CI ni autoriza un deployment.
