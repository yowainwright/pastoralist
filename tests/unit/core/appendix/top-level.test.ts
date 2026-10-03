import { test } from "node:test";
import assert from "node:assert/strict";
import { findTopLevelDependents } from "../../../../src/core/appendix/utils";

type Graph = Record<string, string[]>;
type Random = (limit: number) => number;
type GraphEntry = [string, string[]];

const LCG_MULTIPLIER = 1664525;
const LCG_INCREMENT = 1013904223;

const createRandom = (seed: number): Random => {
  let state = seed >>> 0;
  const random: Random = (limit) => {
    const product = Math.imul(state, LCG_MULTIPLIER);
    state = (product + LCG_INCREMENT) >>> 0;
    const value = state % limit;
    return value;
  };
  return random;
};

const graphFrom = (entries: GraphEntry[]): Graph => {
  const graph: Graph = Object.fromEntries(entries);
  return graph;
};

const nodeNames = (size: number): string[] => {
  const names = Array.from({ length: size }, (_, index) => `p${index}`);
  return names;
};

const randomParents = (random: Random, names: string[]): string[] => {
  const count = random(4);
  const parents = Array.from({ length: count }, () => names[random(names.length)]);
  return parents;
};

const randomGraph = (random: Random, size: number): Graph => {
  const names = nodeNames(size);
  const entries = names.map((name): GraphEntry => [name, randomParents(random, names)]);
  const graph = graphFrom(entries);
  return graph;
};

const randomDirectDeps = (random: Random, size: number): Set<string> => {
  const picked = nodeNames(size).filter(() => random(4) === 0);
  const directDeps = new Set(picked);
  return directDeps;
};

const parentsOf = (names: Set<string>, graph: Graph): string[] => {
  const parents = Array.from(names).flatMap((name) => graph[name] ?? []);
  return parents;
};

const expandUntilStable = (expanded: Set<string>, graph: Graph, directDeps: Set<string>) => {
  const indirect = parentsOf(expanded, graph).filter((parent) => !directDeps.has(parent));
  const grown = new Set(Array.from(expanded).concat(indirect));
  const isStable = grown.size === expanded.size;
  const next = isStable ? expanded : expandUntilStable(grown, graph, directDeps);
  return next;
};

const referenceTopLevel = (name: string, graph: Graph, directDeps: Set<string>): string[] => {
  const expanded = expandUntilStable(new Set([name]), graph, directDeps);
  const reached = parentsOf(expanded, graph).filter((parent) => directDeps.has(parent));
  const others = reached.filter((parent) => parent !== name);
  const sorted = Array.from(new Set(others)).toSorted();
  return sorted;
};

const assertAllNames = (trial: number, graph: Graph, directDeps: Set<string>): void => {
  Object.keys(graph).forEach((name) => {
    const actual = findTopLevelDependents(name, graph, directDeps);
    const expected = referenceTopLevel(name, graph, directDeps);
    assert.deepEqual(actual, expected, `trial ${trial} name ${name}`);
  });
};

const runRandomTrial = (random: Random, trial: number): void => {
  const size = 2 + random(40);
  const graph = randomGraph(random, size);
  const directDeps = randomDirectDeps(random, size);
  assertAllNames(trial, graph, directDeps);
};

const assertResultShape = (random: Random): void => {
  const size = 2 + random(30);
  const graph = randomGraph(random, size);
  const directDeps = randomDirectDeps(random, size);
  const result = findTopLevelDependents("p0", graph, directDeps);
  assert.deepEqual(result, result.toSorted());
  assert.equal(new Set(result).size, result.length);
  assert.ok(result.every((dependency) => directDeps.has(dependency)));
  assert.ok(!result.includes("p0"));
};

const trials = (count: number): number[] => Array.from({ length: count }, (_, index) => index);

test("findTopLevelDependents - matches a reference walk on 2000 random graphs", () => {
  const random = createRandom(20261002);
  trials(2000).forEach((trial) => runRandomTrial(random, trial));
});

test("findTopLevelDependents - results are sorted, unique and only direct dependencies", () => {
  const random = createRandom(7);
  trials(500).forEach(() => assertResultShape(random));
});

