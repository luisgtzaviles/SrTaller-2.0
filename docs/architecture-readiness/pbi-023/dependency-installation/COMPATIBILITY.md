# Compatibilidad

## Baseline

| Componente | Versión | Resultado |
|---|---:|---|
| Node.js | `24.18.0` | PASS |
| pnpm | `11.15.1` | PASS |
| TypeScript | `6.0.3` | PASS |
| módulos | ESM / NodeNext | PASS |
| architecture policy | 2 | PASS |

## Imports y tipos

Una prueba efímera con `node --input-type=module` importó `Kysely` y el
default export de `pg`, confirmó que `pg.Pool` está expuesto y terminó sin
crear objetos ni conexiones.

Un programa virtual TypeScript, no escrito a disco, resolvió:

- `Kysely` desde `kysely`;
- `Pool` y `PoolConfig` desde `pg`;
- `module` y `moduleResolution` NodeNext;
- target ES2024 y strict;
- cero diagnósticos y cero emisión.

No se creó archivo bajo `src/` ni temporal versionable.

## Gates

Los siguientes gates pasaron una vez después de instalar y luego en cada una
de las dos instalaciones limpias:

- `pnpm run architecture`;
- `pnpm run typecheck`;
- `pnpm run build`;
- `pnpm test` — 219/219;
- `pnpm run test:architecture` — 207/207;
- `pnpm run verify`;
- `pnpm run smoke:start`;
- `git diff --check`.

El checker siguió reportando policy 2 y el grafo
`access -> stations`, `access -> tenancy`, `stations -> tenancy`.
D5-R037–D5-R047 permanecieron activos; instalar paquetes sin imports
productivos no generó falso positivo ni exigió allowlist.

## Conclusión

Las versiones exactas son compatibles estáticamente con la baseline aceptada.
Esta prueba no acredita conexión, pool, transacción, migrador ni PostgreSQL
real; esos triggers siguen cerrados.
