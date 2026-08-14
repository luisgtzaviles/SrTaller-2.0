const AUTHORIZED_HEALTH_CONTROLLER =
  'src/modules/preview/presentation/http/health.controller.ts';
const PROHIBITED_DIAGNOSTIC_ROUTES = new Set([
  'health',
  'readyz',
  'livez',
  'metrics',
  'debug',
  'status',
]);
const CONTROLLER_DECORATOR = /@Controller\s*\(([^)]*)\)/gu;
const ROUTE_DECORATOR = /@(Get|Post|Put|Patch|Delete|Options|Head|All)\s*\(\s*(['"])([^'"]+)\2\s*\)/gu;

function healthLike(path) {
  const normalized = path.replace(/^\/+|\/+$/gu, '').toLowerCase();
  return normalized.includes('health') ||
    PROHIBITED_DIAGNOSTIC_ROUTES.has(normalized);
}

export function healthRoutePolicyFailures(relativePath, sourceText) {
  const failures = [];
  const controllers = [...sourceText.matchAll(CONTROLLER_DECORATOR)];
  const routes = [...sourceText.matchAll(ROUTE_DECORATOR)];

  for (const controller of controllers) {
    const path = controller[1].trim().replace(/^['"]|['"]$/gu, '');
    if (healthLike(path) && relativePath !== AUTHORIZED_HEALTH_CONTROLLER) {
      failures.push(
        `Unauthorized health-like controller root in ${relativePath}: ${path}`,
      );
    }
  }

  for (const route of routes) {
    const method = route[1];
    const path = route[3];
    if (!healthLike(path)) {
      continue;
    }
    if (
      relativePath !== AUTHORIZED_HEALTH_CONTROLLER ||
      method !== 'Get' ||
      path !== 'healthz'
    ) {
      failures.push(
        `Unauthorized health-like route in ${relativePath}: ${method} ${path}`,
      );
    }
  }

  if (relativePath === AUTHORIZED_HEALTH_CONTROLLER) {
    if (controllers.length !== 1 || controllers[0]?.[1].trim() !== '') {
      failures.push('Health controller must use exactly @Controller() at the root.');
    }
    if (
      routes.length !== 1 ||
      routes[0]?.[1] !== 'Get' ||
      routes[0]?.[3] !== 'healthz'
    ) {
      failures.push('Health controller must expose exactly GET /healthz.');
    }
  }

  return failures;
}
