# PBI-026 — Verificación acotada de Option A

## Estado

- **Alcance:** enforcement arquitectónico de la composición dirigida
  `repairs->access` para Contextual Authorization.
- **Policy:** `architecture/dec-005-policy.json`, versión `5`.
- **Resultado:** la arista, el binding público y los archivos productivos
  están registrados de forma exacta; la suite arquitectónica aplica D5-R004,
  D5-R005, D5-R006, D5-R007, D5-R014, D5-R016 y D5-R024–D5-R027 sin
  excepciones nuevas. Candidate y exact-main CI están GREEN.
- **Estado del PBI / G4:** `Done candidate` / `PASS candidate`; cierre
  documental pendiente.
- **Límite:** esta verificación arquitectónica no autoriza por sí sola cierre,
  PBI-028, release o deploy.

## Arista autorizada

```text
repairs -> access -> stations
                  -> users
                  -> tenancy
```

La extensión agrega sólo esta composición:

| Elemento | Registro exacto |
| --- | --- |
| Consumidor | `repairs` / `RepairsModule` |
| Productor | `access` / `AccessModule` |
| Import de módulo | `../access/access.module.js` |
| Token | `CONTEXTUAL_AUTHORIZATION_EXECUTOR` |
| Contrato | `ContextualAuthorizationExecutor` |
| API funcional | `../access/index.js` |

No se registra `access->repairs`, no se agrega otro binding y no se autoriza
acceso desde Repairs a repositorios, sesión, persistencia o internals de
Access.

## Ownership y superficie pública

Access conserva la decisión de autorización contextual y publica en
`src/modules/access/index.ts` únicamente shapes framework-free necesarios para
invocar una operación protegida. La implementación y las cookies/session
internas permanecen privadas a Access. `AccessModule` vincula y exporta una vez
`CONTEXTUAL_AUTHORIZATION_EXECUTOR`.

Repairs conserva ownership del recurso y de sus casos de uso. Su capa de
aplicación importa sólo la API pública de Access; `RepairsModule` importa
`AccessModule` por el specifier registrado e inyecta una vez el token en
`RepairProtectedOperations`. La capability es seleccionada por el adapter
owner-side, no por datos del request.

Los dos archivos productivos nuevos quedan admitidos explícitamente en
`productModuleFiles`:

- `src/modules/access/presentation/contextual-authorization.executor.ts`;
- `src/modules/repairs/application/repair-protected-operations.ts`.

## Enforcement fail-closed

`test/architecture-policy.test.mjs` fija como contrato exacto las tres aristas
Option A vigentes y comprueba que los dos archivos de PBI-026 pertenezcan al
registro productivo. El checker compara además el grafo observado completo,
los exports públicos exactos y la composición consumer/producer real.

Los fixtures negativos existentes de D5-R024 son deliberadamente genéricos a
cualquier arista registrada y, por tanto, cubren también `repairs->access`:

- edge presente sólo en el grafo;
- import con alias, namespace, dynamic import o `forwardRef`;
- metadata `imports` ausente, duplicada o no literal;
- token público ausente, con alias o inyectado más de una vez;
- binding/export/contrato del productor ausente o duplicado;
- arista inversa/ciclo;
- bypass por `ModuleRef`, `@Global`, deep/private import o repository ajeno;
- contrato público acoplado a NestJS.

No se deshabilita regla, no se amplía `shared`, no se registra excepción y no
se modifica el allowlist de autoridad del controller para ocultar la nueva
composición.

## Validación exacta

```text
pnpm run test:architecture
pnpm run typecheck
git diff --check
```

| Comprobación local | Resultado |
| --- | --- |
| `pnpm run architecture` | PASS — policy `5`; siete edges exactos, incluido `repairs->access` |
| `pnpm run test:architecture` | PASS — `307/307`; fixtures y mutaciones fail-closed |
| `node --test test/architecture-policy.test.mjs` | PASS — `16/16` |
| `node --test test/architecture-mutations.test.mjs` | PASS — `36/36`; D5-R024 se acumula cuando una mutación invalida el consumer `AccessModule` |
| `pnpm run typecheck` | PASS |
| `git diff --check` | PASS |

El candidate `54b3cf01c6b5ae0b51ca0b8f432d23abbb229ab7`, CI `34157187442`,
focused Critical-risk review PASS `0B/0H/0M/0L`, merge funcional
`4db5d9384d13c200eb2031dceb32dd89efcca64d` y exact-main CI `34158203438`
verifican esta composición. El merge/CI del cierre documental siguen siendo el
gate para `Done` y G4 `PASS` efectivos.
