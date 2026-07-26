# Topología de CI

## Diseño seleccionado

Se seleccionó Docker explícito dentro de los jobs matrix existentes. Esta
opción reutiliza los harnesses gobernados, permite fijar digest, asignar un
label de cleanup y comprobar residuos. Un service container único no habría
dado el mismo aislamiento por suite ni la misma inspección explícita.

```text
push o pull_request
  ├─ VC-024 run-1
  │    ├─ gates generales
  │    ├─ 5 suites PostgreSQL, cada una con contenedor y DB nuevos
  │    ├─ cleanup always
  │    └─ artifact vc024-run-1
  ├─ VC-024 run-2
  │    ├─ gates generales
  │    ├─ 5 suites PostgreSQL, cada una con contenedor y DB nuevos
  │    ├─ cleanup always
  │    └─ artifact vc024-run-2
  └─ VC-024 comparison
       ├─ descarga ambos artifacts
       ├─ normaliza sólo campos variables permitidos
       └─ artifact vc024-comparison
```

## Fail-closed

- falla si Docker no obtiene el digest gobernado;
- falla si OS/arquitectura/versiones no coinciden;
- falla si falta una de las cinco suites;
- falla ante test fallido, cancelado, pendiente o skipped;
- falla si migración, schema, aislamiento, cleanup o sanitización no pasan;
- falla si el hash comparable difiere;
- cleanup se ejecuta con semántica `always()` y su resultado queda visible.

## Ejecuciones observadas

| Evento | Run ID | SHA reportado por GitHub | Resultado |
|---|---:|---|---|
| push | `30185110105` | `9e38f20900e2be4df7680a936fdfee077e6c6950` | success |
| pull_request | `30185111056` | `9e38f20900e2be4df7680a936fdfee077e6c6950` | success |

Los artefactos del PR contienen el SHA sintético `33e886c5…`; véase
[COMPARISON.md](COMPARISON.md).
