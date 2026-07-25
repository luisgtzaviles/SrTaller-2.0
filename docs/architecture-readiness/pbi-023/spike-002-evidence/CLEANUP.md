# Cleanup y sanitización

## Resultado por run

| Verificación | Run 1 | Run 2 |
|---|---:|---:|
| exit code | `0` | `0` |
| contenedores huérfanos | `0` | `0` |
| volúmenes huérfanos | `0` | `0` |
| redes huérfanas | `0` | `0` |
| puertos publicados | `0` | `0` |
| archivo runtime env eliminado | sí | sí |
| directorio de ejecución eliminado | sí | sí |

El controlador identificó recursos exclusivamente mediante labels sintéticos
del run y nunca aplicó cleanup global.

## Recursos temporales

- contenedor PostgreSQL por run: eliminado;
- contenedor Node por run: eliminado;
- volumen PostgreSQL por run: eliminado;
- red privada por run: eliminada;
- bases y tablas experimentales: destruidas con el volumen;
- `node_modules` y `dist` experimentales: destruidos con el directorio;
- `dist` generado por los gates del repositorio: eliminado con el comando
  canónico de limpieza;
- archivo de credencial modo `0600`: eliminado;
- directorio temporal del laboratorio: eliminado tras preservar evidencia;
- imágenes descargadas sólo para este spike: eliminadas al cierre.

## Sanitización

Antes de conservar el paquete:

- los resultados automatizados comprobaron cero ocurrencias de la credencial
  sintética y de paths personales;
- la evidencia cruda temporal no tuvo coincidencias para URLs PostgreSQL,
  encabezados Authorization/Bearer, variables de credencial ni asignaciones
  de password;
- no se copiaron logs crudos al repositorio;
- IDs de contenedores se conservaron por ser efímeros, seguros y requeridos
  para trazabilidad;
- no se conservó host, usuario, base, password ni connection string.

Las palabras “password”, “token” y “secret” pueden aparecer únicamente como
conceptos normativos o patrones de escaneo, nunca con un valor.
