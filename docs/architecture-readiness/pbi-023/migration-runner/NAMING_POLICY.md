# Política de nombres

## Formato normativo

`YYYYMMDDHHMMSS_<owner>_<verbo>_<objeto>[...].ts`

Owners permitidos en R0:

- `database`;
- `stations`;
- `tenancy`.

El source TypeScript usa `.ts`; el mismo módulo compilado usa `.js`. El
provider acepta sólo la extensión correspondiente al modo inspeccionado.

## Validaciones

- timestamp UTC válido, año igual o posterior a 2000;
- exactamente 14 dígitos;
- minúsculas ASCII y `snake_case`;
- verbo y al menos un componente de objeto;
- orden lexicográfico;
- timestamp y nombre únicos;
- sin espacio, Unicode, mayúscula, backup, sufijo temporal o archivo oculto;
- sin owner desconocido, traversal, symlink, directorio o extensión distinta.

El patrón materializado es:

```text
^\d{14}_(database|stations|tenancy)_[a-z][a-z0-9]*(?:_[a-z0-9]+)+\.(ts|js)$
```

La policy de producto conserva la variante `.ts`; `.js` sólo corresponde al
artefacto compilado y a fixtures ejecutadas desde `dist`.
