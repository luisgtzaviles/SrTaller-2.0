# PBI-029 — External Configuration Contract

## Fuente y consumo

La configuración llega desde el entorno del proceso. La nueva foundation no
lee archivos, no conserva un singleton global, no hace I/O ni ejecuta comandos.
Cada consumidor declara de forma explícita los secretos que necesita; el valor
no se copia a logs, serialización ni diagnóstico.

| Clase | Nombres | Estado | Consumidor |
|---|---|---|---|
| No secreto técnico | `HOST`, `NODE_ENV`, `PORT` | Activo | Technical shell |
| No secreto de persistencia | `SR_DB_ENVIRONMENT` | Activo | Database configuration |
| Secreto activo | `SR_DB_PASSWORD`, `SR_TEST_DB_PASSWORD` | Activo | Database configuration |
| Secreto activo | `SR_PIN_PEPPER` | Consumido por Access/PBI-025 | Server-only; nunca navegador, logs ni evidencia |
| Secreto reservado | `SR_SESSION_SIGNING_KEY` | Sin consumidor | PBI-034 futuro |
| Secreto activo local/test | `SR_STATION_BOOTSTRAP_SECRET` | Bootstrap técnico de Station en PBI-024 | Sólo `.env.local` o runner efímero; no enrollment productivo |
| Secreto activo local/test | `SR_USER_BOOTSTRAP_SECRET` | Provisioning server-only del primer User en PBI-032 | Sólo `.env.local`; no endpoint, administración ni provisioning productivo |

La clasificación no autoriza exponer nada al cliente: todos estos nombres son
server-only. La configuración pública de Vite continúa siendo una superficie
separada y no puede usar un nombre secreto.

## Reglas fail-closed

- Un secreto declarado por un consumidor debe existir, no ser vacío ni sólo
  espacios, no tener espacios externos y no superar el límite gobernado.
- La misma dependencia no puede declararse dos veces.
- Un consumidor no puede recuperar un secreto que no declaró.
- El parser de PostgreSQL mantiene su own allowlist, sus namespaces y su
  rechazo de `DATABASE_URL`/`PG*`; PBI-029 no lo reemplaza.
- El arranque del servidor exige explícitamente `SR_DB_PASSWORD` antes de abrir
  el runtime. El error contiene nombre, categoría y código estable, nunca valor.

## Ambientes

| Ambiente | Fuente de valores | Restricción |
|---|---|---|
| Local | `.env.local` ignorado y generado con valores aleatorios sintéticos | Los scripts derivan `SR_DB_*` sólo en memoria y limpian el entorno hijo. |
| Test / CI | Entorno efímero del runner con literales sintéticos inequívocos | No se persiste el valor ni se imprime en evidencia. |
| Preview | Inyección del runtime de Preview, fuera de este cambio | No usa archivos locales ni credenciales de Production. |
| Production | No materializado | Sin default; requiere configuración externa válida y autoridad/deploy propios. |

## Rotación y revocación

Los valores se leen al construir el runtime y no se almacenan en base de datos,
fixtures ni artefactos. Una rotación se aplica mediante una nueva inyección y
reinicio controlado del proceso. Hot reload, proveedor externo, rotación
automatizada, break-glass y almacenamiento de claves son decisiones futuras y
no están implícitas en este contrato.

## Próxima revisión

PBI-025 materializa el primer consumidor criptografico de este contrato:
`SR_PIN_PEPPER` es obligatorio y fail-closed al construir el hasher de Access.
La siguiente revision corresponde antes de que PBI-034 declare un consumidor
activo para `SR_SESSION_SIGNING_KEY`, y antes de materializar Production. Los
consumidores bootstrap de PBI-024 y PBI-032 siguen limitados a desarrollo/test
y no autorizan enrollment ni provisioning productivos.
