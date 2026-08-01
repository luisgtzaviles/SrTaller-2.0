# Plan de implementación de VS0

## Regla de ejecución

La rama autorizada es `preview/visual-slice-0`. Cada bloque debe conservar el
badge `DEV PREVIEW`, datos sintéticos, scope server-side y ausencia de merge a
`main`. Un gate rojo detiene el bloque; no abre una cadena documental nueva.

## Bloque 1 — Shell navegable y primer deploy

- introducir el workspace pnpm mínimo y `apps/dev-preview-web`;
- fijar React, Vite, React Router y dependencias exactas;
- crear layout, sidebar, header, responsive básico y estados loading/empty/error;
- añadir `/`, `/repairs`, `/repairs/new` y placeholder de detalle;
- componer `GET /api/dev-preview/v1/context` con PBI-024 y adapter DEV_ONLY;
- incorporar estáticos al único build backend;
- desplegar inmediatamente shell + pantalla de Nueva reparación al VPS.

**Salida:** URL privada navegable y formulario visible, aunque guardar aún no
esté habilitado.

## Bloque 2 — Creación y persistencia

- materializar el módulo owner-scoped de preview;
- agregar las dos migraciones/tablas autorizadas y constraints compuestas;
- implementar `POST /repairs` con validación, transacción y scope confiable;
- conectar el formulario y mostrar éxito/error sanitizado;
- probar persistencia, recarga y denegación cross-tenant/cross-branch;
- desplegar por SHA y verificar creación con datos sintéticos.

**Salida:** creación completa y persistente en PostgreSQL de preview.

## Bloque 3 — Listado, detalle y estado

- implementar búsqueda/listado determinista;
- implementar detalle e historial básico;
- implementar CAS de estado con las transiciones provisionales autorizadas;
- completar empty/loading/error, navegación y responsive;
- probar `404` scope-safe, concurrencia y recarga;
- desplegar y revisar visualmente con Producto.

**Salida:** recorrido mínimo punta a punta.

## Bloque 4 — Repetibilidad y handoff

- automatizar release por SHA, migración separada, symlink, systemd y rollback;
- documentar comandos operativos sin secretos;
- ejecutar checklist completo y registrar limitaciones visuales;
- abrir un ciclo corto de iteración por pushes sólo en la rama preview.

**Salida:** preview repetible y operable, sin release ni integración a `main`.

## Gates proporcionales

Por bloque se exige únicamente:

- install congelado, typecheck, build y arquitectura;
- pruebas unitarias/de integración del cambio;
- PostgreSQL real para persistencia y aislamiento cuando aplique;
- smoke del artefacto y de la URL desplegada;
- revisión visual de Producto al final de cada deploy útil;
- ausencia de secretos, datos reales y cambios fuera de scope.

No se exigen nuevas campañas de 25 mutaciones, doble manifest ni artifacts
duplicados. La CI existente se conserva sin reducirse.

## Estimación

`L`: cuatro bloques cortos. El primer feedback visual debe ocurrir al terminar
el Bloque 1, sin esperar a los Bloques 2–4.
