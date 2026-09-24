import * as fs from "fs";
import { dirname, join, resolve } from "path";
import { IS_DEBUGGING } from "../../constants";
import { logger } from "../../observability";
import type { OverridesType, OverrideValue, PastoralistJSON, SecurityPackage } from "../../types";
import type { DependencyGraph, DependencyGraphState } from "../types";
import { addDependencyParent, getPopulatedPackages } from "../utils";
import {
  PNPM_LOCK_FILENAME,
  PNPM_WORKSPACE_FILE,
  PNPM_GRAPH_FIELDS,
  QUOTE_CHARACTERS,
  UNSAFE_SCALAR_CHARACTERS,
} from "./constants";
import type { YamlPair, YamlSection, YamlEntry, ScanState, FlowSplitState } from "./types";

const log = logger({ file: "mgrs/pnpm/utils.ts", isLogging: IS_DEBUGGING });

const getPnpmSectionLines = (lines: string[], headerIndex: number): string[] => {
  const remaining = lines.slice(headerIndex + 1);
  const nextFieldIndex = remaining.findIndex((line) => /^[^\s#][^:]*:/.test(line));
  if (nextFieldIndex === -1) return remaining;
  const section = remaining.slice(0, nextFieldIndex);
  return section;
};

const getPnpmPackageSections = (content: string): string => {
  const lines = content.split(/\r?\n/);
  const headers = new Map<string, number>();
  lines.forEach((line, index) => {
    const isPackageSection = line === "packages:" || line === "snapshots:";
    if (!isPackageSection) return;
    if (!headers.has(line)) headers.set(line, index);
  });
  const index = headers.get("packages:") ?? headers.get("snapshots:");
  if (index === undefined) return "";
  const section = getPnpmSectionLines(lines, index).join("\n");
  return section;
};

const toPnpmPackage = ([, name, reference]: RegExpMatchArray): SecurityPackage => {
  const peerSuffixIndex = reference.indexOf("(");
  const hasPeerSuffix = peerSuffixIndex !== -1;
  const version = hasPeerSuffix ? reference.slice(0, peerSuffixIndex) : reference;
  const pkg = { name, version };
  return pkg;
};

const parsePnpmPackageMatches = (content: string): SecurityPackage[] => {
  const packageSections = getPnpmPackageSections(content);
  const legacy = packageSections.matchAll(/^  \/((?:@[^/@\n]+\/)?[^/@\n\s]+)(?:@|\/)([^\s:]+):/gm);
  const current = packageSections.matchAll(/^  '?((?:@[^@/\n'"]+\/)?[\w][\w.-]*)@([^\s:'"]+)/gm);
  const packages = Array.from(legacy, toPnpmPackage).concat(Array.from(current, toPnpmPackage));
  return packages;
};

const splitPnpmLockDocuments = (content: string): string[] => {
  const documents = content.split(/^---\s*$/m).map((document) => document.trim());
  const populated = documents.filter(Boolean);
  return populated;
};

const isPnpmPackageManagerDocument = (content: string): boolean => {
  const hasPackageManagerDependencies = /^\s{4}packageManagerDependencies:/m.test(content);
  if (!hasPackageManagerDependencies) return false;
  const hasSnapshots = /^snapshots:\s*$/m.test(content);
  const hasProjectDependencies = /^\s{4}(dependencies|devDependencies|optionalDependencies):/m.test(
    content,
  );
  const isManagerOnly = !hasSnapshots && !hasProjectDependencies;
  return isManagerOnly;
};

const parsePnpmLockDocuments = (content: string): SecurityPackage[] => {
  const documents = splitPnpmLockDocuments(content);
  const hasDocuments = documents.length > 0;
  const lockDocuments = hasDocuments ? documents : [content];
  const packages = lockDocuments
    .filter((document) => !isPnpmPackageManagerDocument(document))
    .flatMap(parsePnpmPackageMatches);
  return packages;
};

