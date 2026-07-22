const importSpecifiers = (source) =>
  [...source.matchAll(/from\s+['"]([^'"]+)['"]/g)].map((match) => match[1] ?? '');

export function inspectSource(name, source) {
  const failures = [];
  const isDomain = /src\/synthetic\/domain\//.test(name);
  const isApplication = /src\/synthetic\/application\//.test(name);
  const isController = name.endsWith('.controller.ts');
  const imports = importSpecifiers(source);

  if ((isDomain || isApplication) && imports.some((value) => value.startsWith('@nestjs/'))) {
    failures.push('NestJS import outside bootstrap/transport');
  }
  if (isDomain && imports.some((value) => /infrastructure|transport|postgres|http/.test(value))) {
    failures.push('domain imports infrastructure or transport');
  }
  if (/\bModuleRef\b/.test(source)) failures.push('ModuleRef service locator is forbidden');
  if (/\bScope\.REQUEST\b|scope\s*:\s*['"]?REQUEST['"]?/i.test(source)) {
    failures.push('request scope requires explicit authorization');
  }
  if (isController) {
    if (/\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i.test(source)) failures.push('SQL in controller');
    if (imports.some((value) => /infrastructure|postgres|adapter/.test(value))) {
      failures.push('controller imports an infrastructure adapter');
    }
  }
  return failures;
}

export function findImportCycle(graph) {
  const visiting = new Set();
  const visited = new Set();
  const visit = (file) => {
    if (visiting.has(file)) return file;
    if (visited.has(file)) return undefined;
    visiting.add(file);
    for (const dependency of graph.get(file) ?? []) {
      const cycle = visit(dependency);
      if (cycle) return cycle;
    }
    visiting.delete(file);
    visited.add(file);
    return undefined;
  };
  for (const file of graph.keys()) {
    const cycle = visit(file);
    if (cycle) return cycle;
  }
  return undefined;
}
