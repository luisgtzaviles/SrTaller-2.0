# PBI-029 — Threat Model: Secrets and External Configuration Foundation

## Estado

- **Estado:** Aprobado para implementación local-first por autorización Owner.
- **Alcance:** Foundation de configuración externa y secretos; no implementa
  PIN, sesiones, Station Runtime, proveedores de secretos ni infraestructura.
- **Riesgo del PBI:** `CRITICAL`, aceptado explícitamente por el Owner.
- **Decisión de diseño:** La mitigación mínima cabe en el repositorio y el
  runtime actual; no requiere Vault, KMS, cloud secret manager, deploy,
  distribución productiva de secretos ni criptografía propia.

## Activos y clasificación

| Activo | Clasificación | Propietario / destino | Regla |
|---|---|---|---|
| Host, puerto y ambiente de runtime | No secreto | Servidor | Fuente externa y formato validado. |
| Configuración de conexión PostgreSQL | Mixta | Servidor / infraestructura de persistencia | El password es secreto; los demás campos se validan sin exponerse en diagnósticos. |
| Pepper de PIN futuro | Secreto reservado | Servidor / futuro PBI-025 | No existe valor ni consumidor en este PBI. |
| Material de firma de sesión futuro | Secreto reservado | Servidor / futuro PBI-034 | No existe valor ni consumidor en este PBI. |
| Credencial de bootstrap de Station futura | Secreto reservado | Servidor / futuro PBI-024 | No existe valor ni consumidor en este PBI. |
| Configuración de Vite y bundle | No secreto público | Cliente | No puede contener secretos server-only. |

Los nombres de secretos futuros son inventario sin valores. Un nombre no crea
una credencial, una clave ni autorización para materializar el consumidor.

## Límites de confianza

```text
operador / CI / runtime injecta variables externas
        -> parser puro y fail-closed del servidor
        -> consumidores server-only (actualmente PostgreSQL)

fuentes de Vite no secretas
        -> define/bundle público
        -> navegador
```

`.env.local` sólo vive en la máquina de desarrollo, está ignorado por Git y es
generado con valores locales aleatorios. Preview, Staging y Production no
comparten ese archivo ni credenciales entre sí.

## Amenazas y mitigaciones

| Superficie / amenaza | Riesgo | Mitigación materializada o exigida | Riesgo residual |
|---|---|---|---|
| Git, historial o artefactos con secretos | Exfiltración | `.env*` ignorado salvo ejemplos sin valores; scanner de archivos versionados; no se aceptan valores productivos en pruebas o evidencia. | Un secreto ya filtrado en historial requiere respuesta de incidente fuera de este PBI. |
| Variables ausentes, vacías o inyectadas | Fail-open, destino equivocado | Parseo explícito, allowlist por contrato, errores estables sin valores y rechazo de variables de conexión alternativas. | El operador sigue siendo responsable de inyectar valores correctos. |
| Defaults o fallback silencioso | Uso accidental de credencial/ambiente | Ningún default para secretos requeridos; ambiente y requisito se declaran explícitamente; producción falla cerrada. | La configuración de cada ambiente sigue siendo una operación autorizada. |
| Logs, excepciones, CI y evidencia | Divulgación indirecta | Diagnósticos con código/nombre/categoría; redacción determinista; pruebas contra `message`, stack, JSON e inspección; CI no imprime variables. | Dependencias externas pueden cambiar su formato; se limita la superficie propia. |
| Bundle, HTML o Vite | Secreto llega al navegador | Inventario server-only; prohibición y prueba de `VITE_*` sensible, `import.meta.env` sensible y artefactos con secretos. | Las variables públicas futuras requieren clasificación antes de agregarse. |
| Docker, procesos hijos y healthcheck | Secreto en imagen, comando o entorno heredado | Imagen no define secretos; scripts locales limpian variables canónicas antes de crear procesos y sólo derivan el mínimo por rol. | La inyección de runtime/deploy sigue fuera de alcance y debe revisarse antes de Production. |
| Fixtures, snapshots y máquinas de desarrollo | Secreto versionado o reutilizado | Sólo literales sintéticos inequívocos en pruebas; `.env.local` con permisos de propietario y credenciales generadas localmente; ejemplos con marcador no utilizable. | Un equipo comprometido requiere manejo de incidente local. |
| Preview/Production | Reuso cruzado | Contrato de ambientes separados; Preview no usa credenciales productivas; PBI no cambia deploy. | La verificación de secretos reales de Dokploy/Production exige una tarea autorizada. |
| PIN, bootstrap y claves futuras | Consumidor creado antes de control | Registro reservado sin valores; todo consumidor futuro debe declarar requisito, rotación y pruebas negativas. | La selección de algoritmo, almacenamiento y rotación productiva queda para sus PBIs/ADR. |
| Rotación o revocación | Secreto inmóvil o cacheado | Lectura de configuración al arranque, sin singleton global ni persistencia de plaintext; reinicio controlado reevalúa requisitos. | Rotación automatizada, hot reload, Vault/KMS y break-glass requieren diseño y autoridad posteriores. |

## Decisión del gate de implementación

La foundation se limita a contratos puros de proceso, clasificación y
diagnósticos seguros, controles de repositorio/bundle y documentación local.
No hay requisito material de infraestructura externa ni de una dependencia de
alto impacto. Por ello el gate permite continuar con tamaño `Medium`; el riesgo
permanece `CRITICAL` y no queda reducido por esta estimación.

## Evidencia esperada

- pruebas unitarias de requisitos, formato, redacción y ausencia de valores en
  diagnósticos;
- pruebas de frontera frontend, artefacto y archivos versionados;
- pruebas de ambiente local/test/production y compatibilidad del runtime;
- `pnpm run verify`, revisión focalizada y CI autoritativo del candidato;
- ningún valor secreto en esta evidencia.

## Próxima revisión

Revisar nuevamente antes de introducir PBI-024, PBI-025 o PBI-034 como
consumidores de secretos reservados.
