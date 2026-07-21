# Criterios de producción

## Precondición

Producción exige un piloto cerrado con evidencia o una justificación equivalente aprobada. No basta con que el sistema funcione en el recorrido feliz.

## Producto, legalidad y ciclo de tenant

- [ ] oferta inicial, límites y comportamiento al excederlos están aprobados;
- [ ] alta, administración, suspensión, reactivación y cierre de tenants están definidos;
- [ ] suspensión no destruye datos ni deja operaciones críticas ambiguas;
- [ ] exportación, retención, eliminación y evidencia de cierre están acordadas;
- [ ] avisos, consentimiento y obligaciones aplicables fueron revisados;
- [ ] soporte, comunicación de incidentes y niveles de servicio están definidos;
- [ ] criterios de aceptación de producción y autoridad de go/no-go son explícitos.

## Seguridad

- [ ] hardening de aplicación, infraestructura y configuración completado;
- [ ] aislamiento, autorización, sesión, reautenticación y archivos pasaron pruebas de seguridad;
- [ ] vulnerabilidades críticas o altas están cerradas o excepcionalmente aceptadas;
- [ ] secretos tienen fuente externa, privilegio mínimo, rotación y respuesta a exposición;
- [ ] accesos administrativos excepcionales están limitados y auditados;
- [ ] logs y auditoría no exponen secretos ni datos personales innecesarios;
- [ ] retención y acceso a auditoría están aplicados.

## Datos y cambios

- [ ] migraciones tienen compatibilidad, respaldo y estrategia de roll-forward/rollback;
- [ ] integridad y reconciliación tienen consultas o controles repetibles;
- [ ] backup y restore cubren datos, configuración y archivos necesarios;
- [ ] objetivos de pérdida y recuperación fueron aprobados y demostrados;
- [ ] cierre o migración del legado evita dos fuentes de verdad;
- [ ] datos semilla, fixtures y pruebas no usan copias productivas no autorizadas.

## Fiabilidad y capacidad

- [ ] objetivos de rendimiento por recorrido fueron medidos con carga representativa;
- [ ] capacidad esperada y disparadores de escalamiento están documentados;
- [ ] health, readiness, métricas, alertas y tableros tienen dueño;
- [ ] degradación de proveedores y reintentos no violan invariantes;
- [ ] idempotencia fue probada en creación, autorización, pago y entrega cuando aplique;
- [ ] soporte y guardias pueden ejecutar runbooks sin conocimiento tácito;
- [ ] simulación de incidente y recuperación produjo evidencia aceptable.

## Release

- [ ] artefacto reproducible, versionado y trazable a un commit;
- [ ] separación de ambientes y configuración validada;
- [ ] pipeline y gates de seguridad/calidad están verdes;
- [ ] despliegue controlado y smoke no destructivo están documentados;
- [ ] plan de comunicación, rollback y verificación post-release está aprobado;
- [ ] no existen bloqueantes H4 críticos abiertos;
- [ ] riesgo residual y go/no-go quedaron firmados por las autoridades correspondientes.
