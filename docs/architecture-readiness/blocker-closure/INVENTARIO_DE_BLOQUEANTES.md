# Inventario consolidado de decisiones

## Regla de clasificación

Una decisión sólo bloquea cuando diferirla amenaza aislamiento, seguridad, identidad, una invariante, trazabilidad, recuperabilidad o provoca retrabajo estructural inmediato. El hito indicado es el primero que no puede cruzarse sin cierre. Los IDs son locales a este paquete.

## H0 y contexto de R0

| ID | Decisión | Estado actual | Hito que bloquea | Severidad | Dependencias | ADR requerido | Responsable sugerido | Evidencia para cierre | Riesgo si se difiere |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DEC-001 | Arquitectura inicial | Aceptada | H0 cerrado | Crítica | Ninguna | ADR-002 Accepted | Arquitectura + Producto | ADR-002 y registro actualizados | Arquitectura caótica o distribución prematura |
| DEC-002 | Alcance exacto de R0 | Requiere Product Owner | H0 | Crítica | Alcance del MVP | No | Producto + Arquitectura | Resultado, exclusiones y demostración aprobados | Scaffolding sin propósito o fundación sobredimensionada |
| DEC-003 | Alcance exacto de R1 | Requiere Product Owner | H2 | Crítica | DEC-002, R0 | No | Producto + Operaciones | Caso de uso, variantes y exclusiones aprobados | Código de recepción incompleto o inventado |
| DEC-004 | Stack de aplicación | Propuesta | H0 | Alta | DEC-001, DEC-002 | ADR-001, ADR-003, ADR-005 y ADR-009 | Arquitectura + Ingeniería | ADRs aceptados y restricciones verificadas | Rehacer runtime, persistencia o repositorio |
| DEC-005 | Organización inicial del monolito modular | Parcialmente resuelta | H0 | Alta | DEC-001, DEC-002 | No, salvo excepción a ADR-002 | Arquitectura | Agrupación inicial, ownership y reglas de dependencias revisados | Módulos vacíos, ciclos o agregado universal |
| DEC-006 | Estrategia multitenant | Aceptada en ADR-004 | H1: falta aplicar/probar | Crítica | DEC-008, DEC-009, DEC-049 | ADR-004 Accepted | Arquitectura + Seguridad | ADR aceptado; faltan modelo de amenazas y evidencia de aislamiento | Fuga entre tenants o persistencia difícil de rehacer |
| DEC-007 | Propiedad de datos por tenant | Aceptada en ADR-004 | H1: falta aplicar/probar | Crítica | DEC-006, DEC-008, DEC-049 | ADR-004 Accepted | Arquitectura + Producto | Matriz SaaS, tenant y sucursal aceptada | Datos sin dueño o alcance ambiguo |
| DEC-008 | Datos globales del SaaS | Aceptada en ADR-004 | H1: falta aplicar/probar | Crítica | Ciclo del tenant, DEC-006 | ADR-004 Accepted | Producto + Arquitectura | Catálogo conceptual y autoridad aceptados | Omisión accidental de tenant o supertenant implícito |
| DEC-009 | Contexto explícito de tenant | Aceptada en ADR-004/010 | H1: falta aplicar/probar | Crítica | DEC-006, identidad | ADR-004 y ADR-010 Accepted | Arquitectura + Seguridad | Contrato inmutable, fuente del lado del servidor y pruebas negativas | Contexto manipulable o contaminación entre operaciones |
| DEC-010 | Sucursal activa | Aceptada en ADR-010 | H1: falta aplicar/probar | Crítica | DEC-007, estación | ADR-010 Accepted | Producto + Arquitectura | La estación vinculada determina la sucursal; ausencia falla cerrada | Operación atribuida a sucursal incorrecta |
| DEC-011 | Usuario operando múltiples sucursales | Aceptada en ADR-010 | H1: falta aplicar/probar | Alta | DEC-010, DEC-017 | ADR-010 Accepted | Producto + Seguridad | Usuario por tenant, sin asignación permanente; la estación fija sucursal | Acceso transversal implícito |
| DEC-012 | Cambio de sucursal | Aceptada en ADR-010 | H1: falta aplicar/probar | Alta | DEC-010, DEC-011, sesión | ADR-010 Accepted | Producto + Seguridad + Arquitectura | Desvinculación, nueva vinculación, invalidación y auditoría aceptadas | Contexto mutado silenciosamente |
| DEC-013 | Identidad tradicional | Aceptada conceptualmente en ADR-011 | H1: falta aplicar/probar | Crítica | DEC-006, DEC-008 | ADR-011 Accepted | Seguridad + Arquitectura | Usuario por tenant, autenticación contextual y estados mínimos aceptados; recuperación técnica diferida | Cuentas ambiguas o imposibles de revocar |
| DEC-014 | Acceso operativo por PIN | Aceptado conceptualmente en ADR-011 | H1: falta aplicar/probar | Crítica | DEC-013, DEC-010, acciones sensibles | ADR-011 Accepted | Producto + Seguridad + Operaciones | PIN como credencial limitada al tenant y no reversible aceptado; faltan protección técnica, límites y modelo de amenazas | PIN tratado como identidad o permiso universal |
| DEC-015 | Cierre por inactividad | Aceptado conceptualmente en ADR-011 | H1: falta aplicar/probar | Alta | DEC-014, riesgo operativo | ADR-011 Accepted | Producto + Seguridad + Operaciones | Expira sesión, conserva estación y exige nueva autenticación; faltan duración y prueba | Atribución al usuario anterior |
| DEC-016 | Atribución de acciones | Aceptada conceptualmente en ADR-010/011 | H1: falta aplicar/probar | Crítica | DEC-013 a DEC-015, DEC-046 | ADR-010/011 Accepted + ADR de auditoría | Producto + Seguridad + Arquitectura | Tenant, sucursal, estación, usuario, sesión, fecha y hora aceptados; faltan integridad, retención y pruebas | Acciones sin responsable verificable |
| DEC-017 | Roles mínimos | Aceptada conceptualmente en ADR-012 | H1: falta aplicar/componer/probar | Alta | Actores de R0, DEC-013 | ADR-012 Accepted | Producto + Seguridad | Rol tenant-scoped, múltiples roles y asignaciones tenant-wide/restringidas aceptados; falta composición por rebanada | Roles inventados o privilegios excesivos |
| DEC-018 | Permisos mínimos | Aceptada conceptualmente en ADR-012 | H1: falta aplicar/probar | Crítica | DEC-017, alcance R0 | ADR-012 Accepted | Producto + Seguridad + Arquitectura | Capacidad por acción, unión, alcance, deny-by-default y autoridad server-side aceptados; falta matriz y evidencia por rebanada | Autorización sólo en interfaz |
| DEC-019 | Acciones sensibles | Frontera aceptada en ADR-012 | H1 y por rebanada | Crítica | DEC-018, procesos incluidos | ADR de acciones sensibles | Producto + Seguridad | Capacidad ordinaria más control reforzado aceptados; faltan catálogo, autoridad, motivo y auditoría | Fraude, bypass o excepciones invisibles |
| DEC-020 | Reautenticación | Requiere Product Owner | H1 | Alta | DEC-014, DEC-019 | ADR de autorización/acciones sensibles | Producto + Seguridad | Acciones, vigencia y método reforzado acordados | PIN/sesión insuficientes para cambios críticos |

