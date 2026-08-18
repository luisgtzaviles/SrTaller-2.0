# Evidencia — primera POC app-only real en Dokploy

## Estado y alcance

- Fecha de ejecución: `2026-08-18`.
- Resultado: `PASS` para el pipeline real GitHub → Dokploy → contenedor de SR
  Taller en Preview.
- Límite: es un shell técnico app-only; no es SR Taller funcional terminado.
- Rama fuente inicial: `ops/first-oci-health`.
- Commit fuente del primer deployment:
  `267c41e8b26d5ffd8261bca876ed60ca419d9e92`.

## Configuración verificada

| Campo | Valor |
| --- | --- |
| Plataforma | Dokploy Cloud `v0.30.0` |
| Proyecto | `SR Taller` |
| Environment | `Preview` |
| Aplicación | `srtaller-app` |
| Servidor | `srtaller-app-01` (`204.168.203.127`) |
| Fuente | repositorio privado `luisgtzaviles/SrTaller-2.0`, rama `ops/first-oci-health` |
| Acceso Git | provider Git soportado por Dokploy y deploy key ED25519 dedicada, verificada y de sólo lectura |
| Build | `Dockerfile`, contexto `.`, sin Nixpacks, Railpack ni Buildpacks |
| Runtime observado | `linux x64`, equivalente Node.js de `linux/amd64` |
| Variables | `HOST=0.0.0.0`, `NODE_ENV=production`, `PORT=3000` |
| Puerto interno | `3000` |
| Endpoint Preview | `https://preview.srtaller.dev` |
| DNS | `A preview.srtaller.dev → 204.168.203.127`, Cloudflare `DNS only`, TTL automático |
| TLS | Let's Encrypt en Traefik; SAN exacto `preview.srtaller.dev` |
| Autodeploy | deshabilitado; deployment manual |

No se añadieron build arguments, build secrets, volúmenes, puertos directos ni
servicios auxiliares.

## Primer deployment

Dokploy clonó la rama privada y registró el commit fuente exacto. El build
Docker terminó en `54s` y produjo la imagen local de Dokploy
`sha256:8298cb33b9b6906d162b4a3e7e46d48d9b214f1e0ae8d49ffcf8a5799659d9c4`.
El deployment quedó en estado `done`.

El contenedor observado fue `4cf8cf250268`, servicio
`srtaller-app-nvpkjj`, estado `running` y health `healthy`. Una inspección de
sólo lectura dentro del contenedor devolvió `linux x64`. El log de aplicación
mostró únicamente:

```json
{"event":"technical_shell_listening"}
```

No hubo crash loop ni hotfix de fuente.

## Routing inicial y contratos HTTP

Se creó sólo el routing temporal HTTP generado por Dokploy:

```text
http://srtaller-app-nvpkjj-f566bb-204-168-203-127.sslip.io/
```

Ese routing permitió verificar primero la aplicación sin dominio propio. No se
configuraron entonces TLS, `srtaller.com` ni Cloudflare.

| Comprobación pública | Resultado |
| --- | --- |
| `GET /livez` | `200 {"status":"live"}` |
| `GET /readyz` | `200 {"status":"ready"}` |
| `GET /unknown` | `404` con respuesta NestJS `Not Found` |

El `HEALTHCHECK` de la imagen consulta `/readyz`; el estado `healthy` observado
en Dokploy confirma su ejecución en el runtime real.

Después de solicitar `Reload` en Dokploy, el servicio permaneció `running
(healthy)` y la matriz `200/200/404` volvió a pasar. Esto verifica una recarga
razonable sin dependencia externa.

## Endpoint Preview y TLS

La zona activa `srtaller.dev` usa los nameservers de Cloudflare. El registro ya
existente se confirmó sin modificar otros registros:

```text
A  preview.srtaller.dev  204.168.203.127  DNS only  TTL automático
```

Dokploy quedó configurado con host `preview.srtaller.dev`, path `/`, internal
path `/`, puerto `3000`, HTTPS activo y proveedor de certificado Let's Encrypt.
Traefik emitió un certificado público con CN y SAN exactos
`preview.srtaller.dev`, vigente de `2026-08-18T08:12:13Z` a
`2026-11-16T08:12:12Z`.

| Comprobación final | Resultado |
| --- | --- |
| Resolución A mediante Cloudflare `1.1.1.1` | `204.168.203.127` |
| Resolución A mediante Google `8.8.8.8` | `204.168.203.127` |
| `GET http://preview.srtaller.dev/livez` | `301` a `https://preview.srtaller.dev/livez` |
| `GET https://preview.srtaller.dev/livez` | `200 {"status":"live"}` |
| `GET https://preview.srtaller.dev/readyz` | `200 {"status":"ready"}` |
| `GET https://preview.srtaller.dev/unknown` | `404` |
| Puerto público `204.168.203.127:3000` | conexión rechazada |

El hostname temporal `sslip.io` se retiró de Dokploy después de validar HTTPS y
ahora responde `404` de Traefik. El servicio permaneció `running (healthy)` y no
se ejecutó rebuild porque no cambió la aplicación ni su configuración runtime.

## Aislamiento y secretos

- PostgreSQL: no creado, no conectado y no requerido por readiness.
- Redis: no creado, no conectado y no requerido.
- WAHA: no creado, no conectado y no requerido.
- La única credencial creada fue una deploy key específica del repositorio,
  verificada por GitHub como read-only; su valor privado no se registró en Git
  ni en esta evidencia.
- No se añadieron secretos de aplicación.

## Flujo repetible

```text
Codex
→ cambio y pruebas locales
→ commit en rama autorizada
→ push a origin
→ Deploy/Rebuild manual en Dokploy Preview
→ confirmar deployment done y servicio healthy
→ verificar /livez=200, /readyz=200 y ruta desconocida=404
→ reportar commit y evidencia
```

El autodeploy permanece deshabilitado: `ops/first-oci-health` es una rama de
trabajo específica y todavía no existe una estrategia adoptada para una rama
estable de Preview. No existe autorización implícita para desplegar `main` o
production.

## Conclusión

**SR TALLER DOKPLOY APP-ONLY POC PASS**

**PREVIEW.SRTALLER.DEV LIVE ON DOKPLOY**
