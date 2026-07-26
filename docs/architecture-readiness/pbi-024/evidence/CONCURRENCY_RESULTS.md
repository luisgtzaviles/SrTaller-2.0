# Resultados de concurrencia

La unidad de trabajo usa `READ COMMITTED`. Toda operación protegida:

1. inicia transacción;
2. bloquea la fila Station con `FOR UPDATE`;
3. revalida estado y `stationRevision`;
4. bloquea/consulta el binding vigente;
5. ejecuta el efecto dentro de la misma transacción.

PostgreSQL real verificó:

- efecto obtiene lock antes que revoke;
- revoke obtiene lock antes que efecto;
- relink concurrente rechaza revisión obsoleta;
- estaciones distintas no usan lock global;
- fallo del efecto revierte y libera;
- tenant scope se conserva bajo lock.

No se cambió a `SERIALIZABLE` y no se introdujo retry oculto.
