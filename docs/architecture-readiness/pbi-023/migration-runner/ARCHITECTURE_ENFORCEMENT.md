# Enforcement arquitectónico

## D5-R049

La regla nueva exige:

- capability/provider internos sólo consumidos por los paths registrados;
- runner ausente de startup, controllers, dominio y aplicación;
- composición operacional diferida;
- imports locales resueltos, no búsquedas textuales.

Los casos negativos cubren import directo, alias, namespace, reexport,
type-only, `require` e `import()`. El caso positivo de shadowing demuestra que
un nombre local no activa la regla. La mutación aislada D5-R049 prueba
diagnóstico, path, neutralización exclusiva de fixture y restauración.

## Reglas preservadas

D5-R037–D5-R048 siguen activas. En especial:

- D5-R040 impide DB infrastructure desde inner layers;
- D5-R042 mantiene root/naming único;
- D5-R045 valida owner/API/consumer;
- D5-R046 limita SQL ejecutable;
- D5-R048 protege la capability transaccional.

El advisory lock se construye con el query builder tipado y funciones
PostgreSQL; no se añadió raw SQL en producto.

Estado vigente: 40 reglas directas, 152 fixtures (20 positivos/132 negativos),
36 mutaciones de producto y 55 contratos semánticos críticos.
