# ADR-007 — Despliegues mediante contenedores versionados

**Status: Accepted — OCI app-only baseline authorized**
**Fecha:** 2026-08-18
**Autoridad de aceptación:** Responsable del Proyecto

## Estado del documento

Decisión aceptada para empaquetar el único backend inicial como imagen OCI
portable. Autoriza el Dockerfile de producto, su verificación local y la
superficie técnica mínima de salud necesaria para una POC app-only. No autoriza
deploy, infraestructura remota, bases de datos, dominios ni servicios futuros.

Está subordinada a
[ADR-002](ADR-002-modular-monolith-first.md): conserva un único artefacto
inicial y no crea unidades desplegables separadas.

## Contexto

El sistema anterior tuvo despliegues lentos o manuales y diferencias difíciles de validar entre local, staging y producción. El único artefacto inicial debe poder promoverse de manera repetible; cualquier unidad futura extraída tendría que conservar esa propiedad.

## Fuerzas de decisión

- Reproducibilidad e inmutabilidad del artefacto.
- Promoción sin reconstrucción.
- Promoción consistente de la unidad inicial y de cualquier unidad futura autorizada.
- Seguridad de supply chain, rollback y observabilidad.
- Coste de operar runtime de contenedores.

## Opciones consideradas

1. **Imágenes Docker/OCI versionadas:** artefactos portables con pipeline controlado.
2. **Buildpacks/plataforma como servicio:** menor mantenimiento, más dependencia de plataforma.
3. **Despliegue directo en VM:** flexibilidad, mayor riesgo de deriva.
4. **FTP/manual:** descartable por baja trazabilidad y repetibilidad.

## Decisión

Empaquetar el único artefacto inicial como imagen OCI versionada y promover
exactamente el mismo digest entre ambientes mediante un pipeline controlado.
La imagen se construye mediante un Dockerfile multi-stage sobre Linux/glibc,
fija la toolchain aceptada, ejecuta JavaScript compilado desde `dist/`, corre
como usuario no-root y recibe configuración en runtime.

La imagen expone únicamente la superficie técnica `GET /livez` y
`GET /readyz`. Durante la POC app-only, readiness representa que el bootstrap
actual terminó; no declara salud de PostgreSQL ni de servicios futuros.

Dokploy es la plataforma operativa elegida actualmente para ejecutar la POC y
administrar routing/TLS, pero la imagen no utiliza APIs, manifests ni
constructs propietarios de Dokploy. Debe poder ejecutarse con un runtime OCI
estándar.

Si un ADR futuro autoriza extraer otra unidad, esa unidad aplicará el mismo
principio. GitHub Actions permanece como candidato para CI/CD. Docker Compose
no es obligatorio ni queda autorizado por esta decisión; Kubernetes,
configuración Swarm específica, Redis, workers, WAHA, R2 y PostgreSQL runtime
quedan fuera de este incremento. La política de registry y promoción remota
permanece pendiente.

## Contrato autorizado para la primera imagen

- Linux/glibc; no Alpine/musl.
- Node.js `24.18.0` y pnpm `11.15.1` durante el build reproducible.
- Instalación desde `pnpm-lock.yaml` con `--frozen-lockfile`.
- Build mediante el script canónico del repositorio.
- Runtime non-root desde `dist/`, sin ejecutar TypeScript.
- Puerto interno convencional `3000`, configurable mediante `PORT`.
- `HOST`, `NODE_ENV` y `PORT` siguen siendo configuración de runtime.
- TLS y routing externos al contenedor.
- Sin secretos, `.git`, fuentes o herramientas de verificación en la imagen
  final.
- Sin volumen persistente para la aplicación app-only.

## Consecuencias positivas

- Entornos de runtime reproducibles y rollback por artefacto.
- Separación de build y deploy.
- Escaneo y evidencia por imagen.

## Consecuencias negativas

- Pipeline, registry, parcheo y limpieza requieren operación.
- Los contenedores no eliminan diferencias de configuración externa.
- Mayor superficie de supply-chain.

## Riesgos

- Etiquetas mutables o rebuild en producción romperían trazabilidad; usar digests y promoción.
- Secretos dentro de imágenes; exigir inyección externa y escaneo.

## Criterios para reconsiderar

- Plataforma aprobada ofrece artefacto inmutable equivalente con menor coste.
- Restricciones regulatorias u operativas impiden el runtime elegido.

## Preguntas abiertas

- ¿Qué registry, plataforma y política de retención se usarán?
- ¿Qué controles de firma, SBOM y escaneo serán obligatorios?
- ¿Qué mecanismo construirá y publicará el digest que después consumirá
  Dokploy?

## Referencias

- [Estrategia de despliegue](../../architecture/DEPLOYMENT_STRATEGY.md)
- [Ambientes](../../delivery/ENVIRONMENTS.md)
- [PBI-015](../../backlog/pbis/PBI-015.md)

## Próxima revisión

Antes de autorizar publicación de imagen o el primer deploy en Dokploy; fecha:
TBD.
