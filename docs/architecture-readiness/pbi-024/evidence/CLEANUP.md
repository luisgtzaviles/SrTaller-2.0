# Cleanup

Cada suite PostgreSQL usa base, role, password y contenedor sintéticos
efímeros. Los contenedores usan filesystem temporal y se eliminan aun ante
fallo.

Resultado local:

- contenedores residuales PBI-023: 0;
- contenedores residuales PBI-024: 0;
- volúmenes persistentes: 0;
- dumps persistentes: 0;
- archivos `.env`: 0;
- credenciales registradas: 0.

El smoke verificó listener, cierre limpio y ausencia de handles abiertos.
