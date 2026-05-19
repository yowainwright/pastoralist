import {
  COMPARISON_OPERATORS,
  DEFAULT_MAX_EXPRESSION_OPERATORS,
  DEFAULT_MAX_IF_OPERATORS,
  DEFAULT_MAX_TERNARY_OPERATORS,
  EXPRESSION_CONTAINER_NODE_TYPES,
  FUNCTION_NODE_TYPES,
  HOIST_IF_OPERATORS_META,
  IF_CONDITION_OPERATOR_NODE_TYPES,
  ITERATION_METHODS,
  LOOP_TYPES,
  MAX_EXPRESSION_OPERATORS_META,
  MUTATING_METHODS,
  NO_COMPLEX_TERNARIES_META,
  NO_HIDDEN_SIDE_EFFECTS_META,
  NO_QUADRATIC_PATTERNS_META,
  READABILITY_OPERATOR_NODE_TYPES,
  SEARCH_METHODS,
  SIDE_EFFECT_FREE_ITERATION_METHODS,
  SKIP_KEYS,
} from "./constants.js";

function defineRule(meta, create) {
  return { meta, create };
}

function isRecord(value) {
  return !!value && typeof value === "object";
}

function hasType(node, type) {
  return node.type === type;
}

function isFunctionBoundary(node, root) {
  if (node === root) return false;
  return FUNCTION_NODE_TYPES.has(String(node.type));
}

function isFunctionNode(node) {
  if (!isRecord(node)) return false;
  return FUNCTION_NODE_TYPES.has(String(node.type));
}

function isJsxNode(node) {
  if (!isRecord(node)) return false;
  return String(node.type).startsWith("JSX");
}

function isExpressionContainer(node) {
  if (!isRecord(node)) return false;
  return EXPRESSION_CONTAINER_NODE_TYPES.has(String(node.type));
}

function isSkippedExpressionRoot(expression) {
  return isFunctionNode(expression) || isExpressionContainer(expression) || isJsxNode(expression);
}

function getOperatorWeight(node) {
  if (READABILITY_OPERATOR_NODE_TYPES.has(String(node.type))) return 1;
  if (node.type === "BinaryExpression" && COMPARISON_OPERATORS.has(String(node.operator))) return 1;
  if (node.type === "UnaryExpression" && node.operator === "!") return 1;
  return 0;
}

function getIfConditionOperatorWeight(node) {
  if (IF_CONDITION_OPERATOR_NODE_TYPES.has(String(node.type))) return 1;
  return 0;
}

function countChildOperators(child, root) {
  if (Array.isArray(child)) {
    return child.reduce((sum, item) => sum + countChildOperators(item, root), 0);
  }
  if (!isRecord(child)) return 0;
  return countOperatorNode(child, root);
}

function countOperatorNode(node, root) {
  if (isFunctionBoundary(node, root)) return 0;
  const isNestedContainer = node !== root && (isExpressionContainer(node) || isJsxNode(node));
  if (isNestedContainer) return 0;
  const childCount = Object.entries(node).reduce((sum, [key, child]) => {
    if (SKIP_KEYS.has(key)) return sum;
    return sum + countChildOperators(child, root);
  }, 0);
  return getOperatorWeight(node) + childCount;
}

function countIfConditionOperatorNode(node, root) {
  if (isFunctionBoundary(node, root)) return 0;
  const childCount = Object.entries(node).reduce((sum, [key, child]) => {
    if (SKIP_KEYS.has(key)) return sum;
    return sum + countIfConditionChildOperators(child, root);
  }, 0);
  return getIfConditionOperatorWeight(node) + childCount;
}

function countIfConditionChildOperators(child, root) {
  if (Array.isArray(child)) {
    return child.reduce((sum, item) => sum + countIfConditionChildOperators(item, root), 0);
  }
  if (!isRecord(child)) return 0;
  return countIfConditionOperatorNode(child, root);
}

export function countExpressionOperators(expression) {
  if (!isRecord(expression)) return 0;
  if (isSkippedExpressionRoot(expression)) return 0;
  return countOperatorNode(expression, expression);
}

export function countIfConditionOperators(expression) {
  if (!isRecord(expression)) return 0;
  return countIfConditionOperatorNode(expression, expression);
}

export function isMethodCall(node, methodSet) {
  if (!isRecord(node)) return false;
  if (!hasType(node, "CallExpression")) return false;
  const call = node;
  if (call.callee?.type !== "MemberExpression") return false;
  if (call.callee.property?.type !== "Identifier") return false;
  return methodSet.has(call.callee.property.name ?? "");
}

function containsCallWithin(node, methodSet, root) {
  if (isFunctionBoundary(node, root)) return false;
  if (isMethodCall(node, methodSet)) return true;
  return Object.entries(node).some(([key, child]) => {
    if (SKIP_KEYS.has(key)) return false;
    return childContainsCall(child, methodSet, root);
  });
}

