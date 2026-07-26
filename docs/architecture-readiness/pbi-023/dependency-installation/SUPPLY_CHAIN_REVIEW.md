# Revisión de supply chain

## Resultado

**PASS — riesgo residual aceptable para instalar, no para conectar.**

La auditoría cubrió metadata oficial, lockfile, cierre transitivo, scripts,
binarios, licencias, optional dependencies, deprecations, advisories,
duplicados y capacidades.

| Control | Resultado |
|---|---|
| versiones exactas | PASS — sin `^`, `~` o `latest` |
| fuente | PASS — registro público oficial de npm |
| integridades | PASS — SHA-512 en los dieciséis nodos nuevos |
| tarballs | PASS — metadata oficial; ninguno preservado |
| lifecycle scripts | PASS — ninguno en el cierre nuevo |
| binarios/native addons | PASS — ninguno; `pg-native` ausente |
| optional dependencies | PASS — `pg-cloudflare` revisada |
| deprecated | PASS — ninguna versión reportada |
| advisories | PASS — 0 info/low/moderate/high/critical |
| licencias | PASS — MIT o ISC |
| typosquatting | PASS — nombres exactos de DEC-049/050 y namespace esperado |
| versiones duplicadas directas | PASS — una de cada paquete autorizado |
| actualización ajena | PASS — ninguna |

## Auditoría

`pnpm audit --json` registró:

- `116` dependencias;
- `4` dev dependencies;
- `1` optional dependency;
- `121` dependencias totales;
- cero advisories en todas las severidades.

No se ejecutó una corrección automática ni se actualizó un paquete para
resolver advisories.

## Capacidades y riesgos

- `pg` y parte de su cierre pueden abrir sockets y leer configuración cuando
  exista código consumidor. En este paso no se creó instancia, pool ni
  conexión.
- `pgpass` es sensible por su finalidad futura; no leyó ni preservó
  credenciales en esta tarea. La configuración tipada y redaction pertenecen
  al Paso 5.
- `pg-cloudflare` es opcional, JavaScript puro y no tiene lifecycle; su
  presencia proviene exclusivamente del manifest de `pg`.
- Kysely no incorpora un driver ni ejecuta IO por instalación.
- No existen paquetes nativos, ejecutables, postinstall o permisos
  extraordinarios en el cierre nuevo.

## Integridad transitiva

Cada paquete de
[DEPENDENCY_GRAPH.md](DEPENDENCY_GRAPH.md) tiene una entrada de integridad
SHA-512 en `pnpm-lock.yaml`. El hash completo del lockfile es
`2fde645e039107249348ff4f66510220383341635fa18c8fe3ec7ff0219611f7`.

## Riesgo residual

El riesgo de instalación se clasifica bajo/medio y reversible. La capacidad
de conexión futura sigue siendo riesgo alto gobernado por DEC-049/050 y no
fue activada. Un advisory material, cambio de integridad, lifecycle nuevo o
versión distinta obliga a detener y reabrir la revisión.
