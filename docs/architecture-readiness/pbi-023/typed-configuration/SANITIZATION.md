# Sanitización

`sanitizeDatabaseConfig(config)` crea un objeto nuevo, determinista y
profundamente congelado.

| Campo original | Vista segura |
|---|---|
| host | `<configured>` |
| database | `<configured>` |
| user | `<configured>` |
| password | `[REDACTED]` |
| port, SSL, pool/timeouts | valor validado |
| role/environment/access/migration flag | valor validado |
| test run ID | sólo `testRunConfigured: true/false` |
| application name y labels | valor ASCII validado |

La prueba usa un password sintético con newline, comillas, escape y secuencia
de control. Ni `JSON.stringify`, `util.inspect`, el error, su stack ni `toJSON`
contienen el secreto.

La función no intenta modificar el comportamiento de inspección del objeto
privado original: el contrato obliga a diagnosticar exclusivamente con la
vista sanitizada.
