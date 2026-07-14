# Dominio de refacciones e inventario operativo

## Metadatos

- **Estado:** Initial hypothesis / Pending Product Owner validation
- **Propósito:** Explorar lenguaje, escenarios, consistencia y ownership de refacciones sin diseñar mecanismos técnicos.
- **Alcance:** Catálogo, existencia, disponibilidad, reservas, consumo, transferencias, partes del cliente y garantía de proveedor.
- **Audiencia:** Product Owner, técnicos, inventario/compras, representantes de sucursal, garantías y arquitectura.
- **Última actualización:** 2026-07-13

## Límites de la exploración

Este documento no define tablas, SKUs, endpoints, algoritmos de stock, métodos de costo ni bloqueos. Inventory continúa como contexto candidato y su inclusión en el primer recorrido depende de Q015/Q016 y DQ-023.

## Conceptos candidatos

| ID | Concepto | Significado candidato | Distinción o pregunta | Estado |
|---|---|---|---|---|
| INVDOM-CONCEPT-001 | Producto | definición catalogada que puede referenciarse comercial u operativamente | no toda definición es refacción disponible | Initial hypothesis |
| INVDOM-CONCEPT-002 | Refacción | componente propuesto o usado para reparar | DQ-010; puede no pertenecer al catálogo propio | Initial hypothesis |
| INVDOM-CONCEPT-003 | Consumible | material cuyo uso reduce cantidad y quizá no permanece identificable | adhesivo o limpiador por validar | Unknown |
| INVDOM-CONCEPT-004 | Pieza | objeto físico concreto o término coloquial para refacción | definición frente a producto | Initial hypothesis |
| INVDOM-CONCEPT-005 | Variante | diferencia relevante de una definición de producto | compatibilidad, calidad, color o proveedor TBD | Unknown |
| INVDOM-CONCEPT-006 | Existencia | cantidad reconocida físicamente o por movimientos en un alcance | no equivale a disponibilidad | Initial hypothesis |
| INVDOM-CONCEPT-007 | Disponibilidad | cantidad que podría comprometerse considerando reservas/bloqueos | fórmula y autoridad pendientes | Initial hypothesis |
| INVDOM-CONCEPT-008 | Reserva | compromiso temporal de cantidad para un propósito | INV-013, DQ-023 | Initial hypothesis |
| INVDOM-CONCEPT-009 | Apartado | término operativo posiblemente equivalente a reserva o promesa comercial | relación con anticipo pendiente | Unknown |
| INVDOM-CONCEPT-010 | Asignación | relación de una pieza concreta con orden/técnico antes de instalar | no confundir con asignación técnica | Unknown |
| INVDOM-CONCEPT-011 | Consumo | hecho de aplicar una cantidad al trabajo | EVENT-026; no equivale necesariamente a instalación | Initial hypothesis |
| INVDOM-CONCEPT-012 | Instalación | incorporación física de una pieza al dispositivo | puede fallar o revertirse | Initial hypothesis |
| INVDOM-CONCEPT-013 | Devolución | retorno de pieza a inventario, cliente o proveedor según contexto | requiere destino explícito | Unknown |
| INVDOM-CONCEPT-014 | Liberación | fin de una reserva sin consumo | evento canónico no definido | Initial hypothesis |
| INVDOM-CONCEPT-015 | Merma | reducción por pérdida, daño o inutilidad | motivo y autoridad pendientes | Initial hypothesis |
| INVDOM-CONCEPT-016 | Daño | condición causada o descubierta que reduce utilidad | distinguir del defecto de origen | Initial hypothesis |
| INVDOM-CONCEPT-017 | Defecto | condición atribuida potencialmente a fabricación/proveedor | evidencia y aceptación pendientes | Unknown |
| INVDOM-CONCEPT-018 | Pieza retirada | componente extraído del dispositivo | custodia, devolución o descarte pendientes | Unknown |
| INVDOM-CONCEPT-019 | Pieza del cliente | parte aportada por cliente y fuera del stock propio | EDGE-021, SCENARIO-022 | Initial hypothesis |
| INVDOM-CONCEPT-020 | Pieza del proveedor | parte recibida o custodiada con procedencia externa | ownership físico/comercial pendiente | Unknown |
| INVDOM-CONCEPT-021 | Pieza reemplazada | componente nuevo o retirado vinculado a sustitución | relación con instalación y garantía | Unknown |
| INVDOM-CONCEPT-022 | Lote | agrupación por origen o recepción | necesidad no validada | Unknown |
| INVDOM-CONCEPT-023 | Serie | identidad individual de una pieza | no toda refacción la tiene | Unknown |
| INVDOM-CONCEPT-024 | Costo | valoración interna asociada a adquisición/uso | método y autoridad fuera de decisión | Unknown |
| INVDOM-CONCEPT-025 | Ubicación | lugar operativo donde se encuentra una cantidad o pieza | no equivale a sucursal | Initial hypothesis |
| INVDOM-CONCEPT-026 | Almacén | agrupación física u operativa de ubicaciones | existencia formal no validada | Unknown |
| INVDOM-CONCEPT-027 | Sucursal | unidad organizacional que podría contener ubicaciones | DQ-002/031 | Partially understood |
| INVDOM-CONCEPT-028 | Transferencia | coordinación de salida, tránsito y recepción entre alcances | solicitud no equivale a recepción | Initial hypothesis |
| INVDOM-CONCEPT-029 | Recepción de inventario | reconocimiento de bienes que llegan a un alcance | no es recepción del dispositivo del cliente | Unknown |
| INVDOM-CONCEPT-030 | Ajuste | corrección trazable de una discrepancia | no es edición silenciosa de cantidad | Initial hypothesis |
| INVDOM-CONCEPT-031 | Conteo | observación física en un momento y alcance | no reemplaza movimientos automáticamente | Initial hypothesis |
| INVDOM-CONCEPT-032 | Discrepancia | diferencia entre conteo y cantidad esperada | requiere investigación | Initial hypothesis |
| INVDOM-CONCEPT-033 | Garantía de proveedor | derecho o reclamo sobre pieza adquirida | no equivale a garantía al cliente | Unknown |

