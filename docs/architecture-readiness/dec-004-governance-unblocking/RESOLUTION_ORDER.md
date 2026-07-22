# Orden mínimo recomendado de resolución

## Principio

El orden se deriva de dependencias reales, no de la numeración. Distingue decisión de selección, evidencia de cierre y programación. Ningún paso cambia estados automáticamente.

## Orden recomendado

### 1. DEC-004 — Contrato de toolchain reproducible

Trabajar primero el remanente concreto de DEC-004:

- package manager y versión;
- lockfile e instalación congelada;
- política de scripts y supply chain;
- pinning de Node.js `24.x`;
- ESM/CommonJS;
- compilador/ejecución TypeScript;
- versiones alineadas de NestJS `11.x`;
- contrato de build/start y matriz de compatibilidad con PostgreSQL `18.x`.

**Justificación:** todas las herramientas de enforcement, persistencia, migración y pruebas deben ser compatibles con esta selección. La máquina local en Node.js `25.x` demuestra por qué el pinning no puede dejarse implícito.

**Criterio de salida para llevar a decisión:** alternativas comparadas, selección/versiones propuestas, scripts permitidos, instalación limpia reproducible, mecanismo de pinning y plan de evidencia Linux. La ejecución del gate Linux puede completarse en el paso 6 sin impedir que la selección quede lista para revisión.

**Impacto sobre DEC-004:** resuelve su incertidumbre principal y habilita decisiones técnicas posteriores sin adoptar tooling experimental por inercia.

### 2. DEC-005 + DEC-049 — Estructura, ownership y persistencia

Resolverlas como un paquete coordinado, conservando dos decisiones:

- DEC-005: agrupación física mínima de R0, API interna, dirección de imports y enforcement;
- DEC-049: puertos/repositories, ownership de tablas, transacciones, contexto tenant/sucursal y herramienta de acceso a PostgreSQL.

**Justificación:** una estructura sin ownership de datos sería nominal; un repository sin módulo propietario crearía acceso transversal. ADR-002/004/005/009 ya restringen las alternativas.

**Criterio de salida DEC-005:** mapa físico de R0, owners, imports permitidos/prohibidos, ausencia de módulos futuros vacíos y regla de excepciones.

**Criterio de salida DEC-049:** alternativa de acceso a datos seleccionada, puertos propietarios, firmas tenant-aware, transacciones, consultas administrativas separadas y matriz módulo–tabla/estructura.

**Impacto sobre DEC-004:** aporta la estructura que la baseline ejecutable debe compilar y la persistencia que debe integrar, sin ampliar el alcance de plataforma aceptado.

### 3. DEC-044 + núcleo de DEC-051 — Contratos verificables

Pueden trabajarse en paralelo:

- DEC-044 define categorías, mapeo seguro y no divulgación;
- DEC-051 define runner, scripts canónicos, capas, pruebas arquitectónicas y gate mínimo Linux.

**Justificación:** los errores deben ser probables mediante el mismo gate que protege arquitectura y aislamiento. DEC-044 no necesita esperar migraciones; la suite completa de DEC-051 sí se amplía después.

**Criterio de salida DEC-044:** taxonomía independiente de NestJS, mapeo REST estable, política de causas/logs, regla anti-enumeración y matriz de pruebas.

**Criterio de salida inicial DEC-051:** runner y versiones, comandos canónicos, typecheck/build/arquitectura, reglas de fallo, CI Linux y política de flakiness. Mantener explícitos los gates de integración que dependen de DEC-050.

**Impacto sobre DEC-004:** permite ejecutar el primer gate reproducible sin convertir la evidencia de SPIKE-009 en scaffold.

### 4. DEC-050 — Migraciones reproducibles

Resolver después de DEC-049 y dentro de la toolchain de DEC-004.

**Justificación:** la herramienta de migración debe coexistir con el acceso a datos, ownership y transacciones elegidos. Su evidencia se incorpora a DEC-051.

**Criterio de salida:** herramienta/versiones, naming/checksum, ejecución única y concurrente segura, permisos, migración desde cero y desde versión previa, estrategia de irreversibles, rollback/roll-forward, pruebas y evidencia por tenant.

**Impacto sobre DEC-004:** completa la integración PostgreSQL que necesita la fundación R0; no cambia el motor aceptado.

