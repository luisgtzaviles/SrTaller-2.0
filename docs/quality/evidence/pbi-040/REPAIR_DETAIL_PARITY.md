# PBI-039 Repair Detail — Local/Preview parity

## Resultado

La diferencia observada por Owner no provenía de una variante de Repair Detail.
La comparación efectiva encontró dos reparaciones con densidad distinta y, por
lo tanto, bloques condicionales distintos. La prueba final elimina esa variable:
los assets reales de Preview `0d1c5760ce962d17a8292b841f5de43a8cb453a7`
y el runtime local de la rama renderizan el mismo read model sintético gobernado.

No se modificó el producto para producir este resultado. Se materializó el dato
faltante en el seed local y se agregó un contrato permanente de fixture, DOM y
provenance.

## 1. Diferencia real observada

Se capturaron antes de la remediación el GET efectivo y el DOM renderizado de
cada runtime. Preview se consultó en modo read-only contra su repositorio
desplegado; para observar el DOM sin alterar Preview, el browser recibió ese
mismo read model mediante interceptación local y efímera.

| Superficie | Preview efectiva | Local efectiva | Clase |
|---|---|---|---|
| Identidad | `SR-2026-1000`, Samsung Galaxy QA Preview | `SR-2026-003`, Motorola Edge 40 | A/D |
| Header | sin promesa, presupuesto, técnico o ubicación | técnico y ubicación presentes; sin promesa/presupuesto | A/D |
| Problema | problema sintético breve | problema y relato extensos | A/D |
| Equipo recibido | tipo ausente; identificador no disponible; SIM/Memoria `No` | tipo, identificador, SIM y Memoria sin captura | A/D |
| Acceso | `Sin acceso` | sin captura | A/D |
| Condiciones especiales | sin resumen documentado | resumen documentado | A/D |
| Historial | 2 eventos, incluida recepción | 7 eventos, incluida recepción | A/D |
| Conceptos | placeholder PBI-039 | placeholder PBI-039 | Igual |
| Evidencias | 3 referencias | 3 referencias | A/D por contenido |
| Backend/read model | misma proyección y contrato | misma proyección y contrato | B descartada |
| Frontend/build | mismo contrato estructural PBI-039 | mismo contrato estructural PBI-039 | C descartada |
| Defecto | faltaba una prueba rica y durable con el mismo payload | faltaba fixture dedicado | E: brecha de prueba |

Hashes de la captura de investigación, conservados como trazabilidad local:

- read model Local: `4601289fce7dfe1981de998ace42025a9143b6184feb037a28a6e7014281589a`;
- read model Preview: `506cc67bd983e33c895af8566efc9569e182e869bc6b7f84b2834a174bd3aa8b`;
- captura DOM Local: `32a93718545d708b0d3033d8a57143dc89c0f08f4fe7ede882f01a173b080461`;
- captura DOM Preview: `7438d32311f8dc6df5c9d9a2495be41f35a87061217260cb9c442de33a0805bf`.

## 2. Fixture controlado

El seed gobernado materializa `SR-2026-039`, id
`00000000-0000-4000-8000-000000001039`, exclusivamente sintético y reversible
mediante el reset local gobernado. Incluye:

- equipo Motorola Edge 40 y cliente Patricia Paridad;
- recepción, promesa, presupuesto, estado, técnico, custodia y Taller;
- problema, relato, clasificación Centro de carga y condición física;
- tipo Teléfono, IMEI sintético, SIM, Memoria, acceso por PIN y accesorios;
- condición especial/riesgo aceptado y receptor Sol Recepción;
- evento de recepción, nota, asignación y movimiento de ubicación;
- dos evidencias PNG sintéticas y el placeholder final de Conceptos.

La prueba nunca escribe en Preview. El verificador toma el GET real del fixture
local autenticado y entrega exactamente ese JSON, sólo dentro del tab de Chrome,
a los assets reales y hash-verificados de Preview. Los writes `/api/*` del tab
quedan bloqueados con `409 PARITY_FIXTURE_READ_ONLY`.

## 3. Comparación final

`verify:repair-detail-parity` exige simultáneamente:

- assets HTML/JS/CSS exactos del Preview aceptado PBI-039;
- frontend y backend local en el mismo SHA limpio;
- sesión operativa local activa y GET real `200` del fixture materializado;
- el mismo payload en ambas superficies (`samePayload: true`);
- cuatro eventos de Historial y dos Evidencias;
- presencia de todos los campos del Header y Recepción;
- jerarquía `Recepción | Historial | Conceptos | Evidencias`;
- evento `repairs.received`, actores, timestamps, notas y markers;
- mismo ancho funcional (`1102 px` en el viewport gobernado) y cero overflow.

La firma DOM común fue:

`Motorola Edge 40 | Problema y contexto | Estado físico recibido | Equipo recibido | Condiciones especiales | Acceso | Historial | Conceptos | Evidencias`.

Los términos comunes fueron:

`Equipo | Política de recepción | Recepción | Promesa de entrega | Presupuesto inicial | Estado | Técnico | Custodia | Ubicación | Condición física | Color | Estado al recibir | Tipo | IMEI / Serie | SIM | Memoria | Accesorios | Riesgos aceptados | Detalle comunicado`.

La captura visual es evidencia suplementaria; no sustituye el contrato de read
model/estructura ni el guard de provenance.

## 4. Guard permanente

La protección queda distribuida en cuatro capas:

1. fixture sintético versionado y materializable en PostgreSQL local;
2. assertions de completitud del read model y de anchors de Repair Detail;
3. prueba DOM/runtime contra los assets reales de Preview y la revisión local;
4. hashes de los cuatro archivos del guard dentro del inventario de superficies
   protegidas PBI-039.

Así, una rama falla antes de Owner Review si pierde campos del header, cambia la
arquitectura de Recepción, elimina la recepción del Historial, pierde Conceptos
o Evidencias, sirve procesos stale, altera los assets aceptados de Preview o
deja de materializar el fixture.

## Límites preservados

- No hubo cambios visuales o funcionales en Repair Detail.
- No se tocó Price List ni se inició PBI-041/PBI-042.
- No hubo push, PR, merge, deploy, release ni Owner Acceptance.
