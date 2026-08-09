# Best-case dependency portfolios

This module ranks complete package-version portfolios under a configurable security policy.

## Why portfolios

Choosing the newest fix for each package independently can produce a worse result. One version can introduce a vulnerability or compatibility failure elsewhere in the graph. The evaluator therefore scores complete states, not isolated upgrades.

Each patchable package contributes its current version, known patched versions, and latest compatible version as candidates.

## Formal model

Package $i$ contributes candidate versions $V_i$, producing the portfolio space:

$$
\mathcal{X} = \prod_{i=1}^{n} V_i
$$

Let $\pi = (o_1, \ldots, o_m, a)$ be the resolved policy, where each $o_j$ is an objective and $a$ is the risk-aggregation mode. Each objective produces a score block, and the blocks are concatenated in policy order:

$$
F_{\pi}(x) = g_{o_1,a}(x) \mathbin{\Vert} \cdots \mathbin{\Vert} g_{o_m,a}(x)
$$

The default blocks represent known-exploited vulnerabilities, critical vulnerabilities, high vulnerabilities, summed EPSS, package exposures, incompatibilities, changed packages, and oldness. With `riskAggregation: "both"`, security blocks contain both unique-advisory and package-exposure values.

The selected portfolio minimizes that vector lexicographically:

$$
x^* = \operatorname*{arg\,min}^{\mathrm{lex}}_{x \in \mathcal{X}} F_{\pi}(x)
$$

Each selected dependency stores shared portfolio provenance in its ledger reason:

$$
r_i = \left(\mathtt{decisionId}(x^*), \mathtt{policyHash}(\pi), \mathtt{search}, \mathtt{impact}\right)
$$

The reason is per dependency, while the decision ID connects all dependencies selected in the portfolio. CVEs remain in the sibling ledger field.

## Configuration

Best-case selection is opt-in under `pastoralist.bestCase`.

- `enabled` defaults to false.
- `riskAggregation` accepts `unique-cves`, `package-exposures`, or `both`.
- `objectives` defines the lexicographic ranking order.
- `search.mode` accepts `auto`, `exact`, or `beam`.
- `search.exactStateLimit` defaults to 256.
- `search.beamWidth` defaults to 16.
- `search.maxEvaluations` defaults to 1000.

The default objective order is known exploited, critical, high, expected exploitation, package exposures, compatibility, change count, and oldness.

The first differing objective decides which portfolio ranks higher. Reordering the list changes policy; the algorithm does not combine objectives into a weighted sum.

## Search behavior

Auto mode uses exhaustive search when the Cartesian product fits both the exact-state and evaluation limits. A completed exhaustive search reports `provenOptimal: true`.

Larger products use deterministic beam search. Beam results and exact searches stopped by the evaluation limit report `provenOptimal: false`.

The result records the selected state, evaluated and total state counts, duration, failed-state count, policy hash, decision ID, and vulnerability impact. Evaluator failures rank as invalid states and do not abort other evaluations.

## Portfolio evaluator

The built-in workflow evaluates all root packages plus each package controlled by the candidate state.

Projects that materialize a lockfile, solve peer constraints, or model version-combination behavior can inject a `bestCaseEvaluator` through `SecurityCheckOptions`. It receives the complete package-version state and returns the complete alert set, plus optional incompatibility and oldness scores.

The callback is an API option because functions cannot be represented in package JSON. The package also exports `optimizeBestCasePortfolio`, `createBestCaseReason`, `resolveBestCasePolicy`, and their supporting types.

## Ledger reasons

The ledger reason accepts a non-empty string or a typed object.

A project reason uses the `project` discriminator and requires `summary`. It may also record `pin`, `patch`, `constraints`, and `references`.

These fields explain a decision. The package-manager override remains authoritative for a pin, and the appendix patch list remains authoritative for patch files.

A best-case reason uses the `best-case` discriminator. It requires `summary`, `decisionId`, `policyHash`, `search`, and `impact`.

Search metadata records evaluated states and whether optimality was proven. Impact records fixed, introduced, and remaining vulnerabilities.

The reason belongs to one appendix dependency item. Items selected in the same portfolio share a decision ID. CVEs remain in the sibling ledger field and are not duplicated inside the reason.

## Performance

Search cost is dominated by the evaluator. Pure ranking and state enumeration run under `bun run test:bench`.

Every result exposes duration and evaluated-state count so resolver or scanner cost can be measured separately.
