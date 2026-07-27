# Demostraciones manuales de mutación

Además de la campaña automática, cinco mutaciones críticas se ejecutaron de
forma aislada sobre
`2988bcdf362505776f7bc111e3d590aee358d2ce`.

| ID | Riesgo | Build | Test objetivo | Resultado | Duración | Cleanup |
| --- | --- | --- | --- | --- | ---: | --- |
| `MUT-024-01` | tenant scope de Station | exit 0 | `station lookup never crosses tenant scope` | causal / killed | 6304 ms | PASS |
| `MUT-024-04` | `bindingRevision` omitida | exit 0 | `resolver rejects lower and higher binding revisions before issuing trust` | causal / killed | 6320 ms | PASS |
| `MUT-024-07` | `FOR UPDATE` omitido | exit 0 | `station and binding locks execute FOR UPDATE` | causal / killed | 6320 ms | PASS |
| `MUT-024-11` | revoke deja binding abierto | exit 0 | `link, unlink, relink and revoke preserve history and close the active binding` | causal / killed | 6269 ms | PASS |
| `MUT-024-15` | error interno expuesto | exit 0 | tres targets sanitizados declarados | causal / killed | 6210 ms | PASS |

En los cinco casos:

- la transformación se aplicó;
- el código mutado compiló;
- el target pasó en baseline;
- el test objetivo exacto falló con firma causal compatible;
- la clasificación fue `EXPECTED_TEST_FAILURE`;
- `causalMatch` y `killed` fueron `true`;
- no hubo timeout ni fallo ajeno;
- el workspace temporal se destruyó;
- no quedó archivo residual;
- el working tree original conservó exactamente su estado.
