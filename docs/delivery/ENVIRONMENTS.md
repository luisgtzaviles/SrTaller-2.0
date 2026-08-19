# Ambientes

## Estado del documento

- **Estado:** Contrato vigente para Local y Preview; contrato planificado para
  Staging y Production.
- **Autoridad superior:**
  [workflow canónico](./DEVELOPMENT_AND_DELIVERY_WORKFLOW.md).
- **Baseline de datos:** PostgreSQL 18.x por ambiente; Preview efectivo 18.4.
- **Próxima revisión:** al crear Staging, autorizar Production o cambiar la
  topología de Preview.

## Principio

Git branches no son deployment environments. `main` es la baseline integrada;
Dokploy representa los ambientes. No existen ramas permanentes `preview`,
`staging` o `production`.

Cada ambiente debe tener aplicación, base de datos, volumen, credenciales,
integraciones y telemetría separados. Nunca se comparte un persistent volume
entre ambientes.

## Clasificación actual

| Ambiente | Estado | Propósito |
|---|---|---|
| Local development | `CURRENT` | Desarrollo y pruebas reproducibles en una máquina. |
| Preview | `CURRENT` | Iteración rápida, integración y validación visual/funcional con datos no productivos. |
| Staging | `PLANNED` | Validar el release candidate y la operación antes de Production. |
| Production | `PLANNED` | Servicio real con datos reales y controles formales. |

## Preview — CURRENT

Preview está materializado en Dokploy:

| Fact | Value |
|---|---|
| Project / environment | `SR Taller` / `Preview` |
| Application | `srtaller-app` |
| Server | `srtaller-app-01` (`204.168.203.127`) |
| Domain | `https://preview.srtaller.dev` |
| Source / build | `main` / `Dockerfile` |
| Internal application port | `3000` |
| PostgreSQL service | `srtaller-postgres` |
| PostgreSQL version | `18.4` |
| PostgreSQL storage | Persistent volume, exclusive to Preview |
| PostgreSQL exposure | Internal Dokploy network, no public port |
| Autodeploy | Disabled; manual deployment |

Preview admite datos sintéticos, de desarrollo o desechables. Nunca usa datos
reales de Production. Su tolerancia a reconstrucción no autoriza borrar datos
persistentes sin confirmar alcance y autoridad.

## Local development — CURRENT

Local está materializado para el ciclo diario en macOS mediante Docker CLI y
scripts del repositorio. Usa exclusivamente el container
`srtaller-postgres-local`, el volumen `srtaller-postgres-local-data`, la base
`srtaller_local` y el binding loopback `127.0.0.1:55432`. La imagen esperada es
PostgreSQL `18.4`; el comando `local:db:up` lo verifica antes de continuar.

La ruta canónica y sus guardas están en
[LOCAL_DEVELOPMENT.md](LOCAL_DEVELOPMENT.md). Migraciones usan un rol local
`migration`, NestJS/seed usan un rol local `application`, y el reset sólo puede
destruir ese container/volumen etiquetado como `local`. Los IDs sembrados son
UUIDs sintéticos deterministas sobre las tablas integradas `tenants` y
`branches`; no hay PII ni tablas funcionales.

## Staging — PLANNED

Staging no existe y este documento no autoriza crearlo. Cuando se materialice:

- usará aplicación, DB, volumen y credenciales propios;
- alojará un release candidate identificado por digest inmutable;
- usará datos sintéticos/representativos o un dataset explícitamente
  sanitizado y autorizado;
- verificará migraciones, regresión, smoke y diferencias con Production;
- ensayará backup/restore y rollback cuando corresponda;
- conservará evidencia para el gate de Production.

## Production — PLANNED

Production no existe. Contendrá datos reales y no será un ambiente de
iteración. Requiere decisión Owner separada, controles de acceso, backup y
restore probados, observabilidad, runbooks, RPO/RTO/retención y promoción del
mismo artefacto validado en Staging.

Ninguna mutación de Production se infiere de un PASS local, merge a `main` o
deployment exitoso en Preview.

## Matriz de ambientes

| Aspecto | Local | Preview | Staging | Production |
|---|---|---|---|---|
| Estado | Current | Current | Planned | Planned |
| Datos | Sintéticos/fixtures | Desarrollo, sintéticos, desechables | Sintéticos/representativos; sanitizados sólo con autorización | Reales |
| Base | `srtaller_local` en Docker loopback | `srtaller-postgres` | Independiente | Independiente |
| Credenciales | Locales | Exclusivas de Preview | Exclusivas | Exclusivas y mínimo privilegio |
| Artefacto | Cambio local | Build desde `main` actual | Release candidate inmutable | Mismo digest aprobado |
| Deploy | Comando local | Manual en Dokploy | Pipeline repetible futuro | Promoción con gate futuro |
| Backups | Reproducibilidad local | Best-effort | Según prueba/migración | Obligatorios y restaurables |
| Autoridad | Tarea autorizada | Tarea autorizada para Preview | Autorización separada | Owner explícito |

## Configuración y secretos

- Configuración específica se inyecta al desplegar; no se incrusta en el
  artefacto.
- Secretos no viven en Git, imágenes, documentación, logs ni evidencia.
- Cuentas y claves se separan por ambiente e integración.
- Dokploy administra actualmente los secretos de Preview.
- Rotación, vault y break-glass de Production están `TO BE DECIDED BEFORE
  PRODUCTION`.

## Datos y movimientos entre ambientes

Local, Preview y Staging nunca se conectan a la DB de Production para pruebas.
Una extracción excepcional futura requiere propósito, minimización,
sanitización verificable, canal/ubicación autorizados, acceso/retención
limitados, eliminación comprobable y registro de autoridad.

Se prefieren generadores de datos sintéticos y escenarios reproducibles.

## Promoción

El modelo objetivo es:

```text
main → Preview
exact release candidate digest → Staging
approved same digest → Production
```

La configuración cambia por ambiente; los bits del artefacto promovido no se
reconstruyen. Migraciones se ensayan en Staging antes de Production.

## Preguntas abiertas

- ¿Qué topología, región y acceso tendrá Staging?
- ¿Qué topología, región, dominio y acceso tendrá Production?
- ¿Qué diferencias de escala entre Staging y Production son aceptables?
- ¿Cómo se generará el dataset representativo de Staging?
- ¿Qué identidad puede promover, contener y hacer rollback?

Las respuestas no deben inventarse; quedan `TBD` hasta decisión explícita.