export const parsePnpmLockedPackages = (root: string): SecurityPackage[] | undefined => {
  const lockPath = resolve(root, PNPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    const packages = getPopulatedPackages(parsePnpmLockDocuments(content));
    return packages;
  } catch {
    log.debug("Could not read package inventory", "parsePnpmLockedPackages", lockPath);
    return undefined;
  }
};

export const parsePnpmLockTree = (root: string): Record<string, string> | undefined => {
  const packages = parsePnpmLockedPackages(root);
  if (!packages) return undefined;
  const entries = packages.map(({ name, version }) => [name, version]);
  const tree = Object.fromEntries(entries);
  return tree;
};

const hasPnpmLockStructure = (content: string): boolean =>
  content.split("\n").some((line) => PNPM_GRAPH_FIELDS.has(line.trim()));

const matchPnpmGraphPackage = (line: string): RegExpMatchArray | null => {
  const v5v6Match = line.match(/^  \/((?:@[^/@\n]+\/)?[^/@\n\s]+)(?:@|\/)([^\s:]+):/);
  const v9Match = line.match(/^  '?((?:@[^@/\n'"]+\/)?[\w][\w.-]*)@([^\s:'"]+)/);
  const match = v5v6Match ?? v9Match;
  return match;
};

const addPnpmDependencyLine = (
  graph: DependencyGraph,
  state: DependencyGraphState,
  line: string,
): void => {
  const { currentPackage } = state;
  const isDependency = state.inDependencies && currentPackage;
  if (!isDependency) return;
  const dependencyMatch = line.match(/^      '?([^':\s]+)'?:/);
  if (dependencyMatch) addDependencyParent(graph, dependencyMatch[1], currentPackage);
  if (!line.startsWith("      ")) state.inDependencies = false;
};

const addPnpmGraphLine = (
  graph: DependencyGraph,
  state: DependencyGraphState,
  line: string,
): void => {
  const packageMatch = matchPnpmGraphPackage(line);
  if (packageMatch) {
    state.currentPackage = packageMatch[1];
    state.inDependencies = false;
    return;
  }
  const { currentPackage } = state;
  const startsDependencies = currentPackage && line.match(/^    dependencies:/);
  if (startsDependencies) {
    state.inDependencies = true;
    return;
  }
  addPnpmDependencyLine(graph, state, line);
};

export const parsePnpmLockGraph = (root: string): Record<string, string[]> | undefined => {
  const lockPath = resolve(root, PNPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    if (!hasPnpmLockStructure(content)) return undefined;
    const inverted: Record<string, string[]> = {};
    const state: DependencyGraphState = { inDependencies: false };
    content.split("\n").forEach((line) => {
      addPnpmGraphLine(inverted, state, line);
    });
    return inverted;
  } catch {
    log.debug("Could not read dependency graph", "parsePnpmLockGraph", lockPath);
    return undefined;
  }
};

const updatePnpmWorkspaceContent = (
  content: string,
  overrides: OverridesType | undefined,
): string => {
  if (!overrides) return content;
  const updated = updatePnpmWorkspaceOverrides(content, overrides);
  return updated;
};

export const stagePnpmWorkspace = (
  projectRoot: string,
  removalRoot: string,
  config: PastoralistJSON,
): void => {
  const sourcePath = join(projectRoot, "pnpm-workspace.yaml");
  if (!fs.existsSync(sourcePath)) return;
  const content = fs.readFileSync(sourcePath, "utf8");
  const removalContent = updatePnpmWorkspaceContent(content, config.pnpm?.overrides);
  fs.writeFileSync(join(removalRoot, "pnpm-workspace.yaml"), removalContent);
};

const isPnpmEleven = (config: PastoralistJSON): boolean => {
  const match = config.packageManager?.match(/^pnpm@(\d+)/);
  if (!match) return false;
  const major = Number(match[1]);
  const usesWorkspaceOverrides = major >= 11;
  return usesWorkspaceOverrides;
};