### 5. DEC-051 completa + DEC-063 — Gate y Definition of Done

Completar DEC-051 con:

- integración PostgreSQL real;
- migraciones;
- dataset de dos tenants;
- pruebas negativas de contexto, repositorios y referencias cruzadas;
- criterios de cobertura por riesgo.

Después resolver DEC-063 con los gates ya conocidos.

**Justificación:** una DoD no debe inventar otra suite ni declarar evidencia que todavía no tiene owner. DEC-062 ya fija qué debe demostrar R0.

**Criterio de salida DEC-051:** matriz de suites por riesgo, gates locales/PR/merge, aislamiento obligatorio, arquitectura, migraciones, seguridad y evidencia canónica.

**Criterio de salida DEC-063:** perfiles por tipo de cambio, N/A justificado, aprobadores, excepciones, umbrales, evidencia retenida y separación entre candidato y validación staging/release.

**Impacto sobre DEC-004:** establece la evidencia objetiva para recomendar el cierre de reproducibilidad y evita que “compila” equivalga a “terminado”.

### 6. Evidencia final de DEC-004

Ejecutar, cuando exista autorización para una baseline técnica:

- instalación limpia con lockfile;
- verificación efectiva de Node.js `24.x`;
- build/start mínimo;
- suite canónica disponible;
- gate real en Linux;
- auditoría de dependencias y scripts;
- repetición desde un checkout limpio;
- registro de versiones y resultados.

**Criterio de salida:** compatibilidad y reproducibilidad demostradas; Arquitectura + Ingeniería pueden entonces evaluar el cierre de DEC-004. Este paso no cierra automáticamente R0 ni autoriza funcionalidad.

## Trabajo posterior necesario para programar/completar R0

Después de los siete cierres siguen los paquetes H1:

1. mecanismos de estación/vinculación/revocación y threat model;
2. protección de PIN, intentos, sesión, inactividad e invalidación;
3. composición de roles/capacidades y clasificación de operaciones de R0;
4. auditoría mínima, secretos, tiempo y fixtures;
5. autorización organizacional y PBI trazado;
6. implementación y demostración según DEC-062.

## Decisiones que pueden resolverse conjuntamente

| Paquete | Motivo | Límite que se conserva |
| --- | --- | --- |
| DEC-005 + DEC-049 | Estructura y ownership son inseparables para evitar fronteras nominales | Dos decisiones y criterios de salida distintos |
| DEC-044 + diseño inicial DEC-051 | El contrato de errores necesita pruebas desde su aprobación | Error no se fusiona con log, auditoría u observabilidad |
| DEC-050 + ampliación DEC-051 | Toda política de migración necesita ejecución automatizada | DEC-050 decide migración; DEC-051 decide el gate |
| DEC-051 + DEC-063 | La DoD consume suites y evidencia | DEC-062 continúa siendo el contrato de aceptación de producto |

## Decisiones que no deben fusionarse

- DEC-004 no debe absorber DEC-049/050: plataforma, acceso a datos y migraciones tienen autoridades y ciclos distintos.
- DEC-005 no debe absorber módulos futuros de Reparaciones: R0 no los implementa.
- DEC-044 no debe absorber auditoría de negocio.
- DEC-051 no debe redefinir los escenarios de DEC-062.
- DEC-063 no debe convertirse en autorización de release ni en aceptación de R0.

## Primera decisión concreta recomendada

**Trabajar primero DEC-004: selección y política de la toolchain reproducible de R0.**

La pregunta de decisión debe formularse así:

> ¿Qué combinación fijada de package manager, lockfile, scripts de instalación, sistema de módulos, compilación TypeScript y pinning de Node.js `24.x` permite instalar, compilar, iniciar y validar NestJS `11.x` de manera reproducible localmente y en Linux, sin adoptar tooling no aceptado por SPIKE-009?

No debe incluir todavía driver/ORM, migrador, estructura modular, runner completo, PIN o sesiones. Esos asuntos tienen decisiones propias en los pasos siguientes.

## Resultado esperado del camino

Al terminar esta secuencia existirán entradas suficientes para recomendar el cierre de DEC-004 y autorizar un primer cambio técnico controlado. Para construir el baseline funcional completo aún deberán cerrarse los mecanismos H1 señalados; confundir ambos resultados volvería a introducir decisiones ocultas.
