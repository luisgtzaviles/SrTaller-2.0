# Resultados unitarios

`pnpm test`:

- tests: 388;
- pass: 377;
- fail: 0;
- skips ordinarios: 11;
- skips críticos: 0.

Los skips ordinarios corresponden a suites PostgreSQL que requieren sus flags
explícitos y fueron ejecutadas por separado con PostgreSQL real.

El dominio verifica IDs/revisiones/instantes, invariantes, transiciones,
revocación terminal, inmutabilidad, no wildcard y contrato público sanitizado.

Las pruebas añadidas cubren translator PostgreSQL, retryability, allowlist
23503, diagnóstico interno, sanitización pública, lower/higher
`bindingRevision`, defensa en profundidad y contratos del harness semántico.
