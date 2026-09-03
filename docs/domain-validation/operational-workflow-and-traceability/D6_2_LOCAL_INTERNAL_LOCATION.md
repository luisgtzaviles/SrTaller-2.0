# D6.2 — Local Internal Movement

## Estado

Candidato de integración local en `feature/repair-location-d6-2-local`, validado
por el Owner sin hallazgos abiertos. Todavía no está integrado en `main` y no
autoriza merge ni deploy.

## Slice autorizado

El slice modela exclusivamente el movimiento interno de una reparación desde
`pending_area` (`Área de pendientes`) hacia `workshop` (`Taller`). Location es
independiente de Workflow, Technician y Custody. Custody se consulta sólo como
precondición activa y ninguno de esos agregados se modifica.

La superficie HTTP intencional es:

`POST /api/repairs/:repairId/location/move-to-workshop`

Payload exacto:

```json
{
  "clientRequestId": "UUID",
  "expectedVersion": 1,
  "reason": "opcional"
}
```

Campos adicionales fallan. `reason` se recorta; vacío equivale a `null` y
forma parte de la huella semántica de idempotencia.

## Persistencia e invariantes

- `repair_locations` es un catálogo por tenant + sucursal y sólo admite las
  categorías `pending_area` y `workshop` en este slice. Las FK compuestas de
  movimientos vinculan scope + location ID + code para impedir snapshots con
  una identidad semántica contradictoria.
- `repair_location_movements` es el historial append-only y fuente de verdad.
- La ubicación vigente se deriva del último movimiento; sin historial se
  proyecta `location: null`, `locationVersion: 0` y
  `locationSource: unrecorded`.
- La colocación inicial sintética es un movimiento explícito
  `null → pending_area`, versión `0 → 1`.
- El command autorizado produce sólo `pending_area → workshop`, versión
  `1 → 2`; repetir el mismo request/payload devuelve el resultado original.
- Misma clave con command, versión o motivo distinto responde conflicto.
- Un lock scoped de la reparación y la transacción serializable protegen la
  versión. Sólo un command concurrente con la misma versión puede prosperar.
- Reparación inexistente/fuera de scope, custodia terminada, origen distinto,
  destino ausente/inactivo y destino cross-scope fallan sin efectos parciales.
- Movimiento y Timeline se insertan atómicamente. El evento es
  `system_event`, título `Equipo movido`, cuerpo
  `Área de pendientes → Taller`, source `local.location` y actor sintético.

## UI local

Repair Detail muestra ubicación, versión/fuente en el read model y el command
`Mover a Taller` únicamente cuando la ubicación vigente es `pending_area` y la
custodia sigue activa. Loading, éxito, error y conflicto stale se anuncian de
forma accesible; tras éxito o conflicto se refresca el Detail y la proyección
local. Worklist no añade columna ni filtro de ubicación.

## Límites conservados

No existen movimiento inverso, editor genérico, ubicaciones adicionales,
writes de Workflow/Custody/Technician, capacidades productivas, identidad
confiable ni integración remota. Todo el contexto y los datos son sintéticos y
locales.