## Distinciones críticas

| ID | Contraste | Distinción candidata | Riesgo si se mezcla | Referencias |
|---|---|---|---|---|
| INVDOM-DIST-001 | refacción / producto | refacción cumple propósito técnico; producto es definición catalogada | asumir stock propio | DQ-010 |
| INVDOM-DIST-002 | existencia / disponibilidad | existencia representa cantidad; disponibilidad considera compromisos | prometer la última pieza dos veces | DQ-023 |
| INVDOM-DIST-003 | reserva / apartado | podrían ser alias o compromisos con autoridades distintas | anticipo interpretado como stock | RULE-009/011 |
| INVDOM-DIST-004 | reserva / consumo | reserva compromete; consumo reconoce uso | descontar dos veces | EVENT-025/026 |
| INVDOM-DIST-005 | consumo / instalación | consumo es efecto de inventario; instalación es hecho técnico | pieza consumida pero no instalada | EDGE-024 |
| INVDOM-DIST-006 | devolución a inventario / proveedor | destinos, ownership y efectos distintos | disponibilidad incorrecta | Q016 |
| INVDOM-DIST-007 | pieza propia / del cliente | sólo la propia podría afectar existencia/costo | garantía y costo incorrectos | EDGE-021, SCENARIO-022 |
| INVDOM-DIST-008 | inventario físico / disponible | conteo físico no descuenta necesariamente reservas o cuarentena | promesa falsa | INV-013 |
| INVDOM-DIST-009 | ubicación / sucursal | ubicación describe lugar; sucursal describe unidad organizacional | transferencias innecesarias | DQ-002 |
| INVDOM-DIST-010 | transferencia solicitada / recibida | una intención no prueba llegada ni disponibilidad | stock simultáneo en dos lugares | SCENARIO-020 |
| INVDOM-DIST-011 | pieza defectuosa / dañada al instalar | cambia responsabilidad, garantía y costo | reclamo al actor equivocado | EDGE-022/025 |

## Casos de exploración

Estos casos no agregan entradas a SCENARIO_CATALOG; reutilizan escenarios y edges cuando existe equivalencia.

