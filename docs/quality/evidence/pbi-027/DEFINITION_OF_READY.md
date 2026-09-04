# PBI-027 — Definition of Ready

## Resultado

**PASS — IMPLEMENTATION LOCALLY AUTHORIZED (2026-09-04)**

La autorización Owner es condicional: permite la implementación local de
PBI-027 después de este dictamen, pero no autoriza merge, deploy ni iniciar el
siguiente PBI.

## Contrato de implementación

- La Branch es la única autoridad temporal operativa.
- Cada Branch conserva una zona IANA explícita; `America/Hermosillo` es el
  fallback histórico documentado que la migración aplica únicamente a filas
  preexistentes sin ese atributo y bootstrap SQL gobernado.
- La creación mediante el contrato de `stations` exige una zona IANA explícita.
  Un offset fijo, por ejemplo `-07:00`, no supera la validación de dominio.
- Los instantes se persisten como `timestamptz`; la zona afecta sólo su
  presentación posterior. Un cambio de zona no modifica instantes ni eventos
  ya guardados.
- La migración es aditiva. Su `down` se usa en local/test; los ambientes
  compartidos se corrigen por migración posterior (roll-forward).

## Riesgo y estimación

- **Size:** Small.
- **Risk:** Medium.
- **Drivers:** evolución de esquema ya gobernada, validación IANA y pruebas de
  borde de día/multibranch. No hay API pública, UI ni cambio de datos de
  negocio fuera de Branch.

## Salida requerida

Implementación, migración, pruebas unitarias y PostgreSQL, documentación y
evidencia; commits lógicos, Draft PR y CI autoritativo GREEN. Después se
detiene en Owner Review.
