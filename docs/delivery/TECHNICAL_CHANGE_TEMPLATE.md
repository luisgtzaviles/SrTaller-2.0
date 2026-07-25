# Plantilla mínima de cambio técnico

## Estado y autoridad

- **Estado:** Materialización mínima de `DEC063-C01`.
- **Autoridad:** [DEC-063](../decisions/dec-063-definition-of-done/DECISION_PROPOSAL.md).
- **Uso:** Cambios técnicos acotados; no sustituye un PBI ni una decisión.

## Identidad

| Campo | Valor |
| --- | --- |
| Trabajo/PBI | `TBD` |
| Owner | `TBD` |
| Commit/PR | `TBD` |
| Tipo | `TBD` |
| Riesgo | `Bajo` / `Medio` / `Alto` |
| Justificación | `TBD` |

## Ready

- [ ] Objetivo observable.
- [ ] Alcance y exclusiones.
- [ ] Dependencias y decisiones aplicables.
- [ ] Criterios de aceptación.
- [ ] Evidencia y gates esperados.
- [ ] Preguntas bloqueantes resueltas.
- [ ] Ambigüedad elevada a riesgo alto.

## Done

- [ ] Objetivo y criterios satisfechos.
- [ ] Archivos exactos inventariados.
- [ ] Gates base y especializados verdes.
- [ ] Pruebas positivas, negativas, de frontera y fallo según riesgo.
- [ ] Evidencia ligada al commit.
- [ ] Sin secretos ni datos reales.
- [ ] Defectos, deuda y limitaciones con owner.
- [ ] Revisión proporcional al riesgo.
- [ ] Estado Git y acciones externas reportados.
- [ ] Siguiente estado inequívoco.

## Evidencia

Usar el
[manifest canónico](./EVIDENCE_MANIFEST_TEMPLATE.json) y su
[schema](./evidence-manifest.schema.json) cuando exista ejecución técnica.

| Evidencia | Referencia |
| --- | --- |
| Comandos y exit codes | `TBD` |
| Entorno/toolchain | `TBD` |
| Pruebas | `TBD` |
| Artefactos/hashes | `TBD` |
| CI | `TBD` |
| Revisión/dictamen | `TBD` |

## `N/A`, defectos y waivers

- **`N/A` justificado y revisado:** `TBD`.
- **Defectos/deuda:** `TBD`.
- **Waiver:** criterio, autoridad, alcance, compensación, expiración y
  remediación; `TBD`.
- **Estados bloqueados mientras exista el waiver:** `TBD`.

## Resultado

- **Resultado:** `PASS` / `PASS WITH CONDITIONS` / `FAIL`.
- **`Done`:** `Sí` / `No`.
- **`Released`:** siempre se evalúa por separado.
