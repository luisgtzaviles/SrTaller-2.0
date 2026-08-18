# Evidencia — baseline OCI app-only y salud

## Estado y alcance

- Fecha de ejecución: `2026-08-18`.
- Rama local: `ops/first-oci-health`.
- Commit de implementación verificado: `1dd499e6270bc780a793a6c71d567a7c1d3d718d`.
- Resultado: `PASS` para construcción y ejecución OCI local del backend único.
- Límite: no se publicó imagen, no se usó registry, SSH o Dokploy y no se creó ni conectó PostgreSQL, Redis, WAHA u otro servicio.

## Artefacto construido

- Base Linux/glibc: `node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d`.
- Toolchain de build: Node.js `24.18.0`, pnpm `11.15.1`, `pnpm install --frozen-lockfile` y `pnpm run build`.
- Plataforma local observada: `linux/arm64`.
- Image ID local reproducible: `sha256:7b909cc8863f9c4fd0baeb52ecc8d9fae144073128e1dd69f4746d0c14fdb4a7`.
- Tamaño local: `82,735,047` bytes.
- Runtime declarado: usuario `node`, UID/GID efectivo `1000:1000`, entrada `node --enable-source-maps dist/main.js`.
- Contenido raíz de `/app`: sólo `dist`, `node_modules` y `package.json`.
- La migración compilada `20260725183832_database_create_tenants_and_branches.js` está presente.
- TypeScript, tipos de desarrollo, código fuente, tests, documentación, herramientas, `.git` y `.env` están ausentes del runtime.

## Construcción reproducible

Se ejecutaron dos builds secuenciales e independientes con:

```sh
docker build --no-cache --provenance=false \
  --build-arg SOURCE_DATE_EPOCH=0 \
  --tag srtaller-2:oci-ready-N .
```

Ambos produjeron exactamente:

```text
sha256:7b909cc8863f9c4fd0baeb52ecc8d9fae144073128e1dd69f4746d0c14fdb4a7
82,735,047 bytes
linux/arm64
created=1970-01-01T00:00:00Z
```

La normalización incluye los metadatos temporales de pnpm, mtimes, orden del tar de runtime, ownership y mtime de `/app`.

## Contratos HTTP y lifecycle

| Comprobación | Resultado |
| --- | --- |
| `GET /livez` | `200 {"status":"live"}` |
| `GET /readyz` después de bootstrap | `200 {"status":"ready"}` |
| `GET /readyz` antes de marcar readiness, prueba de integración | `503 {"status":"starting"}` |
| Ruta no autorizada | `404` |
| `HEALTHCHECK` Docker real | `healthy`, exit `0` |
| Override `PORT=3101` | PASS; salud y aplicación usaron el puerto sobrescrito |
| `SIGTERM` con timeout de 10 segundos | Exit `0`, container detenido |

La readiness representa únicamente bootstrap terminado. No abre ni verifica una conexión de base de datos.

## Aislamiento runtime

El verificador `pnpm run verify:container -- srtaller-2:oci-ready-1` confirmó:

- ningún mount o volumen;
- ningún cambio reportado por `docker diff` después de las solicitudes;
- ningún proceso PostgreSQL, Redis o WAHA;
- ninguna variable de imagen con nombre de credencial, password, secret, token o `DATABASE_URL`;
- defaults `HOST=0.0.0.0`, `NODE_ENV=production`, `PORT=3000`;
- `HEALTHCHECK` en forma exec, con timeout interno de 2 segundos y timeout Docker de 3 segundos.

Todos los containers de auditoría se eliminaron después de cada ejecución. No se crearon volúmenes ni redes dedicadas.

## Gates de fuente

`pnpm run verify` terminó con exit `0`:

- toolchain, typecheck y build: PASS;
- test runner: `353` tests, `343` PASS, `0` FAIL, `10` SKIP;
- estructura DEC-004: PASS;
- arquitectura DEC-005: PASS.

Los 10 skips corresponden a suites PostgreSQL que requieren una instancia explícitamente aprovisionada. No se aprovisionó una porque la tarea excluye runtime de base de datos. Las pruebas unitarias, de arquitectura, de salud y de persistencia sin servidor pasaron.

El checker permite sólo `src/health/health.controller.ts` con `GET /livez` y `GET /readyz`. Las fixtures positivas pasan y las negativas rechazan prefijo, ruta adicional, método cambiado, path cambiado y cualquier otro controller o endpoint.

## Historial fail-closed relevante

- El primer build se detuvo antes de instalar dependencias porque faltaba el directorio de shims de Corepack; se añadió su creación explícita.
- El primer auditor se detuvo por el separador de argumentos de pnpm y luego por diferencias portables de `docker top`; se corrigió el harness y se repitió desde cero.
- Dos builds iniciales revelaron timestamps variables de pnpm y de `/app`; se eliminaron sólo metadatos no requeridos en runtime y se normalizó la capa. Los dos builds finales convergieron en el mismo image ID.
- No se reutilizó un resultado parcial como evidencia final.

## Conclusión

La evidencia autoriza únicamente que la imagen OCI app-only entre a un POC futuro de Dokploy. No prueba publicación, pull desde registry, configuración remota, conectividad, dominio, TLS, migraciones, base de datos ni despliegue real.

**SR TALLER OCI IMAGE READY FOR DOKPLOY APP-ONLY POC**
