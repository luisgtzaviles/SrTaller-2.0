# Comparación autoritativa

Los manifests PostgreSQL locales y remotos comparten
`comparableSha256`:

`16cfb89dd2b603a95f53683e9314c0fa4de835ff20330d6eef23f85c93ecfaa6`.

## Push

- workflow/job: `30232400104` / `89875512269`;
- head: `e02f4acb84bf67cfa8683c0dfb0fffc202bdcd66`;
- artifact: `vc024-comparison`, ID `8640714457`;
- artifact JSON SHA-256:
  `247dec2e92b9a8ab7ac95848cffaaaf068d8e4ad2cb5a3555b70a04ab3caf77b`;
- comparable global izquierdo/derecho:
  `a5c79f2c345c6e2b642b948e1b19693a17bc9a840441480ac3a0fd1f263485d6`;
- diferencias: ninguna;
- `equivalent: true`;
- resultado: `SUCCESS`.

## Pull request

- workflow/job: `30232401232` / `89875502418`;
- head del PR: `e02f4acb84bf67cfa8683c0dfb0fffc202bdcd66`;
- merge ref sintético probado:
  `c63120cdd07aa88565cd05b42c389379ee29015c`;
- artifact: `vc024-comparison`, ID `8640713753`;
- artifact JSON SHA-256:
  `29a73a569724fe76a9d01e5a44082b0b486bb8e3fecb0bfa013176f9cca13310`;
- comparable global izquierdo/derecho:
  `ff3bd8478dba92c5ba0689468ca04b58cae12f1027111c48a35ee90cd1b7e8bc`;
- diferencias: ninguna;
- `equivalent: true`;
- resultado: `SUCCESS`.

Las comparaciones descargadas se recalcularon localmente y resultaron
idénticas byte a byte. El merge ref de GitHub no equivale a un merge real.
