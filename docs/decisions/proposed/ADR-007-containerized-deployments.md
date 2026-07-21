# ADR-007 — Despliegues mediante contenedores versionados

**Status: Proposed**
**Fecha:** TBD

## Estado del documento

Propuesta de empaquetado y promoción; no autoriza Dockerfiles, infraestructura ni despliegues. Está subordinada a [ADR-002](ADR-002-modular-monolith-first.md): se evaluaría sobre el único artefacto inicial y no crea unidades desplegables separadas.

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

## Decisión propuesta

Empaquetar el único artefacto inicial como imagen versionada y promover exactamente el mismo digest entre staging y producción mediante un pipeline controlado. Si un ADR futuro autoriza extraer otra unidad, esa unidad aplicaría el mismo principio. GitHub Actions es el candidato preliminar para CI/CD y Docker Compose una hipótesis para dependencias locales; ambas elecciones requieren evaluación propia y no forman parte de la decisión de empaquetado de este ADR. La plataforma de ejecución y el registry siguen pendientes.

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
- ¿GitHub Actions y Docker Compose satisfacen los requisitos operativos y de seguridad frente a sus alternativas?

## Referencias

- [Estrategia de despliegue](../../architecture/DEPLOYMENT_STRATEGY.md)
- [Ambientes](../../delivery/ENVIRONMENTS.md)
- [PBI-015](../../backlog/pbis/PBI-015.md)

## Próxima revisión

Antes de diseñar el pipeline de Engineering Foundation; fecha: TBD.
