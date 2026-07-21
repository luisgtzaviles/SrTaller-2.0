# Reglas e invariantes

## Criterio de clasificación

“Validada” conserva una decisión explícita del Product Owner. “Validada en la operación descrita” evita convertir una práctica habitual en prohibición universal. “Propuesta” identifica una protección o estructura cuya implementación y alcance todavía deben decidirse.

## Matriz

| ID | Condición | Clasificación | Alcance | Ejemplo inválido |
|---|---|---|---|---|
| DTR-INV-001 | El problema reportado no sustituye la conclusión técnica | Validada | diagnóstico | copiar “no carga” como causa confirmada |
| DTR-INV-002 | El técnico revisa suficientemente antes de concluir | Validada | diagnóstico | concluir sin evaluar el equipo |
| DTR-INV-003 | No es obligatorio registrar cada prueba interna | Validada | baja fricción | exigir decenas de hallazgos sin valor |
| DTR-INV-004 | Una pieza temporal no se considera vendida, instalada o consumida por probarla | Validada | diagnóstico/inventario comercial | cobrar pantalla de prueba |
| DTR-INV-005 | Una observación no sustituye la conclusión | Validada | contenido técnico | dejar sólo una nota ambigua |
| DTR-INV-006 | Una recomendación no constituye cotización | Validada | frontera técnica/comercial | técnico recomienda y sistema asume precio |
| DTR-INV-007 | El diagnóstico no determina precio | Validada | frontera técnica/comercial | incluir promoción como causa técnica |
| DTR-INV-008 | Cambiar precio no cambia la conclusión | Validada | cotización | editar diagnóstico al descontar |
| DTR-INV-009 | Sólo se ejecuta alcance autorizado | Validada | reparación | reparar micrófono autorizado sólo para pantalla |
| DTR-INV-010 | Un hallazgo nuevo no amplía autorización anterior | Validada | descubrimiento posterior | usar aceptación previa para otra pieza |
| DTR-INV-011 | Un descubrimiento dentro del mismo ciclo permanece en la misma orden | Validada | identidad/custodia | crear orden nueva sólo por nueva falla |
| DTR-INV-012 | Una conclusión anterior no se borra ni sobrescribe | Validada | historia | dejar únicamente el último diagnóstico |
| DTR-INV-013 | Una recomendación rechazada permanece en historia | Validada | decisión parcial | eliminar componente rechazado |
| DTR-INV-014 | Una nueva recomendación requiere nueva decisión antes de ejecutarse | Validada | transición comercial | continuar sin contactar al cliente |
| DTR-INV-015 | Quedó con servicio pasa a segunda revisión, no directamente a Listo | Validada | control de calidad Avicell | marcar Listo desde taller |
| DTR-INV-016 | Un resultado inconcluso conserva su incertidumbre | Validada | diagnóstico | inventar causa para cerrar |
| DTR-INV-017 | El técnico normalmente diagnostica y repara, sin excluir participación de otros | Validada en la operación descrita | responsabilidad | borrar al diagnosticador al reasignar |
| DTR-INV-018 | Cada evolución debería poder relacionarse con la decisión comercial que produjo | Propuesta | trazabilidad | historial sin causa entre recomendación y autorización |
| DTR-INV-019 | La historia completa debería conservar secuencia y correcciones | Propuesta | historia | corrección silenciosa sin rastro |
| DTR-INV-020 | La prioridad de una recomendación sólo debería aplicarse bajo clasificación aprobada | Propuesta | recomendaciones | inferir “obligatoria” de texto libre |

## Reglas validadas resultantes

1. El diagnóstico puede apoyarse en muchas pruebas sin convertir cada una en un registro independiente.
2. La conclusión debe ser comprensible y atribuible, incluso cuando sea inconclusa.
3. Recomendación, cotización, autorización y ejecución responden preguntas distintas.
4. Una cotización puede variar sin alterar conocimiento técnico.
5. La aceptación parcial limita el trabajo ejecutable.
6. Un nuevo problema abre otra evaluación y otra decisión dentro de la misma orden.
7. Una nota narrativa puede complementar, pero no ser la única prueba de autorización.
8. Segunda revisión conserva su propia autoridad y no se sustituye con el cierre diagnóstico.

## Propuestas que no son invariantes aprobadas

DTR-INV-018 a DTR-INV-020 no autorizan todavía:

- exigir un número formal de iteración;
- imponer versionado técnico;
- declarar inmutabilidad absoluta;
- definir prioridades obligatorias;
- bloquear el flujo mediante una clasificación no validada;
- seleccionar una arquitectura de auditoría.

## Checklist de consistencia

Una propuesta posterior debe responder afirmativamente:

1. ¿Distingue problema reportado, conclusión, observación y prueba?
2. ¿Mantiene recomendación separada de precio y cotización?
3. ¿Impide ejecutar trabajo no autorizado?
4. ¿Preserva conclusiones y rechazos anteriores?
5. ¿Permite nueva información dentro de la misma orden?
6. ¿Evita obligar captura técnica sin valor?
7. ¿Conserva atribución suficiente?
8. ¿Evita prescribir Event Sourcing o almacenamiento específico?

Una respuesta negativa indica contradicción o una nueva decisión de dominio que debe registrarse con autoridad.
