import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { ITERATION_METHODS, SEARCH_METHODS } from "../../../../scripts/oxlint-plugin/constants.js";
import {
  checkNestedIteration,
  checkSearchInLoop,
  containsCallTo,
  countComputedValueOperators,
  countExpressionOperators,
  countIfConditionOperators,
  getCallbackBody,
  getMethodName,
  hoistIfOperators,
  isMethodCall,
  maxExpressionOperators,
  noComplexTernaries,
  noComputedValues,
  noHiddenSideEffects,
  noDirectNodeBinSmoke,
  noStandaloneArrayMutations,
  preferConcatObjectAssign,
  requireExecutableShebang,
} from "../../../../scripts/oxlint-plugin/index.js";
import type { ASTNode, RuleContext, RuleReport } from "../../../../scripts/oxlint-plugin/types";

const identifier = (name: string): ASTNode => ({ type: "Identifier", name });

const binary = (operator: string): ASTNode => ({
  type: "BinaryExpression",
  operator,
  left: identifier("left"),
  right: identifier("right"),
});

const logical = (left: ASTNode, right: ASTNode): ASTNode => ({
  type: "LogicalExpression",
  operator: "&&",
  left,
  right,
});

const unaryNot = (): ASTNode => ({
  type: "UnaryExpression",
  operator: "!",
  argument: identifier("disabled"),
});

const memberCall = (method: string, args: unknown[] = []): ASTNode => ({
  type: "CallExpression",
  callee: {
    type: "MemberExpression",
    object: identifier("items"),
    property: { type: "Identifier", name: method },
  },
  arguments: args,
});

const freshArrayCall = (method: string): ASTNode => ({
  type: "CallExpression",
  callee: {
    type: "MemberExpression",
    object: { type: "ArrayExpression", elements: [] },
    property: { type: "Identifier", name: method },
  },
  arguments: [],
});

const arrowCallback = (body: ASTNode): ASTNode => ({
  type: "ArrowFunctionExpression",
  params: [identifier("item")],
  body,
});

const ternary = (testNode: ASTNode, consequent = identifier("yes")): ASTNode => ({
  type: "ConditionalExpression",
  test: testNode,
  consequent,
  alternate: identifier("no"),
});

const expressionStatement = (expression: ASTNode): ASTNode => ({
  type: "ExpressionStatement",
  expression,
});

const spreadElement = (argument: ASTNode): ASTNode => ({
  type: "SpreadElement",
  argument,
});

const literal = (value: string): ASTNode => ({
  type: "Literal",
  value,
});

const arrayExpression = (elements: ASTNode[]): ASTNode => ({
  type: "ArrayExpression",
  elements,
});

const callExpression = (name: string, args: ASTNode[]): ASTNode => ({
  type: "CallExpression",
  callee: identifier(name),
  arguments: args,
});

const program = (): ASTNode => ({
  type: "Program",
  body: [],
});

interface ContextOptions {
  cwd?: string;
  filename?: string;
  options?: unknown[];
  text?: string;
}

const createContext = (
  optionsOrConfig: unknown[] | ContextOptions = [],
): RuleContext & { reports: RuleReport[] } => {
  let reports: RuleReport[] = [];
  const config = Array.isArray(optionsOrConfig) ? { options: optionsOrConfig } : optionsOrConfig;
  return {
    cwd: config.cwd,
    filename: config.filename,
    options: config.options ?? [],
    sourceCode: { text: config.text ?? "" },
    get reports() {
      return reports;
    },
    report(report) {
      reports = reports.concat(report);
    },
  };
};

