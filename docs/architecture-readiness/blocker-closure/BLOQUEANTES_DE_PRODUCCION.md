# Bloqueantes de producción general

## Alcance del gate

Producción general expone el SaaS fuera de un piloto contenido. Requiere controles repetibles, soporte sostenido y decisiones de ciclo de vida de datos/tenant; no basta con que el flujo R1–R5 funcione.

## Decisiones H4

| ID | Decisión | Cierre requerido |
| --- | --- | --- |
| DEC-056 | Retención de actividad | Política por categoría, propósito, acceso, corrección y eliminación |
| DEC-064 | Seguridad mínima para producción | Threat models, hardening, pruebas y riesgos residuales aceptados |
| DEC-066 | Escalabilidad esperada | Perfil de carga, capacidad y disparadores de revisión medidos |
| DEC-067 | Planes y límites SaaS | Oferta, entitlements, medición y excepciones definidos |
| DEC-069 | Suspensión de tenants | Efecto sobre sesiones, trabajos, lectura, exportación y reactivación |
| DEC-070 | Borrado o cierre de tenant | Retención, exportación, cierre, eliminación y evidencia legal |

## Gates transversales

- aislamiento y autorización negativos en API, datos, archivos, caché, jobs y soporte;
- secretos, dependencias y artefacto sujetos a scanning y promoción controlada;
- backups y restauración ensayados con RPO/RTO aprobados;
- logs, métricas, trazas, alertas y runbooks con owner;
- límites de carga, archivos, rate limiting y abuso validados;
- privacidad, términos, consentimiento y jurisdicción revisados por autoridad competente;
- migración, rollback y recuperación ante desastre probados;
- vulnerabilidades críticas tratadas y riesgos altos mitigados o aceptados;
- soporte, incidentes, accesos de emergencia y revocación operables.

## Decisiones que no son requisito automático

Kubernetes, microservicios, multi-región, Event Sourcing, CQRS completo, RLS, Redis, cola externa, IA y data warehouse. Sólo se activan si los requisitos de producción demostrados los necesitan y un ADR los autoriza.

## Condición de no avance

No se declara producción si el sistema depende de operación heroica, si no puede recuperar datos, si no existen reglas de suspensión/cierre o si los objetivos de seguridad y operación carecen de autoridad y evidencia.
