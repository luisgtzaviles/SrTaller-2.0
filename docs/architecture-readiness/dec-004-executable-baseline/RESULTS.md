# DEC-004 — Resultados del intento de baseline ejecutable

## Resultado final

**FAIL — BLOCKED BY ACCEPTED GOVERNANCE**

No existe una baseline ejecutable aceptable. El trabajo se detuvo antes de introducir implementación porque las decisiones y gates que gobiernan tooling, estructura, persistencia, migraciones, pruebas y autenticación técnica continúan abiertos.

## Contexto verificado

| Elemento | Resultado |
| --- | --- |
| Repositorio | `/Users/luisantoniogutierrez/Documents/GitHub/SrTaller-2.0` |
| Rama | `main` |
| HEAD inicial | `6bd9289e31fd382d6c35303f669c2c00ea7ff89f` |
| `origin/main` inicial | `6bd9289e31fd382d6c35303f669c2c00ea7ff89f` |
| Divergencia inicial | `0 0` |
| Working tree inicial | Limpio |
| Entorno | Local; sin deploy ni conexiones remotas |

## Checklist completo

| Validación solicitada | Estado | Resultado |
| --- | --- | --- |
| Baseline mínimo ejecutable | BLOCKED | `DEC-004/005/044/049/050/051/063` y decisiones técnicas de identidad siguen abiertas |
| Aplicación inicia correctamente | NOT RUN | No existe aplicación de producto autorizada |
| Compilación sin errores | NOT RUN | No existe configuración TypeScript de producto autorizada |
| Migraciones ejecutan correctamente | BLOCKED | `DEC-050` no selecciona herramienta ni contrato de ejecución |
| Autenticación básica funciona | BLOCKED | Protección del PIN, sesión, intentos y reconocimiento técnico de estación están diferidos |
| Aislamiento por tenant funciona | BLOCKED | No existe repositorio/esquema autorizado; `DEC-049` sigue abierto |
| Prueba automatizada de aislamiento | BLOCKED | `DEC-051` y la persistencia necesaria siguen abiertos |
| Respeto de ADR aceptados | PASS | Se evitó decidir mediante código asuntos expresamente diferidos |
| Sin reutilizar SPIKE-009 como scaffold | PASS | No se copió código experimental |
| Sin modificar documentación histórica | PASS | Sólo se añadieron este registro y `IMPLEMENTATION.md` |
| Sin commit ni push | PASS | No se ejecutaron |

## Validaciones y comandos ejecutados

```text
git status --short
git branch --show-current
git rev-parse HEAD
git rev-parse origin/main
git rev-list --left-right --count HEAD...origin/main
node --version
npm --version
psql --version
```

Resultados relevantes:

- Git estaba limpio y alineado antes de documentar.
- Node.js local: `v25.9.0`; no coincide con Node.js `24.x` aceptado.
- npm local: `11.12.1`; npm y su versión no están aceptados todavía como package manager de producto.
- PostgreSQL local: `18.4`; coincide con la versión efectiva inicial registrada.
- No se encontraron manifiesto, configuración TypeScript, configuración NestJS ni migraciones en la raíz del producto.

No se ejecutaron instalación de dependencias, build, servidor, SQL, migraciones ni pruebas de producto porque no existe una baseline autorizada para hacerlo.

## Evidencias documentales

- [DEC-004](../blocker-closure/DEC-004_BASELINE_TECNICA.md): estado abierto, tooling y reproducibilidad pendientes, primer cambio ejecutable bloqueado.
- [ADR-005](../../decisions/proposed/ADR-005-nestjs-backend.md): condiciones previas al primer recorrido productivo y prohibición de promover automáticamente el spike.
- [Inventario de bloqueantes](../blocker-closure/INVENTARIO_DE_BLOQUEANTES.md): `DEC-005`, `DEC-044`, `DEC-049`, `DEC-050` y `DEC-051` permanecen abiertos o propuestos.
- [Secuencia de decisiones](../blocker-closure/SECUENCIA_DE_DECISIONES.md): esos cierres preceden al primer cambio ejecutable.
- [ADR-011](../../decisions/proposed/ADR-011-tenant-user-pin-authentication-and-operational-session.md): decisiones técnicas de PIN y sesión diferidas.
- [ADR-012](../../decisions/proposed/ADR-012-tenant-roles-capabilities-and-contextual-authorization.md): composición y capacidades concretas se definen por rebanada.

## Riesgos encontrados

| Riesgo | Severidad | Consecuencia si se ignora |
| --- | --- | --- |
| Elegir driver/migrador sin cerrar `DEC-049/050` | Critical | Persistencia y esquema se convierten en decisiones de facto sin autoridad ni recuperación definida |
| Implementar aislamiento antes de definir contratos de repositorio | Critical | Una consulta sin contexto puede exponer o modificar otro tenant |
| Implementar PIN/sesión con parámetros ad hoc | Critical | Credenciales débiles, enumeración, sesiones residuales o contexto manipulable |
| Ejecutar con Node.js 25 | High | Baseline local no reproducible ni compatible con ADR-001 |
| Copiar SPIKE-009 | High | Tooling experimental y supuestos no aceptados se convierten en producto |
| Elegir runner/gates sin `DEC-051` | High | Evidencia incompleta o no canónica de aislamiento y arquitectura |
| Introducir estructura antes de `DEC-005` | High | Fronteras nominales, ciclos o ownership ambiguo desde el scaffold |

## Conclusión

El criterio de aceptación no se cumple: hoy un desarrollador no puede clonar y ejecutar una aplicación de producto con aislamiento tenant porque la autoridad documental vigente prohíbe crear esa baseline antes de cerrar sus decisiones previas.

El resultado es **FAIL** para implementación, con detención segura y evidencia suficiente para desbloquear el siguiente trabajo arquitectónico. No se debe comenzar código hasta cerrar, como mínimo, `DEC-004`, `DEC-005`, `DEC-044`, `DEC-049`, `DEC-050`, `DEC-051`, `DEC-063`, las decisiones técnicas mínimas de identidad/autorización y la autorización organizacional.
