# Política del directorio de migraciones

## Ruta autoritativa

La policy DEC-005 reserva:

`src/infrastructure/database/migrations/`

El artefacto compilado equivalente es resuelto desde
`dist/infrastructure/database/migrations/`. No se acepta un path proporcionado
por módulo, request o usuario.

## Decisión del Paso 8

Se adoptó la opción 3 del gate: la ruta productiva permanece inexistente hasta
que el Paso 9 cree la primera migración real. Crear un directorio vacío, `.keep`
o archivo contractual dentro del root violaría el principio de no placeholders
y además podría confundirse con discovery.

El runner productivo responde
`DATABASE_MIGRATION_DIRECTORY_MISSING`. Los tests usan una fuente interna no
exportada por la API del runner y roots temporales autorizados bajo
`test/fixtures/database-migrations/`.

## Contención

El provider:

1. recibe root y root autorizado inmutables;
2. normaliza y comprueba contención;
3. hace `lstat` y `realpath`;
4. rechaza root o entry symlink;
5. rechaza traversal, subdirectorios y archivos desconocidos;
6. vuelve a validar path y hash justo antes del import.

No escanea `src`, no usa glob y no ignora entradas silenciosamente.
