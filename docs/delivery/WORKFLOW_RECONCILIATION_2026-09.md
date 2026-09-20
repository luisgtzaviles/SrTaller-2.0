# Workflow reconciliation — 2026-09

## Estado del documento

- **Estado:** accepted and materialized in this documentation candidate.
- **Alcance:** reconciliar el flujo de entrega posterior a PBI-041; no cambia
  producto, API, esquema, datos, runtime ni infraestructura.
- **Autoridad:** decisión Owner posterior al cierre material de PBI-041.
- **Próxima revisión:** al habilitar protección técnica de `main`, incorporar
  runner propio o cambiar la topología de Preview.

## Hechos verificados

PBI-041 se integró por PR #55/#56/#57 y su cierre de data scope por PR #58.
El merge de #58 es `cb1dca3edc945776face00ea3b2d6213fa0c7b37`; su CI
autoritativa exact-main
[`35544551782`](https://github.com/luisgtzaviles/SrTaller-2.0/actions/runs/35544551782)
pasó clasificación, run-1, run-2 y comparación. Por ello PBI-041 es `Done`,
SPRINT-03 es `Closed`, Current PBI es `NONE`, WIP es `0/1` y `Released` sigue
siendo `NO`.

El inventario gobernado posterior verificó que las cuatro ramas PBI-041 estaban
contenidas en `main` y no tenían commits exclusivos: `feature/pbi-041-bulk-catalog-composer`,
`fix/pbi-041-preview-spa-routes`, `fix/pbi-041-publish-determinism` y
`ops/pbi-041-roadmap-advance`. El worktree temporal limpio de rendimiento fue
retirado, las ramas locales/remotas fueron eliminadas después del PASS exact-main
y el checkout primario quedó en `main == origin/main == cb1dca3`. El único
artefacto local pendiente es el `.DS_Store` no rastreado del Owner; no forma
parte de esta entrega.

No se perdió una feature: `Lista de precios → Configurar campos` fue introducida
por `2dda1eedbf8dca591459c7c0e039da2389c735e6`, ancestro de `main` y del
release Preview `9b7a83d`. La diferencia observada entre local y Preview fue
de capabilities/dataset mínimo, no de código ni de build. Preview conserva su
autoridad de release/runtime; Owner/local conserva la autoridad read-only de
integridad AviCell. Ningún dataset fue copiado, sembrado o reseteado.

## Pipeline normal

```text
main
  → feature/fix/ops branch
  → local verification and evidence
  → one integration candidate PR
  → authoritative CI
  → logical independent review
  → ordinary merge to main
  → exact-main CI
  → Preview deploy when the change has runtime scope
  → provenance, health and smoke
  → delete absorbed branch
  → local main == origin/main
```

La implementación, pruebas, hardening, evidencia, documentación canónica y
reconciliación de `ACTIVE_CHECKLIST.md` deben viajar por defecto en **un solo
candidato de integración**. Un PR documental posterior es excepcional: sólo
para governance independiente, ADR/DEC, inconsistencia descubierta después o
reconciliación histórica. No se crea un PR sólo para cambiar wording
pre-merge a `Done` cuando merge autorizado y CI exact-main ya satisfacen la
semántica de cierre vigente.

## Review, autoridad y detención

La revisión independiente es un control de proceso: se demuestra con alcance,
HEAD exacto, criterios, findings y evidencia; no depende permanentemente de
una cuenta concreta de GitHub. `empresasgalatech` puede participar, pero no es
un requisito técnico ni una identidad obligatoria futura.

Cuando el Owner autoriza un PBI o feature, puede conceder autoridad de delivery
acotada para crear la rama temporal, implementar, probar, documentar, crear
commits, push ordinario, abrir PR, esperar CI, revisar, remediar findings
legítimos, merge ordinario, sincronizar `main`, desplegar Preview cuando el
alcance lo incluye, ejecutar migraciones autorizadas, registrar evidencia y
limpiar ramas absorbidas. Esa delegación no permite iniciar otro PBI, ampliar
negocio/arquitectura, tocar Production, usar fuerza/rewrite, ignorar integridad
de datos, realizar operaciones destructivas sobre datos Owner ni interpretar
silencio como aprobación de un riesgo material.

El agente se detiene y solicita decisión Owner ante cambio de objetivo de
negocio, arquitectura o migración material, seguridad, integridad de datos,
operación destructiva Owner, Production/passkeys, force push/rewrite o rollback
inseguro, o commits únicos no explicados.

## Verificación proporcional

- **Bajo riesgo:** documentación inequívocamente no ejecutable puede usar el
  gate DOCS_ONLY cuando el clasificador fail-closed lo permita.
- **Medio riesgo:** UI, API o comportamiento acotado conserva typecheck,
  pruebas focalizadas, build, CI exacta y smoke proporcional.
- **Alto riesgo:** persistencia, migración, autorización, publicación o datos
  conserva verificación completa, PostgreSQL material, doble ejecución y
  comparison exacta.

Una clasificación desconocida escala a alto riesgo. La protección técnica de
`main` sigue pendiente; green checks no sustituyen la autoridad o evidencia
aplicable.

## Ambientes y follow-ups no implementados

Local y Preview deben exponer en UX futura una identidad visible y no sensible:
`LOCAL · <branch> · <short SHA>` y `PREVIEW · main · <short SHA>`. Esta
reconciliación sólo registra el requisito; no modifica runtime ni UI.

La evaluación de runner propio en Hetzner queda como follow-up de gobernanza:
medir compatibilidad, aislamiento, costo y operación antes de cualquier
migración. No se autoriza crear, migrar ni configurar infraestructura por este
documento.