const hasWorkspaceOverrides = (path: string): boolean => {
  if (!fs.existsSync(path)) return false;
  const content = fs.readFileSync(path, "utf8");
  const hasOverrides = Object.keys(parsePnpmWorkspaceOverrides(content)).length > 0;
  return hasOverrides;
};

export const resolvePnpmSource = (
  config: PastoralistJSON,
  manifestPath: string,
): string | undefined => {
  const workspacePath = resolve(dirname(resolve(manifestPath)), PNPM_WORKSPACE_FILE);
  const usesWorkspaceSource = isPnpmEleven(config) || hasWorkspaceOverrides(workspacePath);
  const source = usesWorkspaceSource ? workspacePath : undefined;
  return source;
};

const getIndent = (line: string): string => line.match(/^\s*/)?.[0] || "";

const updateQuote = (quote: string | undefined, character: string): string | undefined => {
  if (character === quote) return undefined;
  if (quote) return quote;
  if (QUOTE_CHARACTERS.has(character)) return character;
  return undefined;
};

const scanCharacter = (state: ScanState, character: string): ScanState => {
  const { quote } = state;
  if (state.escaped) {
    const next = { quote, escaped: false };
    return next;
  }
  const startsEscape = quote === '"' && character === "\\";
  const nextQuote = startsEscape ? quote : updateQuote(quote, character);
  const next = { quote: nextQuote, escaped: startsEscape };
  return next;
};

const findSeparator = (line: string): number => {
  let state: ScanState = { escaped: false };
  const separator = line.split("").findIndex((character, index) => {
    const isUnquoted = !state.quote;
    const isUnescaped = !state.escaped;
    const canMatchSeparator = isUnquoted && isUnescaped;
    const isSeparator = canMatchSeparator && character === ":";
    const nextCharacter = line[index + 1] || "";
    const hasBoundary = !nextCharacter || /\s/.test(nextCharacter);
    const isYamlSeparator = isSeparator && hasBoundary;
    state = scanCharacter(state, character);
    return isYamlSeparator;
  });
  return separator;
};

const parseQuotedScalar = (value: string): string => {
  if (value.startsWith('"')) {
    const parsed = JSON.parse(value) as string;
    return parsed;
  }
  if (value.startsWith("'")) {
    const unquoted = value.slice(1, -1).replaceAll("''", "'");
    return unquoted;
  }
  return value;
};

const findComment = (value: string): number => {
  let state: ScanState = { escaped: false };
  const comment = value.split("").findIndex((character, index) => {
    const isUnquoted = !state.quote;
    const isUnescaped = !state.escaped;
    const canMatchComment = isUnquoted && isUnescaped;
    const isComment = canMatchComment && character === "#";
    const hasBoundary = /\s/.test(value[index - 1] || " ");
    const startsComment = isComment && hasBoundary;
    state = scanCharacter(state, character);
    return startsComment;
  });
  return comment;
};

const splitValue = (source: string): Pick<YamlPair, "valueSource" | "suffix"> => {
  const trimmed = source.trimStart();
  const commentIndex = findComment(trimmed);
  if (commentIndex < 0) {
    const valueSource = trimmed.trimEnd();
    const value = { valueSource, suffix: "" };
    return value;
  }

  const valueSource = trimmed.slice(0, commentIndex).trimEnd();
  const suffix = ` ${trimmed.slice(commentIndex).trimEnd()}`;
  const value = { valueSource, suffix };
  return value;
};

const parsePair = (line: string): YamlPair | undefined => {
  const indent = getIndent(line);
  const content = line.slice(indent.length);
  const isIgnoredContent = !content || content.startsWith("#") || content.startsWith("-");
  if (isIgnoredContent) return undefined;

  const separator = findSeparator(content);
  if (separator < 0) return undefined;
  const keySource = content.slice(0, separator).trim();
  const key = parseQuotedScalar(keySource);
  const value = splitValue(content.slice(separator + 1));
  const pair = Object.assign({}, { key, keySource, indent }, value);
  return pair;
};

