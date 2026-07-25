import { readFile, readdir } from 'node:fs/promises';
import {
  basename,
  dirname,
  extname,
  isAbsolute,
  posix,
  relative,
  resolve,
  sep,
} from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const sourceExtensions = new Set(['.cjs', '.cts', '.js', '.mjs', '.mts', '.ts']);
const httpDecoratorSymbols = [
  'All',
  'Delete',
  'Get',
  'Head',
  'Options',
  'Patch',
  'Post',
  'Put',
];
const policyPath = fileURLToPath(
  new URL('../../architecture/dec-005-policy.json', import.meta.url),
);

function toPosix(path) {
  return path.replaceAll('\\', '/');
}

const windowsAbsolutePath = /^[A-Za-z]:[\\/]/u;
const fileUrlPath = /^file:/iu;

export function toRepositoryRelativePath(projectRoot, path) {
  if (typeof path !== 'string' || path.length === 0) {
    throw new TypeError('diagnostic path must be a non-empty string');
  }

  const root = resolve(projectRoot);
  let candidate;
  if (isAbsolute(path)) {
    candidate = relative(root, resolve(path));
  } else {
    if (windowsAbsolutePath.test(path) || fileUrlPath.test(path)) {
      throw new RangeError('diagnostic path must not use an external absolute form');
    }
    candidate = path;
  }

  const normalized = posix.normalize(toPosix(candidate));
  if (
    normalized === '.' ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.startsWith('/') ||
    windowsAbsolutePath.test(normalized) ||
    fileUrlPath.test(normalized)
  ) {
    throw new RangeError('diagnostic path must remain inside the repository root');
  }

  return normalized;
}

function isSourceFile(path) {
  return sourceExtensions.has(extname(path));
}

async function readPolicy() {
  return JSON.parse(await readFile(policyPath, 'utf8'));
}

async function walk(directory) {
  const files = [];
  const directories = [];

  async function visit(current) {
    let entries;
    try {
      entries = await readdir(current, { withFileTypes: true });
    } catch (error) {
      if (error?.code === 'ENOENT') {
        return;
      }
      throw error;
    }

    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      const path = resolve(current, entry.name);
      if (entry.isDirectory()) {
        directories.push(path);
        await visit(path);
      } else if (entry.isFile()) {
        files.push(path);
      }
    }
  }

  await visit(directory);
  return { directories, files };
}

function moduleFromPath(root, path) {
  const parts = toPosix(relative(root, path)).split('/');
  return parts[0] === 'src' && parts[1] === 'modules' ? parts[2] : undefined;
}

function layerFromPath(root, path) {
  const parts = toPosix(relative(root, path)).split('/');
  if (parts[0] !== 'src' || parts[1] !== 'modules') {
    return undefined;
  }
  return parts[3];
}

function exportedNames(sourceFile) {
  const names = [];

  for (const statement of sourceFile.statements) {
    const modifiers = ts.canHaveModifiers(statement)
      ? ts.getModifiers(statement) ?? []
      : [];
    const exported = modifiers.some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    );
    if (!exported) {
      continue;
    }

    if (
      ts.isInterfaceDeclaration(statement) ||
      ts.isTypeAliasDeclaration(statement) ||
      ts.isClassDeclaration(statement) ||
      ts.isFunctionDeclaration(statement) ||
      ts.isEnumDeclaration(statement)
    ) {
      if (statement.name) {
        names.push(statement.name.text);
      }
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          names.push(declaration.name.text);
        }
      }
    }
  }

  return names.sort();
}

function collectModuleSpecifiers(sourceFile) {
  const specifiers = [];

  function add(node, kind) {
    const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
    specifiers.push({ kind, line, specifier: node.text });
  }

  function visit(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      add(node.moduleSpecifier, ts.isExportDeclaration(node) ? 'export' : 'import');
    } else if (
      ts.isImportEqualsDeclaration(node) &&
      ts.isExternalModuleReference(node.moduleReference) &&
      node.moduleReference.expression &&
      ts.isStringLiteralLike(node.moduleReference.expression)
    ) {
      add(node.moduleReference.expression, 'import-equals');
    } else if (
      ts.isCallExpression(node) &&
      node.arguments.length === 1 &&
      ts.isStringLiteralLike(node.arguments[0]) &&
      (node.expression.kind === ts.SyntaxKind.ImportKeyword ||
        (ts.isIdentifier(node.expression) && node.expression.text === 'require'))
    ) {
      add(node.arguments[0], 'dynamic');
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return specifiers;
}

function resolveLocalSource(sourcePath, specifier, sourceFileSet) {
  if (!specifier.startsWith('.')) {
    return undefined;
  }

  const base = resolve(dirname(sourcePath), specifier);
  const candidates = [base];
  const extension = extname(base);
  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') {
    const stem = base.slice(0, -extension.length);
    candidates.push(`${stem}.ts`, `${stem}.mts`, `${stem}.cts`);
  } else if (extension.length === 0) {
    candidates.push(
      `${base}.ts`,
      `${base}.mts`,
      `${base}.js`,
      resolve(base, 'index.ts'),
      resolve(base, 'index.js'),
    );
  }

  return candidates.find((candidate) => sourceFileSet.has(candidate));
}

function findCycles(graph) {
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const cycles = new Set();

  function canonicalize(nodes) {
    const body = nodes.slice(0, -1);
    const rotations = body.map((_, index) => [
      ...body.slice(index),
      ...body.slice(0, index),
      body[index],
    ].join(' -> '));
    return rotations.sort()[0];
  }

  function visit(node) {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      cycles.add(canonicalize([...stack.slice(start), node]));
      return;
    }
    if (visited.has(node)) {
      return;
    }

    visiting.add(node);
    stack.push(node);
    for (const dependency of [...(graph.get(node) ?? [])].sort()) {
      visit(dependency);
    }
    stack.pop();
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of [...graph.keys()].sort()) {
    visit(node);
  }
  return [...cycles].sort();
}

function sourceKind(path) {
  const extension = extname(path);
  if (extension === '.js' || extension === '.mjs' || extension === '.cjs') {
    return ts.ScriptKind.JS;
  }
  return ts.ScriptKind.TS;
}

