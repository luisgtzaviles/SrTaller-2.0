# Aislamiento tenant

## Cobertura material

- `tenant_id` es obligatorio en `branches`;
- la PK de branch incluye `tenant_id`;
- la FK impide branches huérfanas;
- la misma identidad local de branch puede existir en tenants distintos;
- una tabla experimental pudo declarar FK futura
  `(tenant_id, branch_id) → branches (tenant_id, branch_id)`;
- una referencia experimental cruzada entre tenant A y branch de tenant B fue
  rechazada.

## Cobertura no reclamada

El schema no implementa RLS ni decide autorización. Tampoco existen adapters,
repositories o queries productivas; por ello aún no se afirma aislamiento de
lecturas/escrituras de aplicación. El Paso 10 deberá exigir `tenantId` en cada
port y repetir pruebas negativas sobre adapters reales.
