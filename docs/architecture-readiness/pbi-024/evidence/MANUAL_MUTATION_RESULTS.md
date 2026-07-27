# Demostraciones manuales de mutación

Además de la campaña automática, cinco mutaciones críticas se ejecutaron de
forma aislada sobre
`e02f4acb84bf67cfa8683c0dfb0fffc202bdcd66`.

| ID | Riesgo | Build | Test objetivo | Resultado | Duración | Cleanup |
| --- | --- | --- | --- | --- | ---: | --- |
| `MUT-024-01` | tenant scope de Station | exit 0 | `station lookup never crosses tenant scope` | exit 1 por el defecto sembrado | 1907 ms | PASS |
| `MUT-024-04` | `bindingRevision` omitida | exit 0 | `resolver rejects lower and higher binding revisions` | exit 1 por el defecto sembrado | 1717 ms | PASS |
| `MUT-024-07` | `FOR UPDATE` omitido | exit 0 | `station and binding locks execute FOR UPDATE` | exit 1 por el defecto sembrado | 1699 ms | PASS |
| `MUT-024-11` | revoke deja binding abierto | exit 0 | `link, unlink, relink and revoke preserve history` | exit 1 por el defecto sembrado | 1692 ms | PASS |
| `MUT-024-15` | error interno expuesto | exit 0 | `public error contract is stable, sanitized` | exit 1 por el defecto sembrado | 1763 ms | PASS |

En los cinco casos:

- la transformación se aplicó;
- el código mutado compiló;
- el test objetivo falló y su nombre coincidió con el contrato esperado;
- no hubo timeout ni fallo ajeno;
- el workspace temporal se destruyó;
- no quedó archivo residual;
- el working tree original conservó exactamente su estado.
