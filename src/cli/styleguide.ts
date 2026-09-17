import {
  copper,
  createOutput,
  createSpinner,
  createTerminalGraph,
  cyan,
  formatChoiceList,
  formatChoicePrompt,
  formatCompletion,
  formatConfirmPrompt,
  formatInfo,
  formatInputPrompt,
  formatStepHeader,
  formatSuccess,
  formatWarning,
  gold,
  gradientGreenTan,
  gradientPastoralist,
  gray,
  green,
  link,
  playShimmer,
  red,
  renderHint,
  renderTable,
  shimmerFrame,
  yellow,
} from "../dx";
import type { Output, TerminalGraph } from "../dx";
import { promptCheckbox, promptSelect, quickConfirm, quickInput, quickList } from "./prompts";
import type { PromptChoice } from "./prompts/types";
import type {
  OverrideInfo,
  RemovedOverrideInfo,
  SecurityFixInfo,
  VulnerabilityInfo,
} from "../dx/types";
import {
  box,
  calculateWidths,
  divider,
  indent,
  item,
  line,
  pad,
  progress as renderProgress,
  truncate,
  visibleLength,
  width,
} from "../dx/format";

const writeSection = (out: Output, title: string): void => {
  out.writeLine("");
  out.writeLine(cyan(`◆ ${title}`));
};

const writeBlock = (out: Output, text: string): void => {
  out.writeLine(text);
};

const showColors = (out: Output): void => {
  writeSection(out, "Colors and links");
  writeBlock(out, `  ${green("green")} ${red("red")} ${yellow("yellow")} ${gold("gold")}`);
  writeBlock(out, `  ${copper("copper")} ${cyan("cyan")} ${gray("gray")}`);
  writeBlock(out, `  ${gradientPastoralist()}`);
  writeBlock(out, `  ${gradientGreenTan("green to tan")}`);
  writeBlock(out, `  ${link("https://jeffry.in/pastoralist", "documentation link")}`);
};

const showFormatting = (out: Output): void => {
  writeSection(out, "Formatting");
  writeBlock(
    out,
    box([green("Boxed content"), "Aligned with visible-width support"], { title: "Box" }).join(
      "\n",
    ),
  );
  writeBlock(out, divider("─", 40));
  writeBlock(out, renderProgress(75));
  writeBlock(out, indent("Indented text"));
  writeBlock(out, line("Leading newline"));
  writeBlock(out, item(1, "Numbered item"));
  const widthSample = cyan("visible text");
  const columnWidths = calculateWidths([
    { label: "Packages", value: 12 },
    { label: "Security fixes", value: 3 },
  ]);
  writeBlock(out, `  terminal width: ${width()}`);
  writeBlock(out, `  visible width: ${visibleLength(widthSample)}`);
  writeBlock(out, `  padded: ${pad("left", 10)}`);
  writeBlock(out, `  truncated: ${truncate("long visible text", 12)}`);
  writeBlock(out, `  column widths: ${columnWidths.labelWidth}/${columnWidths.valueWidth}`);
};

const showPrompts = (out: Output): void => {
  writeSection(out, "Prompts");
  writeBlock(out, formatConfirmPrompt("Apply the example fix"));
  writeBlock(
    out,
    formatChoiceList("Choose a package manager", [
      { name: "npm", value: "npm" },
      { name: "pnpm", value: "pnpm" },
    ]),
  );
  writeBlock(out, formatChoicePrompt());
  writeBlock(out, formatInputPrompt("Project name", "pastoralist"));
  writeBlock(out, formatStepHeader(1, "Configuration"));
  writeBlock(out, formatInfo("Informational message"));
  writeBlock(out, formatSuccess("Successful message"));
  writeBlock(out, formatWarning("Warning message"));
  writeBlock(out, formatCompletion("Complete", ["Inspect output", "Keep building"]));
};

const showTable = (out: Output): void => {
  writeSection(out, "Table");
  writeBlock(
    out,
    renderTable(
      [
        { label: "Packages scanned", value: 12, color: "cyan" },
        { label: "Security fixes", value: 3, color: "green" },
        { label: "Unused overrides", value: 1, color: "yellow" },
      ],
      { title: "DX metrics" },
    ),
  );
};

const showSpinner = (out: Output): void => {
  writeSection(out, "Spinner");
  createSpinner("Loading dependency graph", out)
    .start()
    .update("Dependency graph loaded")
    .succeed();
  createSpinner("Example failure", out).fail();
  createSpinner("Example information", out).info();
  createSpinner("Example warning", out).warn();
};