## Recepción R1

| ID | Decisión | Estado actual | Hito que bloquea | Severidad | Dependencias | ADR requerido | Responsable sugerido | Evidencia para cierre | Riesgo si se difiere |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DEC-021 | Alcance del folio | Requiere Product Owner | H2 | Crítica | DEC-007, DEC-010 | ADR de folio | Producto + Operaciones | Tenant, sucursal o global decidido con ejemplos | Colisiones o identidad operativa incompatible |
| DEC-022 | Formato del folio | Requiere Product Owner | H2 | Alta | DEC-021, identificación física | ADR de folio o política documentada | Producto + Operaciones | Formato, legibilidad, estabilidad y cambio definidos | Etiquetas ambiguas o formato convertido en identidad técnica |
| DEC-023 | Unicidad del folio | Propuesta | H2 | Crítica | DEC-021 | ADR de folio | Arquitectura + Ingeniería | Invariante y prueba de colisión en alcance | Dos equipos comparten identificación |
| DEC-024 | Reserva y concurrencia de folio | Requiere spike | H2 | Crítica | DEC-021, DEC-023, persistencia | ADR de folio | Arquitectura + Ingeniería | Prueba concurrente y comportamiento de fallo/reintento | Folio predicho, saltos ambiguos o sticker cruzado |
| DEC-025 | Idempotencia al crear orden | Propuesta | H2 | Crítica | DEC-024, DEC-030 | ADR de folio/creación | Arquitectura + Ingeniería | Identidad de intención y pruebas de doble envío/timeout | Orden y custodia duplicadas |
| DEC-026 | Término Orden de Servicio frente a Orden de Reparación | Parcialmente resuelta | H2 | Media | Lenguaje integrado | No, decisión de producto | Producto + Operaciones | Término visible, alias y transición documental | Vocabulario divergente en criterios y operación |
| DEC-027 | Estados mínimos de R1 | Requiere Product Owner | H2 | Alta | DEC-003, custodia | ADR de estados/custodia | Producto + Operaciones | Catálogo mínimo y transiciones con actor/precondición | Máquina de estados inventada |
| DEC-028 | Ubicaciones físicas mínimas | Requiere Product Owner | H2 | Alta | DEC-010, DEC-029 | ADR de estados/custodia | Producto + Operaciones | Ubicación inicial y movimientos relevantes definidos | Equipo físicamente ilocalizable |
| DEC-029 | Condición de custodia | Parcialmente resuelta | H2 | Crítica | Decisiones RMCA, DEC-031 | ADR de estados/custodia | Producto + Operaciones + Arquitectura | Inicio, vigencia, excepciones y consulta definidos | Custodia inferida desde estado o comentario |
| DEC-030 | Inicio atómico de custodia | Parcialmente resuelta | H2 | Crítica | DEC-025, DEC-029 | ADR de estados/custodia | Arquitectura + Ingeniería | Límite transaccional aceptado y prueba de fallo | Orden sin custodia o equipo sin orden |
| DEC-031 | Fin de custodia | Parcialmente resuelta | H3 | Crítica | Entrega R5, permisos, pagos | ADR de entrega idempotente | Producto + Operaciones + Arquitectura | Entrega válida, tercero, excepción y corrección definidas | Doble entrega o custodia falsa |
| DEC-032 | Política efectiva sistema → tenant → sucursal | Propuesta | H2 | Crítica | DEC-007, DEC-010 | ADR de política efectiva | Producto + Arquitectura | Precedencia, autoridad y defaults seguros | Orden válida según regla inexplicable |
| DEC-033 | Snapshot de política aplicada | Propuesta | H2 | Alta | DEC-032, DEC-030 | ADR de política efectiva | Arquitectura + Producto | Versión o instantánea mínima reproducible | Historia cambia al editar configuración |
| DEC-034 | Cambio de política con órdenes abiertas | Requiere Product Owner | H2 | Alta | DEC-032, DEC-033 | ADR de política efectiva | Producto + Operaciones | Vigencia, recepción en curso y excepciones | Requisitos históricos cambian silenciosamente |
| DEC-035 | Campos configurables de recepción | Requiere Product Owner | H2 | Alta | DEC-032, RMCA | ADR de política efectiva | Producto + Operaciones | Catálogo, condiciones y alcance tenant/sucursal | Invariante universal desactivable |
| DEC-036 | Catálogos de marca y modelo | Requiere Product Owner | H2 | Media | DEC-035, cliente/equipo mínimo | No inicialmente | Producto + Operaciones | Fuente, obligatoriedad y fallback libre definidos | Catálogo innecesario bloquea recepción |
| DEC-037 | Zona horaria del tenant o sucursal | Requiere Product Owner | H1 | Alta | DEC-010, datos globales | ADR de tiempo | Producto + Operaciones + Arquitectura | Autoridad, cambio y casos multisucursal | Fechas operativas y cortes ambiguos |
| DEC-038 | Almacenamiento y presentación de fechas | Propuesta | H1 | Alta | DEC-037 | ADR de tiempo | Arquitectura + Ingeniería | Instante autoritativo, zona aplicada y pruebas de cambio | Historia no reconstruible |
| DEC-039 | Estrategia de archivos | Propuesta | H2 | Crítica | DEC-006, DEC-055 | ADR de archivos/evidencias | Arquitectura + Seguridad | Clasificación, metadatos, acceso, borrado y puerto | Fuga de archivos o proveedor incrustado |
| DEC-040 | Fotografías y evidencias mínimas | Requiere Product Owner | H2 | Alta | DEC-035, DEC-039 | Parte de ADR de archivos | Producto + Operaciones + Seguridad | Propósito, casos obligatorios y condición de avance | Evidencia excesiva o ausencia silenciosa |
| DEC-041 | Impresión de ticket y etiqueta | Parcialmente resuelta | H2 | Alta | DEC-022, DEC-030 | No; contrato de adaptador | Producto + Operaciones + Arquitectura | Contenido conceptual, estado pendiente y reimpresión | Impresora dentro de transacción o comprobante mutable |
| DEC-042 | Fallback manual | Cerrada | H2 cerrado | Alta | DEC-022 | No | Producto + Operaciones | RMCA-DEC-011 y escenarios de falla | Sin identificación ante falla de impresora |
| DEC-043 | Generación de QR | Diferida | H5 | Baja | DEC-022, necesidad de escaneo | No | Producto + Operaciones | Caso de uso futuro que supere folio legible | Optimización prematura o dependencia física innecesaria |

