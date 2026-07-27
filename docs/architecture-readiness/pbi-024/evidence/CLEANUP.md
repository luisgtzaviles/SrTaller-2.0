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

Los dos runs locales PostgreSQL y los cuatro jobs remotos registraron:

- contenedores residuales: 0;
- volúmenes: 0;
- redes dedicadas: 0;
- archivos persistentes/dumps/`.env`: 0.

Las 25 mutaciones, las cinco demostraciones manuales y los casos negativos
A–J registraron symlink controlado, `cleanupStatus: PASS`, cero procesos
hijos, `residualWorkspace: false` y `workingTreePreserved: true`.

Parser failure y unrelated failure también recorren `finally`; las pruebas
negativas verificaron que no dejan workspace ni modificación residual.
