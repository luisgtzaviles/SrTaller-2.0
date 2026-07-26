# Checklist de seguridad

- [x] recognition es un puerto server-side;
- [x] tenant/branch efectivos no se aceptan desde payload;
- [x] contexto inmutable, no forjable por estructura y sin wildcard;
- [x] unknown, revoked, unlinked, stale y mismatch fallan cerrados;
- [x] queries y locks incluyen tenant;
- [x] mensajes públicos colapsan causas sensibles;
- [x] errores no exponen SQL, SQLSTATE, stack o nombres internos;
- [x] manifest no contiene host, URL, usuario, password, token, PIN o PII;
- [x] no existe endpoint administrativo;
- [x] no existe fallback global;
- [x] no se añadió RLS ni se afirmó que exista;
- [x] 25 mutaciones críticas fueron eliminadas.

Riesgo residual: el mecanismo criptográfico real de reconocimiento permanece
diferido a PBI-029; PBI-024 consume únicamente su contrato.
