import examples from "./examples.json" with { type: "json" };
import more from "./more-examples.json" with { type: "json" };
import cli from "./cli-examples.json" with { type: "json" };
import { createActorContext } from "@xstate/react";
import { fromTransition } from "xstate";
import { formatAppendix, formatReport, selectActiveCallout } from "./utils";
import type { Walkthrough } from "./types";
import type { TokenTransitionsSnapshot } from "codehike/utils/token-transitions";

export const TOKEN_TRANSITIONS = {
  selector: ".line > span, .line:not(:has(span))",
  duration: 700,
};
export const EMPTY_SNAPSHOT: TokenTransitionsSnapshot = [];
export const SCROLL_TRIGGER_TOP = 160;
export const CALLOUT_VISIBILITY = { threshold: 0.25 };
export const calloutLogic = fromTransition(selectActiveCallout, null);
export const CalloutActor = createActorContext(calloutLogic);
const calloutCollisions = { side: "flip", align: "shift", fallbackAxisSide: "end" } as const;
export const CALLOUT_POSITION = {
  side: "right",
  align: "center",
  sideOffset: 12,
  collisionPadding: 16,
  collisionAvoidance: calloutCollisions,
  positionMethod: "absolute",
} as const;

const calloutOffset = -6;
const calloutHidden = { opacity: 0, x: calloutOffset };
const calloutVisible = { opacity: 1, x: 0 };
const calloutTransition = { duration: 0.18 };
const calloutStillTransition = { duration: 0 };
export const CALLOUT_MOTION = {
  initial: calloutHidden,
  animate: calloutVisible,
  exit: calloutHidden,
  transition: calloutTransition,
};
export const CALLOUT_STILL_MOTION = {
  initial: false,
  animate: calloutVisible,
  exit: calloutVisible,
  transition: calloutStillTransition,
} as const;

const trackingResult = JSON.stringify(examples.after, null, 2);
const cleanupResult = JSON.stringify(examples.cleanupAfter, null, 2);

const tracking: Walkthrough = [
  {
    id: "track-override",
    title: "Track an override",
    code: "npx pastoralist",
    lang: "bash",
    filename: "Command",
    note: "Track the existing qs override. Scroll to see the generated record.",
  },
  {
    id: "tracking-result",
    title: "Generated tracking",
    code: trackingResult,
    lang: "json",
    filename: "package.json",
    note: "The appendix records who needs qs and when tracking began.",
    calloutTarget: "qs@6.11.2",
  },
];

const cleanup: Walkthrough = [
  {
    id: "remove-unused-override",
    title: "Remove an unused override",
    code: "npx pastoralist --remove-unused",
    lang: "bash",
    filename: "Command",
    note: "Here, express has been removed and no dependency needs qs. Scroll to see cleanup.",
  },
  {
    id: "cleanup-result",
    title: "Generated cleanup",
    code: cleanupResult,
    lang: "json",
    filename: "package.json",
    note: "Pastoralist removes the unused override and its appendix entry. Active keep constraints prevent removal.",
    calloutTarget: "overrides",
  },
];

const doctorResult = formatReport(more.doctorReport);
const hookResult = JSON.stringify(more.hookAfter, null, 2);
const workspaceResult = formatAppendix(more.workspaceAfter.pastoralist.appendix);

const doctor: Walkthrough = [
  {
    id: "doctor-preview",
    title: "Preview tracking",
    code: "npx pastoralist doctor --outputFormat json",
    lang: "bash",
    filename: "Command",
    note: "Preview workspace tracking without changing project files. Security scanning is disabled in this fixture.",
  },
  {
    id: "doctor-result",
    title: "Read the report",
    code: doctorResult,
    lang: "json",
    filename: "stdout (excerpt)",
    note: "The report shows one override and no unused entries. updated is false because this is a preview.",
    calloutTarget: "unusedOverrides",
  },
];

const hook: Walkthrough = [
  {
    id: "setup-postinstall",
    title: "Add the hook",
    code: "npx pastoralist --setup-hook",
    lang: "bash",
    filename: "Command",
    note: "Add Pastoralist after the existing postinstall command.",
  },
  {
    id: "postinstall-result",
    title: "Review the script",
    code: hookResult,
    lang: "json",
    filename: "package.json",
    note: "The existing command runs first, followed by pastoralist.",
    calloutTarget: "postinstall",
  },
];

