# Arquitectura objetivo preliminar

## Estado del documento

- **Estado:** Borrador conceptual.
- **Naturaleza:** Arquitectura propuesta; ninguna selección tecnológica queda aceptada por este documento.
- **Horizonte:** Dirección escalable para 1,000 o más tenants, sujeta a validación con carga, costos y necesidades reales.
- **Decisiones relacionadas:** ADRs en estado `Proposed` del [registro de decisiones](../decisions/README.md).

## Objetivo

Definir una dirección coherente para construir SR Taller 2.0 sin implementar todavía aplicaciones, infraestructura ni esquemas. La arquitectura busca aislamiento multitenant, límites claros, una API reutilizable, despliegues repetibles y evolución gradual.

## Principios rectores

1. Aislamiento de tenant antes que conveniencia.
2. La API central aplica reglas y es fuente de verdad para clientes propios.
3. El dominio se organiza en módulos con ownership explícito.
4. Un monolito modular es el punto de partida propuesto; los microservicios no forman parte de la fundación.
5. Procesos síncronos, asíncronos y tiempo real tienen responsabilidades distintas.
6. API, workers y aplicaciones web pueden desplegarse por separado aun cuando compartan un repositorio y contratos.
7. Seguridad, observabilidad y trazabilidad se diseñan desde el inicio.
8. Las decisiones reversibles se mantienen simples; las irreversibles requieren evidencia y ADR.

## Vista objetivo

```mermaid
flowchart TB
    subgraph Clients[Clientes propios]
        WorkshopWeb[Web de operación\nNext.js propuesto]
        PlatformWeb[Web de plataforma\nNext.js propuesto]
        Mobile[Apps iOS y Android\nReact Native / Expo futuro]
    end

    Edge[DNS / TLS / routing\nresolución inicial de hostname]
    API[API central\nNestJS propuesto\nmonolito modular]
    Worker[Workers asíncronos\nBullMQ propuesto]
    Realtime[Gateway de tiempo real\nSocket.IO o WebSockets por decidir]

    DB[(PostgreSQL propuesto\nesquema compartido)]
    Redis[(Redis propuesto\ncaché, colas y coordinación)]
    Storage[(Objetos compatibles con S3\npropuesto)]

    Channels[Mensajería y otros canales]
    Payment[Pagos y suscripciones]
    Delivery[Correo / push / notificaciones]

    WorkshopWeb --> Edge
    PlatformWeb --> Edge
    Mobile --> Edge
    Edge --> API
    Edge --> Realtime
    API --> DB
    API --> Redis
    API --> Storage
    API -->|Encola| Worker
    Worker --> DB
    Worker --> Redis
    Worker --> Storage
    Worker <-->|Adaptadores| Channels
    Worker <-->|Adaptadores| Payment
    Worker <-->|Adaptadores| Delivery
    API -->|Eventos confirmados| Realtime
    Realtime --> Redis
    Realtime --> Clients
```

El diagrama expresa responsabilidades lógicas. El gateway de tiempo real puede comenzar dentro del proceso de API; su despliegue independiente sólo se justificaría con evidencia operativa.

## Bloques de la solución

| Bloque | Responsabilidad | Propuesta preliminar | No implica todavía |
|---|---|---|---|
| Clientes web | Experiencias específicas por audiencia | Next.js, React, Tailwind y design system propio | Número final de aplicaciones ni estrategia de renderizado |
| Cliente móvil | Consumir contratos centrales cuando exista necesidad validada | React Native con Expo | Construcción durante la fundación |
| API central | Autenticación, autorización, casos de uso y contratos | NestJS con TypeScript | Framework aceptado ni endpoints definidos |
| Módulos de dominio | Encapsular reglas, datos y eventos por capacidad | Monolito modular | Microservicios ni tablas por módulo |
| Workers | Ejecutar procesos diferibles, reintentos e integraciones | BullMQ sobre Redis | Topología o concurrencia final |
| Tiempo real | Entregar cambios confirmados a clientes conectados | Socket.IO o WebSockets | Protocolo aceptado |
| Datos transaccionales | Persistencia canónica y consistencia | PostgreSQL, esquema compartido con `tenant_id` | Diseño físico ni RLS aceptado |
| Coordinación temporal | Caché, colas y coordinación de conexiones | Redis | Uso como fuente de verdad |
| Archivos | Guardar objetos y metadatos de acceso | API compatible con S3 | Proveedor, regiones o retención final |
| Integraciones | Aislar contratos externos y normalizar eventos | Adaptadores y anti-corruption layer | Proveedores comprometidos |

## Unidades lógicas y desplegables

- **API:** atiende solicitudes síncronas, valida contexto y ejecuta casos de uso breves.
- **Worker:** consume trabajos con contexto de tenant, maneja reintentos e integraciones diferibles.
- **Clientes web:** se construyen y despliegan de acuerdo con su audiencia, sin contener reglas autoritativas.
- **Gateway de tiempo real:** responsabilidad lógica diferenciada; puede compartir unidad al inicio.
- **Persistencias y servicios de soporte:** son dependencias por ambiente, no módulos de negocio.

Compartir monorepo no autoriza dependencias arbitrarias. Compartir base de datos no autoriza a un módulo a modificar datos de otro sin contrato.

## Límites de módulos

Los módulos preliminares están descritos en el [mapa de módulos](../product/MODULE_MAP.md). Cada uno debería:

- poseer sus invariantes y su modelo conceptual;
- exponer capacidades mediante interfaces de aplicación;
- producir eventos con significado de negocio cuando corresponda;
- evitar acceso directo a internals de otro módulo;
- declarar dependencias permitidas y mantenerlas acíclicas;
- transportar tenant, actor y correlación en operaciones relevantes.

