# Criterios de piloto

## Regla

Un piloto usa operación y datos reales bajo límites explícitos. No es un ambiente para descubrir invariantes básicas, probar restauración por primera vez ni decidir quién tiene autoridad.

## Producto y operación

- [ ] R1–R5 completan el recorrido seleccionado para el piloto;
- [ ] recepción, diagnóstico, autorización, ejecución y entrega tienen criterios aceptados;
- [ ] inicio y fin de custodia, entrega a terceros y correcciones están definidos;
- [ ] tenant, sucursal, usuarios, roles y volumen del piloto están delimitados;
- [ ] convivencia o corte con SR Taller 1.0 tiene fuente de verdad única;
- [ ] doble captura, reconciliación y retorno al legado están prohibidos o gobernados;
- [ ] soporte, responsables, horarios y escalamiento están acordados;
- [ ] criterios de éxito, aborto y salida del piloto son observables;
- [ ] usuarios operativos fueron preparados con escenarios reales.

## Seguridad y datos

- [ ] threat models de tenant, identidad, archivos y acciones sensibles revisados;
- [ ] aislamiento cross-tenant y cross-branch probado con intentos negativos;
- [ ] permisos y reautenticación probados por actor y alcance;
- [ ] secretos, cifrado y accesos operativos están gobernados;
- [ ] datos iniciales tienen origen, reconciliación y validación documentados;
- [ ] archivos tienen tipos, tamaños, cuotas y controles activos;
- [ ] auditoría permite reconstruir acciones críticas del recorrido;
- [ ] no se utilizan datos productivos fuera del alcance autorizado.

## Recuperación y operación técnica

- [ ] backup de datos y archivos ejecutado con evidencia;
- [ ] restauración aislada ejecutada y reconciliada;
- [ ] rollback o roll-forward tiene runbook y autoridad;
- [ ] migraciones fueron ensayadas sobre un conjunto representativo;
- [ ] health, readiness, logs, correlation ID, métricas y alertas mínimas están activas;
- [ ] fallos de impresión, archivos e integraciones degradan según contrato;
- [ ] rendimiento cualitativo de los recorridos críticos fue validado con carga representativa;
- [ ] incidentes tienen clasificación, comunicación y registro.

## Evidencia de aprobación

- [ ] no existen bloqueantes H3 críticos abiertos;
- [ ] riesgos residuales tienen dueño y aceptación explícita;
- [ ] Producto, Operaciones, Seguridad, Calidad y Arquitectura aprobaron la entrada;
- [ ] fecha y alcance de la revisión de salida quedaron registrados.

Si un criterio no aplica, debe documentarse la razón y la autoridad que acepta su exclusión. “Se probará en producción” no es una exclusión válida.
