# Mapa inicial de dependencias

## Estado del documento

**Estado:** Hipótesis de secuencia documental; no representa calendario ni dependencias de código.

```mermaid
flowchart TD
    V[PBI-001 Visión y principios] --> S[PBI-003 Alcance]
    A[PBI-002 Actores] --> S
    V --> G[PBI-004 Glosario]
    A --> G
    G --> M[PBI-005 Módulos]
    L[PBI-006 Lecciones legacy] --> M
    S --> M
    M --> MT[PBI-007 Multitenancy]
    A --> IAM[PBI-008 Identidad y permisos]
    MT --> IAM
    IAM --> BD[PBI-009 Sucursales y dispositivos]
    M --> APP[PBI-010 Arquitectura objetivo]
    MT --> APP
    MT --> DB[PBI-011 Base de datos]
    APP --> API[PBI-012 Backend/API]
    S --> WEB[PBI-013 Web/design system]
    APP --> WEB
    DSV1[Design System & Application Shell V1<br/>Owner direction approved] --> UI[PBI-030 UI Foundation/Shell<br/>Draft / readiness blocked]
    WEB --> UI
    APP --> UI
    M --> RT[PBI-014 Realtime/messaging]
    MT --> RT
    APP --> RT
    APP --> DEP[PBI-015 Ambientes/despliegue]
    WF[PBI-016 Workflow documental] --> Q[PBI-017 Testing/aislamiento]
    MT --> Q
    IAM --> Q
    APP --> Q
    IAM --> SEC[PBI-018 Seguridad]
    MT --> SEC
    BD --> SEC
    APP --> OBS[PBI-019 Observabilidad]
    MT --> OBS
    RT --> OBS
    DEP --> OBS
    V --> GATE[PBI-020 Preguntas/gates]
    BD --> GATE
    DB --> GATE
    API --> GATE
    WEB --> GATE
    RT --> GATE
    DEP --> GATE
    Q --> GATE
    SEC --> GATE
    OBS --> GATE
    API --> TOOL[PBI-021<br/>Done]
    DEC004[DEC-004 Accepted<br/>Evidence Verified] --> TOOL
    DEC051[DEC-051 Accepted<br/>C01/C07/C09 Satisfied] -. VC-024 .-> TOOL
    TOOL --> VC[VC-001 a VC-024<br/>Closed / PASS]
    DEC005[DEC-005 Accepted<br/>Materialized / Formally Verified] --> MOD[PBI-022<br/>Done]
    MOD --> D5E[DEC005-C01 a C05<br/>PASS formal]
    D5E --> DEC049[DEC-049 Accepted<br/>C01-C08 vigentes]
    MOD -. no resuelve preguntas propias .-> DEC049
    VC --> P23[PBI-023 persistencia tenant<br/>Closed]
    DEC049 --> P23
    DEC050[DEC-050 Accepted with conditions<br/>C01-C10 pending] --> P23
    P23 --> P24[PBI-024 contexto<br/>draft branch / not integrated]
    P24 --> P25[PBI-025 identidad/sesión<br/>Blocked]
    P25 --> P26[PBI-026 autorización<br/>Draft]
    P24 --> P28[PBI-028 señales/auditoría<br/>Draft]
    P27[PBI-027 tiempo<br/>Blocked] --> P28
    P29[PBI-029 secretos<br/>Draft] --> P25
    P29 --> P28
```

El grafo incluye las dependencias documentales directas declaradas por los PBIs y algunas relaciones transitivas necesarias para leer la secuencia. No representa dependencias de runtime ni sustituye el detalle de cada PBI.

## Dependencias críticas

- Visión, actores y alcance dan significado al glosario y mapa modular.
- Multitenancy condiciona datos, identidad, realtime, archivos, cachés, observabilidad y pruebas.
- Identidad y permisos preceden la validación del acceso por dispositivo/PIN.
- Arquitectura objetivo enmarca evaluaciones de backend, web, despliegue y observabilidad.
- PBI-020 consolida gates; no puede cerrarse hasta que entradas críticas sean revisadas.
- PBI-021 consumió la selección aceptada de DEC-004 y el shell seleccionado
  mediante ADR-005/PBI-012. Está `Done` después de VC-024 `Closed / PASS`; no
  habilita funcionalidad.
