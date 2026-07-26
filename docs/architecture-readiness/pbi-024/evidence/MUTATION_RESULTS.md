# Resultados de mutaciones

`node --test test/station-critical-mutations.test.mjs`:

- mutaciones: 25;
- killed: 25;
- survived: 0;
- skipped: 0;
- restauración/hash de cada copia: `PASS`.

`MUT-024-01`–`MUT-024-25` cubren eliminación de tenant scope, branch
eligibility, branch inexistente/cross-tenant, confianza en input cliente,
Station revocada, revisión, row lock, efecto fuera de transacción,
deny-to-allow, anti-enumeración, fallback, mutabilidad, binding abierto o
incorrecto y atomicidad Station/Binding.