## Fundación técnica, piloto y producción

| ID | Decisión | Estado actual | Hito que bloquea | Severidad | Dependencias | ADR requerido | Responsable sugerido | Evidencia para cierre | Riesgo si se difiere |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DEC-044 | Estrategia de errores | Propuesta | H0 | Alta | Stack, casos de uso | ADR sólo si transversal irreversible | Arquitectura + Ingeniería | Taxonomía, mapeo seguro y pruebas | Errores filtran datos o acoplan dominio a transporte |
| DEC-045 | Logs técnicos | Propuesta | H1 | Alta | DEC-044, DEC-047 | No, estrategia aprobada | Ingeniería + Operaciones + Seguridad | Campos permitidos/prohibidos y prueba de redacción | Sin diagnóstico o exposición de secretos |
| DEC-046 | Auditoría de negocio | Parcialmente resuelta | H1 mínimo, H3 suficiente | Crítica | DEC-016, DEC-019, DEC-056 | ADR de auditoría y atribución | Producto + Seguridad + Arquitectura | Hechos mínimos, consistencia, acceso y fallo definidos | Acciones críticas no demostrables |
| DEC-047 | Correlation ID | Propuesta | H1 | Media | DEC-044, DEC-045 | No | Arquitectura + Ingeniería | Generación/propagación segura y prueba de recorrido | Fallos imposibles de correlacionar |
| DEC-048 | Observabilidad mínima | Propuesta | H1 | Alta | DEC-045 a DEC-047 | ADR sólo si fija plataforma | Operaciones + Ingeniería | Salud, readiness, métricas y señales R0 con owner | Aplicación inicia pero no es operable |
| DEC-049 | Repositorios y propiedad lógica | Parcialmente resuelta | H0 | Crítica | ADR-002, DEC-007 | No, salvo excepción | Arquitectura + Ingeniería | Puertos propietarios y prohibición de consultas globales ordinarias | Tablas compartidas como API interna |
| DEC-050 | Migraciones y versionado de esquema | Propuesta | H1 | Crítica | DEC-004, DEC-006 | ADR de persistencia/migraciones | Arquitectura + Ingeniería + Operaciones | Política, compatibilidad, rollback/roll-forward y prueba | Esquema irrepetible o despliegue inseguro |
| DEC-051 | Estrategia de pruebas | Propuesta | H0 | Crítica | DEC-002, riesgos | ADR de pruebas | Arquitectura + Calidad + Seguridad | Pirámide por riesgo, aislamiento y gates definidos | Fundación sin evidencia repetible |
| DEC-052 | Fixtures y datos semilla | Propuesta | H1 | Alta | DEC-006, DEC-051 | No | Ingeniería + Calidad | Dos tenants, casos seguros, repetibilidad y ownership | Pruebas irreales o uso de datos productivos |
| DEC-053 | Backups | No iniciada | H3 | Crítica | Persistencia, archivos | ADR operativo si cambia arquitectura | Operaciones + Seguridad | Política, alcance, cifrado y ejecución comprobada | Pérdida irreversible de datos de piloto |
| DEC-054 | Restauración | No iniciada | H3 | Crítica | DEC-053, tenancy | ADR operativo | Operaciones + Ingeniería + Seguridad | Restore aislado, reconciliación y evidencia | Backup no recuperable o cruce de tenant |
| DEC-055 | Cifrado y secretos | Propuesta | H1 | Crítica | Stack, ambientes | ADR de secretos si fija mecanismo | Seguridad + Operaciones + Ingeniería | Fuente externa, mínimo privilegio, rotación y scanning | Exposición de credenciales o defaults inseguros |
| DEC-056 | Retención de actividad | No iniciada | H4 | Alta | DEC-046, legalidad | ADR de auditoría/retención | Producto + Legal + Seguridad | Matriz por dato, propósito, acceso y eliminación | Incumplimiento o destrucción de evidencia |
| DEC-057 | Límites de archivos | No iniciada | H3 | Alta | DEC-039, carga piloto | Parte de ADR de archivos | Producto + Seguridad + Operaciones | Tipos, tamaños, cuotas, rechazo y monitoreo | Abuso, costo o indisponibilidad |
| DEC-058 | Integraciones que pueden fallar sin bloquear | Parcialmente resuelta | H2 por impresión, después por integración | Alta | Límites transaccionales | No por defecto | Arquitectura + Producto | Contrato de pendiente/reintento por integración real | Proveedor revierte o duplica hechos válidos |
| DEC-059 | Convivencia con SR Taller 1.0 | Requiere Product Owner | H3 | Crítica | Datos a preservar, piloto | ADR de convivencia/migración | Producto + Operaciones + Arquitectura | Unidad de corte, fuente de verdad, reconciliación y salida | Doble captura o historia inconsistente |
| DEC-060 | Estrategia de piloto | No iniciada | H3 | Crítica | R1–R5, DEC-059 | No | Producto + Operaciones + Seguridad | Alcance, tenant/sucursal, datos, duración cualitativa y salida | Operación real sin límites ni autoridad |
| DEC-061 | Soporte y rollback | Propuesta | H3 | Crítica | DEC-053 a DEC-060 | ADR operativo si fija topología | Operaciones + Ingeniería + Producto | Runbook, autoridad, recuperación y criterios de abortar | Incidente sin respuesta o reversión dañina |
| DEC-062 | Criterios de aceptación | Requiere Product Owner | H0 y cada rebanada | Crítica | Alcance y escenarios | No | Producto + Calidad + Arquitectura | Casos felices, negativos, concurrencia y autoridad | Trabajo imposible de validar |
| DEC-063 | Definición de terminado | Propuesta | H0 | Alta | DEC-051, DEC-062 | No | Calidad + Arquitectura + Producto | Gates de código, seguridad, docs y evidencia | “Terminado” sin aislamiento ni operación |
| DEC-064 | Seguridad mínima para producción | No iniciada | H4 | Crítica | H1, H3, threat models | ADRs por mecanismo significativo | Seguridad + Arquitectura + Operaciones | Hardening, pruebas, vulnerabilidades y riesgos aceptados | Exposición general del SaaS |
| DEC-065 | Rendimiento mínimo | No iniciada | H3 cualitativo, H4 cuantitativo | Alta | Perfil de carga, recorridos | No, salvo cambio arquitectónico | Producto + Operaciones + Ingeniería | Objetivos por recorrido y medición representativa | Piloto inutilizable o metas inventadas |
| DEC-066 | Escalabilidad esperada | No iniciada | H4 | Media | DEC-065, costos | ADR sólo si cambia topología | Producto + Arquitectura + Operaciones | Perfil de tenants, concurrencia y disparadores medidos | Sobrearquitectura o capacidad insuficiente |
| DEC-067 | Planes y límites del SaaS | Requiere Product Owner | H4 | Alta | Oferta inicial, costos | No | Producto + Finanzas | Oferta, límites, medición y excepciones | Promesas comerciales sin enforcement coherente |
| DEC-068 | Administración de tenants | Propuesta | H3 mínima, H4 completa | Alta | DEC-006, DEC-067 | ADR de administración excepcional si aplica | Producto + Operaciones + Seguridad | Provisión piloto y administración auditada | Superadministrador o alta manual no gobernada |
| DEC-069 | Suspensión de tenants | Requiere Product Owner | H4 | Crítica | DEC-067, identidad, retención | ADR de ciclo de tenant | Producto + Seguridad + Operaciones | Efecto sobre acceso, trabajos, exportación y reactivación | Bloqueo destructivo o acceso indebido |
| DEC-070 | Borrado o cierre de tenant | Requiere Product Owner | H4 | Crítica | DEC-056, DEC-069, legalidad | ADR de ciclo de tenant/datos | Producto + Legal + Seguridad | Cierre, exportación, retención, eliminación y evidencia | Pérdida, retención indefinida o incumplimiento |

