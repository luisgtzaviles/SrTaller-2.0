# Seguridad y sanitización

## Credenciales

Sólo se usan identidades y passwords sintéticos por lifecycle de suite. No se
usan GitHub Secrets ni datos de usuario. Los valores no se imprimen ni se
incluyen en artifacts.

## Artifact policy

Los manifests retienen versión, digest, modo de roles, hashes y resultados.
No retienen:

- password, token o private key;
- connection string;
- SQL crudo o parámetros;
- host/user real;
- UUIDs de fixtures;
- `.env`, dump o data directory;
- rutas personales o ruta del workspace del runner.

Se validaron los cuatro contratos `EVIDENCE_MANIFEST`, los cuatro contratos
`POSTGRESQL_MANIFEST` y se escanearon los catorce JSON remotos. Resultado:
`PASS`.

## DEC-055

DEC-055 no cambia sustancialmente. La CI prueba valores sintéticos y
redacción; proveedor, almacenamiento, mínimo privilegio productivo, rotación y
revocación siguen siendo trabajo operacional futuro.

## Privilegios

La identidad de cada suite es efímera. Las migraciones sólo se habilitan en
los harnesses que las necesitan. Esto no inventa una matriz productiva de
privilegios ni declara satisfecha esa parte operacional de DEC050-C06.
