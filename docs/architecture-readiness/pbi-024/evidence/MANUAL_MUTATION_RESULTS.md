# Demostraciones manuales de mutación

Además de la campaña automática, cinco mutaciones críticas se ejecutaron de
forma aislada sobre
`2b89279eeda6fd3cfa4b76bae34460c520abd784`.

| ID | Riesgo | Build | Test objetivo | Resultado | Duración | Cleanup |
| --- | --- | --- | --- | --- | ---: | --- |
| `MUT-024-01` | tenant scope de Station | exit 0 | `station lookup never crosses tenant scope` | exit 1 por el defecto sembrado | 1927 ms | PASS |
| `MUT-024-04` | `bindingRevision` omitida | exit 0 | `resolver rejects lower and higher binding revisions` | exit 1 por el defecto sembrado | 1658 ms | PASS |
| `MUT-024-07` | `FOR UPDATE` omitido | exit 0 | `station and binding locks execute FOR UPDATE` | exit 1 por el defecto sembrado | 1649 ms | PASS |
| `MUT-024-11` | revoke deja binding abierto | exit 0 | `link, unlink, relink and revoke preserve history` | exit 1 por el defecto sembrado | 1643 ms | PASS |
| `MUT-024-15` | error interno expuesto | exit 0 | `public error contract is stable, sanitized` | exit 1 por el defecto sembrado | 1673 ms | PASS |

En los cinco casos:

- la transformación se aplicó;
- el código mutado compiló;
- el test objetivo falló y su nombre coincidió con el contrato esperado;
- no hubo timeout ni fallo ajeno;
- el workspace temporal se destruyó;
- no quedó archivo residual;
- el working tree original conservó exactamente su estado.
