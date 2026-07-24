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
    API --> TOOL[PBI-021 Materializar/verificar DEC-004]
    DEC004[DEC-004 Accepted<br/>Evidence Pending] --> TOOL
    DEC051[DEC-051 Accepted<br/>C01-C10 Pending] -. VC-024 .-> TOOL
    TOOL --> VC[VC-001 a VC-024<br/>evidencia pendiente]
    DEC005[DEC-005 Accepted<br/>Materialized / Formally Verified] --> MOD[PBI-022<br/>Done]
    MOD --> D5E[DEC005-C01 a C05<br/>PASS formal]
    D5E --> DEC049[DEC-049 Accepted<br/>C01-C08 vigentes]
    MOD -. no resuelve preguntas propias .-> DEC049
```

El grafo incluye las dependencias documentales directas declaradas por los PBIs y algunas relaciones transitivas necesarias para leer la secuencia. No representa dependencias de runtime ni sustituye el detalle de cada PBI.

## Dependencias críticas

- Visión, actores y alcance dan significado al glosario y mapa modular.
- Multitenancy condiciona datos, identidad, realtime, archivos, cachés, observabilidad y pruebas.
- Identidad y permisos preceden la validación del acceso por dispositivo/PIN.
- Arquitectura objetivo enmarca evaluaciones de backend, web, despliegue y observabilidad.
- PBI-020 consolida gates; no puede cerrarse hasta que entradas críticas sean revisadas.
- PBI-021 consume la selección aceptada de DEC-004 y el shell seleccionado mediante ADR-005/PBI-012; puede comenzar su materialización técnica sin habilitar funcionalidad.
- PBI-021 no puede quedar `Done` ni producir un PASS final sin VC-024; la ejecución CI de ese caso depende de materializar la [DEC-051 aceptada](../decisions/dec-051-testing-ci-strategy/FORMAL_REVIEW.md).
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
  C01 a C10 permanecen pendientes.
- [DEC-063](../decisions/dec-063-definition-of-done/FORMAL_REVIEW.md) fue
  aceptada el 2026-07-24 con base común más checklists por tipo/riesgo;
  DEC063-C01 a C08 permanecen `Pending`. Su aceptación no materializa los
  gates ni cierra VC-024.

## Bloqueos conocidos

- PBI-013 requiere confirmar superficies web, audiencias y necesidades visuales; hasta entonces permanece bloqueado para una recomendación final.
- PBI-008, PBI-009 y PBI-020 requieren decisiones de producto/operación.
- PBI-021 está `Ready` y autorizado, pero `Unassigned`; VC-024 conserva la dependencia explícita de la materialización y evidencia de DEC-051.
- PBI-022 está `Done` y `Unassigned`; DEC005-C01 a C05 tienen `PASS` formal en la sexta reverificación independiente.
- Ninguna dependencia técnica propuesta puede convertirse en implementación hasta aceptar ADRs relacionados.

## Preguntas abiertas

- ¿Qué dependencias son obligatorias para revisión y cuáles pueden explorarse en paralelo?
- ¿Qué producto de PBI-020 constituye autorización formal para prototipos?

## Próxima revisión

Cuando cambie el estado de un PBI o una pregunta crítica; fecha: TBD.