function isExported(node) {
  if (!ts.canHaveModifiers(node)) {
    return false;
  }
  return (ts.getModifiers(node) ?? []).some(
    (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
  );
}

function decoratorsNamed(node, name) {
  if (!ts.canHaveDecorators(node)) {
    return [];
  }
  return (ts.getDecorators(node) ?? [])
    .map((decorator) => decorator.expression)
    .filter(
      (expression) =>
        ts.isCallExpression(expression) &&
        ts.isIdentifier(expression.expression) &&
        expression.expression.text === name,
    );
}

function propertyNameText(name) {
  if (ts.isIdentifier(name) || ts.isStringLiteralLike(name)) {
    return name.text;
  }
  return undefined;
}

function bindingNameContains(name, expected) {
  if (ts.isIdentifier(name)) {
    return name.text === expected;
  }
  if (ts.isObjectBindingPattern(name) || ts.isArrayBindingPattern(name)) {
    return name.elements.some(
      (element) =>
        ts.isBindingElement(element) &&
        bindingNameContains(element.name, expected),
    );
  }
  return false;
}

function statementBindsValueName(statement, expected) {
  if (ts.isVariableStatement(statement)) {
    return statement.declarationList.declarations.some((declaration) =>
      bindingNameContains(declaration.name, expected),
    );
  }
  return (
    (ts.isClassDeclaration(statement) ||
      ts.isFunctionDeclaration(statement) ||
      ts.isEnumDeclaration(statement)) &&
    statement.name?.text === expected
  );
}

function isFunctionLikeDeclaration(node) {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isConstructorDeclaration(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  );
}

function identifierIsShadowed(identifier, sourceFile) {
  const expected = identifier.text;

  for (
    let current = identifier.parent;
    current && current !== sourceFile;
    current = current.parent
  ) {
    if (
      isFunctionLikeDeclaration(current) &&
      current.parameters.some((parameter) =>
        bindingNameContains(parameter.name, expected),
      )
    ) {
      return true;
    }
    if (
      ts.isBlock(current) &&
      current.statements.some((statement) =>
        statementBindsValueName(statement, expected),
      )
    ) {
      return true;
    }
    if (
      ts.isCatchClause(current) &&
      current.variableDeclaration &&
      bindingNameContains(current.variableDeclaration.name, expected)
    ) {
      return true;
    }
    if (
      (ts.isForStatement(current) ||
        ts.isForInStatement(current) ||
        ts.isForOfStatement(current)) &&
      current.initializer &&
      ts.isVariableDeclarationList(current.initializer) &&
      current.initializer.declarations.some((declaration) =>
        bindingNameContains(declaration.name, expected),
      )
    ) {
      return true;
    }
  }

  return false;
}

export function unwrapTransparentExpression(node) {
  let current = node;
  const visited = new Set();

  while (!visited.has(current)) {
    visited.add(current);
    if (
      ts.isParenthesizedExpression(current) ||
      ts.isAsExpression(current) ||
      ts.isTypeAssertionExpression(current) ||
      ts.isNonNullExpression(current) ||
      ts.isSatisfiesExpression(current) ||
      ts.isPartiallyEmittedExpression(current)
    ) {
      current = current.expression;
      continue;
    }
    break;
  }

  return current;
}

export function createImportIdentityResolver(sourceFile) {
  const named = new Map();
  const namespaces = new Map();
  const defaults = new Map();

  for (const statement of sourceFile.statements) {
    if (
      ts.isImportDeclaration(statement) &&
      ts.isStringLiteralLike(statement.moduleSpecifier)
    ) {
      const specifier = statement.moduleSpecifier.text;
      if (statement.importClause?.name) {
        defaults.set(statement.importClause.name.text, {
          imported: 'default',
          specifier,
        });
      }
      if (
        statement.importClause?.namedBindings &&
        ts.isNamedImports(statement.importClause.namedBindings)
      ) {
        for (const element of statement.importClause.namedBindings.elements) {
          named.set(element.name.text, {
            imported: element.propertyName?.text ?? element.name.text,
            specifier,
          });
        }
      } else if (
        statement.importClause?.namedBindings &&
        ts.isNamespaceImport(statement.importClause.namedBindings)
      ) {
        namespaces.set(statement.importClause.namedBindings.name.text, specifier);
      }
    } else if (
      ts.isImportEqualsDeclaration(statement) &&
      ts.isExternalModuleReference(statement.moduleReference) &&
      statement.moduleReference.expression &&
      ts.isStringLiteralLike(statement.moduleReference.expression)
    ) {
      namespaces.set(
        statement.name.text,
        statement.moduleReference.expression.text,
      );
    } else if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isIdentifier(declaration.name) &&
          declaration.initializer
        ) {
          const initializer = unwrapTransparentExpression(
            declaration.initializer,
          );
          if (
            ts.isCallExpression(initializer) &&
            ts.isIdentifier(initializer.expression) &&
            initializer.expression.text === 'require' &&
            initializer.arguments.length === 1 &&
            ts.isStringLiteralLike(initializer.arguments[0])
          ) {
            namespaces.set(
              declaration.name.text,
              initializer.arguments[0].text,
            );
          }
        }
      }
    }
  }

  function originOf(expression) {
    const candidate = unwrapTransparentExpression(expression);

    if (ts.isIdentifier(candidate)) {
      if (identifierIsShadowed(candidate, sourceFile)) {
        return undefined;
      }
      return named.get(candidate.text) ?? defaults.get(candidate.text);
    }
    if (ts.isPropertyAccessExpression(candidate)) {
      const namespace = unwrapTransparentExpression(candidate.expression);
      if (
        ts.isIdentifier(namespace) &&
        !identifierIsShadowed(namespace, sourceFile)
      ) {
        const specifier =
          namespaces.get(namespace.text) ??
          defaults.get(namespace.text)?.specifier;
        if (specifier) {
          return { imported: candidate.name.text, specifier };
        }
      }
    }
    if (ts.isQualifiedName(candidate)) {
      const namespace = unwrapTransparentExpression(candidate.left);
      if (
        ts.isIdentifier(namespace) &&
        !identifierIsShadowed(namespace, sourceFile)
      ) {
        const specifier =
          namespaces.get(namespace.text) ??
          defaults.get(namespace.text)?.specifier;
        if (specifier) {
          return { imported: candidate.right.text, specifier };
        }
      }
    }
    return undefined;
  }

  function matches(expression, specifier, imported) {
    const origin = originOf(expression);
    return origin?.specifier === specifier && origin.imported === imported;
  }

  return { matches, originOf };
}

function importedDecorators(node, resolver, specifier, imported) {
  if (!ts.canHaveDecorators(node)) {
    return [];
  }
  return (ts.getDecorators(node) ?? [])
    .map((decorator) => decorator.expression)
    .filter(
      (expression) =>
        ts.isCallExpression(expression) &&
        resolver.matches(expression.expression, specifier, imported),
    );
}