| ID | Caso candidato | Resultado a descubrir | Referencia existente | Pregunta principal |
|---|---|---|---|---|
| INVDOM-CASE-001 | refacción disponible y reservada | cuándo deja de estar disponible | SCENARIO-008 | DQ-023 |
| INVDOM-CASE-002 | misma cantidad solicitada por varias órdenes | autoridad ante competencia | INV-013, EDGE-038 | prioridad y atomicidad de negocio |
| INVDOM-CASE-003 | reserva vencida o liberada | retorno a disponibilidad y evidencia | DQ-023 | duración y actor |
| INVDOM-CASE-004 | pieza recibida después de autorización | reanudación y cambio de promesa | SCENARIO-008 | evento de recepción faltante |
| INVDOM-CASE-005 | cambio de parte después de anticipo | nueva cotización/aplicación financiera | SCENARIO-021 | DQ-009/012 |
| INVDOM-CASE-006 | pieza incorrecta | devolución, demora y responsabilidad | EDGE-022 | compatibilidad |
| INVDOM-CASE-007 | pieza defectuosa | garantía de proveedor y nueva parte | EDGE-022 | evidencia de defecto |
| INVDOM-CASE-008 | pieza dañada durante instalación | merma/incidente y compensación | EDGE-025 | quién asume costo |
| INVDOM-CASE-009 | devolución de pieza sin usar | liberación o retorno físico | SCENARIO-008 | condición y ubicación |
| INVDOM-CASE-010 | pieza instalada con reparación fallida | consumo permanece o se revierte | EDGE-024 | instalación frente a resultado |
| INVDOM-CASE-011 | pieza aportada por cliente | sin movimiento de stock propio | SCENARIO-022/EDGE-021 | cobertura |
| INVDOM-CASE-012 | pieza retirada conservada | cadena de custodia y entrega | EDGE-040 por analogía | propiedad y plazo |
| INVDOM-CASE-013 | transferencia multisucursal | salida, tránsito y recepción separados | SCENARIO-020 | DQ-002/031 |
| INVDOM-CASE-014 | discrepancia de conteo | investigar antes de ajustar | RULE-020 | autoridad y evidencia |
| INVDOM-CASE-015 | existencia negativa | excepción, incertidumbre o prohibición | INV-013, DQ-023 | cuándo y por quién |
| INVDOM-CASE-016 | garantía usa pieza nueva | consumo, cobertura y proveedor | SCENARIO-018/022 | quién paga |
| INVDOM-CASE-017 | reclamación al proveedor | salida/cuarentena/reposición | DQ-010/021 | vínculo con garantía al cliente |

## Consistencia candidata

| ID | Situación | Coordinación candidata | Motivo | Estado |
|---|---|---|---|---|
| INVDOM-CONS-001 | reservar cantidad frente a disponibilidad | posible coordinación inmediata | evitar doble compromiso | Initial hypothesis |
| INVDOM-CONS-002 | consumir o liberar reserva | posible coordinación inmediata | preservar INV-007/013 | Initial hypothesis |
| INVDOM-CONS-003 | instalar pieza y reflejar consumo | orden relativo cercano; límite por validar | evitar pieza instalada sin historia | Unknown |
| INVDOM-CONS-004 | transferir salida y recepción | etapas coordinadas; no fingir simultaneidad | tránsito y custodia | Initial hypothesis |
| INVDOM-CONS-005 | publicar disponibilidad hacia Repair | posible consistencia eventual con frescura visible | Inventory conserva candidato autoritativo | Initial hypothesis |
| INVDOM-CONS-006 | proyectar costo en cotización/reportes | posible consistencia eventual/versionada | precio y costo no son lo mismo | Unknown |
| INVDOM-CONS-007 | conteo y ajuste | investigación antes de cambio efectivo | preservar evidencia | Initial hypothesis |
| INVDOM-CONS-008 | stock negativo | política y mecanismo desconocidos | Q016 no resuelta | Unknown |
| INVDOM-CONS-009 | lotes/series | necesidad y nivel desconocidos | no hay escenario aprobado | Unknown |
| INVDOM-CONS-010 | garantía de proveedor | coordinación eventualmente consistente | tercero puede responder tarde | Initial hypothesis |

Ninguna fila decide tecnología, bloqueo o consistencia transaccional definitiva.

## Ownership de inventario candidato

La matriz transversal está en [OWNERSHIP_MATRIX](OWNERSHIP_MATRIX.md).

| Información | Referencia | Ownership candidato | Estado |
|---|---|---|---|
| catálogo | OWN-038 | Inventory | Initial hypothesis |
| disponibilidad | OWN-023 | Inventory como cálculo candidato | Initial hypothesis |
| existencia física | OWN-039 | Inventory/sucursal-ubicación por validar | Unknown |
| reserva | OWN-024 | Inventory | Initial hypothesis |
| consumo | OWN-043 | Inventory con origen técnico | Initial hypothesis |
| costo | OWN-040 | Inventory o capacidad financiera/compras TBD | Unknown |
| transferencia | OWN-041 | Inventory con sucursales participantes | Initial hypothesis |
| pieza instalada | OWN-025 | Repair conserva hecho técnico; Inventory conserva consumo | Unknown |
| garantía de proveedor | OWN-042 | Inventory/compras TBD | Unknown |

## Revisión requerida

Operación necesita narrar al menos INVDOM-CASE-001, 002, 005, 010, 013, 015 y 016. Arquitectura puede revisar límites y consistencia después, sin convertir estas hipótesis en un algoritmo.
