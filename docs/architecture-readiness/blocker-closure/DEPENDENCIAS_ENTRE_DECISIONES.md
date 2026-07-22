# Dependencias entre decisiones

## Mapa principal

```mermaid
flowchart TD
    SCOPE[DEC-002 Alcance R0] --> STACK[DEC-004 Stack]
    SCOPE --> MODULES[DEC-005 Módulos]
    STACK --> DATA[DEC-050 Persistencia/migraciones]
    MODULES --> OWN[DEC-049 Propiedad/repositorios]

    GLOBAL[DEC-008 Datos globales] --> MT[DEC-006 Estrategia multitenant]
    OWN --> MT
    MT --> TC[DEC-009 Contexto tenant]
    TC --> BR[DEC-010 a 012 Sucursal]
    BR --> ID[DEC-013 a 020 Identidad/permisos]
    MT --> DATA

    TEST[DEC-051 Pruebas] --> R0[R0 demostrado]
    ID --> R0
    DATA --> R0
    OBS[DEC-044 a 048 Errores/observabilidad] --> R0

    R0 --> R1S[DEC-003 Alcance R1]
    BR --> FOLIO[DEC-021 a 025 Folio]
    DATA --> FOLIO
    R1S --> CUST[DEC-027 a 030 Estado/custodia]
    FOLIO --> CUST
    BR --> POLICY[DEC-032 a 036 Política]
    POLICY --> CUST
    MT --> FILES[DEC-039 a 040 Archivos]
    CUST --> R1[R1 programable]
    FILES --> R1

    R1 --> MVP[R1 a R5 integradas]
    MVP --> PILOT[DEC-053 a 061 Piloto]
    PILOT --> PROD[DEC-056/064/066/067/069/070 Producción]
```

## Dependencias de autoridad

| Decisión técnica | Respuesta previa de producto |
| --- | --- |
| ADR multitenant | Datos globales, tenant-wide, branch-scoped, ciclo del tenant |
| ADR de contexto operativo | Cerrado por ADR-010: estación vinculada, sucursal derivada, rotación y cambio explícito |
| ADR de identidad/PIN | Cerrado por ADR-011: usuario de tenant, acceso por PIN, sesión, inactividad y atribución mínima |
| ADR de roles/permisos | Capacidades mínimas y excepciones por rebanada |
| ADR de folio | Alcance visible y transferencias entre sucursales |
| ADR de política | Campos, autoridad, precedencia y vigencia |
| ADR de tiempo | Zona por tenant/sucursal y significado operativo |
| ADR de archivos | Evidencia requerida, propósito, acceso y retención |
| ADR de custodia/estados | Catálogos, entrega y autoridad de excepciones |
| ADR de convivencia | Unidad de corte, datos a preservar y fuente de verdad |

## Dependencias técnicas condicionadas

- SPIKE-002 depende de una estrategia shared-schema aún candidata y de un contrato representativo.
- SPIKE-003 depende del resultado de SPIKE-002, PostgreSQL candidato y acceso de datos/pooling.
- SPIKE-005 parte del propósito y sesión aceptados por ADR-011; debe acotarse a protección técnica, intentos, revocación y relación con acciones sensibles.
- La prueba concurrente de folio depende de alcance del folio y persistencia candidata.
- Restore por tenant depende de estrategia multitenant, backups y clasificación de datos.
- Observabilidad de producción depende de recorridos y SLOs, no de elegir primero una herramienta.

## Decisiones que pueden cerrarse juntas

- `DEC-007` a `DEC-012`: cerradas conceptualmente por ADR-004/010; su aplicación y pruebas se verifican juntas.
- `DEC-013` a `DEC-016`: cerradas conceptualmente por ADR-011; su aplicación y pruebas se coordinan con auditoría.
- `DEC-017` a `DEC-020`: autorización y seguridad operativa pendientes, separadas de autenticación.
- `DEC-021` a `DEC-025`: folio, concurrencia e idempotencia.
- `DEC-032` a `DEC-035`: política efectiva, snapshot, vigencia y campos.
- `DEC-044` a `DEC-048`: contrato transversal de errores, auditoría y señales.
- `DEC-053`, `DEC-054` y `DEC-061`: recuperación y rollback.

## Dependencias que no deben fusionarse

- estrategia multitenant de ADR-004, contexto operativo de ADR-010 e identidad/sesión de ADR-011;
- autenticación primaria y autorización de acciones;
- estado de negocio y ubicación física;
- pago y entrega;
- recomendación técnica y cotización;
- auditoría de negocio y logs técnicos;
- backup exitoso y restauración demostrada.
