# Checklist de preview y deploy de VS0

## Antes de implementar

- [ ] Rama `preview/visual-slice-0` y upstream correctos.
- [ ] Base desciende de `81b655f7d43363f5c1e459bd945ab3013da8733a`.
- [ ] PR #3 continúa Draft y DEC-051 C02 continúa `Pending`.
- [ ] No hay cambios en PBI-025–PBI-029 ni R1.

## Aplicación

- [ ] Badge `DEV PREVIEW` visible en todo momento.
- [ ] Shell, navegación y responsive básico funcionan.
- [ ] Tenant, sucursal y estación provienen de `TrustedStationContext`.
- [ ] Scope enviado por el navegador no es autoridad.
- [ ] Actor fijo está rotulado `DEV_ONLY`.
- [ ] Nueva reparación valida los campos mínimos.
- [ ] Sólo existen los endpoints autorizados.
- [ ] Errores públicos están sanitizados.

## Datos

- [ ] PostgreSQL `18.4` es exclusivo de preview.
- [ ] Sólo existen datos sintéticos desechables.
- [ ] Migraciones crean únicamente las dos tablas autorizadas.
- [ ] Queries y constraints preservan tenant y branch scope.
- [ ] Pruebas negativas cross-tenant/cross-branch pasan.
- [ ] Crear, listar, abrir detalle, cambiar estado y recargar pasan.
- [ ] No existen pagos, caja, inventario, datos o integraciones reales.

## Acceso y VPS

- [ ] VPS está separado de staging y producción.
- [ ] Hostname de desarrollo y HTTPS válidos.
- [ ] Basic Auth está aplicado en Caddy y su hash no está en Git.
- [ ] PostgreSQL no está expuesto a Internet.
- [ ] Firewall, usuario de servicio y permisos mínimos verificados.
- [ ] Variables DEV_ONLY fallan cerradas si faltan o si el modo no es preview.
- [ ] Logs básicos no contienen secretos ni payloads sensibles.

## Deploy por SHA

- [ ] SHA y rama de origen registrados.
- [ ] `pnpm install --frozen-lockfile`, typecheck, build y gates pasan.
- [ ] Backup de la base de preview creado antes de migrar.
- [ ] Migraciones ejecutadas separadamente y con resultado registrado.
- [ ] Release limpio activado mediante symlink.
- [ ] systemd reinicia correctamente.
- [ ] Smoke HTTPS, navegación y API pasan.
- [ ] Rollback al release anterior está probado o verificable.

## Cierre de la preview

- [ ] Responsable de Producto puede navegar e iterar.
- [ ] Limitaciones y decisiones diferidas siguen visibles.
- [ ] No hubo merge a `main`, release o producción.
- [ ] No se afirmó completar ADR-006/007, PBI-025–PBI-029 o R1.