- PBI-022 consumió la selección aceptada de DEC-005 y materializó sólo estructura, ownership, checker local, fixtures y evidencia; está `Done` y no habilita funcionalidad.
- PBI-022 no resolvió por sí mismo DEC-044, DEC-049 ni DEC-051. Su `PASS`
  formal satisfizo la dependencia de frontera de
  [DEC-049](../decisions/dec-049-persistence-ownership/FORMAL_REVIEW.md),
  aceptada después el 2026-07-24 por el Responsable del Proyecto con
  DEC049-C01 a C08 vigentes.
  [DEC-044](../decisions/dec-044-error-strategy/FORMAL_REVIEW.md) también fue
  aceptada el 2026-07-24 con DEC044-C01 a C08 vigentes.
  [DEC-051](../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md) fue
  aceptada el mismo día y convierte documentalmente esos contratos en gates;
  VC-024 satisfizo C01/C07/C09; C02–C06/C08/C10 permanecen pendientes.
- [DEC-063](../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md) fue
  aceptada el 2026-07-24 con base común más checklists por tipo/riesgo.
  VC-024 satisfizo C01/C03/C04; C02/C05–C08 permanecen `Pending`.
- [PBI-023](pbis/PBI-023.md) cerró su alcance y fue integrado con evidencia
  post-merge.
- [PBI-024](pbis/PBI-024.md) tiene implementación sólo en una rama/PR draft
  divergente. No forma parte de `main` y el primer merge funcional sigue
  bloqueado por DEC051-C02.
- PBI-025–PBI-029 descomponen el resto de los 24 contratos H1; sus estados
  `Draft` o `Blocked` impiden tratarlos como compromiso o autorización.
- [PBI-030](pbis/PBI-030.md) consume la dirección visual Owner aprobada y la
  baseline React/Vite. No depende de PBI-024/PBI-025 para usar fixtures
  honestos, pero cualquier contexto confiable, identidad o permisos reales sí
  requiere esos trabajos. PBI-024 es una dependencia blanda. Su estado
  `Draft — readiness blocked` no autoriza implementación.

## Bloqueos conocidos

- PBI-013 resolvió parcialmente la dirección visual del cliente React/Vite;
  rendering, número de aplicaciones y estrategia web futura permanecen
  diferidos.
- PBI-006, PBI-013, PBI-014 y PBI-018–PBI-020 fueron diferidos con remanente,
  owner por rol e hito explícitos; no bloquean el objetivo documental del
  Sprint 00.
- PBI-021 está `Done` y `Unassigned`; VC-024 está `Closed / PASS`.
- PBI-022 está `Done` y `Unassigned`; DEC005-C01 a C05 tienen `PASS` formal en la sexta reverificación independiente.
- PBI-025 y PBI-027 están bloqueados por decisiones de mecanismo/producto.
- PBI-023 está cerrado.
- PBI-024 requiere decisión de recuperación/revalidación o descarte; no puede
  integrarse mientras DEC051-C02 siga `Pending`.
- Los demás PBIs H1 requieren revisión y autorización propias.
- PBI-030 tiene resueltos iconografía, accent, catálogo, compatibilidad y
  partición. Requiere estimación acordada y CI autoritativo verde del arreglo
  local antes de `Ready`; después todavía requiere autorización explícita para
  iniciar.

## Preguntas abiertas

- SPIKE-002 confirmó el patrón sin bypass cross-tenant observado y con cleanup
  completo; la implementación productiva debe repetir sus controles.
- Los mecanismos de PIN/sesión y la autoridad temporal siguen requiriendo
  decisiones dentro de PBI-025/PBI-027.

## Próxima revisión

Reconciliación de PBI-024 y cierre de los dos bloqueantes de PBI-030 sin
iniciar implementación.
