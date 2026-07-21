# Plan de rebanadas verticales

## Principio

**[DAR]** Cada rebanada incluye intención, regla de dominio, persistencia propia, autorización, lectura, pruebas y observabilidad necesarias. El plan no es sprint, hoja de ruta ni autorización de implementación.

## Secuencia propuesta

| Rebanada | Valor, módulos y casos de uso | Dependencias y decisiones | Riesgos y aceptación | Demostración controlada | Clasificación |
| --- | --- | --- | --- | --- | --- |
| R0 — Fundación ejecutable | Contexto seguro; Tenancy, Identidad, Usuarios; sesión, sucursal, salud y observabilidad | B-01, B-04, B-05, B-14, B-15, B-21 a B-24 | Fundación horizontal; acepta acceso aislado, revocación y correlación | Dos tenants sin acceso cruzado y sesión atribuible | DAR |
| R1 — Recepción | Orden válida; Configuración, Clientes, Orden, Custodia, Evidencia/Notas; crear, reservar folio, identificar y comprobante | B-02, B-03, B-06, B-07, B-10, B-16 a B-18 | Duplicidad, política cambiante e impresora; acepta orden+custodia atómicas, reintento y alternativa manual | Crear/consultar orden sin duplicar, incluso con falla de impresora | DAR |
| R2 — Operación y Taller | Visibilidad/diagnóstico; Custodia, Trabajo, Diagnóstico y lecturas; listar, escanear, mover, asignar, anotar y concluir | Estados/ubicaciones, roles y revisión diagnóstica | Ubicación/estado mezclados; acepta movimientos concurrentes, atribución e iteraciones | Recibir, localizar, asignar y concluir una orden | DAR |
| R3 — Cotización y autorización | Alcance comercial; Cotización/Autorizaciones; conceptos, versión, decisión parcial y total | B-08 y B-20; política comercial/dinero | Precio mutable/versión vieja; acepta servicio, pieza descriptiva, parcial y rechazo | Autorizar algunos conceptos sin inventario | DAR |
| R4 — Ejecución y QC | Trabajo controlado; Ejecución, Calidad y Flujo; iniciar/terminar, participar, revisar y resolver | B-10 y B-13; permisos sensibles | Trabajo no autorizado/Listo sin QC; acepta rechazo, reintento y No quedó | Ejecutar sólo autorizado y mostrar retorno a Taller | DAR |
| R5 — Pagos y entrega | Cierre vendible; Pagos, Entrega, Custodia; anticipo, saldo, cobro y entrega | B-09, B-12 y B-19; política de saldo | Doble cobro/entrega; acepta movimientos, compensación y fin único de custodia | Anticipo, cobro y entrega idempotentes | DAR |
| R6 — Endurecimiento | Preparación de piloto/producción; todos + reportes mínimos; excepciones, auditoría y recuperación | Criterios de producción y riesgos residuales | Sobreajuste/huecos; acepta seguridad, carga, copias, permisos y variantes | Flujo R1-R5 con fallos y evidencia operativa | RP |

## Criterios por rebanada

### R1 — Recepción y custodia

- **[RDD]** Creación e inicio de custodia son atómicos.
- **[RDD]** Folio no se duplica en su alcance.
- **[DAR]** Reintento no crea otra orden.
- **[DAR]** Prueba entre tenants niega consulta por identificador.

### R2 y R3 — Técnico y comercial

- **[RDD]** Conclusión, recomendación y propuesta permanecen distintas.
- **[RDD]** La autorización refiere a versión y concepto.
- **[DAR]** Conflictos de revisión se hacen visibles.

### R4 — Ejecución y QC

- **[RDD]** No se ejecuta alcance no autorizado.
- **[RDD]** QC revisa una versión concreta y puede rechazar.
- **[RDD]** Listo/No quedó no termina custodia.

### R5 — Pagos y entrega

- **[RDD]** Pagos son movimientos idempotentes y reversables por compensación.
- **[RDD]** Entrega válida termina custodia una sola vez.
- **[DAR]** Fallo de notificación no revierte la entrega.

## Hito vendible

**[RP]** El primer hito vendible existe al integrar R1 a R5 y demostrar el flujo completo; ninguna rebanada aislada se presenta como MVP terminado.
