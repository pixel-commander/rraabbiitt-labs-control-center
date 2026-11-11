import ts from "typescript";

/** Parse one JSX expression and preserve the scaffold's root class composition. */
export const compositionExpression = (code: string) => {
  const source = ts.createSourceFile("composition.tsx", `const content = (${code});`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const diagnostics = (source as ts.SourceFile & { parseDiagnostics: readonly ts.Diagnostic[] }).parseDiagnostics;
  if (diagnostics.length || source.statements.length !== 1) throw Error("code must contain one valid JSX element.");
  const declaration = (source.statements[0] as ts.VariableStatement).declarationList?.declarations[0];
  let expression = declaration?.initializer;
  while (expression && ts.isParenthesizedExpression(expression)) expression = expression.expression;
  if (!expression || (!ts.isJsxElement(expression) && !ts.isJsxSelfClosingElement(expression))) {
    throw Error("code must contain one JSX root element.");
  }
  const opening = ts.isJsxElement(expression) ? expression.openingElement : expression;
  const existing = opening.attributes.properties.find((attribute) =>
    ts.isJsxAttribute(attribute) && attribute.name.getText(source) === "className",
  ) as ts.JsxAttribute | undefined;
  let previous: ts.Expression | undefined;
  if (existing?.initializer) {
    if (ts.isStringLiteral(existing.initializer)) previous = ts.factory.createStringLiteral(existing.initializer.text);
    else if (ts.isJsxExpression(existing.initializer)) previous = existing.initializer.expression;
    else throw Error("Root className must be a string or JSX expression.");
  }
  const classes = previous && !(ts.isIdentifier(previous) && previous.text === "className")
    ? [ts.factory.createIdentifier("className"), previous]
    : [ts.factory.createIdentifier("className")];
  const classValue = ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(ts.factory.createArrayLiteralExpression(classes), "filter"),
        undefined,
        [ts.factory.createIdentifier("Boolean")],
      ),
      "join",
    ),
    undefined,
    [ts.factory.createStringLiteral(" ")],
  );
  const attributes = ts.factory.createJsxAttributes([
    ...opening.attributes.properties.filter((attribute) => attribute !== existing),
    ts.factory.createJsxAttribute(ts.factory.createIdentifier("className"), ts.factory.createJsxExpression(undefined, classValue)),
  ]);
  const updated = ts.isJsxElement(expression)
    ? ts.factory.updateJsxElement(
        expression,
        ts.factory.updateJsxOpeningElement(opening as ts.JsxOpeningElement, opening.tagName, opening.typeArguments, attributes),
        expression.children,
        expression.closingElement,
      )
    : ts.factory.updateJsxSelfClosingElement(expression, opening.tagName, opening.typeArguments, attributes);
  return ts.createPrinter().printNode(ts.EmitHint.Expression, updated, source);
};

/** Replace only the component's return expression, retaining its existing function and imports. */
export const replaceReturn = (source: string, name: string, code: string) => {
  const file = ts.createSourceFile(`${name}.tsx`, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let component: ts.ArrowFunction | undefined;
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name) && declaration.name.text === name &&
          declaration.initializer && ts.isArrowFunction(declaration.initializer)) component = declaration.initializer;
    }
  }
  if (!component || !ts.isBlock(component.body)) throw Error("Generated component must have a block body.");
  const returns = component.body.statements.filter(ts.isReturnStatement);
  if (returns.length !== 1 || !returns[0].expression) throw Error("Generated component must have one return expression.");
  const expression = returns[0].expression;
  return source.slice(0, expression.getStart(file)) + `(\n    ${code}\n  )` + source.slice(expression.end);
};
