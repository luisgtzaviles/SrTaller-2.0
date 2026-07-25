# Política de down

`down` revierte como máximo una migración y nunca se ejecuta automáticamente.

El caller debe proporcionar exactamente:

- `migrationName` igual a la última aplicada;
- `expectedHash` SHA-256 igual al archivo del manifest;
- `reason` trim, entre 12 y 200 caracteres;
- `environment` igual al runtime;
- confirmación literal `REVERT_ONE_MIGRATION`.

El objeto no es un secreto. Campo ausente, adicional, nombre/hash/ambiente
incorrecto, razón inválida o migración sin función `down` produce
`DATABASE_MIGRATION_DOWN_FORBIDDEN`.

Production está prohibido por default incluso con objeto correcto. No existe
`reset`, down múltiple ni down-all. Una reversión productiva requerirá una
decisión operacional posterior; el patrón preferente sigue siendo roll-forward.

Si el código `down` falla, el runner responde
`DATABASE_MIGRATION_DOWN_FAILED`; la transacción preserva schema y journal.
