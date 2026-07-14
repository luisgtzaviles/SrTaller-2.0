# ADR-008 — Resolución inicial de tenant mediante subdominios wildcard

**Status: Proposed**
**Fecha:** TBD

## Estado del documento

Propuesta de routing pendiente de validar DNS, certificados, dominios y experiencia de acceso.

## Contexto

Cada solicitud debe resolver un tenant sin confiar sólo en datos controlados por el cliente. Un subdominio puede ofrecer contexto inicial y marca, pero debe validarse contra la identidad autenticada y nunca sustituir autorización.

## Fuerzas de decisión

- Resolución inequívoca antes de acceder a datos tenant-scoped.
- Seguridad frente a host headers, enumeración y cachés compartidas.
- DNS/TLS wildcard y operación de ambientes.
- Dominios personalizados futuros y experiencia móvil/API.

## Opciones consideradas

1. **Subdominio wildcard por tenant:** contexto visible; requiere DNS/TLS y validación.
2. **Path por tenant:** operación DNS simple, mayor riesgo de mezclar rutas/cachés.
3. **Tenant seleccionado después del login:** flexible para usuarios multi-tenant, menos contexto previo.
4. **Dominio personalizado por tenant:** branding, mayor complejidad de verificación y certificados.

## Decisión propuesta

Resolver inicialmente un candidato de tenant por hostname wildcard en clientes web y validarlo con membresía/identidad. La API no confiará en un `tenant_id` arbitrario enviado por el cliente. Separar dominios y credenciales por ambiente. Tratar dominios personalizados como capacidad futura.

## Consecuencias positivas

- Contexto tenant claro para usuario y aplicación.
- Routing coherente y preparado para branding básico.
- Reduce dependencia de selectores manuales en sesiones comunes.

## Consecuencias negativas

- Configuración wildcard DNS/TLS y cookies más delicada.
- Usuarios con múltiples tenants necesitan un flujo definido.
- Desarrollo local requiere convención de hosts.

## Riesgos

- Host header spoofing o subdomain takeover; aplicar allowlists, validación y lifecycle seguro.
- Cookies demasiado amplias podrían cruzar tenants; definir scope estricto.

## Criterios para reconsiderar

- Restricciones de plataforma, seguridad o UX hacen inviable wildcard.
- Dominios personalizados o clientes móviles requieren un resolver adicional.

## Preguntas abiertas

- ¿Cómo se elige tenant para usuarios con varias membresías?
- ¿Qué ciclo de vida tendrá un slug y puede reutilizarse?
- ¿Qué dominios tendrá cada ambiente?

## Referencias

- [Modelo multitenant](../../architecture/MULTITENANCY_MODEL.md)
- [Contexto del sistema](../../architecture/SYSTEM_CONTEXT.md)
- [PBI-007](../../backlog/pbis/PBI-007.md)

## Próxima revisión

Después de validar identidad, DNS y amenazas; fecha: TBD.
