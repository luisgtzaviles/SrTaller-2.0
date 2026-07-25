# Manifest y drift

## Manifest

Cada inspección produce un objeto inmutable con:

- root normalizado, nunca path absoluto;
- modo `source` o `compiled`;
- filename y migration name;
- timestamp UTC;
- owner;
- acción;
- orden;
- tamaño;
- SHA-256 del contenido;
- SHA-256 agregado.

El hash agregado se calcula sobre JSON canónico de versión, root normalizado,
modo y todos los metadatos ordenados.

## Gate de ejecución

El journal estándar de Kysely no guarda checksums. Git, el commit revisado y el
expediente conservan el contenido autorizado. Por eso:

- status sin expectativa devuelve `unverified`;
- una mutación sin `expectedManifestHash` falla;
- un hash distinto falla antes de adquirir conexión;
- el manifest se recalcula después de obtener lock y debe seguir idéntico;
- el import relee el archivo y exige su hash individual.

Esto detecta archivo editado o eliminado, conjunto distinto, orden
intercalado, duplicado y cambio entre inspection e import. No se añadió una
tabla de checksums ni metadata productiva fuera de DEC-050.
