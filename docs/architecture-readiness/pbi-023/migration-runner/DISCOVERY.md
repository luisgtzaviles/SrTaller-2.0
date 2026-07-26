# Discovery y FileMigrationProvider

## Secuencia

1. Resolver una vez root y root autorizado.
2. Rechazar root ausente, no directorio o symlink.
3. Leer únicamente sus entries inmediatos.
4. Ordenar por nombre con locale estable.
5. Validar tipo, nombre, timestamp, owner, extensión y duplicados.
6. Resolver cada archivo, comprobar contención y calcular SHA-256/tamaño.
7. Congelar manifest e inspection.
8. Construir `FileMigrationProvider` con adaptadores mínimos de `fs`, `path` e
   import que sólo reconocen los archivos del manifest.
9. Releer y comparar SHA-256 inmediatamente antes del import.

Una entrada no admitida produce error; `onFileIgnored` también falla. No existe
lista de extensiones “toleradas”.

## ESM, TypeScript y dist

El modo `source` valida nombres y contenido `.ts` sin intentar ejecutar
TypeScript. El modo `compiled` importa `.js` ESM y es el que consume
`Kysely.Migrator`. Las pruebas compilan primero con NodeNext y luego ejecutan
los módulos `.js` desde `dist`, por lo que no dependen de un transpiler runtime.

## Razón del wrapper

`FileMigrationProvider` sigue siendo el provider real de Kysely. El wrapper no
implementa otro migrador: restringe su filesystem, fija el conjunto autorizado
y agrega comprobación de integridad que el provider genérico no conoce.
