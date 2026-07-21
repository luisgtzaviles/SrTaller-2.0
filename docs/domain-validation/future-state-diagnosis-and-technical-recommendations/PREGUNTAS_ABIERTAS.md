# Preguntas abiertas

## Regla

Estas preguntas no deben resolverse por comodidad de interfaz, comportamiento accidental del sistema anterior o preferencia arquitectónica. Su cierre requiere respuesta explícita, autoridad, fecha, ejemplo normal, excepción y documentos afectados.

## Inicio, alcance y conclusión

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| DTR-PREG-001 | ¿Qué acción demuestra que comenzó el diagnóstico? | Product Owner + Técnicos | tiempo/atribución |
| DTR-PREG-002 | ¿Escanear sólo consulta o puede iniciar diagnóstico bajo alguna política? | Product Owner + Operaciones | fricción |
| DTR-PREG-003 | ¿Qué significa revisar completamente por tipo de dispositivo o falla? | Técnicos + Product Owner | suficiencia |
| DTR-PREG-004 | ¿Qué información mínima necesita una conclusión técnica? | Técnicos + Operaciones | calidad |
| DTR-PREG-005 | ¿Qué pruebas o evidencia deben conservarse y en qué casos? | Técnicos + Seguridad | trazabilidad |
| DTR-PREG-006 | ¿Qué nivel de certeza debe expresarse? | Técnicos + Product Owner | lenguaje |
| DTR-PREG-007 | ¿Quién puede corregir una conclusión y con qué evidencia? | Product Owner + Auditoría | historia |
| DTR-PREG-008 | ¿Puede otro técnico validar o sustituir una conclusión? | Técnicos + Operaciones | autoridad |

## Resultados diagnósticos

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| DTR-PREG-009 | ¿Cuál es el catálogo definitivo de resultados? | Product Owner + Técnicos | vocabulario |
| DTR-PREG-010 | ¿Qué diferencia exacta existe entre no recomendable e irreparable? | Técnicos + Product Owner | decisión |
| DTR-PREG-011 | ¿Qué rutas siguen un diagnóstico inconcluso? | Operaciones + Técnicos | continuidad |
| DTR-PREG-012 | ¿Cuándo un resultado inconcluso puede cerrarse sin nueva evaluación? | Product Owner + Operaciones | excepciones |
| DTR-PREG-013 | ¿Qué estado operativo corresponde a cada resultado, si alguno? | Product Owner | flujo |
| DTR-PREG-014 | ¿Qué resultados deben comunicarse al cliente y con qué nivel técnico? | Product Owner + Legal | comunicación |

## Recomendaciones

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| DTR-PREG-015 | ¿Qué contenido mínimo necesita una recomendación? | Técnicos + Recepción | transición comercial |
| DTR-PREG-016 | ¿Puede haber recomendaciones alternativas o mutuamente excluyentes? | Técnicos + Product Owner | opciones |
| DTR-PREG-017 | ¿Cómo se relaciona una recomendación con varias piezas o trabajos? | Técnicos + Operaciones | granularidad |
| DTR-PREG-018 | ¿Qué clasificación futura de prioridad aporta valor? | Product Owner + Técnicos | priorización |
| DTR-PREG-019 | ¿Una recomendación de seguridad exige tratamiento especial aun si se rechaza? | Product Owner + Legal + Técnicos | riesgo |
| DTR-PREG-020 | ¿Cómo se retira o corrige una recomendación sin borrar la anterior? | Técnicos + Auditoría | historia |

## Cotización y autorización

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| DTR-PREG-021 | ¿Cuándo una recomendación está suficientemente clara para cotizar? | Recepción + Técnicos | transferencia |
| DTR-PREG-022 | ¿Puede recepción dividir o combinar recomendaciones en conceptos comerciales? | Product Owner + Recepción | interpretación |
| DTR-PREG-023 | ¿Cómo se conserva la relación cuando una recomendación produce varias cotizaciones? | Product Owner + Finanzas | trazabilidad |
| DTR-PREG-024 | ¿Qué ocurre con una autorización cuando cambia sólo el precio? | Product Owner + Legal + Finanzas | vigencia |
| DTR-PREG-025 | ¿Qué ocurre cuando cambia el alcance técnico después de cotizar? | Product Owner + Técnicos | recotización |
| DTR-PREG-026 | ¿Cómo se distingue pendiente, aceptada, rechazada, sustituida o revocada? | Product Owner + Legal | decisiones |

## Iteraciones e historia

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| DTR-PREG-027 | ¿Qué delimita una iteración diagnóstica? | Product Owner + Técnicos | modelo conceptual |
| DTR-PREG-028 | ¿Toda nueva falla crea una iteración o sólo una conclusión materialmente distinta? | Técnicos + Operaciones | granularidad |
| DTR-PREG-029 | ¿Cómo se distingue nueva información de una corrección? | Product Owner + Auditoría | fidelidad |
| DTR-PREG-030 | ¿Qué parte del historial debe ser inmutable y qué parte corregible? | Product Owner + Legal + Auditoría | gobernanza |
| DTR-PREG-031 | ¿Cómo se relacionan varias recomendaciones con varias autorizaciones? | Product Owner + Finanzas | cardinalidad |
| DTR-PREG-032 | ¿Cómo se presenta la vigencia de conclusiones anteriores? | Técnicos + Operaciones | interpretación |

## Personas, evidencia y operación

| ID | Pregunta | Propietario sugerido | Impacto |
|---|---|---|---|
| DTR-PREG-033 | ¿Puede haber varios diagnosticadores simultáneos? | Product Owner + Técnicos | participación |
| DTR-PREG-034 | ¿Cómo se distingue técnico principal, colaborador y consultor? | Product Owner + Técnicos | atribución |
| DTR-PREG-035 | ¿Qué ocurre cuando quien diagnostica no es quien repara? | Operaciones + Técnicos | transferencia |
| DTR-PREG-036 | ¿Qué evidencia fotográfica, medición o archivo requiere cada caso? | Técnicos + Seguridad | evidencia |
| DTR-PREG-037 | ¿Qué información técnica es visible al cliente? | Product Owner + Legal | privacidad/comunicación |
| DTR-PREG-038 | ¿Se medirán tiempos de diagnóstico e iteración? | Product Owner + Operaciones | métricas |
| DTR-PREG-039 | ¿Cómo afectan falta de código de acceso o daño progresivo a la conclusión? | Técnicos + Seguridad | límites |
| DTR-PREG-040 | ¿Qué permisos requiere concluir, corregir, recomendar o declarar irreparable? | Product Owner + Seguridad | autoridad |

## Temas expresamente diferidos

No se resuelven aquí inventario, disponibilidad, compatibilidad catalogada, costos, impuestos, descuentos, pagos, Caja, contabilidad, diseño de pantallas, almacenamiento ni mecanismos de integración.

## Criterio de cierre

Para cerrar una pregunta debe registrarse:

1. respuesta explícita;
2. autoridad y fecha;
3. caso normal y excepción;
4. alcance por tenant o sucursal cuando aplique;
5. impacto sobre decisiones, invariantes y escenarios;
6. revisión de Seguridad, Legal o Finanzas cuando corresponda;
7. contradicciones y documentos que deban actualizarse.