const showShimmerFrame = (out: Output): void => {
  writeSection(out, "Shimmer");
  writeBlock(out, `  ${shimmerFrame("Shimmer frame", 0.5)}`);
};

const showShimmer = async (out: Output): Promise<void> => {
  showShimmerFrame(out);
  await playShimmer("Animated shimmer", 30, out, "  ");
};

const showHints = (out: Output): void => {
  writeSection(out, "Hint");
  writeBlock(out, renderHint("Hints can be rendered without changing the hint cache."));
};

const demoVulnerability: VulnerabilityInfo = {
  severity: "high",
  packageName: "demo-package",
  currentVersion: "1.0.0",
  title: "Example vulnerability",
  cves: ["CVE-2026-0001"],
  fixAvailable: true,
  patchedVersion: "1.0.1",
  url: "https://osv.dev/",
};

const demoOverride: OverrideInfo = {
  packageName: "demo-package",
  version: "1.0.1",
  reason: "security",
  dependents: { "styleguide-app": "demo-package@^1.0.0" },
  patches: ["1.0.0 -> 1.0.1"],
  isSecurityFix: true,
  cves: ["CVE-2026-0001"],
};

const demoSecurityFix: SecurityFixInfo = {
  packageName: "demo-package",
  fromVersion: "1.0.0",
  toVersion: "1.0.1",
  cves: ["CVE-2026-0001"],
  severity: "high",
  reason: "Patched security release",
};

const demoRemovedOverride: RemovedOverrideInfo = {
  packageName: "stale-package",
  version: "1.0.0",
  reason: "No longer required",
};

const showScanPhase = (graph: TerminalGraph): void => {
  graph
    .startPhase("scanning", "Scanning dependencies")
    .progress(1, 3, "package.json")
    .progress(3, 3, "dependency tree")
    .item("Dependency tree ready")
    .vulnerability(demoVulnerability, true)
    .endPhase("Scan complete");
};

const showResolutionPhase = (graph: TerminalGraph): void => {
  graph
    .startPhase("resolving", "Resolving overrides")
    .override(demoOverride)
    .securityFix(demoSecurityFix)
    .removedOverride(demoRemovedOverride, true)
    .endPhase("Resolution complete");
};

const showGraph = async (out: Output): Promise<void> => {
  const graph = createTerminalGraph({ out });
  graph.banner();
  showScanPhase(graph);
  showResolutionPhase(graph);
  graph
    .summary({ "demo-package": "1.0.1" }, ["Applied security fix"])
    .executiveSummary({ vulnerabilitiesFixed: 1, packagesProtected: 1 })
    .compactSummary({
      severityCritical: 0,
      severityHigh: 1,
      severityMedium: 0,
      severityLow: 0,
      overridesTracked: 1,
      overridesRemoved: 1,
      packagesScanned: 12,
    })
    .notice("Terminal graph components are composable.");
  graph.stop().complete("DX styleguide complete");
  await graph.waitForCompletion();
};

const showAllComponents = async (out: Output): Promise<void> => {
  showColors(out);
  showFormatting(out);
  showPrompts(out);
  showTable(out);
  showSpinner(out);
  await showShimmer(out);
  showHints(out);
  await showGraph(out);
};

const styleguideChoices: PromptChoice[] = [
  { name: "Colors and links", value: "colors", description: "color and hyperlink helpers" },
  { name: "Formatting", value: "formatting", description: "boxes, dividers, and progress" },
  { name: "Interactive prompts", value: "prompts", description: "radio, checkbox, and input" },
  { name: "Tables", value: "table", description: "aligned metrics" },
  { name: "Spinners", value: "spinner", description: "success and status states" },
  { name: "Shimmer", value: "shimmer", description: "animated progress text" },
  { name: "Hints", value: "hint", description: "cached guidance rendering" },
  { name: "Terminal graph", value: "graph", description: "scan and resolution lifecycle" },
  { name: "Run all demos", value: "all", description: "render every non-interactive example" },
  { name: "Exit styleguide", value: "exit", description: "return to the shell" },
];