function containsImportedCall(sourceFile, resolver, specifier, imported) {
  let found = false;
  function visit(node) {
    if (
      ts.isCallExpression(node) &&
      resolver.matches(node.expression, specifier, imported)
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}

function containsImportedMember(
  sourceFile,
  resolver,
  specifier,
  imported,
  member,
) {
  let found = false;
  function visit(node) {
    if (
      ts.isPropertyAccessExpression(node) &&
      node.name.text === member &&
      resolver.matches(node.expression, specifier, imported)
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}

function isInsideImportDeclaration(node) {
  for (let current = node.parent; current; current = current.parent) {
    if (ts.isImportDeclaration(current)) {
      return true;
    }
  }
  return false;
}

function containsImportedReference(sourceFile, resolver, specifier, imported) {
  let found = false;
  function visit(node) {
    if (
      !isInsideImportDeclaration(node) &&
      (ts.isIdentifier(node) ||
        ts.isPropertyAccessExpression(node) ||
        ts.isQualifiedName(node)) &&
      resolver.matches(node, specifier, imported)
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}

function containsImportedDecorator(
  sourceFile,
  resolver,
  specifier,
  importedNames,
) {
  let found = false;
  function visit(node) {
    if (
      importedNames.some(
        (imported) =>
          importedDecorators(node, resolver, specifier, imported).length > 0,
      )
    ) {
      found = true;
      return;
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
  return found;
}

function namedImportBindings(sourceFile) {
  const bindings = new Map();
  for (const statement of sourceFile.statements) {
    if (
      !ts.isImportDeclaration(statement) ||
      !ts.isStringLiteralLike(statement.moduleSpecifier) ||
      !statement.importClause?.namedBindings ||
      !ts.isNamedImports(statement.importClause.namedBindings)
    ) {
      continue;
    }
    for (const element of statement.importClause.namedBindings.elements) {
      bindings.set(element.name.text, {
        imported: element.propertyName?.text ?? element.name.text,
        specifier: statement.moduleSpecifier.text,
      });
    }
  }
  return bindings;
}

function isNonStructuralFile(path, policy) {
  const name = basename(path);
  return (
    name.startsWith('.') ||
    policy.nonStructuralFileNames.includes(name) ||
    policy.nonStructuralFileSuffixes.some((suffix) => name.endsWith(suffix))
  );
}

function controllerAuthorityUses(sourceFile, authoritySymbols, resolver) {
  const uses = new Set();

  function calledName(expression) {
    if (ts.isIdentifier(expression)) {
      return expression.text;
    }
    if (ts.isPropertyAccessExpression(expression)) {
      return expression.name.text;
    }
    return undefined;
  }

  function inspectMember(node) {
    if (node.name) {
      const name = propertyNameText(node.name);
      if (name && authoritySymbols.has(name)) {
        uses.add(name);
      }
    }
    function visit(child) {
      if (ts.isCallExpression(child)) {
        const name = calledName(child.expression);
        if (name && authoritySymbols.has(name)) {
          uses.add(name);
        }
      }
      ts.forEachChild(child, visit);
    }
    ts.forEachChild(node, visit);
  }

  for (const statement of sourceFile.statements) {
    if (
      ts.isClassDeclaration(statement) &&
      importedDecorators(
        statement,
        resolver,
        '@nestjs/common',
        'Controller',
      ).length > 0
    ) {
      for (const member of statement.members) {
        inspectMember(member);
      }
    }
  }
  return [...uses].sort();
}

function exportedDeclarationNames(sourceFile) {
  const names = new Set(exportedNames(sourceFile));
  for (const statement of sourceFile.statements) {
    if (!ts.isExportDeclaration(statement) || !statement.exportClause) {
      continue;
    }
    if (ts.isNamedExports(statement.exportClause)) {
      for (const element of statement.exportClause.elements) {
        names.add(element.name.text);
      }
    }
  }
  return [...names].sort();
}

function declarationName(node) {
  if (
    node &&
    (ts.isIdentifier(node) ||
      ts.isStringLiteralLike(node) ||
      ts.isNumericLiteral(node))
  ) {
    return node.text;
  }
  return undefined;
}

function nodeContainsImportedDriver(node, resolver, persistence, aliases = new Set()) {
  let found = false;
  function visit(current) {
    if (
      (ts.isIdentifier(current) ||
        ts.isPropertyAccessExpression(current) ||
        ts.isQualifiedName(current))
    ) {
      const origin = resolver.originOf(current);
      if (
        origin &&
        (persistence.driverPublicTypes[origin.specifier] ?? []).includes(
          origin.imported,
        )
      ) {
        found = true;
        return;
      }
      if (ts.isIdentifier(current) && aliases.has(current.text)) {
        found = true;
        return;
      }
    }
    ts.forEachChild(current, visit);
  }
  if (node) {
    visit(node);
  }
  return found;
}

function importedDriverAliases(sourceFile, resolver, persistence) {
  const aliases = new Set();
  let changed = true;
  while (changed) {
    changed = false;
    for (const statement of sourceFile.statements) {
      if (
        ts.isTypeAliasDeclaration(statement) &&
        !aliases.has(statement.name.text) &&
        nodeContainsImportedDriver(statement.type, resolver, persistence, aliases)
      ) {
        aliases.add(statement.name.text);
        changed = true;
      }
    }
  }
  return aliases;
}

function isPersistencePackage(specifier, persistence) {
  return (
    persistence.dependencyPackages.includes(specifier) ||
    persistence.dependencyPackagePrefixes.some((prefix) =>
      specifier.startsWith(prefix),
    )
  );
}

function isInsidePath(path, root) {
  return path === root.slice(0, -1) || path.startsWith(root);
}

function scopeTypeIsStructural(sourceFile, scopeName, persistence) {
  const requiredFields = persistence.scopeTypes[scopeName];
  if (!requiredFields) {
    return false;
  }
  const declaration = sourceFile.statements.find(
    (statement) =>
      (ts.isInterfaceDeclaration(statement) ||
        ts.isTypeAliasDeclaration(statement)) &&
      statement.name.text === scopeName,
  );
  if (!declaration) {
    return false;
  }
  let members;
  if (ts.isInterfaceDeclaration(declaration)) {
    members = declaration.members;
  } else if (
    ts.isTypeAliasDeclaration(declaration) &&
    ts.isTypeLiteralNode(declaration.type)
  ) {
    members = declaration.type.members;
  } else {
    return false;
  }
  return requiredFields.every((field) =>
    members.some((member) => {
      if (
        !ts.isPropertySignature(member) ||
        declarationName(member.name) !== field ||
        member.questionToken ||
        member.type?.kind !== ts.SyntaxKind.StringKeyword
      ) {
        return false;
      }
      const modifiers = ts.canHaveModifiers(member)
        ? ts.getModifiers(member) ?? []
        : [];
      return modifiers.some(
        (modifier) => modifier.kind === ts.SyntaxKind.ReadonlyKeyword,
      );
    }),
  );
}

function parameterHasRequiredScope(
  parameter,
  allowedScopes,
  sourceFile,
  persistence,
) {
  if (
    parameter.questionToken ||
    parameter.initializer ||
    !parameter.type ||
    ts.isOptionalTypeNode(parameter.type)
  ) {
    return false;
  }
  if (
    ts.isUnionTypeNode(parameter.type) &&
    parameter.type.types.some(
      (type) =>
        type.kind === ts.SyntaxKind.NullKeyword ||
        type.kind === ts.SyntaxKind.UndefinedKeyword,
    )
  ) {
    return false;
  }
  return (
    ts.isTypeReferenceNode(parameter.type) &&
    ts.isIdentifier(parameter.type.typeName) &&
    allowedScopes.includes(parameter.type.typeName.text) &&
    scopeTypeIsStructural(
      sourceFile,
      parameter.type.typeName.text,
      persistence,
    )
  );
}

function importsTarget(parsed, sourcePath, targetPath, sourceFileSet) {
  return parsed.records.some((record) => {
    const target = resolveLocalSource(sourcePath, record.specifier, sourceFileSet);
    return target === targetPath;
  });
}

function collectExecutorBindings(sourceFile, resolver, persistence, aliases) {
  const identifiers = new Map();
  const properties = new Set();

  function isExecutorType(type) {
    return nodeContainsImportedDriver(type, resolver, persistence, aliases);
  }

  function addBinding(
    declaration,
    name,
    type,
    initializer,
    isProperty = false,
  ) {
    let executor = isExecutorType(type);
    if (initializer && ts.isNewExpression(unwrapTransparentExpression(initializer))) {
      const expression = unwrapTransparentExpression(initializer).expression;
      const origin = resolver.originOf(expression);
      executor ||= Boolean(
        origin &&
          (persistence.databaseExecutorTypes[origin.specifier] ?? []).includes(
            origin.imported,
          ),
      );
    }
    if (!executor || !ts.isIdentifier(name)) {
      return;
    }
    if (isProperty) {
      properties.add(name.text);
    } else {
      const declarations = identifiers.get(name.text) ?? new Set();
      declarations.add(declaration);
      identifiers.set(name.text, declarations);
    }
  }

  function visit(node) {
    if (ts.isVariableDeclaration(node)) {
      addBinding(node, node.name, node.type, node.initializer);
    } else if (ts.isParameter(node)) {
      const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) ?? [] : [];
      addBinding(
        node,
        node.name,
        node.type,
        node.initializer,
        modifiers.some((modifier) =>
          [
            ts.SyntaxKind.PrivateKeyword,
            ts.SyntaxKind.ProtectedKeyword,
            ts.SyntaxKind.PublicKeyword,
            ts.SyntaxKind.ReadonlyKeyword,
          ].includes(modifier.kind),
        ),
      );
    } else if (ts.isPropertyDeclaration(node) || ts.isPropertySignature(node)) {
      addBinding(node, node.name, node.type, node.initializer, true);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  function nearestValueBinding(identifier) {
    const expected = identifier.text;
    for (
      let current = identifier.parent;
      current && current !== sourceFile.parent;
      current = current.parent
    ) {
      if (isFunctionLikeDeclaration(current)) {
        const parameter = current.parameters.find((candidate) =>
          bindingNameContains(candidate.name, expected),
        );
        if (parameter) {
          return parameter;
        }
      }
      if (ts.isBlock(current) || ts.isSourceFile(current)) {
        for (const statement of current.statements) {
          if (ts.isVariableStatement(statement)) {
            const declaration = statement.declarationList.declarations.find(
              (candidate) => bindingNameContains(candidate.name, expected),
            );
            if (declaration) {
              return declaration;
            }
          }
          if (
            (ts.isFunctionDeclaration(statement) ||
              ts.isClassDeclaration(statement) ||
              ts.isEnumDeclaration(statement)) &&
            statement.name?.text === expected
          ) {
            return statement;
          }
        }
      }
      if (
        ts.isCatchClause(current) &&
        current.variableDeclaration &&
        bindingNameContains(current.variableDeclaration.name, expected)
      ) {
        return current.variableDeclaration;
      }
    }
    return undefined;
  }

  function matches(expression) {
    const candidate = unwrapTransparentExpression(expression);
    if (
      ts.isIdentifier(candidate) &&
      identifiers.get(candidate.text)?.has(nearestValueBinding(candidate))
    ) {
      return true;
    }
    if (
      ts.isPropertyAccessExpression(candidate) &&
      candidate.expression.kind === ts.SyntaxKind.ThisKeyword &&
      properties.has(candidate.name.text)
    ) {
      return true;
    }
    if (
      ts.isCallExpression(candidate) &&
      ts.isPropertyAccessExpression(candidate.expression)
    ) {
      return matches(candidate.expression.expression);
    }
    return false;
  }

  return { matches };
}

function persistenceBoundaryDiagnostics({
  add,
  parsedFiles,
  persistence,
  projectRoot,
  sourceFileSet,
}) {
  const databaseRoot = persistence.databaseRoot;
  const migrationRoot = persistence.migrationRoot;
  const registeredPorts = new Set(Object.keys(persistence.ports));
  const registeredAdapters = new Set(Object.keys(persistence.adapters));
  const registeredInfrastructure = new Set(
    Object.keys(persistence.infrastructureFiles),
  );
  const forbiddenGlobalNames = new Set(
    persistence.forbiddenGlobalSurfaceNames,
  );
  const genericCapabilities = new Set(
    persistence.genericRepositoryCapabilities,
  );

  for (const [file, parsed] of parsedFiles) {
    const relativePath = toPosix(relative(projectRoot, file));
    const sourceFile = parsed.sourceFile;
    const resolver = createImportIdentityResolver(sourceFile);
    const aliases = importedDriverAliases(
      sourceFile,
      resolver,
      persistence,
    );
    const moduleName = moduleFromPath(projectRoot, file);
    const layer = layerFromPath(projectRoot, file);
    const isPort =
      registeredPorts.has(relativePath) ||
      /\/application\/ports\/[^/]*repository[^/]*\.(?:c|m)?[jt]s$/u.test(
        relativePath,
      );
    const allowedDependencyPath = persistence.allowedDependencyRoots.some(
      (root) => isInsidePath(relativePath, root),
    );

    for (const record of parsed.records) {
      if (
        isPersistencePackage(record.specifier, persistence) &&
        !allowedDependencyPath &&
        !isPort
      ) {
        add(
          'D5-R037',
          file,
          `persistence dependency ${record.specifier} is outside an authorized infrastructure root`,
        );
      }

      const target = resolveLocalSource(file, record.specifier, sourceFileSet);
      const targetRelative = target
        ? toPosix(relative(projectRoot, target))
        : undefined;
      if (
        targetRelative &&
        isInsidePath(targetRelative, databaseRoot) &&
        (layer === 'domain' || layer === 'application') &&
        !isPort
      ) {
        add(
          'D5-R040',
          file,
          `layer ${layer} imports database infrastructure through ${record.specifier}`,
        );
      }
      if (
        targetRelative &&
        isInsidePath(targetRelative, migrationRoot) &&
        (layer === 'domain' ||
          persistence.startupFiles.includes(relativePath) ||
          /\.controller\.(?:c|m)?[jt]s$/u.test(relativePath))
      ) {
        add(
          'D5-R042',
          file,
          `migration ${targetRelative} is consumed outside the authorized runner`,
        );
      }
    }

    for (const statement of sourceFile.statements) {
      if (
        (ts.isClassDeclaration(statement) ||
          ts.isInterfaceDeclaration(statement)) &&
        statement.typeParameters?.length > 0
      ) {
        const capabilityCount = new Set(
          statement.members
            .map((member) => declarationName(member.name))
            .filter((name) => name && genericCapabilities.has(name)),
        ).size;
        if (capabilityCount >= 2) {
          add(
            'D5-R039',
            file,
            'generic cross-entity repository capability is forbidden',
          );
        }
      }
      if (
        ts.isFunctionDeclaration(statement) &&
        statement.typeParameters?.length > 0 &&
        statement.parameters.some(
          (parameter) =>
            declarationName(parameter.name) === 'table' &&
            parameter.type?.kind === ts.SyntaxKind.StringKeyword,
        )
      ) {
        add(
          'D5-R039',
          file,
          'generic arbitrary-table persistence helper is forbidden',
        );
      }
    }

    if (isPort) {
      let leaked = false;
      for (const record of parsed.records) {
        const target = resolveLocalSource(file, record.specifier, sourceFileSet);
        const targetRelative = target
          ? toPosix(relative(projectRoot, target))
          : undefined;
        if (
          isPersistencePackage(record.specifier, persistence) ||
          (targetRelative && isInsidePath(targetRelative, databaseRoot))
        ) {
          leaked = true;
        }
      }
      if (
        !leaked &&
        nodeContainsImportedDriver(sourceFile, resolver, persistence, aliases)
      ) {
        leaked = true;
      }
      if (leaked) {
        add(
          'D5-R043',
          file,
          'persistence port leaks a driver, query-builder, SQL, or database infrastructure type',
        );
      }

      const port = persistence.ports[relativePath];
      if (port) {
        const methods = [];
        for (const statement of sourceFile.statements) {
          if (ts.isInterfaceDeclaration(statement) || ts.isClassDeclaration(statement)) {
            methods.push(
              ...statement.members.filter(
                (member) =>
                  ts.isMethodSignature(member) ||
                  ts.isMethodDeclaration(member),
              ),
            );
          }
        }
        if (
          methods.length === 0 ||
          methods.some(
            (method) =>
              !method.parameters.some((parameter) =>
                parameterHasRequiredScope(
                  parameter,
                  port.allowedScopes,
                  sourceFile,
                  persistence,
                ),
              ),
          )
        ) {
          add(
            'D5-R044',
            file,
            'every owner-scoped persistence operation must require a non-optional structural tenant scope',
          );
        }
      }
    }

    if (isInsidePath(relativePath, migrationRoot)) {
      const migrationName = basename(relativePath);
      if (
        !new RegExp(persistence.migrationFilePattern, 'u').test(migrationName)
      ) {
        add(
          'D5-R042',
          file,
          `migration filename ${migrationName} is not UTC-lexicographic and owner-scoped`,
        );
      }
    } else if (/(?:^|\/)migrations?\//u.test(relativePath)) {
      add(
        'D5-R042',
        file,
        'migration is outside the central authorized migration root',
      );
    }

    if (
      isInsidePath(relativePath, databaseRoot) &&
      !isInsidePath(relativePath, migrationRoot)
    ) {
      const registration = persistence.infrastructureFiles[relativePath];
      if (!registration) {
        add(
          'D5-R045',
          file,
          'database infrastructure file has no explicit owner/API/consumer registration',
        );
      } else {
        const actualExports = exportedDeclarationNames(sourceFile);
        const dangerousExports = new Set(
          actualExports.filter((name) => forbiddenGlobalNames.has(name)),
        );
        const importsPersistence = parsed.records.some((record) =>
          isPersistencePackage(record.specifier, persistence),
        );
        for (const statement of sourceFile.statements) {
          if (ts.isVariableStatement(statement) && isExported(statement)) {
            for (const declaration of statement.declarationList.declarations) {
              const name = declarationName(declaration.name);
              if (
                name &&
                !registration.publicExports.includes(name) &&
                (importsPersistence ||
                  nodeContainsImportedDriver(
                    declaration,
                    resolver,
                    persistence,
                    aliases,
                  ))
              ) {
                dangerousExports.add(name);
              }
            }
          } else if (
            ts.isFunctionDeclaration(statement) &&
            isExported(statement) &&
            statement.name &&
            !registration.publicExports.includes(statement.name.text) &&
            nodeContainsImportedDriver(
              statement.type,
              resolver,
              persistence,
              aliases,
            )
          ) {
            dangerousExports.add(statement.name.text);
          } else if (
            ts.isExportDeclaration(statement) &&
            statement.moduleSpecifier &&
            ts.isStringLiteralLike(statement.moduleSpecifier) &&
            isPersistencePackage(statement.moduleSpecifier.text, persistence)
          ) {
            if (
              statement.exportClause &&
              ts.isNamedExports(statement.exportClause)
            ) {
              for (const element of statement.exportClause.elements) {
                dangerousExports.add(element.name.text);
              }
            } else {
              dangerousExports.add('*');
            }
          }
        }
        if (dangerousExports.size > 0) {
          add(
            'D5-R038',
            file,
            `global database capability is forbidden: ${[...dangerousExports].sort().join(', ')}`,
          );
        }
        const unexpectedExports = actualExports.filter(
          (name) =>
            !registration.publicExports.includes(name) &&
            !dangerousExports.has(name),
        );
        const missingExports = registration.publicExports.filter(
          (name) => !actualExports.includes(name),
        );
        if (unexpectedExports.length > 0 || missingExports.length > 0) {
          add(
            'D5-R045',
            file,
            `database infrastructure API differs from its registry; unexpected=${unexpectedExports.join(',') || 'none'} missing=${missingExports.join(',') || 'none'}`,
          );
        }
        const materializedConsumers = registration.consumers
          .map((consumer) => resolve(projectRoot, consumer))
          .filter((consumer) => parsedFiles.has(consumer));
        const pureConfigurationConsumerDeferred =
          relativePath ===
            'src/infrastructure/database/database-config.ts' &&
          registration.owner === 'database' &&
          registration.status === 'materialized-pure-config' &&
          registration.consumerRequirement ===
            'deferred-until-connection-step' &&
          parsed.records.length === 0;
        if (
          !pureConfigurationConsumerDeferred &&
          (materializedConsumers.length === 0 ||
            !materializedConsumers.some((consumer) =>
              importsTarget(
                parsedFiles.get(consumer),
                consumer,
                file,
                sourceFileSet,
              ),
            ))
        ) {
          add(
            'D5-R045',
            file,
            'database infrastructure has no materialized registered consumer and composition',
          );
        }
      }
    }

    const executor = collectExecutorBindings(
      sourceFile,
      resolver,
      persistence,
      aliases,
    );
    if (!isInsidePath(relativePath, migrationRoot)) {
      let rawSql = false;
      function findRawSql(node) {
        if (
          ts.isTaggedTemplateExpression(node) &&
          resolver.matches(node.tag, 'kysely', 'sql')
        ) {
          rawSql = true;
          return;
        }
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression)
        ) {
          const receiver = node.expression.expression;
          if (
            (node.expression.name.text === 'raw' &&
              resolver.matches(receiver, 'kysely', 'sql')) ||
            (node.expression.name.text === 'query' &&
              executor.matches(receiver) &&
              node.arguments.length > 0 &&
              (ts.isStringLiteralLike(node.arguments[0]) ||
                ts.isNoSubstitutionTemplateLiteral(node.arguments[0]) ||
                ts.isTemplateExpression(node.arguments[0])))
          ) {
            rawSql = true;
            return;
          }
        }
        ts.forEachChild(node, findRawSql);
      }
      findRawSql(sourceFile);
      if (rawSql) {
        add(
          'D5-R046',
          file,
          'executable raw SQL is allowed only in an authorized migration',
        );
      }
    }

    const adapter = persistence.adapters[relativePath];
    if (adapter) {
      const owner = moduleName;
      const portPath = resolve(projectRoot, adapter.port);
      const compositionPath = resolve(projectRoot, adapter.composition);
      const portImported = parsedFiles.has(portPath) &&
        importsTarget(parsed, file, portPath, sourceFileSet);
      const composed = parsedFiles.has(compositionPath) &&
        importsTarget(
          parsedFiles.get(compositionPath),
          compositionPath,
          file,
          sourceFileSet,
        );
      if (owner !== adapter.owner || !portImported || !composed) {
        add(
          'D5-R041',
          file,
          'persistence adapter must match its owner, concrete port, registry, and composition consumer',
        );
      }

      function inspectTableOperation(node) {
        if (
          ts.isCallExpression(node) &&
          ts.isPropertyAccessExpression(node.expression) &&
          ['deleteFrom', 'insertInto', 'selectFrom', 'updateTable'].includes(
            node.expression.name.text,
          ) &&
          executor.matches(node.expression.expression)
        ) {
          const table =
            node.arguments.length === 1 &&
            ts.isStringLiteralLike(node.arguments[0])
              ? node.arguments[0].text
              : undefined;
          const object = table
            ? persistence.databaseObjects[table]
            : undefined;
          if (!object || object.owner !== adapter.owner) {
            add(
              'D5-R047',
              file,
              `database object ${table ?? '<dynamic>'} is unknown or owned by another module`,
            );
          }
        }
        ts.forEachChild(node, inspectTableOperation);
      }
      inspectTableOperation(sourceFile);
    } else if (
      /\/infrastructure\/persistence\//u.test(relativePath) &&
      parsed.records.some((record) =>
        isPersistencePackage(record.specifier, persistence),
      )
    ) {
      add(
        'D5-R041',
        file,
        'persistence adapter is not registered to an owning module and port',
      );
    }
  }
}

export async function checkArchitecture({
  disabledRules = [],
  fixture = false,
  root,
}) {
  const projectRoot = resolve(root);
  const policy = await readPolicy();
  const sourceRoot = resolve(projectRoot, 'src');
  const modulesRoot = resolve(sourceRoot, 'modules');
  const tree = await walk(sourceRoot);
  const sourceFiles = tree.files.filter(isSourceFile).sort();
  const sourceFileSet = new Set(sourceFiles);
  const diagnostics = [];
  const fileGraph = new Map(sourceFiles.map((file) => [file, new Set()]));
  const observedEdges = new Set();
  const parsedFiles = new Map();
  const controllerAuthoritySymbols = new Set(policy.controllerAuthoritySymbols);
  if (!fixture && disabledRules.length > 0) {
    throw new Error('architecture rules may be disabled only in isolated fixtures');
  }
  const disabledRuleSet = new Set(disabledRules);

  function add(rule, file, message, details = {}) {
    if (disabledRuleSet.has(rule)) {
      return;
    }
    diagnostics.push({
      ...details,
      file: toRepositoryRelativePath(projectRoot, file),
      message,
      rule,
    });
  }

  const moduleTree = await walk(modulesRoot);
  const directModuleDirectories = moduleTree.directories
    .filter((directory) => dirname(directory) === modulesRoot)
    .sort();
  const directModuleNames = directModuleDirectories.map((directory) =>
    directory.slice(modulesRoot.length + 1),
  );

  for (const governedRootName of policy.governedRoots) {
    const governedRoot = resolve(projectRoot, governedRootName);
    const governedDirectories = tree.directories
      .filter(
        (directory) =>
          directory === governedRoot || directory.startsWith(`${governedRoot}${sep}`),
      )
      .sort();
    for (const directory of governedDirectories) {
      const structuralFiles = tree.files.filter(
        (file) =>
          file.startsWith(`${directory}${sep}`) &&
          !isNonStructuralFile(file, policy),
      );
      if (structuralFiles.length === 0) {
        add(
          'D5-R003',
          directory,
          'governed directory is empty or contains only hidden/temporary files',
        );
      }
    }
  }

  for (const moduleName of directModuleNames) {
    const directory = resolve(modulesRoot, moduleName);
    const moduleSources = sourceFiles.filter(
      (file) => file.startsWith(`${directory}${sep}`),
    );

    if (moduleSources.length === 0) {
      add('D5-R003', directory, `module ${moduleName} is empty or anticipatory`);
      continue;
    }
    if (!policy.allowedModules.includes(moduleName)) {
      add('D5-R002', directory, `module ${moduleName} is not authorized by DEC-005`);
      continue;
    }
    if (!sourceFileSet.has(resolve(directory, 'index.ts'))) {
      add('D5-R004', directory, `module ${moduleName} has no public index.ts surface`);
    }
  }

  for (const moduleName of policy.allowedModules) {
    if (!directModuleNames.includes(moduleName)) {
      add('D5-R003', `src/modules/${moduleName}`, `required module ${moduleName} is missing`);
    }
  }

  const directSourceDirectories = tree.directories.filter(
    (directory) => dirname(directory) === sourceRoot,
  );
  for (const directory of directSourceDirectories) {
    const name = directory.slice(sourceRoot.length + 1);
    if (policy.forbiddenGlobalRoots.includes(name)) {
      add('D5-R020', directory, `global root ${name} is forbidden`);
    }
  }

  const sharedRoot = resolve(sourceRoot, 'shared');
  const sharedFiles = tree.files.filter((file) => file.startsWith(`${sharedRoot}${sep}`));
  if (sharedFiles.length > 0) {
    add('D5-R019', sharedRoot, 'shared must remain absent or empty during PBI-022');
  }

  for (const file of sourceFiles) {
    const relativePath = toPosix(relative(projectRoot, file));
    const text = await readFile(file, 'utf8');
    const sourceFile = ts.createSourceFile(
      file,
      text,
      ts.ScriptTarget.Latest,
      true,
      sourceKind(file),
    );
    const imports = createImportIdentityResolver(sourceFile);
    const records = collectModuleSpecifiers(sourceFile);
    parsedFiles.set(file, { records, sourceFile, text });

    const moduleName = moduleFromPath(projectRoot, file);
    const layer = layerFromPath(projectRoot, file);
    const basename = relativePath.split('/').at(-1) ?? relativePath;
    const isPublicSurface = moduleName !== undefined && basename === 'index.ts';

    if (
      containsImportedCall(
        sourceFile,
        imports,
        '@nestjs/common',
        'forwardRef',
      )
    ) {
      add('D5-R025', file, 'forwardRef is forbidden in R0');
    }
    if (
      containsImportedReference(
        sourceFile,
        imports,
        '@nestjs/core',
        'ModuleRef',
      )
    ) {
      add('D5-R026', file, 'ModuleRef or service-locator resolution is forbidden');
    }
    if (
      containsImportedDecorator(
        sourceFile,
        imports,
        '@nestjs/common',
        ['Global'],
      )
    ) {
      add('D5-R027', file, 'functional global Nest modules are forbidden');
    }
    if (
      containsImportedMember(
        sourceFile,
        imports,
        '@nestjs/common',
        'Scope',
        'REQUEST',
      )
    ) {
      add('D5-R029', file, 'request scope cannot be operational-context authority');
    }
    if (
      /\.controller\.(?:c|m)?[jt]s$/u.test(basename) ||
      containsImportedDecorator(
        sourceFile,
        imports,
        '@nestjs/common',
        ['Controller'],
      )
    ) {
      add('D5-R035', file, 'controllers are outside the authorized PBI-022 scope');
    }
    if (
      containsImportedDecorator(
        sourceFile,
        imports,
        '@nestjs/common',
        httpDecoratorSymbols,
      )
    ) {
      add('D5-R035', file, 'HTTP endpoints are outside the authorized PBI-022 scope');
    }
    const authorityUses = controllerAuthorityUses(
      sourceFile,
      controllerAuthoritySymbols,
      imports,
    );
    if (authorityUses.length > 0) {
      add(
        'D5-R036',
        file,
        `controller decides trusted context or final authorization through ${authorityUses.join(', ')}`,
      );
    }
    if (
      fixture &&
      moduleName !== undefined &&
      /(?:create|update|delete|authorize)(?:Repair|Order|Quote|Payment)|class\s+\w*(?:Repair|Order|Quote|Payment)\w*/u.test(text)
    ) {
      add('D5-R035', file, 'functional business behavior is outside PBI-022');
    }

    if (
      moduleName !== undefined &&
      /(?:^|\/)(?:ports)(?:\/|$)/u.test(relativePath) &&
      !relativePath.includes('/application/ports/')
    ) {
      add('D5-R012', file, 'ports must live inside the owning application layer');
    }
    if (
      (layer === 'domain' || layer === 'application') &&
      /adapter/u.test(basename)
    ) {
      add('D5-R013', file, 'adapters cannot live in domain or application');
    }
    if (/\.dto\.(?:c|m)?[jt]s$/u.test(basename) && layer !== 'presentation') {
      add('D5-R015', file, 'HTTP DTOs must remain in presentation');
    }

    if (isPublicSurface) {
      for (const statement of sourceFile.statements) {
        if (ts.isExportDeclaration(statement) && statement.moduleSpecifier) {
          add('D5-R004', file, 'public index.ts cannot re-export module internals');
        }
        if (
          (ts.isClassDeclaration(statement) || ts.isInterfaceDeclaration(statement)) &&
          statement.name &&
          /(?:Entity|Aggregate)$/u.test(statement.name.text)
        ) {
          const modifiers = ts.canHaveModifiers(statement)
            ? ts.getModifiers(statement) ?? []
            : [];
          if (modifiers.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) {
            add('D5-R018', file, `mutable domain shape ${statement.name.text} cannot be public`);
          }
        }
      }
    }

    for (const record of records) {
      const { specifier } = record;
      const isNestImport = specifier.startsWith('@nestjs/');
      let layerViolation = false;

      if (isNestImport && (layer === 'domain' || layer === 'application')) {
        add('D5-R010', file, `NestJS import ${specifier} is forbidden in ${layer}`);
        layerViolation = true;
      } else if (isNestImport && isPublicSurface) {
        add('D5-R016', file, `public contract imports NestJS package ${specifier}`);
        layerViolation = true;
      }

      if (
        specifier.startsWith('.') &&
        !/\.(?:c|m)?js$/u.test(specifier) &&
        !specifier.endsWith('.json')
      ) {
        add('D5-R031', file, `relative ESM import lacks a NodeNext JavaScript extension: ${specifier}`);
      }

      const target = resolveLocalSource(file, specifier, sourceFileSet);
      if (target) {
        fileGraph.get(file)?.add(target);
      }

      const targetModule = target ? moduleFromPath(projectRoot, target) : undefined;
      const targetLayer = target ? layerFromPath(projectRoot, target) : undefined;
      const targetRelative = target ? toPosix(relative(projectRoot, target)) : undefined;

      if (!layerViolation && layer === 'domain') {
        if (
          (targetModule && targetModule !== moduleName) ||
          ['application', 'infrastructure', 'presentation'].includes(targetLayer)
        ) {
          add('D5-R008', file, `domain import crosses its allowed boundary: ${specifier}`);
          layerViolation = true;
        }
      }
      if (!layerViolation && layer === 'application') {
        if (
          ['infrastructure', 'presentation'].includes(targetLayer) ||
          (/^(?:@prisma\/|typeorm$|sequelize$|knex$)/u.test(specifier) &&
            !isPersistencePackage(specifier, policy.persistence))
        ) {
          add('D5-R009', file, `application import crosses into an outer layer: ${specifier}`);
          layerViolation = true;
        }
      }
      if (
        !layerViolation &&
        layer === 'presentation' &&
        (targetLayer === 'infrastructure' ||
          /(?:repository|adapter|sql)/iu.test(specifier) ||
          (/^(?:@prisma\/|typeorm$|sequelize$|knex$)/u.test(specifier) &&
            !isPersistencePackage(specifier, policy.persistence)))
      ) {
        add('D5-R011', file, `presentation cannot access persistence or adapters: ${specifier}`);
        layerViolation = true;
      }

      if (!target || !targetModule) {
        continue;
      }

      const targetModuleFile = `src/modules/${targetModule}/${targetModule}.module.ts`;
      if (targetRelative === targetModuleFile) {
        if (relativePath !== 'src/app.module.ts') {
          add('D5-R024', file, `only AppModule may import ${targetModule}.module.ts`);
        }
        continue;
      }

      if (!moduleName || moduleName === targetModule || layerViolation) {
        continue;
      }

      observedEdges.add(`${moduleName}->${targetModule}`);
      const publicSurface = `src/modules/${targetModule}/index.ts`;
      if (targetRelative !== publicSurface) {
        if (/\/(?:internal|infrastructure|adapters?|repositories?)\//u.test(targetRelative)) {
          add(
            'D5-R014',
            file,
            `${moduleName} accesses ${targetModule} internals through ${specifier}`,
          );
        } else {
          add(
            'D5-R005',
            file,
            `${moduleName} deep-imports ${targetModule} through ${specifier}`,
          );
        }
      } else if (!(policy.dependencies[moduleName] ?? []).includes(targetModule)) {
        add(
          'D5-R006',
          file,
          `dependency ${moduleName}->${targetModule} is outside the approved graph`,
          { edge: `${moduleName}->${targetModule}` },
        );
      }
    }
  }

  persistenceBoundaryDiagnostics({
    add,
    parsedFiles,
    persistence: policy.persistence,
    projectRoot,
    sourceFileSet,
  });

  for (const [relativePath, requirement] of Object.entries(
    policy.requiredStructuralFiles,
  )) {
    const file = resolve(projectRoot, relativePath);
    const parsed = parsedFiles.get(file);
    if (!parsed) {
      add('D5-R003', file, 'required structural file is missing');
      continue;
    }

    if (parsed.text.length === 0) {
      add('D5-R003', file, 'required structural file is empty');
      continue;
    }
    if (parsed.text.trim().length === 0) {
      add('D5-R003', file, 'required structural file contains only whitespace');
      continue;
    }
    if (parsed.sourceFile.statements.length === 0) {
      add('D5-R003', file, 'required structural file contains only comments or trivia');
      continue;
    }
    if (parsed.sourceFile.parseDiagnostics.length > 0) {
      add(
        requirement.rule,
        file,
        'required structural file is not syntactically valid TypeScript',
      );
      continue;
    }

    const candidates = parsed.sourceFile.statements.filter((statement) =>
      requirement.declarationKind === 'class'
        ? ts.isClassDeclaration(statement)
        : ts.isInterfaceDeclaration(statement),
    );
    const declaration = candidates.find(
      (statement) => statement.name?.text === requirement.declarationName,
    );
    if (!declaration) {
      const actualNames = candidates
        .map((statement) => statement.name?.text)
        .filter(Boolean)
        .sort();
      add(
        requirement.rule,
        file,
        actualNames.length > 0
          ? `required ${requirement.declarationKind} ${requirement.declarationName} is missing; found ${actualNames.join(', ')}`
          : `required ${requirement.declarationKind} ${requirement.declarationName} is missing`,
      );
      continue;
    }
    if (!isExported(declaration)) {
      add(
        requirement.rule,
        file,
        `required declaration ${requirement.declarationName} must be exported`,
      );
    }
    if (requirement.decorator) {
      const decorators = decoratorsNamed(declaration, requirement.decorator);
      if (decorators.length !== 1) {
        add(
          requirement.rule,
          file,
          `${requirement.declarationName} must have exactly one @${requirement.decorator} decorator`,
        );
      } else if (
        decorators[0].arguments.length !== 1 ||
        !ts.isObjectLiteralExpression(decorators[0].arguments[0])
      ) {
        add(
          requirement.rule,
          file,
          `@${requirement.decorator} metadata for ${requirement.declarationName} must be one static object literal`,
        );
      }
    }
  }

  const cycles = findCycles(fileGraph);
  const cycleEdges = new Set();
  for (const cycle of cycles) {
    const paths = cycle.split(' -> ');
    for (let index = 0; index < paths.length - 1; index += 1) {
      const sourceModule = moduleFromPath(projectRoot, paths[index]);
      const targetModule = moduleFromPath(projectRoot, paths[index + 1]);
      if (sourceModule && targetModule && sourceModule !== targetModule) {
        cycleEdges.add(`${sourceModule}->${targetModule}`);
      }
    }
  }
  if (cycleEdges.size > 0) {
    for (let index = diagnostics.length - 1; index >= 0; index -= 1) {
      if (
        diagnostics[index]?.rule === 'D5-R006' &&
        cycleEdges.has(diagnostics[index]?.edge)
      ) {
        diagnostics.splice(index, 1);
      }
    }
  }

  for (const cycle of cycles) {
    const cyclePaths = cycle.split(' -> ');
    const relativeCycle = cyclePaths
      .map((path) => toRepositoryRelativePath(projectRoot, path))
      .join(' -> ');
    add('D5-R007', cyclePaths[0], `dependency cycle detected: ${relativeCycle}`);
  }

  const composition = policy.appModuleComposition;
  const appModule = resolve(projectRoot, composition.file);
  const parsedAppModule = parsedFiles.get(appModule);
  if (parsedAppModule) {
    const appClass = parsedAppModule.sourceFile.statements.find(
      (statement) =>
        ts.isClassDeclaration(statement) &&
        statement.name?.text === composition.className,
    );
    if (appClass) {
      const moduleDecorators = decoratorsNamed(appClass, composition.decorator);
      if (moduleDecorators.length === 1) {
        const [metadata] = moduleDecorators[0].arguments;
        if (!metadata || !ts.isObjectLiteralExpression(metadata)) {
          add(
            'D5-R023',
            appModule,
            '@Module metadata must be one static object literal',
          );
        } else {
          const importsProperties = metadata.properties.filter(
            (property) =>
              property.name && propertyNameText(property.name) === 'imports',
          );
          if (importsProperties.length !== 1) {
            add(
              'D5-R023',
              appModule,
              'AppModule @Module metadata must contain exactly one imports property',
            );
          } else if (!ts.isPropertyAssignment(importsProperties[0])) {
            add(
              'D5-R023',
              appModule,
              'AppModule imports must be an explicit static property assignment',
            );
          } else if (!ts.isArrayLiteralExpression(importsProperties[0].initializer)) {
            add(
              'D5-R023',
              appModule,
              'AppModule imports must be a static array literal',
            );
          } else {
            const elements = importsProperties[0].initializer.elements;
            const invalidElements = elements.filter(
              (element) => !ts.isIdentifier(element),
            );
            if (invalidElements.length > 0) {
              add(
                'D5-R023',
                appModule,
                'AppModule imports may contain only direct module identifiers',
              );
            }
            const actualSymbols = elements
              .filter(ts.isIdentifier)
              .map((element) => element.text);
            const expectedSymbols = Object.keys(composition.imports).sort();
            const duplicateSymbols = [...new Set(
              actualSymbols.filter(
                (symbol, index) => actualSymbols.indexOf(symbol) !== index,
              ),
            )].sort();
            const unknownSymbols = [...new Set(
              actualSymbols.filter((symbol) => !expectedSymbols.includes(symbol)),
            )].sort();
            const missingSymbols = expectedSymbols.filter(
              (symbol) => !actualSymbols.includes(symbol),
            );
            if (duplicateSymbols.length > 0) {
              add(
                'D5-R023',
                appModule,
                `AppModule imports contain duplicates: ${duplicateSymbols.join(', ')}`,
              );
            }
            if (unknownSymbols.length > 0) {
              add(
                'D5-R023',
                appModule,
                `AppModule imports contain unauthorized modules: ${unknownSymbols.join(', ')}`,
              );
            }
            if (missingSymbols.length > 0) {
              add(
                'D5-R023',
                appModule,
                `AppModule imports are missing required modules: ${missingSymbols.join(', ')}`,
              );
            }

            const importBindings = namedImportBindings(parsedAppModule.sourceFile);
            for (const [symbol, expectedSpecifier] of Object.entries(
              composition.imports,
            )) {
              if (!actualSymbols.includes(symbol)) {
                continue;
              }
              const binding = importBindings.get(symbol);
              if (
                !binding ||
                binding.imported !== symbol ||
                binding.specifier !== expectedSpecifier
              ) {
                add(
                  'D5-R023',
                  appModule,
                  `${symbol} must be imported by name from ${expectedSpecifier}`,
                );
              }
            }
          }
        }
      }
    }
  }

  if (!fixture) {
    const actualModuleFiles = sourceFiles
      .filter((file) => file.startsWith(`${modulesRoot}${sep}`))
      .map((file) => toPosix(relative(projectRoot, file)))
      .sort();
    const allowedModuleFiles = [...policy.productModuleFiles].sort();
    for (const file of actualModuleFiles.filter(
      (candidate) => !allowedModuleFiles.includes(candidate),
    )) {
      add('D5-R035', file, 'source is outside the authorized PBI-022 materialization allowlist');
    }
    for (const file of allowedModuleFiles.filter(
      (candidate) => !actualModuleFiles.includes(candidate),
    )) {
      add('D5-R003', file, 'required materialization artifact is missing');
    }

    for (const moduleName of policy.allowedModules) {
      const index = resolve(modulesRoot, moduleName, 'index.ts');
      const actual = parsedFiles.has(index)
        ? exportedNames(parsedFiles.get(index).sourceFile)
        : [];
      const expected = [...policy.publicSurfaces[moduleName]].sort();
      if (JSON.stringify(actual) !== JSON.stringify(expected)) {
        add(
          'D5-R004',
          index,
          `public exports ${JSON.stringify(actual)} do not match ${JSON.stringify(expected)}`,
        );
      }
    }

    const expectedEdges = Object.entries(policy.dependencies)
      .flatMap(([consumer, producers]) =>
        producers.map((producer) => `${consumer}->${producer}`),
      )
      .sort();
    const actualEdges = [...observedEdges].sort();
    if (JSON.stringify(actualEdges) !== JSON.stringify(expectedEdges)) {
      add(
        'D5-R006',
        'src/modules',
        `observed graph ${JSON.stringify(actualEdges)} does not match ${JSON.stringify(expectedEdges)}`,
      );
    }

    for (const evidencePath of policy.requiredEvidence) {
      try {
        await readFile(resolve(projectRoot, evidencePath), 'utf8');
      } catch (error) {
        if (error?.code === 'ENOENT') {
          add('DEC005-C03', evidencePath, 'required materialization evidence is missing');
        } else {
          throw error;
        }
      }
    }
  }

  diagnostics.sort((left, right) =>
    `${left.rule}\0${left.file}\0${left.message}`.localeCompare(
      `${right.rule}\0${right.file}\0${right.message}`,
    ),
  );

  return {
    diagnostics,
    observedEdges: [...observedEdges].sort(),
    policyVersion: policy.policyVersion,
  };
}

export function formatDiagnostics(diagnostics) {
  return diagnostics
    .map(({ file, message, rule }) => `${rule} ${file}: ${message}`)
    .join('\n');
}
