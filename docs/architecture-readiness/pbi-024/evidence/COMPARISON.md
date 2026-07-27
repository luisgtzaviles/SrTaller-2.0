# Comparación autoritativa

Los manifests PostgreSQL locales y remotos comparten
`comparableSha256`:

`16cfb89dd2b603a95f53683e9314c0fa4de835ff20330d6eef23f85c93ecfaa6`.

## Push

- workflow/job: `30234014251` / `89880786495`;
- head: `2b89279eeda6fd3cfa4b76bae34460c520abd784`;
- artifact: `vc024-comparison`, ID `8641313610`;
- artifact JSON SHA-256:
  `6c7033ea1f4c1f87bc3e1348e5067470c45c88ffaff5170d9d4acabcd831c8a9`;
- comparable global izquierdo/derecho:
  `3d04db78c5c17fdf745fa5d32810353454576e1bb54c3fac7a48bcd39e332fb6`;
- diferencias: ninguna;
- `equivalent: true`;
- resultado: `SUCCESS`.

## Pull request

- workflow/job: `30234016330` / `89880870322`;
- head del PR: `2b89279eeda6fd3cfa4b76bae34460c520abd784`;
- merge ref sintético probado:
  `298a21ec2821359fe837f9768419699a856a9b71`;
- artifact: `vc024-comparison`, ID `8641322901`;
- artifact JSON SHA-256:
  `508b522b3a718b3bc4bb032f5bd86c948052c1eb2798c6b5c38c6af3914a9199`;
- comparable global izquierdo/derecho:
  `b0a53e3b8b92d6cd667f84f610717feba4b7c2168a2c44b508a07cf50b3a3de7`;
- diferencias: ninguna;
- `equivalent: true`;
- resultado: `SUCCESS`.

Las comparaciones descargadas se recalcularon localmente y resultaron
idénticas byte a byte. El merge ref de GitHub no equivale a un merge real.