function childContainsCall(child, methodSet, root) {
  if (Array.isArray(child)) {
    const childNodes = child.filter(isRecord);
    return childNodes.some((item) => containsCallWithin(item, methodSet, root));
  }
  if (!isRecord(child)) return false;
  return containsCallWithin(child, methodSet, root);
}

export function containsCallTo(node, methodSet) {
  if (!isRecord(node)) return false;
  return containsCallWithin(node, methodSet, node);
}

export function getMethodName(node) {
  const call = node;
  return call.callee?.property?.name ?? null;
}

export function getCallbackBody(node) {
  const call = node;
  const callback = call.arguments?.[0];
  if (!callback) return null;
  const isArrow = callback.type === "ArrowFunctionExpression";
  const isFunction = callback.type === "FunctionExpression";
  if (!isArrow && !isFunction) return null;
  return callback.body ?? null;
}

function getConfiguredNumber(context, key, fallback) {
  const [options] = context.options ?? [];
  if (!isRecord(options)) return fallback;
  if (typeof options[key] !== "number") return fallback;
  return options[key];
}

function getConfiguredMax(context, fallback) {
  return getConfiguredNumber(context, "max", fallback);
}

function createExpressionCheck(context) {
  const max = getConfiguredMax(context, DEFAULT_MAX_EXPRESSION_OPERATORS);
  const checked = new WeakSet();
  return (expression) => {
    if (!isRecord(expression)) return;
    if (isSkippedExpressionRoot(expression)) return;
    if (checked.has(expression)) return;
    checked.add(expression);
    const count = countExpressionOperators(expression);
    if (count <= max) return;
    context.report({
      node: expression,
      messageId: "tooMany",
      data: { count, max },
    });
  };
}

function createMaxExpressionOperators(context) {
  const checkExpression = createExpressionCheck(context);
  return {
    ArrowFunctionExpression(node) {
      const body = node.body;
      if (isRecord(body) && body.type === "BlockStatement") return;
      checkExpression(body);
    },
    AssignmentExpression(node) {
      checkExpression(node.right);
    },
    CallExpression(node) {
      const args = node.arguments ?? [];
      args.filter((arg) => !isFunctionNode(arg)).forEach(checkExpression);
    },
    ConditionalExpression(node) {
      checkExpression(node);
    },
    DoWhileStatement(node) {
      checkExpression(node.test);
    },
    ForStatement(node) {
      checkExpression(node.test);
    },
    IfStatement(node) {
      checkExpression(node.test);
    },
    ReturnStatement(node) {
      checkExpression(node.argument);
    },
    VariableDeclarator(node) {
      checkExpression(node.init);
    },
    WhileStatement(node) {
      checkExpression(node.test);
    },
  };
}

function createHoistIfOperators(context) {
  const max = getConfiguredMax(context, DEFAULT_MAX_IF_OPERATORS);
  return {
    IfStatement(node) {
      const count = countIfConditionOperators(node.test);
      if (count <= max) return;
      context.report({
        node: node.test,
        messageId: "tooMany",
        data: { count, max },
      });
    },
  };
}

function isExpressionStatement(node) {
  return isRecord(node) && node.type === "ExpressionStatement";
}

function isForUpdateExpression(node) {
  if (!isRecord(node)) return false;
  return node.type === "ForStatement" && isRecord(node.update);
}

function getSideEffectParent(node) {
  const parent = node.parent;
  if (!isRecord(parent)) return parent;
  if (parent.type !== "ChainExpression") return parent;
  return parent.parent;
}

function isStandaloneSideEffect(node) {
  const parent = getSideEffectParent(node);
  if (isExpressionStatement(parent)) return true;
  return isForUpdateExpression(parent) && parent.update === node;
}

function isAssignmentSideEffect(node) {
  return node.type === "AssignmentExpression" || node.type === "UpdateExpression";
}

function isMutatingMethodCall(node) {
  return isMethodCall(node, MUTATING_METHODS);
}

function getMemberObject(node) {
  if (!isRecord(node)) return null;
  const callee = node.callee;
  if (!isRecord(callee)) return null;
  if (callee.type !== "MemberExpression") return null;
  return callee.object ?? null;
}

function isFreshMutationTarget(target) {
  if (!isRecord(target)) return false;
  if (target.type === "ArrayExpression") return true;
  if (target.type === "ObjectExpression") return true;
  return target.type === "CallExpression";
}

function isFreshMutatingMethodCall(node) {
  if (!isMutatingMethodCall(node)) return false;
  return isFreshMutationTarget(getMemberObject(node));
}

function isSideEffectNode(node) {
  if (!isRecord(node)) return false;
  if (isAssignmentSideEffect(node)) return true;
  if (isFreshMutatingMethodCall(node)) return false;
  return isMutatingMethodCall(node);
}

function childContainsSideEffect(child, root) {
  if (Array.isArray(child)) {
    const childNodes = child.filter(isRecord);
    return childNodes.some((item) => containsSideEffect(item, root));
  }
  if (!isRecord(child)) return false;
  return containsSideEffect(child, root);
}

