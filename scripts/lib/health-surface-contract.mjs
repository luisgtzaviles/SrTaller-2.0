import ts from 'typescript';

export const authorizedHealthSurfacePath =
  'src/health/health.controller.ts';

const httpDecoratorNames = new Set([
  'All',
  'Delete',
  'Get',
  'Head',
  'Options',
  'Patch',
  'Post',
  'Put',
]);

const expectedRoutes = Object.freeze([
  Object.freeze({ handler: 'livez', method: 'Get', path: 'livez' }),
  Object.freeze({ handler: 'readyz', method: 'Get', path: 'readyz' }),
]);

function unwrap(expression) {
  let current = expression;
  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isNonNullExpression(current) ||
    ts.isSatisfiesExpression(current) ||
    ts.isTypeAssertionExpression(current)
  ) {
    current = current.expression;
  }
  return current;
}

function importIdentity(sourceFile) {
  const named = new Map();
  const namespaces = new Set();

  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text !== '@nestjs/common'
    ) {
      continue;
    }
    const bindings = statement.importClause?.namedBindings;
    if (bindings && ts.isNamedImports(bindings)) {
      for (const element of bindings.elements) {
        named.set(element.name.text, element.propertyName?.text ?? element.name.text);
      }
    } else if (bindings && ts.isNamespaceImport(bindings)) {
      namespaces.add(bindings.name.text);
    }
  }

  return { named, namespaces };
}

function decoratorName(expression, identity) {
  const call = unwrap(expression);
  if (!ts.isCallExpression(call)) {
    return undefined;
  }
  const callee = unwrap(call.expression);
  if (ts.isIdentifier(callee)) {
    return identity.named.get(callee.text);
  }
  if (
    ts.isPropertyAccessExpression(callee) &&
    ts.isIdentifier(unwrap(callee.expression)) &&
    identity.namespaces.has(unwrap(callee.expression).text)
  ) {
    return callee.name.text;
  }
  return undefined;
}

function decoratorCall(expression) {
  const call = unwrap(expression);
  return ts.isCallExpression(call) ? call : undefined;
}

function stringArgument(call) {
  const [argument] = call.arguments;
  return argument && ts.isStringLiteralLike(argument)
    ? argument.text
    : undefined;
}

export function validateAuthorizedHealthSurface(source) {
  const sourceFile = ts.createSourceFile(
    authorizedHealthSurfacePath,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const identity = importIdentity(sourceFile);
  const problems = [];
  const controllers = [];
  const routes = [];

  function inspect(node) {
    if (ts.isClassDeclaration(node)) {
      for (const decorator of ts.getDecorators(node) ?? []) {
        if (decoratorName(decorator.expression, identity) === 'Controller') {
          controllers.push({
            call: decoratorCall(decorator.expression),
            name: node.name?.text,
          });
        }
      }
    }
    if (ts.isMethodDeclaration(node)) {
      for (const decorator of ts.getDecorators(node) ?? []) {
        const method = decoratorName(decorator.expression, identity);
        if (method && httpDecoratorNames.has(method)) {
          const call = decoratorCall(decorator.expression);
          routes.push({
            handler:
              node.name &&
              (ts.isIdentifier(node.name) || ts.isStringLiteralLike(node.name))
                ? node.name.text
                : undefined,
            method,
            path: call ? stringArgument(call) : undefined,
            argumentCount: call?.arguments.length ?? -1,
          });
        }
      }
    }
    ts.forEachChild(node, inspect);
  }
  inspect(sourceFile);

  if (
    controllers.length !== 1 ||
    controllers[0]?.name !== 'HealthController' ||
    controllers[0]?.call?.arguments.length !== 0
  ) {
    problems.push(
      'authorized health surface must contain exactly @Controller() HealthController',
    );
  }

  const normalizedRoutes = routes
    .map(({ handler, method, path, argumentCount }) => ({
      handler,
      method,
      path,
      argumentCount,
    }))
    .sort((left, right) => String(left.path).localeCompare(String(right.path)));
  const normalizedExpected = expectedRoutes
    .map((route) => ({ ...route, argumentCount: 1 }))
    .sort((left, right) => left.path.localeCompare(right.path));

  if (JSON.stringify(normalizedRoutes) !== JSON.stringify(normalizedExpected)) {
    problems.push(
      'authorized health surface must contain exactly GET /livez and GET /readyz',
    );
  }

  return Object.freeze(problems);
}
