# Capa de aplicación

## Responsabilidad

**[DAR]** La capa de aplicación recibe una intención autenticada, resuelve contexto, autoriza, carga las capacidades necesarias, coordina el dominio, confirma la unidad de trabajo y publica resultados. No decide reglas que pertenecen al dominio.

## Secuencia general de un caso de uso

1. **[DAR]** Validar forma y presencia de la solicitud sin convertir validación sintáctica en regla de negocio.
2. **[RDD]** Resolver tenant, sucursal, sesión y actor desde fuentes confiables.
3. **[DAR]** Evaluar permiso y alcance para la acción.
4. **[DAR]** Obtener agregados o políticas mediante puertos propietarios.
5. **[RDD]** Ejecutar reglas e invariantes del dominio.
6. **[DAR]** Persistir una unidad coherente e idempotente.
7. **[DAR]** Publicar hechos confirmados, registrar auditoría técnica cuando corresponda y construir el resultado.

## Casos de uso candidatos

| Área | Intenciones mínimas | Clasificación |
| --- | --- | --- |
| Contexto | Autenticar/cerrar/sustituir sesión, validar estación vinculada, obtener capacidades | DAP, ADR-010/011 |
| Recepción | Crear orden, reservar folio, identificar equipo, consultar detalle, agregar nota | DAP |
| Taller | Mover equipo, asignar técnico, registrar participación | DAP |
| Diagnóstico | Abrir revisión, registrar conclusión y recomendaciones | DAP |
| Comercial | Emitir/reemplazar propuesta, decidir conceptos, consultar total autorizado | DAP |
| Ejecución | Iniciar y terminar trabajo autorizado | DAP |
| Calidad | Solicitar, aprobar o rechazar segunda revisión; coordinar Listo | DAP |
| Pagos | Registrar anticipo/pago y movimiento compensatorio autorizado | DAP |
| Entrega | Evaluar elegibilidad, entregar, finalizar custodia | DAP |
| Evidencia | Adjuntar/consultar evidencia y generar identificación | DAP |
| Configuración | Resolver y publicar política versionada | DAP |

## Antiobjetivos

- **[R]** No contener SQL, detalles HTTP ni llamadas directas a proveedores.
- **[R]** No reimplementar invariantes en controladores o interfaz de usuario.
- **[R]** No aceptar actor, tenant o permiso como simples campos confiables.
- **[R]** No hacer una transacción distribuida para notificaciones o impresión.
- **[R]** No calcular precios ni descuentos sin política de dominio.
- **[R]** No mutar persistencia fuera del repositorio propietario.

## Pendiente de diseño

**[ADR]** Nombres, firmas, manejo de transacciones y composición concreta dependen del conjunto tecnológico aceptado. Los casos listados son responsabilidades, no interfaces definitivas.
