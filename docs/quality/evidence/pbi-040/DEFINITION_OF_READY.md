# PBI-040 — Definition of Ready

## Resultado

**PASS — READY FOR OWNER IMPLEMENTATION AUTHORIZATION — 2026-09-11**

Ready confirma claridad suficiente; no autoriza implementación, branch, código,
migraciones, PR, merge, deploy, release ni el inicio de PBI-041.

## Baseline verificada

| Campo | Evidencia |
|---|---|
| Branch | `main` |
| Local/origin | `40684d7554cdf02551f941e5e3f0beabbe563125` = `origin/main` al preflight |
| CI exacta | GitHub Actions run `34623060504`, success |
| PBI previo | PBI-039 Done efectivo en esa baseline |
| Worktree | sólo documentación autorizada de discovery/architecture/readiness; ningún código de producto |

## Evaluación DoR

### Resultado y límites

- [x] Problema y usuario descritos con evidencia del discovery V1/ENL/V2.
- [x] Valor vinculado a EPIC-015 y G9 parcial.
- [x] Alcance y exclusiones precisos; import/images/futuros separados.
- [x] Criterios observables incluyen éxito, error, denegación, stale,
  concurrencia, no-priced, inactive y multi-Branch.
- [x] Dependencias conocidas y disponibles; no depende de Inventory/Caja.
- [x] Riesgos con controles definidos.
- [x] Estimación `XL — agreed` por T-shirt sizing bajo la autoridad de
  planeación de este Master Goal; sin inventar story points.

### Impactos transversales

- [x] Multitenancy: scopes, constraints, search y anti-enumeration definidos.
- [x] Branch: override y contexto operativo/administrativo definidos.
- [x] Permisos: capabilities, actor, recurso y denegación definidos.
- [x] Datos: ownership, lifecycle, revisions, migración y rollback definidos.
- [x] Seguridad: costo minimizado, idempotencia, concurrency y audit definidos
  en el [Threat Model](THREAT_MODEL.md).
- [x] Visual: navegación/estados/responsive/accessibility y QA definidos.
- [x] Operación: observabilidad, rollout y soporte de migración definidos.
- [x] Integraciones: no aplican; PBI no usa terceros, Files ni proveedor.

### Decisiones y verificabilidad

- [x] PLD-001 a PLD-008 y PLD-018 aprobadas y promovidas.
- [x] Decisiones técnicas restantes resueltas en arquitectura.
- [x] No se necesita nuevo ADR: la solución aplica ADR-002/004/010/011/012/013
  y DEC-005/044/049/050/051 sin cambiarlos; el módulo se registra al
  materializarse, no se crea vacío.
- [x] Estrategia de pruebas, UI evidence, focused review y gates definidos.
- [x] Rollout/rollback entendidos; Production sigue como autoridad separada.

## Escenarios bloqueantes revalidados

| Escenario | Resultado |
|---|---|
| OLED vs LCD / dos fuentes | PASS en contrato: identidades separadas, no fuzzy fusion |
| Servicio 350/399 | PASS: base/override, no stock, costo opcional |
| Termo | PASS: Product independiente de Repair |
| Alcohol | PASS: Supply existe pero Price List excluye |
| 1,000 filas | Pertenece a PBI-041; contrato ya cerrado, no bloquea PBI-040 |
| Muchas Branches | PASS: una identidad, base+override, revocación hereda |

## Preguntas

- **Bloqueantes:** ninguna.
- **No bloqueante:** el presupuesto p95 exacto se fija sobre el benchmark del
  entorno de referencia antes de Owner QA; no cambia alcance ni arquitectura.

## Gates de inicio

1. Owner debe emitir autorización explícita para implementar PBI-040.
2. Al iniciar, crear branch desde la baseline vigente y volver a verificar
   SHA/worktree/CI; si `main` avanzó, esta evidencia se revalida.
3. Mantener WIP=1 y actualizar `ACTIVE_CHECKLIST.md` antes del primer cambio
   funcional.

## Revisores requeridos durante entrega

Ingeniería, Arquitectura, Seguridad y Calidad; Owner para checkpoints de
producto y aceptación. No se registra aprobación futura por anticipado.
