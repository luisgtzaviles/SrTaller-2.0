# Cleanup

## Resultado por ejecución

Los cuatro manifests PostgreSQL registran:

| Recurso | Residual |
|---|---:|
| contenedores gobernados | 0 |
| volúmenes | 0 |
| redes dedicadas | 0 |
| archivos persistentes | 0 |
| dumps | 0 |
| archivos de entorno | 0 |

Cada suite reportó `cleanup: PASS`; el step separado
`Cleanup PostgreSQL persistence suites` terminó `success` en los cuatro jobs.

## Controles

- label allowlisted por ejecución;
- teardown de cada harness aun ante error;
- cleanup global con semántica `always`;
- inspección final de contenedores por label;
- sin cache de data directory;
- sin volumen o red manual;
- puertos y procesos limitados al lifecycle del contenedor.

## Local

Los dos runs locales también terminaron sin contenedores etiquetados
residuales. Los artifacts descargados se mantuvieron en un directorio temporal
no versionado durante la validación y se eliminaron al finalizar la tarea.