const isTopLevelBoundary = (line: string): boolean => {
  const isIgnoredLine = !line || /^(?:\s|#)/.test(line);
  if (isIgnoredLine) return false;
  const hasPair = Boolean(parsePair(line));
  const isDocumentBoundary = line === "---" || line === "...";
  const isBoundary = hasPair || isDocumentBoundary;
  return isBoundary;
};

const findOverridesSection = (lines: string[]): YamlSection | undefined => {
  const start = lines.findIndex((line) => {
    const pair = parsePair(line);
    const isOverridesSection = pair?.indent === "" && pair.key === "overrides";
    return isOverridesSection;
  });
  if (start < 0) return undefined;

  const relativeEnd = lines.slice(start + 1).findIndex(isTopLevelBoundary);
  const hasBoundary = relativeEnd >= 0;
  const absoluteEnd = start + relativeEnd + 1;
  const end = hasBoundary ? absoluteEnd : lines.length;
  const pair = parsePair(lines[start])!;
  const section = { start, end, pair };
  return section;
};

const findEntryIndent = (lines: string[], section: YamlSection): number | undefined => {
  const pairs = lines
    .slice(section.start + 1, section.end)
    .map(parsePair)
    .filter((pair): pair is YamlPair => Boolean(pair));
  const indents = pairs.map((pair) => pair.indent.length).filter((indent) => indent > 0);
  if (indents.length === 0) return undefined;
  const indent = Math.min(...indents);
  return indent;
};

const findEntries = (lines: string[], section: YamlSection): YamlEntry[] => {
  const entryIndent = findEntryIndent(lines, section);
  const empty: YamlEntry[] = [];
  if (entryIndent === undefined) return empty;

  const createEntry = (line: string, offset: number): Array<YamlPair & { line: number }> => {
    const pair = parsePair(line);
    const isEntry = Boolean(pair && pair.indent.length === entryIndent);
    if (!isEntry) return empty;
    const entryLine = section.start + offset + 1;
    const matches = [Object.assign({}, pair, { line: entryLine })];
    return matches;
  };

  const entries = lines.slice(section.start + 1, section.end).flatMap(createEntry);
  const complete = entries.map((entry, index) => {
    const end = entries[index + 1]?.line ?? section.end;
    const bounded = Object.assign({}, entry, { end });
    return bounded;
  });
  return complete;
};

const isFlowMapping = (source: string): boolean => {
  const trimmed = source.trim();
  const isMapping = trimmed.startsWith("{") && trimmed.endsWith("}");
  return isMapping;
};

const updateFlowDepth = (state: ScanState & { depth: number }, character: string): number => {
  const isQuotedOrEscaped = Boolean(state.quote || state.escaped);
  const { depth } = state;
  if (isQuotedOrEscaped) return depth;
  if (character === "{") {
    const nested = depth + 1;
    return nested;
  }
  if (character === "}") {
    const parent = depth - 1;
    return parent;
  }
  return depth;
};

const scanFlowEntry = (
  source: string,
  current: FlowSplitState,
  character: string,
  index: number,
): FlowSplitState => {
  const isComma = character === ",";
  const isUnquoted = !current.scan.quote;
  const isTopLevel = current.scan.depth === 0;
  const isSeparator = isComma && isUnquoted && isTopLevel;
  const entry = source.slice(current.start, index).trim();
  const entries = isSeparator ? current.entries.concat(entry) : current.entries;
  const start = isSeparator ? index + 1 : current.start;
  const depth = updateFlowDepth(current.scan, character);
  const scan = Object.assign({}, scanCharacter(current.scan, character), { depth });
  const next = { entries, scan, start };
  return next;
};

const splitFlowEntries = (source: string): string[] => {
  const pending: string[] = [];
  const scan = { escaped: false, depth: 0 };
  const initial: FlowSplitState = { entries: pending, scan, start: 0 };
  const result = source
    .split("")
    .reduce(
      (current, character, index) => scanFlowEntry(source, current, character, index),
      initial,
    );
  const finalEntry = source.slice(result.start).trim();
  const entries = result.entries.concat(finalEntry).filter(Boolean);
  return entries;
};

const hasFlowKeyBoundary = (source: string, index: number): boolean => {
  const nextCharacter = source[index + 1];
  if (!nextCharacter) return true;
  if (/[\s[{]/.test(nextCharacter)) return true;
  const keySource = source.slice(0, index).trim();
  const quote = keySource.at(0);
  if (!quote) return false;
  if (!QUOTE_CHARACTERS.has(quote)) return false;
  const hasClosingQuote = keySource.endsWith(quote);
  return hasClosingQuote;
};

const findFlowSeparator = (source: string): number => {
  let state: ScanState = { escaped: false };
  const separator = source.split("").findIndex((character, index) => {
    const canSeparate = !state.quote && !state.escaped;
    const isCandidate = character === ":" && canSeparate;
    state = scanCharacter(state, character);
    if (!isCandidate) return false;
    const isSeparator = hasFlowKeyBoundary(source, index);
    return isSeparator;
  });
  return separator;
};

const parseFlowPair = (source: string): [string, OverrideValue] => {
  const separator = findFlowSeparator(source);
  if (separator < 0) throw new Error("pnpm overrides must be a YAML mapping");
  const keySource = source.slice(0, separator).trim();
  const valueSource = source.slice(separator + 1).trim();
  const hasPairValue = keySource && valueSource;
  if (!hasPairValue) throw new Error("pnpm overrides must be a YAML mapping");
  const pair: [string, OverrideValue] = [
    parseQuotedScalar(keySource),
    parseOverrideValue(valueSource),
  ];
  return pair;
};

const parseFlowMapping = (source: string): OverridesType => {
  const trimmed = source.trim();
  if (!isFlowMapping(trimmed)) throw new Error("pnpm overrides must be a YAML mapping");
  const content = trimmed.slice(1, -1).trim();
  const empty: OverridesType = {};
  if (!content) return empty;
  const mapping = Object.fromEntries(splitFlowEntries(content).map(parseFlowPair));
  return mapping;
};

const parseNestedFlowMapping = (source: string): Record<string, string> => {
  const mapping = parseFlowMapping(source);
  const hasOnlyStringValues = Object.values(mapping).every((value) => typeof value === "string");
  if (!hasOnlyStringValues) throw new Error("nested pnpm overrides must contain string values");
  const nested = mapping as Record<string, string>;
  return nested;
};

const parseOverrideValue = (source: string): OverrideValue => {
  const value = isFlowMapping(source) ? parseNestedFlowMapping(source) : parseQuotedScalar(source);
  return value;
};

const findEntryContentEnd = (lines: string[], entry: YamlEntry): number => {
  if (entry.valueSource) {
    const end = entry.line + 1;
    return end;
  }
  const relativeEnd = lines.slice(entry.line + 1, entry.end).findIndex((line) => {
    const isContent = line.trim().length > 0;
    const isComment = line.trimStart().startsWith("#");
    const isNested = getIndent(line).length > entry.indent.length;
    const hasEntryContent = isComment || isNested;
    const isBoundary = isContent && !hasEntryContent;
    return isBoundary;
  });
  if (relativeEnd < 0) {
    const { end } = entry;
    return end;
  }
  const absoluteEnd = entry.line + relativeEnd + 1;
  return absoluteEnd;
};

const findNestedEntries = (lines: string[], entry: YamlEntry): YamlPair[] => {
  const contentEnd = findEntryContentEnd(lines, entry);
  const pairs = lines
    .slice(entry.line + 1, contentEnd)
    .map(parsePair)
    .filter((pair): pair is YamlPair => Boolean(pair));
  const nestedIndent = Math.min(...pairs.map((pair) => pair.indent.length));
  const nested = pairs.filter((pair) => pair.indent.length === nestedIndent);
  return nested;
};

const parseNestedBlockMapping = (lines: string[], entry: YamlEntry): Record<string, string> => {
  const pairs = findNestedEntries(lines, entry).map((pair): [string, string] => {
    const value = parseOverrideValue(pair.valueSource);
    if (typeof value !== "string") {
      throw new Error("nested pnpm overrides must contain string values");
    }
    const parsed: [string, string] = [pair.key, value];
    return parsed;
  });
  const mapping = Object.fromEntries(pairs);
  return mapping;
};

const parseEntryValue = (lines: string[], entry: YamlEntry): OverrideValue | undefined => {
  if (entry.valueSource) {
    const value = parseOverrideValue(entry.valueSource);
    return value;
  }
  const mapping = parseNestedBlockMapping(lines, entry);
  if (Object.keys(mapping).length === 0) return undefined;
  return mapping;
};

export const parsePnpmWorkspaceOverrides = (content: string): OverridesType => {
  const lines = content.split(/\r?\n/);
  const section = findOverridesSection(lines);
  const empty: OverridesType = {};
  if (!section) return empty;
  if (section.pair.valueSource) {
    const mapping = parseFlowMapping(section.pair.valueSource);
    return mapping;
  }

  const entries = findEntries(lines, section).flatMap((entry): Array<[string, OverrideValue]> => {
    const value = parseEntryValue(lines, entry);
    const matches: Array<[string, OverrideValue]> = [];
    if (value === undefined) return matches;
    const pair: Array<[string, OverrideValue]> = [[entry.key, value]];
    return pair;
  });
  const overrides = Object.fromEntries(entries);
  return overrides;
};

const hasUnsafeScalarCharacter = (value: string): boolean => {
  const hasUnsafeCharacter = Array.from(value).some((character) =>
    UNSAFE_SCALAR_CHARACTERS.has(character),
  );
  return hasUnsafeCharacter;
};

const formatUpdatedScalar = (value: OverrideValue, previous: string): string => {
  if (typeof value !== "string") {
    const serialized = JSON.stringify(value);
    return serialized;
  }
  if (previous.startsWith("'")) {
    const quoted = `'${value.replaceAll("'", "''")}'`;
    return quoted;
  }
  const serialized = JSON.stringify(value);
  if (previous.startsWith('"')) return serialized;
  const hasValue = value.length > 0;
  const hasWhitespace = /\s/.test(value);
  const requiresQuotes = hasWhitespace || hasUnsafeScalarCharacter(value);
  const isSafePlainValue = hasValue && !requiresQuotes;
  const formatted = isSafePlainValue ? value : serialized;
  return formatted;
};

const hasSameValue = (lines: string[], entry: YamlEntry, value: OverrideValue): boolean => {
  try {
    const isSame = JSON.stringify(parseEntryValue(lines, entry)) === JSON.stringify(value);
    return isSame;
  } catch {
    return false;
  }
};

const updateEntry = (entry: YamlEntry, value: OverrideValue): string => {
  const scalar = formatUpdatedScalar(value, entry.valueSource);
  const line = `${entry.indent}${entry.keySource}: ${scalar}${entry.suffix}`;
  return line;
};

const getPreservedEntryLines = (lines: string[], entry: YamlEntry): string[] => {
  const contentEnd = findEntryContentEnd(lines, entry);
  const nestedLines = lines.slice(entry.line + 1, contentEnd);
  const preserved = nestedLines.filter((line) => {
    const trimmed = line.trimStart();
    const shouldPreserve = !trimmed || trimmed.startsWith("#");
    return shouldPreserve;
  });
  const trailing = lines.slice(contentEnd, entry.end);
  const retained = preserved.concat(trailing);
  return retained;
};

const updateExistingEntry = (
  lines: string[],
  entry: YamlEntry,
  overrides: OverridesType,
): string[] => {
  const preservedLines = getPreservedEntryLines(lines, entry);
  const value = overrides[entry.key];
  if (value === undefined) return preservedLines;
  if (hasSameValue(lines, entry, value)) {
    const original = lines.slice(entry.line, entry.end);
    return original;
  }
  const updated = [updateEntry(entry, value)].concat(preservedLines);
  return updated;
};

const updateExistingEntries = (
  lines: string[],
  section: YamlSection,
  overrides: OverridesType,
): string[] => {
  const entries = findEntries(lines, section);
  if (entries.length === 0) return lines;
  const beforeEntries = lines.slice(0, entries[0].line);
  const updatedEntries = entries.flatMap((entry) => updateExistingEntry(lines, entry, overrides));
  const afterEntries = lines.slice(section.end);
  const updated = beforeEntries.concat(updatedEntries, afterEntries);
  return updated;
};

const appendNewEntries = (lines: string[], overrides: OverridesType): string[] => {
  const section = findOverridesSection(lines)!;
  const entries = findEntries(lines, section);
  const existingKeys = new Set(entries.map((entry) => entry.key));
  const newKeys = Object.keys(overrides).filter((key) => !existingKeys.has(key));
  if (newKeys.length === 0) return lines;

  const indent = entries[0]?.indent || "  ";
  const newLines = newKeys.map((key) => {
    const scalar = JSON.stringify(overrides[key]);
    const line = `${indent}${JSON.stringify(key)}: ${scalar}`;
    return line;
  });
  const lastEntry = entries.at(-1);
  const insertionIndex = lastEntry ? findEntryContentEnd(lines, lastEntry) - 1 : section.start;
  const before = lines.slice(0, insertionIndex + 1);
  const after = lines.slice(insertionIndex + 1);
  const appended = before.concat(newLines, after);
  return appended;
};

const replaceLine = (lines: string[], index: number, replacement: string): string[] => {
  const updated = lines.map((line, lineIndex) => {
    if (lineIndex === index) return replacement;
    return line;
  });
  return updated;
};

const replaceFlowSection = (lines: string[], section: YamlSection): string[] => {
  if (!section.pair.valueSource) return lines;
  const updated = replaceLine(lines, section.start, `overrides:${section.pair.suffix}`);
  return updated;
};

const formatEmptySection = (lines: string[], overrides: OverridesType): string[] => {
  if (Object.keys(overrides).length > 0) return lines;
  const section = findOverridesSection(lines)!;
  const updated = replaceLine(lines, section.start, `overrides: {}${section.pair.suffix}`);
  return updated;
};

const ensureFinalNewline = (content: string, newline: string): string => {
  const hasFinalNewline = content.length === 0 || content.endsWith(newline);
  if (hasFinalNewline) return content;
  const terminated = `${content}${newline}`;
  return terminated;
};

const appendSection = (content: string, overrides: OverridesType, newline: string): string => {
  if (Object.keys(overrides).length === 0) return content;
  const prefix = ensureFinalNewline(content, newline);
  const entries = Object.entries(overrides).map(
    ([key, value]) => `  ${JSON.stringify(key)}: ${JSON.stringify(value)}`,
  );
  const appended = `${prefix}overrides:${newline}${entries.join(newline)}${newline}`;
  return appended;
};

export const updatePnpmWorkspaceOverrides = (content: string, overrides: OverridesType): string => {
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);
  const section = findOverridesSection(lines);
  if (!section) {
    const appended = appendSection(content, overrides, newline);
    return appended;
  }

  const blockLines = replaceFlowSection(lines, section);
  const blockSection = findOverridesSection(blockLines)!;
  const updatedLines = updateExistingEntries(blockLines, blockSection, overrides);
  const appendedLines = appendNewEntries(updatedLines, overrides);
  const finalLines = formatEmptySection(appendedLines, overrides);
  const updated = finalLines.join(newline);
  return updated;
};
