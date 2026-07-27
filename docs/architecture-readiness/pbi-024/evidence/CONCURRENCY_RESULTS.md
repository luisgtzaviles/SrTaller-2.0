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
- relink concurrente con dos conexiones físicas y transacciones
  independientes rechaza revisión obsoleta;
- escenario inverso con la segunda conexión como ganadora;
- PID de backend y transaction ID distintos/equivalentes según corresponda;
- exactamente una operación exitosa y una
  `STATION_CONTEXT_STALE`/`Concurrency`/`never`;
- Station final `Active`, revisión `N + 2`, binding A cerrado y exactamente un
  binding B abierto;
- ausencia expresa de `NESTED_FORBIDDEN`;
- conflicto `SERIALIZABLE` real traducido desde `40001` hasta
  `STATION_TRANSIENT_CONCURRENCY`/`conditional`;
- estaciones distintas no usan lock global;
- fallo del efecto revierte y libera;
- tenant scope se conserva bajo lock.

El lifecycle ordinario permanece `READ COMMITTED`; el escenario
`SERIALIZABLE` existe sólo para demostrar la traducción end-to-end de
`40001`. No se introdujo retry oculto.
