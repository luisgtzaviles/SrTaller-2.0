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
```

El grafo incluye las dependencias documentales directas declaradas por los PBIs y algunas relaciones transitivas necesarias para leer la secuencia. No representa dependencias de runtime ni sustituye el detalle de cada PBI.

## Dependencias críticas

- Visión, actores y alcance dan significado al glosario y mapa modular.
- Multitenancy condiciona datos, identidad, realtime, archivos, cachés, observabilidad y pruebas.
- Identidad y permisos preceden la validación del acceso por dispositivo/PIN.
- Arquitectura objetivo enmarca evaluaciones de backend, web, despliegue y observabilidad.
- PBI-020 consolida gates; no puede cerrarse hasta que entradas críticas sean revisadas.

## Bloqueos conocidos

- PBI-013 requiere confirmar superficies web, audiencias y necesidades visuales; hasta entonces permanece bloqueado para una recomendación final.
- PBI-008, PBI-009 y PBI-020 requieren decisiones de producto/operación.
- Ninguna dependencia técnica propuesta puede convertirse en implementación hasta aceptar ADRs relacionados.

## Preguntas abiertas

- ¿Qué dependencias son obligatorias para revisión y cuáles pueden explorarse en paralelo?
- ¿Qué producto de PBI-020 constituye autorización formal para prototipos?

## Próxima revisión

Cuando cambie el estado de un PBI o una pregunta crítica; fecha: TBD.