## Decisiones explícitamente diferidas

| ID | Decisión | Estado actual | Hito que bloquea | Severidad | Dependencias | ADR requerido | Responsable sugerido | Evidencia para cierre | Riesgo si se difiere |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| DEC-071 | Microservicios o extracción de módulos | Diferida | H5 | Baja | Señales de ADR-002 | ADR futuro sólo con evidencia | Arquitectura + Operaciones | Escala, ownership o aislamiento medidos | Ninguno para MVP; extraer temprano aumenta complejidad |
| DEC-072 | Event Sourcing | Descartada | H5 | Baja | Necesidad histórica no demostrada | ADR futuro si se reabre | Arquitectura | Caso que no pueda resolverse con persistencia normal | Complejidad sin valor si se adopta temprano |
| DEC-073 | CQRS completo | Diferida | H5 | Baja | Escala de lecturas demostrada | ADR futuro | Arquitectura + Ingeniería | Métricas y límites de modelos híbridos | Duplicación y consistencia eventual prematuras |
| DEC-074 | BI avanzado y data warehouse | Diferida | H5 | Baja | Datos y preguntas reales | ADR futuro de datos | Producto + Datos | Casos analíticos y volumen demostrados | Distracción; vistas operativas bastan |
| DEC-075 | Inteligencia artificial | Diferida | H5 | Baja | Caso, datos y gobernanza | ADR futuro | Producto + Seguridad | Valor, riesgo, alternativa y evaluación | Dependencia opaca en invariantes |
| DEC-076 | RFID o NFC | Diferida | H5 | Baja | Necesidad de custodia medida | ADR sólo si cambia arquitectura | Producto + Operaciones | Piloto físico que supere folio/QR | Hardware prematuro y fricción |
| DEC-077 | Inventario, compras y proveedores completos | Diferida | H5 | Media | Flujo R1–R5 validado | ADRs futuros por dominio | Producto + Operaciones | Caso de stock y ownership confirmados | Inflar MVP y acoplar piezas a autorización |
| DEC-078 | CRM omnicanal y WhatsApp automático | Diferida | H5 | Media | Consentimiento y canal prioritario | ADR de integración futura | Producto + Legal + Seguridad | Recorrido, consentimiento, proveedor y fallos | Canal acoplado al núcleo |
| DEC-079 | Promociones avanzadas | Diferida | H5 | Baja | Modelo comercial básico | ADR sólo si motor general | Producto + Finanzas | Reglas reales repetibles | Motor de reglas sin necesidad |
| DEC-080 | Portal de cliente y pagos en línea | Diferida | H5 | Media | Identidad externa, legalidad y pagos | ADRs futuros | Producto + Seguridad + Finanzas | Recorrido, actor, fraude y proveedor | Superficie expuesta prematura |
| DEC-081 | Dispositivo global persistente y operación offline | Diferida | H5 | Media | Necesidad operativa y conflictos | ADR futuro | Producto + Operaciones + Seguridad | Caso offline, sincronización y revocación | Complejidad de identidad/conflictos |
| DEC-082 | Multi-región y distribución geográfica | Diferida | H5 | Baja | Residencia, SLO y carga | ADR futuro | Arquitectura + Operaciones + Legal | Requisito regional y costo comprobados | Complejidad distribuida sin demanda |

## Lectura del estado

- `Aceptada` y `Cerrada` ya no bloquean su hito.
- `Parcialmente resuelta` conserva reglas válidas, pero aún necesita cerrar alcance o mecanismo.
- `Requiere Product Owner` no admite sustitución técnica.
- `Requiere spike` necesita autorización y evidencia antes del ADR.
- `Diferida` y `Descartada` no son deuda implícita del MVP.
