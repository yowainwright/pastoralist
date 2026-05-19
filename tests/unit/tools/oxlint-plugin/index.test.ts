import { describe, expect, test } from "bun:test";
import { ITERATION_METHODS, SEARCH_METHODS } from "../../../../tools/oxlint-plugin/constants.js";
import {
  checkNestedIteration,
  checkSearchInLoop,
  containsCallTo,
  countExpressionOperators,
  countIfConditionOperators,
  getCallbackBody,
  getMethodName,
  hoistIfOperators,
  isMethodCall,
  maxExpressionOperators,
  noComplexTernaries,
  noHiddenSideEffects,
} from "../../../../tools/oxlint-plugin/index.js";
import type { ASTNode, RuleContext, RuleReport } from "../../../../tools/oxlint-plugin/types";

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

const createContext = (options: unknown[] = []): RuleContext & { reports: RuleReport[] } => {
  const reports: RuleReport[] = [];
  return {
    options,
    reports,
    report(report) {
      reports.push(report);
    },
  };
};

describe("tools/oxlint-plugin", () => {
  test("countExpressionOperators counts boolean readability operators", () => {
    const expression = logical(binary("==="), unaryNot());

    expect(countExpressionOperators(expression)).toBe(3);
  });

  test("countExpressionOperators ignores arithmetic operators", () => {
    const expression = logical(binary("+"), binary("*"));

    expect(countExpressionOperators(expression)).toBe(1);
  });

  test("countIfConditionOperators counts branching operators, not comparisons", () => {
    const expression = logical(binary("==="), binary("!=="));

    expect(countIfConditionOperators(expression)).toBe(1);
  });

  test("countExpressionOperators does not cross nested function boundaries", () => {
    const callback = arrowCallback(logical(binary("==="), binary("!==")));
    const expression = memberCall("map", [callback]);

    expect(countExpressionOperators(expression)).toBe(0);
  });

  test("countExpressionOperators does not aggregate object literal branches", () => {
    const expression = {
      type: "ObjectExpression",
      properties: [
        { type: "Property", key: identifier("enabled"), value: logical(binary("==="), unaryNot()) },
      ],
    };

    expect(countExpressionOperators(expression)).toBe(0);
  });

  test("isMethodCall detects configured member calls", () => {
    expect(isMethodCall(memberCall("find"), SEARCH_METHODS)).toBe(true);
    expect(isMethodCall(memberCall("toString"), SEARCH_METHODS)).toBe(false);
  });

  test("containsCallTo finds nested method calls", () => {
    const expression = {
      type: "BlockStatement",
      body: [{ type: "ReturnStatement", argument: memberCall("filter") }],
    };

    expect(containsCallTo(expression, ITERATION_METHODS)).toBe(true);
  });

  test("getMethodName returns member method names", () => {
    expect(getMethodName(memberCall("some"))).toBe("some");
  });

  test("getCallbackBody returns array callback body", () => {
    const body = memberCall("filter");
    const expression = memberCall("map", [arrowCallback(body)]);

    expect(getCallbackBody(expression)).toBe(body);
  });

  test("maxExpressionOperators reports expressions over the configured max", () => {
    const context = createContext([{ max: 2 }]);
    const visitor = maxExpressionOperators.create(context);
    const init = logical(binary("==="), unaryNot());

    visitor.VariableDeclarator?.({ type: "VariableDeclarator", init });

    expect(context.reports).toHaveLength(1);
    expect(context.reports[0]?.messageId).toBe("tooMany");
    expect(context.reports[0]?.data).toEqual({ count: 3, max: 2 });
  });

  test("maxExpressionOperators allows expressions at the configured max", () => {
    const context = createContext([{ max: 3 }]);
    const visitor = maxExpressionOperators.create(context);
    const init = logical(binary("==="), unaryNot());

    visitor.VariableDeclarator?.({ type: "VariableDeclarator", init });

    expect(context.reports).toHaveLength(0);
  });

  test("hoistIfOperators reports operator-heavy if conditions", () => {
    const context = createContext([{ max: 1 }]);
    const visitor = hoistIfOperators.create(context);
    const testNode = logical(logical(binary("==="), binary("!==")), unaryNot());

    visitor.IfStatement?.({ type: "IfStatement", test: testNode });

    expect(context.reports).toHaveLength(1);
    expect(context.reports[0]?.messageId).toBe("tooMany");
    expect(context.reports[0]?.data).toEqual({ count: 2, max: 1 });
  });

  test("noComplexTernaries reports ternaries over the configured max", () => {
    const context = createContext([{ max: 2 }]);
    const visitor = noComplexTernaries.create(context);
    const expression = ternary(logical(binary("==="), binary("!==")));

    visitor.ConditionalExpression?.(expression);

    expect(context.reports).toHaveLength(1);
    expect(context.reports[0]?.messageId).toBe("tooMany");
  });

  test("noComplexTernaries reports nested ternaries", () => {
    const context = createContext([{ max: 4 }]);
    const visitor = noComplexTernaries.create(context);
    const expression = ternary(identifier("enabled"), ternary(identifier("ready")));

    visitor.ConditionalExpression?.(expression);

    expect(context.reports).toHaveLength(1);
    expect(context.reports[0]?.messageId).toBe("nested");
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

    expect(context.reports).toHaveLength(1);
    expect(context.reports[0]?.messageId).toBe("hiddenSideEffect");
  });

  test("noHiddenSideEffects allows standalone side effect statements", () => {
    const context = createContext();
    const visitor = noHiddenSideEffects.create(context);
    const expression = memberCall("push");
    const parent = expressionStatement(expression);
    expression.parent = parent;

    visitor.CallExpression?.(expression);

    expect(context.reports).toHaveLength(0);
  });

  test("noHiddenSideEffects reports side effects in side-effect-free callbacks", () => {
    const context = createContext();
    const visitor = noHiddenSideEffects.create(context);
    const pushCall = memberCall("push");
    const body = { type: "BlockStatement", body: [expressionStatement(pushCall)] };
    const expression = memberCall("map", [arrowCallback(body)]);

    visitor.CallExpression?.(expression);

    expect(context.reports).toHaveLength(1);
    expect(context.reports[0]?.messageId).toBe("callbackSideEffect");
    expect(context.reports[0]?.data).toEqual({ method: "map" });
  });

  test("checkNestedIteration reports callback iteration inside iteration", () => {
    const context = createContext();
    const body = memberCall("filter");
    const expression = memberCall("map", [arrowCallback(body)]);

    const reported = checkNestedIteration(context, expression);

    expect(reported).toBe(true);
    expect(context.reports[0]?.messageId).toBe("nestedIteration");
    expect(context.reports[0]?.data).toEqual({ outer: "map", inner: "filter" });
  });

  test("checkSearchInLoop reports searches while inside a loop", () => {
    const context = createContext();
    const loopStack: ASTNode[] = [{ type: "ForStatement" }];

    checkSearchInLoop(loopStack, context, memberCall("find"));

    expect(context.reports[0]?.messageId).toBe("searchInLoop");
    expect(context.reports[0]?.data).toEqual({ method: "find" });
  });
});
