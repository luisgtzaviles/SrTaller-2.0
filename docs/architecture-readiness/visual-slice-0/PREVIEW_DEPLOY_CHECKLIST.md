# Checklist de preview y deploy de VS0

## Antes de implementar

- [x] Rama `preview/visual-slice-0` y upstream correctos.
- [x] Base desciende de `81b655f7d43363f5c1e459bd945ab3013da8733a`.
- [x] PR #3 continúa Draft y DEC-051 C02 continúa `Pending`.
- [x] No hay cambios en PBI-025–PBI-029 ni R1.

## Aplicación

- [x] Badge `DEV PREVIEW` está incorporado al shell.
- [x] Shell, navegación y responsive básico pasan build y smoke HTTP.
- [x] Tenant, sucursal y estación provienen de `TrustedStationContext`.
- [x] Scope enviado por el navegador no es autoridad.
- [x] Actor fijo está rotulado `DEV_ONLY`.
- [x] Nueva reparación valida los campos mínimos.
- [x] Sólo existen los endpoints autorizados.
- [x] Errores públicos están sanitizados.

## Datos

- [x] PostgreSQL `18.4` efímero local fue validado por digest.
- [x] Sólo se usaron datos sintéticos desechables.
- [x] La migración crea únicamente las dos tablas autorizadas.
- [x] Queries y constraints preservan tenant y branch scope.
- [x] Pruebas negativas cross-tenant/cross-branch pasan.
- [x] Crear, listar, abrir detalle, cambiar estado y recargar pasan.
- [x] No existen pagos, caja, inventario, datos o integraciones reales.

## Acceso y VPS

- [ ] VPS está separado de staging y producción.
- [ ] Hostname de desarrollo y HTTPS válidos.
- [ ] Basic Auth está aplicado en Caddy y su hash no está en Git.
- [ ] PostgreSQL no está expuesto a Internet.
- [ ] Firewall, usuario de servicio y permisos mínimos verificados.
- [x] Variables DEV_ONLY fallan cerradas si faltan o si el modo no es preview.
- [x] Contratos de logs y errores no contienen secretos ni payloads sensibles.

## Deploy por SHA

- [x] SHA y rama de origen registrados.
- [x] `pnpm install --frozen-lockfile`, typecheck, build y gates pasan.
- [ ] Backup de la base de preview creado antes de migrar.
- [ ] Migraciones ejecutadas separadamente y con resultado registrado.
- [ ] Release limpio activado mediante symlink.
- [ ] systemd reinicia correctamente.
- [ ] Smoke HTTPS, navegación y API pasan.
- [ ] Rollback al release anterior está probado o verificable.

## Cierre de la preview

- [ ] Responsable de Producto puede navegar e iterar.
- [x] Limitaciones y decisiones diferidas siguen visibles.
- [x] No hubo merge a `main`, release o producción.
- [x] No se afirmó completar ADR-006/007, PBI-025–PBI-029 o R1.
