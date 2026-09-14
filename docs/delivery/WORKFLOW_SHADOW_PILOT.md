# Workflow Shadow Pilot

## Estado del documento

- **Estado:** Active — 0 implemented PBIs observed.
- **Inicio:** después de integrar la materialización WF-001–WF-010.
- **Duración mínima:** próximos 3 PBIs implementados.
- **Extensión obligatoria:** hasta cubrir los tres perfiles requeridos.
- **Autoridad:** WF-006 y WF-007 en
  [Workflow Efficiency Decisions](DEVELOPMENT_WORKFLOW_EFFICIENCY_DECISIONS.md).
- **Próxima revisión:** después de cada PBI implementado y antes de proponer
  activación del clasificador o reducción de exact-main.

## Regla

El clasificador general y la verified-tree attestation sólo observan. No omiten
gates ni reducen exact-main. `DOCS_ONLY` es una ruta aprobada por WF-002 de
manera independiente y no cuenta como perfil implementado del piloto.

## Cobertura requerida

| Perfil | Estado | PBI / evidencia |
| --- | --- | --- |
| UI/application principalmente | Pending | TBD |
| persistence/migration | Pending | TBD |
| authorization/security o cross-module high risk | Pending | TBD |

## Ledger de PBIs observados

| Orden | PBI | Perfil observado | Clasificación shadow | Pipeline ejecutado | Finding perdido por shadow | Tree equivalence | Evidencia |
| ---: | --- | --- | --- | --- | --- | --- | --- |
| 1 | TBD | TBD | TBD | Full requerido | TBD | TBD | TBD |
| 2 | TBD | TBD | TBD | Full requerido | TBD | TBD | TBD |
| 3 | TBD | TBD | TBD | Full requerido | TBD | TBD | TBD |

Si al tercer PBI falta un perfil, se agregan filas; no se marca el piloto
completo. Si un gate full descubre algo que la recomendación shadow habría
omitido, se registra como falso negativo y se corrige el clasificador antes de
cualquier solicitud de activación.

## Evidencia mínima por fila

- PBI y Git tree exactos;
- clase y reglas activadas;
- gates que shadow habría recomendado;
- gates completos realmente ejecutados;
- tiempos y findings sanitizados;
- resultado run-1/run-2/comparison cuando aplique;
- comparación de attestation candidata/integrada;
- findings detectados sólo por un gate hipotéticamente omitido.

No se registran secretos, credenciales, datos de negocio, valores de entorno ni
identificadores de sesión.

## Criterio de salida

El piloto sólo queda listo para una nueva decisión Owner cuando existen al
menos tres PBIs implementados, están cubiertos los tres perfiles, no hay falso
negativo sin resolver y la evidencia permite evaluar seguridad, ahorro y
mantenimiento. El piloto por sí solo nunca activa Option B.
