# Modelo multitenant

## Restricción central

**[RDD]** Toda operación y lectura debe ocurrir bajo un tenant inequívoco. La sucursal añade alcance operativo, pero no sustituye el tenant. El aislamiento no puede depender sólo de filtros voluntarios en la interfaz de usuario.

## Contexto mínimo

| Elemento | Fuente confiable | Uso | Clasificación |
| --- | --- | --- | --- |
| Tenant | Sesión/membresía verificada | Partición y autorización | RDD |
| Sucursal | Alcance permitido en la sesión | Folios, configuración y operación | RDD |
| Actor | Identidad autenticada y atribución operativa | Auditoría y permisos | RDD |
| Correlación | Generada por el sistema | Diagnóstico e idempotencia | DAR |

## Reglas de diseño

1. **[DAR]** El contexto se resuelve una vez en el borde confiable y se propaga explícitamente.
2. **[DAR]** Repositorios, consultas, cachés, archivos, eventos y trabajos incluyen aislamiento.
3. **[DAR]** Las identidades externas no bastan para autorizar acceso a una entidad.
4. **[DAR]** Pruebas negativas intentan acceso cruzado por identificador, búsqueda, archivo y tarea asíncrona.
5. **[R]** Los roles de soporte o plataforma no reciben bypass implícito.

## Cobertura transversal

| Elemento | Readiness mínimo | Estado | Clasificación |
| --- | --- | --- | --- |
| Datos de negocio | Pertenencia explícita a tenant | Bloqueante | PB |
| Datos de sucursal | Regla de pertenencia por tipo de dato | Bloqueante por rebanada | PB |
| Usuarios/roles/permisos | Membresía y alcance verificables | Bloqueante | PB |
| Políticas/catálogos | Alcance, herencia y versión | Bloqueante por rebanada | PB |
| Folios | Alcance de unicidad y concurrencia | Bloqueante de Recepción | PB |
| Archivos | Tenant/sucursal, autorización y rutas opacas | Bloqueante antes de evidencia | PB |
| Sesiones | Tenant y sucursal activa inequívocos | Bloqueante | PB |
| Auditoría/consultas | Filtro obligatorio y prueba negativa | Bloqueante antes de producción | RDD |
| Índices conceptuales | Tenant como prefijo de búsquedas/únicos cuando aplique | Bloqueante al diseñar persistencia | DAR |
| Trabajos en segundo plano | Contexto explícito y deduplicación | Bloqueante al introducirlos | DAR |
| Notificaciones | Resolución de tenant y minimización de datos | Diferible con la integración | DD |

## Decisiones bloqueantes

- **[PB]** Mecanismo inicial de resolución del tenant y cambio de sucursal.
- **[PB]** Alcance real de una membresía y si una sesión puede operar varias sucursales.
- **[PB]** Estrategia de aislamiento en persistencia y defensa en profundidad.
- **[PB]** Tratamiento de administración de plataforma y soporte temporal.
- **[PB]** Alcance de folios, configuración, archivos y claves idempotentes.

## Preguntas sin respuesta inventada

1. **[PB]** ¿Todo dato de negocio pertenece explícitamente a un tenant y cuáles datos son globales de la plataforma?
2. **[PB]** ¿Qué datos pertenecen además a una sucursal?
3. **[PB]** ¿El folio es único por tenant, sucursal o global?
4. **[PB]** ¿Puede una orden trasladarse de sucursal? La capacidad está fuera del MVP, pero la identidad no debe impedir una decisión futura.
5. **[PB]** ¿Las políticas heredan de tenant a sucursal y con qué precedencia?
6. **[PB]** ¿Una orden abierta conserva la versión aplicada cuando cambia la política?
7. **[PB]** ¿Qué instantánea mínima de política conserva la orden?
8. **[PB]** ¿Puede un usuario operar varias sucursales y cómo selecciona la activa?

## Estado de ADR

**[ADR]** El esquema compartido propuesto en ADR-004 y el enrutamiento por subdominio de ADR-008 no están aceptados. El MVP exige aislamiento, pero no presupone esos mecanismos.

## Gate

**[R]** No debe escribirse persistencia real hasta acordar el contexto mínimo y la estrategia de pruebas de aislamiento.