test("findTopLevelDependents - does not mutate its inputs", () => {
  const graph = graphFrom([
    ["a", ["b", "c"]],
    ["b", ["app"]],
    ["c", ["app", "b"]],
  ]);
  const before = JSON.stringify(graph);
  const directDeps = new Set(["app"]);
  findTopLevelDependents("a", graph, directDeps);
  assert.equal(JSON.stringify(graph), before);
  assert.deepEqual(Array.from(directDeps), ["app"]);
});

test("findTopLevelDependents - an unrelated direct dependency never changes the answer", () => {
  const graph = graphFrom([
    ["a", ["b"]],
    ["b", ["app"]],
  ]);
  const base = findTopLevelDependents("a", graph, new Set(["app"]));
  const extra = findTopLevelDependents("a", graph, new Set(["app", "other"]));
  assert.deepEqual(extra, base);
});

test("findTopLevelDependents - stops at the first direct dependency on each path", () => {
  const graph = graphFrom([
    ["leaf", ["mid"]],
    ["mid", ["outer"]],
    ["outer", ["top"]],
  ]);
  const result = findTopLevelDependents("leaf", graph, new Set(["mid", "top"]));
  assert.deepEqual(result, ["mid"]);
});

test("findTopLevelDependents - handles a diamond without duplicates", () => {
  const graph = graphFrom([
    ["leaf", ["left", "right"]],
    ["left", ["app"]],
    ["right", ["app"]],
  ]);
  const result = findTopLevelDependents("leaf", graph, new Set(["app"]));
  assert.deepEqual(result, ["app"]);
});

test("findTopLevelDependents - handles a package that depends on itself", () => {
  const graph = graphFrom([["loop", ["loop", "app"]]]);
  const result = findTopLevelDependents("loop", graph, new Set(["app"]));
  assert.deepEqual(result, ["app"]);
});

test("findTopLevelDependents - never reports the package itself", () => {
  const graph = graphFrom([
    ["a", ["b"]],
    ["b", ["a"]],
  ]);
  const result = findTopLevelDependents("a", graph, new Set(["a", "b"]));
  assert.deepEqual(result, ["b"]);
});

test("findTopLevelDependents - supports scoped package names", () => {
  const graph = graphFrom([
    ["@scope/leaf", ["@scope/mid"]],
    ["@scope/mid", ["@scope/app"]],
  ]);
  const result = findTopLevelDependents("@scope/leaf", graph, new Set(["@scope/app"]));
  assert.deepEqual(result, ["@scope/app"]);
});

test("findTopLevelDependents - returns nothing for an unknown package", () => {
  const graph = graphFrom([["a", ["b"]]]);
  assert.deepEqual(findTopLevelDependents("ghost", graph, new Set(["b"])), []);
});

test("findTopLevelDependents - returns nothing for an empty graph or no direct dependencies", () => {
  const graph = graphFrom([["a", ["b"]]]);
  assert.deepEqual(findTopLevelDependents("a", {}, new Set(["b"])), []);
  assert.deepEqual(findTopLevelDependents("a", graph, new Set()), []);
});

test("findTopLevelDependents - survives a 50000 package deep chain", () => {
  const entries = Array.from(
    { length: 50000 },
    (_, index): GraphEntry => [`n${index}`, [`n${index + 1}`]],
  );
  const result = findTopLevelDependents("n0", graphFrom(entries), new Set(["n50000"]));
  assert.deepEqual(result, ["n50000"]);
});

test("findTopLevelDependents - stays fast on a wide graph with many lookups", () => {
  const size = 5000;
  const graph = randomGraph(createRandom(99), size);
  const directDeps = new Set(nodeNames(size).filter((_, index) => index % 50 === 0));
  const started = Date.now();
  nodeNames(size)
    .slice(0, 500)
    .forEach((name) => findTopLevelDependents(name, graph, directDeps));
  const elapsed = Date.now() - started;
  assert.ok(elapsed < 5000, `500 lookups took ${elapsed}ms`);
});
