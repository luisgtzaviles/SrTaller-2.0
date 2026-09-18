# UX-005.6A — Pending Brand Display Canonicalization

- **Estado:** implementación local lista para Owner Review; no integración ni despliegue.
- **Alcance:** presentación y propuesta de nombres de `Brand` pendientes; no cambia identidad, gobernanza ni persistencia.

## Cuatro conceptos distintos

| Concepto | Ejemplo | Autoridad / uso |
|---|---|---|
| Observación raw | `SAMSUNG` | Provenance inmutable del proveedor. |
| Clave normalizada | `samsung` | Agrupación e igualdad exacta Tenant-wide. |
| Nombre de presentación / propuesta | `Samsung` | Etiqueta legible de la gobernanza y valor inicial al promover. |
| Brand canónica | `Samsung` | Identidad Tenant autoritativa sólo después de una resolución explícita. |

La presentación nunca reescribe el raw, Supplier Listing histórico, clave de
agrupación, `CatalogItem`, Memory ni Resolution. Tampoco crea una Brand ni
resuelve un grupo por sí misma.

## Regla determinista compartida

`normalizeBrandDisplay` recibe el raw y las Brands canónicas activas visibles
para el Tenant:

1. normaliza sólo Unicode, espacios de borde e internos para producir una
   representación legible;
2. si existe una Brand canónica con la misma identidad normalizada exacta, usa
   exactamente su spelling canónico;
3. sin canon exacto, una palabra o compuesto alfabético de casing uniforme se
   presenta en casing legible por palabra;
4. un token compacto completamente en mayúsculas de tres letras o menos se
   conserva como acrónimo (`LG`, `ZTE`, `JBL`);
5. casing mixto significativo se conserva (`iFixit`); y
6. símbolos, números o valores que no son palabras humanas no reciben una
   inferencia tipográfica nueva.

La regla no contiene un diccionario comercial, no hace fuzzy matching y no
convierte `SAMSUGN` en `Samsung`. La identidad normalizada existente continúa
siendo la única base de agrupación y coincidencia.

## Superficie y promoción explícita

En `Configuración → Lista de precios → Marcas → Por revisar`, la primera
columna presenta la propuesta legible. La provenance permanece disponible como
`Observado: <raw> · clave <normalizedKey>`. El diálogo conserva el raw en su
descripción y, si el operador elige crear una Brand, inicia el campo con el
nombre de presentación. El operador todavía debe revisar y confirmar la
resolución; asignar una Brand existente sólo usa coincidencia normalizada exacta.

La lectura sigue requiriendo `catalog.configuration.read`; promover/asignar
sigue requiriendo `catalog.configuration.manage`. No se introduce capability,
API, migration ni escritura de PostgreSQL.

## AviCell protegido

El proof local es de sólo lectura: los 16 grupos de Brand pendientes de
AviCell, que representan 618 items, se presentan con casing legible sin
promoción, asignación, relink, reescritura histórica ni alteración de la fila
411. `Honor`, `Alcatel`, `Google`, `Cubot`, `ZTE`, `Motorola`, `Hisense`,
`Oppo`, `Realme`, `Xiaomi`, `Oneplus`, `Vivo`, `Poco`, `Huawei`, `LG` y
`Samsung` son evidencia de la regla genérica, no un registro de excepciones.

## Evidencia focalizada

Las pruebas cubren raw/provenance, la agrupación `samsung`, canon exacto
`Apple`, casing uniforme, acrónimos, casing mixto, ausencia de fuzzy matching,
la propuesta de promoción y los contratos de UI/autorización. El cambio no
activa el benchmark de 10k ni `verify:full`.
