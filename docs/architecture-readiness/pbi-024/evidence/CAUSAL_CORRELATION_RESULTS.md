# Evidencia de correlación causal

## Resultado

SHA técnico:
`2988bcdf362505776f7bc111e3d590aee358d2ce`.

| Evidencia | Resultado |
| --- | --- |
| falso positivo anterior reproducido | PASS |
| reporter estructurado | `srtaller-node-test-results/v1` |
| identidad | archivo + nombre completo exacto |
| parser | PASS, 9 pruebas |
| negativos A–J | PASS |
| baseline | PASS, 34 pruebas |
| declaraciones objetivo | 35, todas inequívocas y PASS en baseline |
| campaña | 25/25 `EXPECTED_TEST_FAILURE` |
| `causalMatch` | 25/25 `true` |
| unrelated / unexpected | 0 / 0 |
| survived / timeout | 0 / 0 |
| parser / infrastructure failures | 0 / 0 |
| cleanup failures | 0 |
| regresión expected test incorrecto | PASS, rechazada |
| demostraciones manuales | 5/5 PASS |

## Antes y después

| Campo | Antes | Después |
| --- | --- | --- |
| expected incorrecto | revocación terminal | revocación terminal |
| prueba que realmente falla | tenant scope | tenant scope |
| matching | substring en output | identidad exacta estructurada |
| `expectedTestsFailed` | no existía | `[]` |
| `unexpectedTestsFailed` | no existía | tenant scope |
| `causalMatch` | implícitamente verdadero | `false` |
| clasificación | no existía | `UNRELATED_TEST_FAILURE` |
| `killed` | `true` incorrecto | `false` |
| campaña | aceptada | rechazada |

## Artifacts técnicos

| Evento | Run | Artifact ID | Digest GitHub |
| --- | --- | ---: | --- |
| push | run-1 | `8643151064` | `sha256:1c7ffec77699732dd20afc6df993ef8c8f4efa9b10ac14accd0a3fcdc9b52a2f` |
| push | run-2 | `8643166960` | `sha256:f6a46b0351cebf9d4437a7ebb0cbd295eda086f2debb982dbc4ed1044f57d5c7` |
| push | comparison | `8643171055` | `sha256:a2ed5865c919c46c37518fc5df35a7c69f20bb3b546d3e244b03901e9a3cc393` |
| pull_request | run-1 | `8643162500` | `sha256:b1843350e98ec002a92ec1f4cf503ac9099030eed4ec2d1e877e05b07b38bace` |
| pull_request | run-2 | `8643158764` | `sha256:7bd54b4820f81fb7ec31ce96a92f526c236c03f8dc2eb7dc5188ddf0936178bb` |
| pull_request | comparison | `8643166424` | `sha256:1b5b85c3eabe778a3a4d600e943181028deb96254958966a240118b47ae07a53` |

Los artifacts fueron descargados, sus JSON parseados, los manifests
validados y sus comparaciones recalculadas. No contienen secretos, connection
strings, llaves privadas, tokens, rutas personales ni datos reales.

## Hashes descargados

| Evento / run | Evidencia | Mutaciones | PostgreSQL | Dist |
| --- | --- | --- | --- | --- |
| push / run-1 | `428b1003db7205cfb4a5e5d10e2ab42563e88f5342b0861cca84b1ebc217511a` | `5135a4b38188ed9327b14da640f8dfc98b264f3908fe5a75b00456cc44c9a8fa` | `e4961d53920281ecdab03589c5ff39a616e4b77c906d58a9e4d41254e18eb4a0` | `a14ff7b7a52d93e02bfbc323b2ce239309256d80204e98f8158a46641ac54b77` |
| push / run-2 | `e464b9d455541dd19579a650e5a12ab5ee6bedd688d7198b80c538dd2b1dc453` | `7edc82933c4116c67d664e6a4a2b58f610fa44484174e37166c41105a2375e4d` | `aadad6586210e636cafd2077f968cccec410f207d44c18ad01223f503df3503b` | `a14ff7b7a52d93e02bfbc323b2ce239309256d80204e98f8158a46641ac54b77` |
| pull_request / run-1 | `f5fdaa4c7ebc058d18ca6da64d61ce1a7bde0c12f3feec792d93aeef0a5109b2` | `38fc9ab5e44d7ec68b6fe5675de1133c2683cbc98153e247df1a4b72fd90d1df` | `5d5b2baefbce4b4e314faa6e4bb2319395cb6cab03d3a0e69ed459a96f835261` | `a14ff7b7a52d93e02bfbc323b2ce239309256d80204e98f8158a46641ac54b77` |
| pull_request / run-2 | `0188602d4f6a75e69ebb6b069a54ff116f2b1247f8bc5b14c686f15d54923d97` | `50661a87caa954799142f7e44b5aacbb21ad9733e0118eb737fae63e6aadcee3` | `e41107b6e7baf16c0edea2cde795a950c6e75d1c14e781a51555074109a03a17` | `a14ff7b7a52d93e02bfbc323b2ce239309256d80204e98f8158a46641ac54b77` |

El hash material comparable de mutaciones es
`30f5728e70fd74ac1b1fed10d457c6c2d385356055578262671fb1735647d8c6`
en los cuatro artifacts.

## Comparación

| Evento | Comparison artifact SHA-256 | Comparable izquierdo/derecho | Diferencias |
| --- | --- | --- | --- |
| push | `59bb126e059e1b05b72f7b16e17f98ab2861d6fc07f49ce5ed113ddb559bcb11` | `343de1422606765954930c0ac3e08338c0ad9a8f05f812e13094a78c17a1dc92` | ninguna |
| pull_request | `2e3adee076e8d1dee1c6eb76aa0a3b4b4312ea4a74d611422a082f10931a2566` | `b96a7205e7e3df73b33cb69c7206d530ee68cc53235598cc0f43ae2820206ab5` | ninguna |

## Gobierno

El dictamen vigente previo se conserva como antecedente. Esta evidencia no es
una revisión formal independiente, no cambia el PR a Ready, no aprueba ni
fusiona el PR y no satisface DEC-051 C02.
