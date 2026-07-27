# Comparación autoritativa

Los manifests PostgreSQL locales y remotos comparten
`comparableSha256`:

`16cfb89dd2b603a95f53683e9314c0fa4de835ff20330d6eef23f85c93ecfaa6`.

## Push

- workflow/job: `30239752229` / `89897390062`;
- head: `2988bcdf362505776f7bc111e3d590aee358d2ce`;
- artifact: `vc024-comparison`, ID `8643171055`;
- artifact JSON SHA-256:
  `59bb126e059e1b05b72f7b16e17f98ab2861d6fc07f49ce5ed113ddb559bcb11`;
- comparable global izquierdo/derecho:
  `343de1422606765954930c0ac3e08338c0ad9a8f05f812e13094a78c17a1dc92`;
- diferencias: ninguna;
- `equivalent: true`;
- resultado: `SUCCESS`.

## Pull request

- workflow/job: `30239754842` / `89897351391`;
- head del PR: `2988bcdf362505776f7bc111e3d590aee358d2ce`;
- merge ref sintético probado:
  `dc93f154642f04ce6caebc3d6d12f1c8907147fa`;
- artifact: `vc024-comparison`, ID `8643166424`;
- artifact JSON SHA-256:
  `2e3adee076e8d1dee1c6eb76aa0a3b4b4312ea4a74d611422a082f10931a2566`;
- comparable global izquierdo/derecho:
  `b96a7205e7e3df73b33cb69c7206d530ee68cc53235598cc0f43ae2820206ab5`;
- diferencias: ninguna;
- `equivalent: true`;
- resultado: `SUCCESS`.

Las comparaciones descargadas se recalcularon localmente y resultaron
idénticas byte a byte. El merge ref de GitHub no equivale a un merge real.
