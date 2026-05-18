import type { Options, PastoralistJSON } from "../types";
import { logger as createLogger } from "../utils";
import type {
  CliGraph,
  SecurityPhaseDeps,
  SecurityPhaseResult,
  SecurityResultSummary,
} from "./types";
import { buildSecurityResult } from "./results";
import { checkRemovalSafety } from "./removal-safety";
import type { runSecurityCheck } from "./security";
import { renderSecurityFindings } from "./action-display";

const createEmptySecurityResult = (): SecurityResultSummary => ({
  hasSecurityIssues: false,
  securityAlertCount: 0,
  securityAlerts: [],
});

const applyRemovalSafety = async (
  config: PastoralistJSON,
  mergedOptions: Options,
  securityChecker: Awaited<ReturnType<typeof runSecurityCheck>>["securityChecker"],
): Promise<Options> => {
  if (!mergedOptions.removeUnused) return mergedOptions;
  const skipKeys = await checkRemovalSafety(config, securityChecker, mergedOptions);
  if (skipKeys.length === 0) return mergedOptions;
  return { ...mergedOptions, skipRemovalKeys: skipKeys };
};

const applySecurityResults = (
  result: Awaited<ReturnType<typeof runSecurityCheck>>,
  mergedOptions: Options,
  deps: Pick<SecurityPhaseDeps, "handleSecurityResults">,
): Options => {
  if (result.skipped) return mergedOptions;
  const securityUpdates = deps.handleSecurityResults(
    result.alerts,
    result.securityOverrides,
    result.securityChecker,
    result.spinner,
    mergedOptions,
    result.updates,
  );
  return { ...mergedOptions, ...securityUpdates };
};

export const runSecurityPhase = async (
  graph: CliGraph,
  config: PastoralistJSON,
  mergedOptions: Options,
  isJsonOutput: boolean,
  isLogging: boolean,
  log: ReturnType<typeof createLogger>,
  deps: SecurityPhaseDeps,
): Promise<SecurityPhaseResult> => {
  if (!mergedOptions.checkSecurity) {
    return {
      mergedOptions,
      securityResult: createEmptySecurityResult(),
      packagesScanned: 0,
    };
  }

  if (!isJsonOutput) graph.startPhase("scanning", "Scanning packages");
  const result = await deps.runSecurityCheck(config, mergedOptions, isLogging, log);
  const securityResult = buildSecurityResult(result.alerts);
  const optionsWithAlerts = { ...mergedOptions, securityAlerts: result.alerts };
  const optionsWithSafety = await applyRemovalSafety(
    config,
    optionsWithAlerts,
    result.securityChecker,
  );
  const nextOptions = applySecurityResults(result, optionsWithSafety, deps);

  if (!result.skipped && !isJsonOutput) {
    renderSecurityFindings(
      graph,
      result.alerts,
      result.securityOverrides,
      nextOptions,
      result.packagesScanned,
    );
  }

  return {
    mergedOptions: nextOptions,
    securityResult,
    packagesScanned: result.packagesScanned,
  };
};