La extracción futura de un módulo sólo se evaluará por presión demostrable: escalado independiente, aislamiento de fallos, ownership organizacional o ciclo de despliegue distinto.

## Flujos de ejecución

### Solicitud síncrona

1. El edge recibe hostname y conexión segura.
2. La API resuelve un tenant candidato.
3. La identidad autenticada, membresía, sucursal y dispositivo se contrastan con ese contexto.
4. El caso de uso autoriza la acción y opera dentro del límite del módulo.
5. La persistencia confirma el cambio.
6. Se registra auditoría y/o se publica un evento cuando aplique.

### Trabajo asíncrono

1. Un caso de uso persiste el estado necesario.
2. Se agenda un trabajo con tenant, tipo, versión, idempotency key y correlación.
3. Un worker vuelve a validar el contexto y ejecuta con reintentos acotados.
4. El resultado se persiste antes de notificarlo.
5. Fallos agotados se hacen visibles para operación; no se descartan silenciosamente.

### Integración y tiempo real

Los webhooks se verifican y normalizan; la plataforma persiste su interpretación canónica y sólo entonces emite eventos hacia rooms aisladas. Véanse [tiempo real y mensajería](REALTIME_AND_MESSAGING.md) e [integraciones](INTEGRATION_ARCHITECTURE.md).

## Evolución prevista, no comprometida

| Etapa | Objetivo arquitectónico | Condición de avance |
|---|---|---|
| Fundación documental | Validar límites, riesgos, ADRs y backlog | Aprobación explícita para prototipos técnicos |
| Monolito modular inicial | Demostrar recorridos de negocio y aislamiento | Métricas, pruebas y contratos suficientes |
| Escalado horizontal | Aumentar réplicas sin estado local autoritativo | Demanda y pruebas de capacidad |
| Separación selectiva | Extraer sólo responsabilidades con presión real | ADR nuevo con evidencia y costo operativo |

## Atributos de calidad

- **Seguridad:** denegación por defecto, aislamiento transversal y acciones sensibles reforzadas.
- **Modificabilidad:** módulos y contratos con dependencias visibles.
- **Confiabilidad:** idempotencia, reintentos acotados, recuperación y rollback planificados.
- **Escalabilidad:** servicios de aplicación sin estado autoritativo local y trabajos desacoplados.
- **Portabilidad de clientes:** contratos centrales independientes de la interfaz web.
- **Operabilidad:** logs estructurados, métricas, trazas, health checks y artefactos versionados.
- **Accesibilidad y consistencia:** design system común, sujeto a su estrategia específica.

Los objetivos cuantitativos de capacidad, disponibilidad, latencia y recuperación están en `TBD`; no deben inferirse del objetivo de tenants.

## Alternativas que permanecen abiertas

- Monolito modular propuesto frente a servicios separados prematuramente.
- PostgreSQL con esquema compartido frente a otras estrategias de partición futuras.
- NestJS frente a alternativas TypeScript para la API.
- Next.js frente a otras estrategias para cada cliente web.
- Socket.IO frente a WebSockets nativos u otras soluciones administradas.
- Redis/BullMQ frente a servicios de cola administrados cuando la operación lo justifique.
- Proveedor S3-compatible y estrategia de distribución de archivos.
- Monorepo con pnpm/Turborepo frente a repositorios separados.

Las alternativas principales se documentan en ADRs `Proposed`; este documento no reemplaza su evaluación.

## Restricciones y no objetivos

- No se diseña una arquitectura de microservicios durante esta fase.
- No se implementan aplicaciones, esquemas, migraciones, contenedores ni infraestructura.
- No se promete personalización ilimitada, base de datos por tenant, Kubernetes ni operación offline.
- No se migrará automáticamente toda la complejidad del sistema anterior.
- No se asumirá que 1,000 tenants equivalen a una carga uniforme o conocida.

## Riesgos

- Que los límites lógicos no se apliquen y el monolito vuelva a acoplar presentación, negocio y datos.
- Que la base compartida amplifique una omisión de contexto de tenant.
- Que Redis o WebSockets se conviertan accidentalmente en fuentes de verdad.
- Que la separación desplegable se confunda con servicios distribuidos desde el primer día.
- Que se optimice para una escala nominal sin escenarios de carga representativos.

## Documentos relacionados

- [Contexto del sistema](SYSTEM_CONTEXT.md)
- [Arquitectura de aplicaciones](APPLICATION_ARCHITECTURE.md)
- [Arquitectura de datos](DATA_ARCHITECTURE.md)
- [Estrategia de despliegue](DEPLOYMENT_STRATEGY.md)
- [Línea base de seguridad](SECURITY_BASELINE.md)
- [Estrategia de observabilidad](OBSERVABILITY_STRATEGY.md)
- [Principios de producto](../product/PRODUCT_PRINCIPLES.md)

## Preguntas abiertas

- ¿Cuáles son los primeros recorridos verticales que validarán los límites modulares?
- ¿Qué objetivos de disponibilidad, latencia, recuperación y volumen necesita cada tipo de operación?
- ¿Cuántas aplicaciones web requiere la primera etapa y qué audiencias comparten experiencia?
- ¿Qué presión justificaría separar el gateway de tiempo real o mensajería?
- ¿Qué restricciones de residencia, retención o soberanía de datos existen?
- ¿Qué ADRs propuestos deben resolverse antes de un prototipo técnico?

## Próxima revisión

- **Momento:** después de validar el mapa de módulos, los recorridos críticos y las ADRs propuestas.
- **Evidencia esperada:** escenarios de calidad priorizados, dependencias permitidas y decision gates explícitos.
- **Responsable:** TBD.