describe("scripts/oxlint-plugin", () => {
  test("countExpressionOperators counts boolean readability operators", () => {
    const expression = logical(binary("==="), unaryNot());

    assert.strictEqual(countExpressionOperators(expression), 3);
  });

  test("countExpressionOperators ignores arithmetic operators", () => {
    const expression = logical(binary("+"), binary("*"));

    assert.strictEqual(countExpressionOperators(expression), 1);
  });

  test("countIfConditionOperators counts branching operators, not comparisons", () => {
    const expression = logical(binary("==="), binary("!=="));

    assert.strictEqual(countIfConditionOperators(expression), 1);
  });

  test("countComputedValueOperators counts arithmetic and readability operators", () => {
    const expression = logical(binary("+"), unaryNot());

    assert.strictEqual(countComputedValueOperators(expression), 3);
  });

  test("countExpressionOperators does not cross nested function boundaries", () => {
    const callback = arrowCallback(logical(binary("==="), binary("!==")));
    const expression = memberCall("map", [callback]);

    assert.strictEqual(countExpressionOperators(expression), 0);
  });

  test("countExpressionOperators does not aggregate object literal branches", () => {
    const expression = {
      type: "ObjectExpression",
      properties: [
        { type: "Property", key: identifier("enabled"), value: logical(binary("==="), unaryNot()) },
      ],
    };

    assert.strictEqual(countExpressionOperators(expression), 0);
  });

  test("isMethodCall detects configured member calls", () => {
    assert.strictEqual(isMethodCall(memberCall("find"), SEARCH_METHODS), true);
    assert.strictEqual(isMethodCall(memberCall("toString"), SEARCH_METHODS), false);
  });

  test("containsCallTo finds nested method calls", () => {
    const expression = {
      type: "BlockStatement",
      body: [{ type: "ReturnStatement", argument: memberCall("filter") }],
    };

    assert.strictEqual(containsCallTo(expression, ITERATION_METHODS), true);
  });

  test("getMethodName returns member method names", () => {
    assert.strictEqual(getMethodName(memberCall("some")), "some");
  });

  test("getCallbackBody returns array callback body", () => {
    const body = memberCall("filter");
    const expression = memberCall("map", [arrowCallback(body)]);

    assert.strictEqual(getCallbackBody(expression), body);
  });

  test("maxExpressionOperators reports expressions over the configured max", () => {
    const context = createContext([{ max: 2 }]);
    const visitor = maxExpressionOperators.create(context);
    const init = logical(binary("==="), unaryNot());

    visitor.VariableDeclarator?.({ type: "VariableDeclarator", init });

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "tooMany");
    assert.deepStrictEqual(context.reports[0]?.data, { count: 3, max: 2 });
  });

  test("maxExpressionOperators allows expressions at the configured max", () => {
    const context = createContext([{ max: 3 }]);
    const visitor = maxExpressionOperators.create(context);
    const init = logical(binary("==="), unaryNot());

    visitor.VariableDeclarator?.({ type: "VariableDeclarator", init });

    assert.strictEqual(context.reports.length, 0);
  });

  test("hoistIfOperators reports operator-heavy if conditions", () => {
    const context = createContext([{ max: 1 }]);
    const visitor = hoistIfOperators.create(context);
    const testNode = logical(logical(binary("==="), binary("!==")), unaryNot());

    visitor.IfStatement?.({ type: "IfStatement", test: testNode });

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "tooMany");
    assert.deepStrictEqual(context.reports[0]?.data, { count: 2, max: 1 });
  });

  test("hoistIfOperators reports composed if conditions by default", () => {
    const context = createContext();
    const visitor = hoistIfOperators.create(context);
    const testNode = logical(binary("==="), binary("!=="));

    visitor.IfStatement?.({ type: "IfStatement", test: testNode });

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "tooMany");
    assert.deepStrictEqual(context.reports[0]?.data, { count: 1, max: 0 });
  });

  test("noComplexTernaries reports ternaries over the configured max", () => {
    const context = createContext([{ max: 2 }]);
    const visitor = noComplexTernaries.create(context);
    const expression = ternary(logical(binary("==="), binary("!==")));

    visitor.ConditionalExpression?.(expression);

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "tooMany");
  });

  test("noComplexTernaries reports nested ternaries", () => {
    const context = createContext([{ max: 4 }]);
    const visitor = noComplexTernaries.create(context);
    const expression = ternary(identifier("enabled"), ternary(identifier("ready")));

    visitor.ConditionalExpression?.(expression);

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "nested");
  });

  test("noComputedValues reports computed return values", () => {
    const context = createContext();
    const visitor = noComputedValues.create(context);
    const argument = logical(binary("+"), identifier("ready"));

    visitor.ReturnStatement?.({ type: "ReturnStatement", argument });

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "computedReturn");
    assert.deepStrictEqual(context.reports[0]?.data, { count: 2, max: 1 });
  });

  test("noComputedValues reports computed object values", () => {
    const context = createContext();
    const visitor = noComputedValues.create(context);
    const value = logical(binary("+"), identifier("fallback"));

    visitor.Property?.({ type: "Property", key: identifier("total"), value });

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "computedObjectValue");
    assert.deepStrictEqual(context.reports[0]?.data, { count: 2, max: 1 });
  });

  test("noComputedValues allows simple computed values at the configured max", () => {
    const context = createContext();
    const visitor = noComputedValues.create(context);

    visitor.ReturnStatement?.({ type: "ReturnStatement", argument: binary("+") });

    assert.strictEqual(context.reports.length, 0);
  });

  test("preferConcatObjectAssign reports array literal spreads", () => {
    const context = createContext();
    const visitor = preferConcatObjectAssign.create(context);

    visitor.ArrayExpression?.({
      type: "ArrayExpression",
      elements: [spreadElement(identifier("items"))],
    });

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "arraySpread");
  });

  test("preferConcatObjectAssign reports object literal spreads", () => {
    const context = createContext();
    const visitor = preferConcatObjectAssign.create(context);

    visitor.ObjectExpression?.({
      type: "ObjectExpression",
      properties: [spreadElement(identifier("base"))],
    });

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "objectSpread");
  });

  test("noHiddenSideEffects reports hidden assignment expressions", () => {
    const context = createContext();
    const visitor = noHiddenSideEffects.create(context);
    const expression = {
      type: "AssignmentExpression",
      parent: { type: "VariableDeclarator" },
      left: identifier("value"),
      right: identifier("next"),
    };

    visitor.AssignmentExpression?.(expression);

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "hiddenSideEffect");
  });

  test("noHiddenSideEffects allows standalone side effect statements", () => {
    const context = createContext();
    const visitor = noHiddenSideEffects.create(context);
    const expression = memberCall("push");
    const parent = expressionStatement(expression);
    expression.parent = parent;

    visitor.CallExpression?.(expression);

    assert.strictEqual(context.reports.length, 0);
  });

  test("noStandaloneArrayMutations reports standalone array mutation calls", () => {
    const context = createContext();
    const visitor = noStandaloneArrayMutations.create(context);
    const expression = memberCall("push");
    const parent = expressionStatement(expression);
    expression.parent = parent;

    visitor.CallExpression?.(expression);

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "standaloneArrayMutation");
    assert.deepStrictEqual(context.reports[0]?.data, { method: "push" });
  });

  test("noStandaloneArrayMutations allows mutations on fresh arrays", () => {
    const context = createContext();
    const visitor = noStandaloneArrayMutations.create(context);
    const expression = freshArrayCall("sort");
    const parent = expressionStatement(expression);
    expression.parent = parent;

    visitor.CallExpression?.(expression);

    assert.strictEqual(context.reports.length, 0);
  });

  test("noHiddenSideEffects reports side effects in side-effect-free callbacks", () => {
    const context = createContext();
    const visitor = noHiddenSideEffects.create(context);
    const pushCall = memberCall("push");
    const body = { type: "BlockStatement", body: [expressionStatement(pushCall)] };
    const expression = memberCall("map", [arrowCallback(body)]);

    visitor.CallExpression?.(expression);

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "callbackSideEffect");
    assert.deepStrictEqual(context.reports[0]?.data, { method: "map" });
  });

  test("checkNestedIteration reports callback iteration inside iteration", () => {
    const context = createContext();
    const body = memberCall("filter");
    const expression = memberCall("map", [arrowCallback(body)]);

    const reported = checkNestedIteration(context, expression);

    assert.strictEqual(reported, true);
    assert.strictEqual(context.reports[0]?.messageId, "nestedIteration");
    assert.deepStrictEqual(context.reports[0]?.data, { outer: "map", inner: "filter" });
  });

  test("checkSearchInLoop reports searches while inside a loop", () => {
    const context = createContext();
    const loopStack: ASTNode[] = [{ type: "ForStatement" }];

    checkSearchInLoop(loopStack, context, memberCall("find"));

    assert.strictEqual(context.reports[0]?.messageId, "searchInLoop");
    assert.deepStrictEqual(context.reports[0]?.data, { method: "find" });
  });

  test("requireExecutableShebang reports configured executable entries without shebangs", () => {
    const context = createContext({
      cwd: "/repo",
      filename: "/repo/src/cli/index.ts",
      options: [{ files: ["src/cli/index.ts"] }],
      text: "import { run } from './run';\nrun();\n",
    });
    const visitor = requireExecutableShebang.create(context);

    visitor.Program?.(program());

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "missingShebang");
    assert.deepStrictEqual(context.reports[0]?.data, { file: "src/cli/index.ts" });
  });

  test("requireExecutableShebang allows Node shebangs", () => {
    const context = createContext({
      cwd: "/repo",
      filename: "/repo/src/cli/index.ts",
      options: [{ files: ["src/cli/index.ts"] }],
      text: "#!/usr/bin/env node\nimport { run } from './run';\nrun();\n",
    });
    const visitor = requireExecutableShebang.create(context);

    visitor.Program?.(program());

    assert.strictEqual(context.reports.length, 0);
  });

  test("requireExecutableShebang allows env -S runtime shebangs without trailing args", () => {
    for (const runtime of ["bun", "node"]) {
      const context = createContext({
        cwd: "/repo",
        filename: "/repo/src/cli/index.ts",
        options: [{ files: ["src/cli/index.ts"], runtimes: ["bun", "node"] }],
        text: `#!/usr/bin/env -S ${runtime}\nimport { run } from './run';\nrun();\n`,
      });
      const visitor = requireExecutableShebang.create(context);

      visitor.Program?.(program());

      assert.strictEqual(context.reports.length, 0);
    }
  });

  test("noDirectNodeBinSmoke reports shell commands that bypass package bins", () => {
    const context = createContext();
    const visitor = noDirectNodeBinSmoke.create(context);

    visitor.CallExpression?.(
      callExpression("execSync", [literal("node dist/cli/index.js --help")]),
    );

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "directNodeBin");
    assert.deepStrictEqual(context.reports[0]?.data, { entry: "dist/cli/index.js" });
  });

  test("noDirectNodeBinSmoke reports spawn calls that bypass package bins", () => {
    const context = createContext();
    const visitor = noDirectNodeBinSmoke.create(context);

    visitor.CallExpression?.(
      callExpression("spawnSync", [literal("node"), arrayExpression([literal("dist/index.js")])]),
    );

    assert.strictEqual(context.reports.length, 1);
    assert.strictEqual(context.reports[0]?.messageId, "directNodeBin");
    assert.deepStrictEqual(context.reports[0]?.data, { entry: "dist/index.js" });
  });

  test("noDirectNodeBinSmoke allows installed package bin smoke commands", () => {
    const context = createContext();
    const visitor = noDirectNodeBinSmoke.create(context);

    visitor.CallExpression?.(callExpression("execSync", [literal("tqs --help")]));

    assert.strictEqual(context.reports.length, 0);
  });
});