const workspaces: Walkthrough = [
  {
    id: "scan-workspaces",
    title: "Read workspace dependencies",
    code: 'npx pastoralist --depPaths "packages/*/package.json"',
    lang: "bash",
    filename: "Command",
    note: "The root pins qs. Two workspace packages depend on it: @shepherd/api and @shepherd/worker.",
  },
  {
    id: "workspace-result",
    title: "See both dependents",
    code: workspaceResult,
    lang: "json",
    filename: "package.json (excerpt)",
    note: "Both workspace packages appear in the root appendix.",
    calloutTarget: "@shepherd/api",
  },
];

const ignoredResult = formatAppendix(cli.ignoreAfter.pastoralist.appendix);
const pathResult = JSON.stringify(cli.pathAfter, null, 2);
const { summaryTable } = cli;

const ignore: Walkthrough = [
  {
    id: "filter-workspaces",
    title: "Exclude a workspace",
    code: 'npx pastoralist --depPaths "packages/*/package.json" --ignore "**/worker/**"',
    lang: "bash",
    filename: "Command",
    note: "Scan the workspace manifests while excluding worker.",
  },
  {
    id: "filtered-workspace-result",
    title: "Review the filtered tracking",
    code: ignoredResult,
    lang: "json",
    filename: "package.json (excerpt)",
    note: "Only @shepherd/api contributes dependency context in this run.",
    calloutTarget: "@shepherd/api",
  },
];

const path: Walkthrough = [
  {
    id: "select-manifest",
    title: "Select another manifest",
    code: "npx pastoralist --path standalone/package.json",
    lang: "bash",
    filename: "Command",
    note: "Target the fixture's standalone project with its own qs override.",
  },
  {
    id: "selected-manifest-result",
    title: "Review the selected project",
    code: pathResult,
    lang: "json",
    filename: "standalone/package.json",
    note: "The selected project's appendix records its direct qs dependency.",
    calloutTarget: "qs@6.11.2",
  },
];

const summary: Walkthrough = [
  {
    id: "preview-summary",
    title: "Update tracking with a summary",
    code: "npx pastoralist --summary",
    lang: "bash",
    filename: "Command",
    note: "Update the appendix and print the CLI's metrics. This fixture disables security scanning.",
  },
  {
    id: "summary-result",
    title: "Read the counts",
    code: summaryTable,
    lang: "ansi",
    filename: "stdout",
    note: "The complete generated table. Success means this run wrote the appendix; security scanning was disabled.",
    calloutTarget: "Success",
  },
];

const dryRunResult = formatAppendix(cli.dryRunPreview.pastoralist.appendix);
const jsonResult = formatReport(cli.jsonReport);

const dryRun: Walkthrough = [
  {
    id: "preview-changes",
    title: "Preview proposed changes",
    code: "npx pastoralist --dry-run",
    lang: "bash",
    filename: "Command",
    note: "Preview appendix changes for the workspace fixture.",
  },
  {
    id: "dry-run-result",
    title: "Review the proposed appendix",
    code: dryRunResult,
    lang: "json",
    filename: "package.json (preview excerpt)",
    note: "The CLI prints the proposed changes. No project files changed.",
    calloutTarget: "qs@6.11.2",
  },
];

const json: Walkthrough = [
  {
    id: "write-json",
    title: "Write tracking and print JSON",
    code: "npx pastoralist --outputFormat json",
    lang: "bash",
    filename: "Command",
    note: "Update tracking and print a machine-readable result. Security scanning is disabled in this fixture.",
  },
  {
    id: "json-report-result",
    title: "Read the JSON result",
    code: jsonResult,
    lang: "json",
    filename: "stdout (excerpt)",
    note: "This run wrote a new appendix, so updated is true.",
    calloutTarget: "updated",
  },
];

export const walkthroughs = {
  tracking,
  cleanup,
  doctor,
  hook,
  workspaces,
  ignore,
  path,
  summary,
  dryRun,
  json,
};
