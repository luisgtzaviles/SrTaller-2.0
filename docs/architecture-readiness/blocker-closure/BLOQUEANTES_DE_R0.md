# Bloqueantes de R0 — Fundación Ejecutable

## Resultado que debe producir R0

R0 demuestra una fundación mínima que resuelve tenant, sucursal, estación y usuario desde fuentes confiables, deniega accesos cruzados, evalúa permisos, expone salud y errores seguros y conserva trazabilidad sin incluir todavía una orden de negocio.

El Responsable de Producto aprobó este alcance, sus exclusiones y contrato de
salida el 2026-07-21 (`DEC-002`, `DEC-062`). El
[dictamen final](../R0_AUTHORIZATION.md) autoriza exclusivamente PBI-023; no
implementa R0 ni constituye aceptación formal de una demostración.

## Prerrequisito

H0 está completo en 9/0 y VC-024 está `Closed / PASS`. B-21 registra
autorización explícita ya efectiva dentro del alcance de PBI-023 tras el cierre
de Sprint 00 y la revisión final. DEC-044, DEC-049, DEC-051 y
DEC-063 están aceptadas, pero sus condiciones de materialización siguen
obligatorias. Aceptar un contrato no sustituye su evidencia ni las decisiones
H1.

## Bloqueantes H1

| Grupo | IDs | Cierre requerido |
| --- | --- | --- |
| Multitenancy y datos | DEC-006 a DEC-009 | ADR-004/010 aplicados con propiedad, contexto inmutable y pruebas de aislamiento |
| Contexto operativo | DEC-009 a DEC-012 | Modelo aceptado en ADR-010; faltan aplicación y pruebas de estación, ausencia y conflictos |
| Identidad y sesión | DEC-013 a DEC-016 | Modelo aceptado en ADR-011; faltan mecanismos, aplicación, modelo de amenazas y pruebas |
| Autorización ordinaria | DEC-017 y DEC-018 | Modelo aceptado en ADR-012; faltan composición por rebanada, aplicación y pruebas |
| Acciones sensibles | DEC-019 y DEC-020 | Modelo aceptado en ADR-013; faltan clasificación concreta, mecanismo, aplicación y pruebas |
| Tiempo | DEC-037 y DEC-038 | Autoridad de zona horaria y almacenamiento/presentación coherentes |
| Señales | DEC-045 a DEC-048 | Logs, auditoría, correlación y observabilidad mínima separadas |
| Persistencia | DEC-050 | Versionado y ejecución segura de migraciones base |
| Datos de prueba | DEC-052 | Fixtures/semillas sin datos reales y con dos tenants |
| Secretos | DEC-055 | Configuración externa, cifrado aplicable, rotación y no exposición |

## Lo que debe decidir el Responsable de Producto

- datos globales frente a tenant/sucursal;
- operación mediante PIN y cierre por inactividad;
- composición mínima de roles/capacidades de R0 y clasificación nivel 1–4 de sus acciones;
- zona horaria por tenant o sucursal;
- autoridad de soporte y administración excepcional.

## Lo que debe decidir arquitectura, seguridad e ingeniería

- estrategia de aislamiento y defensa en profundidad;
- contrato de contexto y propagación;
- sesión, rate limiting de PIN, propagación verificable de revocación y mecanismo reforzado compatible con ADR-013;
- contratos de repositorio tenant-aware;
- auditoría mínima que no dependa de logs;
- migraciones, secretos, health checks y pruebas negativas.

## Spikes condicionados

- SPIKE-002 es obligatorio antes de persistencia tenant-scoped con esquema compartido.
- SPIKE-003 es obligatorio sólo antes de adoptar RLS; no bloquea cualquier persistencia de R0 y puede concluir rechazándola.
- SPIKE-005 es obligatorio si PIN/estación forma parte de R0.
- SPIKE-001 se difiere si R0 resuelve tenant sin wildcard ni cliente web tenant-aware.

Ningún spike puede ejecutarse sin autorización. Su resultado informa ADRs; no los acepta.

## Cierre de R0

R0 no se cierra porque la aplicación responda. Debe demostrar con al menos dos tenants que falta o manipulación de contexto falla cerrada, que una sesión o capacidad revocada deja de operar, que la autorización negativa se evalúa server-side por acción y alcance y que auditoría/logs distinguen actor, alcance y correlación sin secretos.