const promptDemoChoices: PromptChoice[] = [
  { name: "npm", value: "npm", description: "package manager available" },
  { name: "pnpm", value: "pnpm", description: "package manager available", checked: true },
  { name: "Yarn", value: "yarn", description: "package manager available" },
  {
    name: "Bun",
    value: "bun",
    description: "package manager available",
    disabled: "not installed",
  },
];

const promptListChoices = promptDemoChoices.filter((choice) => !choice.disabled);

export type StyleguidePrompts = {
  select: (message: string, choices: PromptChoice[]) => Promise<string>;
  checkbox: (message: string, choices: PromptChoice[]) => Promise<string[]>;
  confirm: (message: string, defaultValue?: boolean) => Promise<boolean>;
  input: (message: string, defaultValue?: string) => Promise<string>;
  list: (message: string, choices: PromptChoice[]) => Promise<string>;
};

const defaultStyleguidePrompts: StyleguidePrompts = {
  select: promptSelect,
  checkbox: promptCheckbox,
  confirm: quickConfirm,
  input: quickInput,
  list: quickList,
};

type CapturedOutput = Output & { readonly text: string };

const createCapturedOutput = (): CapturedOutput => {
  let text = "";
  return {
    get text() {
      return text;
    },
    write: (value: string) => {
      text += value;
    },
    writeLine: (value: string) => {
      text += `${value}\n`;
    },
    clearLine: () => {},
    hideCursor: () => {},
    showCursor: () => {},
  };
};

const capture = (render: (out: Output) => void): string => {
  const out = createCapturedOutput();
  render(out);
  return out.text.trim();
};

const formatGraphPreview = (): string =>
  [
    `${cyan("◆ Terminal graph")}`,
    "  banner → scanning → progress → vulnerability",
    "  resolving → override → security fix → removed override",
    "  summary → notice → complete",
  ].join("\n");

export const formatStyleguide = (): string => {
  const staticSections = [
    showColors,
    showFormatting,
    showPrompts,
    showTable,
    showSpinner,
    showShimmerFrame,
    showHints,
  ].map(capture);

  return [
    `${gradientPastoralist()} ${cyan("DX styleguide")}`,
    gray("Static preview of Pastoralist's public terminal components."),
  ]
    .concat(staticSections, formatGraphPreview())
    .join("\n\n");
};

const showPromptDemo = async (out: Output, prompts: StyleguidePrompts): Promise<void> => {
  writeSection(out, "Interactive prompts");
  const confirmed = await prompts.confirm("Apply the example fix", true);
  writeBlock(out, gray(`Confirmed: ${confirmed ? "yes" : "no"}`));
  const input = await prompts.input("Project name", "pastoralist");
  writeBlock(out, gray(`Input: ${input || "empty"}`));
  const listed = await prompts.list("Choose a package manager", promptListChoices);
  writeBlock(out, gray(`List: ${listed || "none"}`));
  const selected = await prompts.checkbox("Choose package managers", promptDemoChoices);
  writeBlock(out, gray(`Selected: ${selected.join(", ") || "none"}`));
  showPrompts(out);
};

const runStyleguideDemo = async (
  selection: string,
  out: Output,
  prompts: StyleguidePrompts,
): Promise<void> => {
  if (selection === "prompts") return await showPromptDemo(out, prompts);
  if (selection === "all") return await showAllComponents(out);
  if (selection === "colors") return showColors(out);
  if (selection === "formatting") return showFormatting(out);
  if (selection === "table") return showTable(out);
  if (selection === "spinner") return showSpinner(out);
  if (selection === "shimmer") return await showShimmer(out);
  if (selection === "hint") return showHints(out);
  if (selection === "graph") return await showGraph(out);
};

export const showStyleguide = async (
  out: Output = createOutput(),
  prompts: StyleguidePrompts = defaultStyleguidePrompts,
): Promise<void> => {
  writeBlock(out, `${gradientPastoralist()} ${cyan("DX styleguide")}`);
  writeBlock(out, gray("A live tour of Pastoralist's terminal UI components."));
  try {
    while (true) {
      const selection = await prompts.select("Choose a component demo", styleguideChoices);
      if (selection === "exit") return;
      await runStyleguideDemo(selection, out, prompts);
      const returnToMenu = await prompts.confirm("Return to the styleguide menu?", true);
      if (!returnToMenu) return;
    }
  } catch (error: unknown) {
    const wasCancelled = error instanceof Error && error.name === "PromptCancelled";
    if (!wasCancelled) throw error;
    writeBlock(out, gray("Styleguide closed."));
  }
};