function containsSideEffect(node, root = node) {
  if (isFunctionBoundary(node, root)) return false;
  if (isSideEffectNode(node)) return true;
  return Object.entries(node).some(([key, child]) => {
    if (SKIP_KEYS.has(key)) return false;
    return childContainsSideEffect(child, root);
  });
}

function reportHiddenSideEffect(context, node) {
  if (isStandaloneSideEffect(node)) return;
  context.report({ node, messageId: "hiddenSideEffect" });
}

function checkCallbackSideEffects(context, node) {
  if (!isMethodCall(node, SIDE_EFFECT_FREE_ITERATION_METHODS)) return false;
  const body = getCallbackBody(node);
  if (!isRecord(body)) return false;
  if (!containsSideEffect(body)) return false;
  context.report({
    node,
    messageId: "callbackSideEffect",
    data: { method: getMethodName(node) ?? "unknown" },
  });
  return true;
}

function createNoHiddenSideEffects(context) {
  return {
    AssignmentExpression(node) {
      reportHiddenSideEffect(context, node);
    },
    CallExpression(node) {
      checkCallbackSideEffects(context, node);
      if (!isMutatingMethodCall(node)) return;
      if (isFreshMutatingMethodCall(node)) return;
      reportHiddenSideEffect(context, node);
    },
    UpdateExpression(node) {
      reportHiddenSideEffect(context, node);
    },
  };
}

function childContainsTernary(child) {
  if (Array.isArray(child)) {
    const childNodes = child.filter(isRecord);
    return childNodes.some(containsTernary);
  }
  if (!isRecord(child)) return false;
  return containsTernary(child);
}

function containsTernary(node) {
  if (node.type === "ConditionalExpression") return true;
  return Object.entries(node).some(([key, child]) => {
    if (SKIP_KEYS.has(key)) return false;
    return childContainsTernary(child);
  });
}

function hasNestedTernary(node) {
  return [node.test, node.consequent, node.alternate].some(childContainsTernary);
}

function createNoComplexTernaries(context) {
  const max = getConfiguredMax(context, DEFAULT_MAX_TERNARY_OPERATORS);
  return {
    ConditionalExpression(node) {
      if (hasNestedTernary(node)) {
        context.report({ node, messageId: "nested" });
        return;
      }

      const count = countExpressionOperators(node);
      if (count <= max) return;
      context.report({
        node,
        messageId: "tooMany",
        data: { count, max },
      });
    },
  };
}

export function enterLoop(loopStack, context, node) {
  if (loopStack.length > 0) {
    context.report({ node, messageId: "nestedLoop" });
  }
  loopStack.push(node);
}

export function checkSearchInLoop(loopStack, context, node) {
  if (loopStack.length === 0) return;
  if (!isMethodCall(node, SEARCH_METHODS)) return;
  context.report({
    node,
    messageId: "searchInLoop",
    data: { method: getMethodName(node) ?? "unknown" },
  });
}

export function checkNestedIteration(context, node) {
  if (!isMethodCall(node, ITERATION_METHODS)) return false;
  const body = getCallbackBody(node);
  if (!body) return false;
  if (!containsCallTo(body, ITERATION_METHODS)) return false;

  const innerMatch = [...ITERATION_METHODS].find((method) =>
    containsCallTo(body, new Set([method])),
  );
  if (!innerMatch) return false;
  context.report({
    node,
    messageId: "nestedIteration",
    data: { outer: getMethodName(node) ?? "unknown", inner: innerMatch },
  });
  return true;
}

function createLoopVisitors(loopStack, context) {
  return Object.fromEntries(
    [...LOOP_TYPES].flatMap((type) => [
      [type, (node) => enterLoop(loopStack, context, node)],
      [
        `${type}:exit`,
        () => {
          loopStack.pop();
        },
      ],
    ]),
  );
}

function createNoQuadraticPatterns(context) {
  const loopStack = [];
  return {
    ...createLoopVisitors(loopStack, context),
    CallExpression(node) {
      if (checkNestedIteration(context, node)) return;
      checkSearchInLoop(loopStack, context, node);
    },
  };
}

export const maxExpressionOperators = defineRule(
  MAX_EXPRESSION_OPERATORS_META,
  createMaxExpressionOperators,
);

export const noQuadraticPatterns = defineRule(
  NO_QUADRATIC_PATTERNS_META,
  createNoQuadraticPatterns,
);

export const hoistIfOperators = defineRule(HOIST_IF_OPERATORS_META, createHoistIfOperators);

export const noHiddenSideEffects = defineRule(
  NO_HIDDEN_SIDE_EFFECTS_META,
  createNoHiddenSideEffects,
);

export const noComplexTernaries = defineRule(NO_COMPLEX_TERNARIES_META, createNoComplexTernaries);

const plugin = {
  rules: {
    "hoist-if-operators": hoistIfOperators,
    "max-expression-operators": maxExpressionOperators,
    "no-complex-ternaries": noComplexTernaries,
    "no-hidden-side-effects": noHiddenSideEffects,
    "no-quadratic-patterns": noQuadraticPatterns,
  },
};

export default plugin;
