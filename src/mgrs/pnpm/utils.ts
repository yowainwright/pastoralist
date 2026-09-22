import * as fs from "fs";
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "path";
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

const isPnpmTopLevelField = (line: string): boolean => /^[^\s#][^:]*:/.test(line);

const getPnpmSectionLines = (lines: string[], headerIndex: number): string[] => {
  const remaining = lines.slice(headerIndex + 1);
  const nextFieldIndex = remaining.findIndex(isPnpmTopLevelField);
  if (nextFieldIndex === -1) return remaining;
  return remaining.slice(0, nextFieldIndex);
};

const getPnpmPackageSections = (content: string): string => {
  const lines = content.split(/\r?\n/);
  const packagesIndex = lines.indexOf("packages:");
  if (packagesIndex !== -1) return getPnpmSectionLines(lines, packagesIndex).join("\n");
  const snapshotsIndex = lines.indexOf("snapshots:");
  if (snapshotsIndex === -1) return "";
  return getPnpmSectionLines(lines, snapshotsIndex).join("\n");
};

const parsePnpmPackageMatches = (content: string): SecurityPackage[] => {
  const packageSections = getPnpmPackageSections(content);
  const legacy = packageSections.matchAll(/^  \/((?:@[^/@\n]+\/)?[^/@\n\s]+)(?:@|\/)([^\s:]+):/gm);
  const current = packageSections.matchAll(/^  '?((?:@[^@/\n'"]+\/)?[\w][\w.-]*)@([^\s:'"]+)/gm);
  const toPackage = ([, name, version]: RegExpMatchArray): SecurityPackage => {
    const peerSuffixIndex = version.indexOf("(");
    if (peerSuffixIndex === -1) return { name, version };
    return { name, version: version.slice(0, peerSuffixIndex) };
  };
  return Array.from(legacy, toPackage).concat(Array.from(current, toPackage));
};

const splitPnpmLockDocuments = (content: string): string[] => {
  const documents = content.split(/^---\s*$/m).map((document) => document.trim());
  return documents.filter(Boolean);
};

const hasPnpmProjectDependencies = (content: string): boolean =>
  /^\s{4}(dependencies|devDependencies|optionalDependencies):/m.test(content);

const isPnpmPackageManagerDocument = (content: string): boolean => {
  const hasPackageManagerDependencies = /^\s{4}packageManagerDependencies:/m.test(content);
  if (!hasPackageManagerDependencies) return false;
  const hasSnapshots = /^snapshots:\s*$/m.test(content);
  const hasProjectDependencies = hasPnpmProjectDependencies(content);
  const hasNoSnapshots = !hasSnapshots;
  const hasNoProjectDependencies = !hasProjectDependencies;
  return hasNoSnapshots && hasNoProjectDependencies;
};

const parsePnpmLockDocuments = (content: string): SecurityPackage[] => {
  const documents = splitPnpmLockDocuments(content);
  const lockDocuments = documents.length > 0 ? documents : [content];
  return lockDocuments
    .filter((document) => !isPnpmPackageManagerDocument(document))
    .flatMap(parsePnpmPackageMatches);
};

export const parsePnpmLockedPackages = (root: string): SecurityPackage[] | undefined => {
  const lockPath = resolve(root, PNPM_LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return undefined;
  try {
    const content = fs.readFileSync(lockPath, "utf8");
    return getPopulatedPackages(parsePnpmLockDocuments(content));
  } catch {
    return undefined;
  }
};

export const parsePnpmLockTree = (root: string): Record<string, string> | undefined => {
  const packages = parsePnpmLockedPackages(root);
  if (!packages) return undefined;
  const entries = packages.map(({ name, version }) => [name, version]);
  return Object.fromEntries(entries);
};

const hasPnpmLockStructure = (content: string): boolean =>
  content.split("\n").some((line) => PNPM_GRAPH_FIELDS.has(line.trim()));

const matchPnpmGraphPackage = (line: string): RegExpMatchArray | null => {
  const v5v6Match = line.match(/^  \/((?:@[^/@\n]+\/)?[^/@\n\s]+)(?:@|\/)([^\s:]+):/);
  const v9Match = line.match(/^  '?((?:@[^@/\n'"]+\/)?[\w][\w.-]*)@([^\s:'"]+)/);
  return v5v6Match ?? v9Match;
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
  const currentPackage = state.currentPackage;
  const startsDependencies = currentPackage && line.match(/^    dependencies:/);
  if (startsDependencies) {
    state.inDependencies = true;
    return;
  }
  const isOutsideDependencies = !state.inDependencies || !currentPackage;
  if (isOutsideDependencies) return;
  const dependencyMatch = line.match(/^      '?([^':\s]+)'?:/);
  if (dependencyMatch) addDependencyParent(graph, dependencyMatch[1], currentPackage);
  if (!line.startsWith("      ")) state.inDependencies = false;
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
    return undefined;
  }
};

const updatePnpmWorkspaceContent = (
  content: string,
  overrides: OverridesType | undefined,
): string => {
  if (!overrides) return content;
  return updatePnpmWorkspaceOverrides(content, overrides);
};

export const stagePnpmWorkspace = async (
  projectRoot: string,
  removalRoot: string,
  config: PastoralistJSON,
): Promise<void> => {
  const sourcePath = join(projectRoot, "pnpm-workspace.yaml");
  if (!fs.existsSync(sourcePath)) return;
  const content = await readFile(sourcePath, "utf8");
  const overrides = config.pnpm?.overrides;
  const removalContent = updatePnpmWorkspaceContent(content, overrides);
  await writeFile(join(removalRoot, "pnpm-workspace.yaml"), removalContent);
};

const isPnpmEleven = (config: PastoralistJSON): boolean => {
  const match = config.packageManager?.match(/^pnpm@(\d+)/);
  if (!match) return false;
  const major = Number(match[1]);
  return major >= 11;
};

const hasWorkspaceOverrides = (path: string): boolean => {
  if (!fs.existsSync(path)) return false;
  const content = fs.readFileSync(path, "utf8");
  return Object.keys(parsePnpmWorkspaceOverrides(content)).length > 0;
};

export const resolvePnpmSource = (
  config: PastoralistJSON,
  manifestPath: string,
): string | undefined => {
  const workspacePath = resolve(dirname(resolve(manifestPath)), PNPM_WORKSPACE_FILE);
  const usesWorkspaceSource = isPnpmEleven(config) || hasWorkspaceOverrides(workspacePath);
  return usesWorkspaceSource ? workspacePath : undefined;
};

const getIndent = (line: string): string => line.match(/^\s*/)?.[0] || "";

const updateQuote = (quote: string | undefined, character: string): string | undefined => {
  if (character === quote) return undefined;
  if (quote) return quote;
  if (QUOTE_CHARACTERS.has(character)) return character;
  return undefined;
};

const scanCharacter = (state: ScanState, character: string): ScanState => {
  if (state.escaped) return { quote: state.quote, escaped: false };
  const startsEscape = state.quote === '"' && character === "\\";
  if (startsEscape) return { quote: state.quote, escaped: true };
  return { quote: updateQuote(state.quote, character), escaped: false };
};

const findSeparator = (line: string): number => {
  let state: ScanState = { escaped: false };
  return line.split("").findIndex((character, index) => {
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
};

const parseQuotedScalar = (value: string): string => {
  if (value.startsWith('"')) return JSON.parse(value) as string;
  if (value.startsWith("'")) return value.slice(1, -1).replaceAll("''", "'");
  return value;
};

const findComment = (value: string): number => {
  let state: ScanState = { escaped: false };
  return value.split("").findIndex((character, index) => {
    const isUnquoted = !state.quote;
    const isUnescaped = !state.escaped;
    const canMatchComment = isUnquoted && isUnescaped;
    const isComment = canMatchComment && character === "#";
    const hasBoundary = /\s/.test(value[index - 1] || " ");
    const startsComment = isComment && hasBoundary;
    state = scanCharacter(state, character);
    return startsComment;
  });
};

const splitValue = (source: string): Pick<YamlPair, "valueSource" | "suffix"> => {
  const trimmed = source.trimStart();
  const commentIndex = findComment(trimmed);
  if (commentIndex < 0) return { valueSource: trimmed.trimEnd(), suffix: "" };

  const valueSource = trimmed.slice(0, commentIndex).trimEnd();
  const suffix = ` ${trimmed.slice(commentIndex).trimEnd()}`;
  return { valueSource, suffix };
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
  return Object.assign({}, { key, keySource, indent }, value);
};

const isTopLevelBoundary = (line: string): boolean => {
  const isIgnoredLine = !line || /^(?:\s|#)/.test(line);
  if (isIgnoredLine) return false;
  const hasPair = Boolean(parsePair(line));
  const isDocumentBoundary = line === "---" || line === "...";
  return hasPair || isDocumentBoundary;
};

const findOverridesSection = (lines: string[]): YamlSection | undefined => {
  const start = lines.findIndex((line) => {
    const pair = parsePair(line);
    const isOverridesSection = pair?.indent === "" && pair.key === "overrides";
    return isOverridesSection;
  });
  if (start < 0) return undefined;

  const relativeEnd = lines.slice(start + 1).findIndex(isTopLevelBoundary);
  const hasNoBoundary = relativeEnd < 0;
  const absoluteEnd = start + relativeEnd + 1;
  const end = hasNoBoundary ? lines.length : absoluteEnd;
  const pair = parsePair(lines[start])!;
  return { start, end, pair };
};

const findEntryIndent = (lines: string[], section: YamlSection): number | undefined => {
  const indents = lines
    .slice(section.start + 1, section.end)
    .map(parsePair)
    .filter((pair): pair is YamlPair => Boolean(pair))
    .map((pair) => pair.indent.length)
    .filter((indent) => indent > 0);
  if (indents.length === 0) return undefined;
  return Math.min(...indents);
};

const findEntries = (lines: string[], section: YamlSection): YamlEntry[] => {
  const entryIndent = findEntryIndent(lines, section);
  if (entryIndent === undefined) return [];

  const createEntry = (line: string, offset: number): Array<YamlPair & { line: number }> => {
    const pair = parsePair(line);
    const isEntry = Boolean(pair && pair.indent.length === entryIndent);
    if (!isEntry) return [];
    const entryLine = section.start + offset + 1;
    return [Object.assign({}, pair, { line: entryLine })];
  };

  const entries = lines.slice(section.start + 1, section.end).flatMap(createEntry);
  return entries.map((entry, index) => {
    const end = entries[index + 1]?.line ?? section.end;
    return Object.assign({}, entry, { end });
  });
};

const isFlowMapping = (source: string): boolean => {
  const trimmed = source.trim();
  return trimmed.startsWith("{") && trimmed.endsWith("}");
};

const updateFlowDepth = (state: ScanState & { depth: number }, character: string): number => {
  const isQuotedOrEscaped = Boolean(state.quote || state.escaped);
  if (isQuotedOrEscaped) return state.depth;
  if (character === "{") return state.depth + 1;
  if (character === "}") return state.depth - 1;
  return state.depth;
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
  return { entries, scan, start };
};

const splitFlowEntries = (source: string): string[] => {
  const initial: FlowSplitState = { entries: [], scan: { escaped: false, depth: 0 }, start: 0 };
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

const findFlowSeparator = (source: string): number => {
  let state: ScanState = { escaped: false };
  return source.split("").findIndex((character, index) => {
    const keySource = source.slice(0, index).trim();
    const quote = keySource.at(0);
    const hasQuote = Boolean(quote);
    const isKnownQuote = Boolean(quote && QUOTE_CHARACTERS.has(quote));
    const hasClosingQuote = Boolean(quote && keySource.endsWith(quote));
    const hasQuotedKey = hasQuote && isKnownQuote && hasClosingQuote;
    const nextCharacter = source[index + 1] || "";
    const hasValueBoundary =
      !nextCharacter || /\s/.test(nextCharacter) || "[{".includes(nextCharacter);
    const isColon = character === ":";
    const isUnquoted = !state.quote;
    const isUnescaped = !state.escaped;
    const canSeparate = isColon && isUnquoted && isUnescaped;
    const hasKeyBoundary = hasQuotedKey || hasValueBoundary;
    const isSeparator = canSeparate && hasKeyBoundary;
    state = scanCharacter(state, character);
    return isSeparator;
  });
};

const parseFlowPair = (source: string): [string, OverrideValue] => {
  const separator = findFlowSeparator(source);
  if (separator < 0) throw new Error("pnpm overrides must be a YAML mapping");
  const keySource = source.slice(0, separator).trim();
  const valueSource = source.slice(separator + 1).trim();
  const hasMissingPairValue = !keySource || !valueSource;
  if (hasMissingPairValue) throw new Error("pnpm overrides must be a YAML mapping");
  return [parseQuotedScalar(keySource), parseOverrideValue(valueSource)];
};

const parseFlowMapping = (source: string): OverridesType => {
  const trimmed = source.trim();
  if (!isFlowMapping(trimmed)) throw new Error("pnpm overrides must be a YAML mapping");
  const content = trimmed.slice(1, -1).trim();
  if (!content) return {};
  return Object.fromEntries(splitFlowEntries(content).map(parseFlowPair));
};

const parseNestedFlowMapping = (source: string): Record<string, string> => {
  const mapping = parseFlowMapping(source);
  const hasOnlyStringValues = Object.values(mapping).every((value) => typeof value === "string");
  if (!hasOnlyStringValues) throw new Error("nested pnpm overrides must contain string values");
  return mapping as Record<string, string>;
};

const parseOverrideValue = (source: string): OverrideValue => {
  if (isFlowMapping(source)) return parseNestedFlowMapping(source);
  return parseQuotedScalar(source);
};

const findEntryContentEnd = (lines: string[], entry: YamlEntry): number => {
  if (entry.valueSource) return entry.line + 1;
  const relativeEnd = lines.slice(entry.line + 1, entry.end).findIndex((line) => {
    const isContent = line.trim().length > 0;
    const isComment = line.trimStart().startsWith("#");
    const isNested = getIndent(line).length > entry.indent.length;
    const isBoundary = isContent && !isComment && !isNested;
    return isBoundary;
  });
  if (relativeEnd < 0) return entry.end;
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
  return pairs.filter((pair) => pair.indent.length === nestedIndent);
};

const parseNestedBlockMapping = (lines: string[], entry: YamlEntry): Record<string, string> => {
  const pairs = findNestedEntries(lines, entry).map((pair): [string, string] => {
    const value = parseOverrideValue(pair.valueSource);
    if (typeof value !== "string") {
      throw new Error("nested pnpm overrides must contain string values");
    }
    return [pair.key, value];
  });
  return Object.fromEntries(pairs);
};

const parseEntryValue = (lines: string[], entry: YamlEntry): OverrideValue | undefined => {
  if (entry.valueSource) return parseOverrideValue(entry.valueSource);
  const mapping = parseNestedBlockMapping(lines, entry);
  if (Object.keys(mapping).length === 0) return undefined;
  return mapping;
};

export const parsePnpmWorkspaceOverrides = (content: string): OverridesType => {
  const lines = content.split(/\r?\n/);
  const section = findOverridesSection(lines);
  if (!section) return {};
  if (section.pair.valueSource) return parseFlowMapping(section.pair.valueSource);

  const entries = findEntries(lines, section).flatMap((entry): Array<[string, OverrideValue]> => {
    const value = parseEntryValue(lines, entry);
    if (value === undefined) return [];
    return [[entry.key, value]];
  });
  return Object.fromEntries(entries);
};

const formatNewScalar = (value: OverrideValue): string => JSON.stringify(value);

const hasUnsafeScalarCharacter = (value: string): boolean => {
  return Array.from(value).some((character) => UNSAFE_SCALAR_CHARACTERS.has(character));
};

const formatUpdatedScalar = (value: OverrideValue, previous: string): string => {
  if (typeof value !== "string") return JSON.stringify(value);
  if (previous.startsWith("'")) return `'${value.replaceAll("'", "''")}'`;
  if (previous.startsWith('"')) return JSON.stringify(value);
  const hasValue = value.length > 0;
  const hasWhitespace = /\s/.test(value);
  const isSafePlainValue = hasValue && !hasWhitespace && !hasUnsafeScalarCharacter(value);
  return isSafePlainValue ? value : JSON.stringify(value);
};

const hasSameValue = (lines: string[], entry: YamlEntry, value: OverrideValue): boolean => {
  try {
    return JSON.stringify(parseEntryValue(lines, entry)) === JSON.stringify(value);
  } catch {
    return false;
  }
};

const updateEntry = (entry: YamlEntry, value: OverrideValue): string => {
  const scalar = formatUpdatedScalar(value, entry.valueSource);
  return `${entry.indent}${entry.keySource}: ${scalar}${entry.suffix}`;
};

const updateExistingEntry = (
  lines: string[],
  entry: YamlEntry,
  overrides: OverridesType,
): string[] => {
  const contentEnd = findEntryContentEnd(lines, entry);
  const nestedLines = lines.slice(entry.line + 1, contentEnd);
  const preservedLines = nestedLines.filter((line) => {
    const trimmed = line.trimStart();
    const isEmpty = !trimmed;
    const isComment = trimmed.startsWith("#");
    const shouldPreserve = isEmpty || isComment;
    return shouldPreserve;
  });
  const trailingLines = lines.slice(contentEnd, entry.end);
  const value = overrides[entry.key];
  if (value === undefined) return preservedLines.concat(trailingLines);
  if (hasSameValue(lines, entry, value)) return lines.slice(entry.line, entry.end);
  return [updateEntry(entry, value)].concat(preservedLines, trailingLines);
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
  return beforeEntries.concat(updatedEntries, afterEntries);
};

const appendNewEntries = (lines: string[], overrides: OverridesType): string[] => {
  const section = findOverridesSection(lines)!;
  const entries = findEntries(lines, section);
  const existingKeys = new Set(entries.map((entry) => entry.key));
  const newKeys = Object.keys(overrides).filter((key) => !existingKeys.has(key));
  if (newKeys.length === 0) return lines;

  const indent = entries[0]?.indent || "  ";
  const newLines = newKeys.map((key) => {
    const scalar = formatNewScalar(overrides[key]);
    return `${indent}${JSON.stringify(key)}: ${scalar}`;
  });
  const lastEntry = entries.at(-1);
  const insertionIndex = lastEntry ? findEntryContentEnd(lines, lastEntry) - 1 : section.start;
  const before = lines.slice(0, insertionIndex + 1);
  const after = lines.slice(insertionIndex + 1);
  return before.concat(newLines, after);
};

const replaceLine = (lines: string[], index: number, replacement: string): string[] => {
  return lines.map((line, lineIndex) => (lineIndex === index ? replacement : line));
};

const replaceFlowSection = (lines: string[], section: YamlSection): string[] => {
  if (!section.pair.valueSource) return lines;
  return replaceLine(lines, section.start, `overrides:${section.pair.suffix}`);
};

const formatEmptySection = (lines: string[], overrides: OverridesType): string[] => {
  if (Object.keys(overrides).length > 0) return lines;
  const section = findOverridesSection(lines)!;
  return replaceLine(lines, section.start, `overrides: {}${section.pair.suffix}`);
};

const ensureFinalNewline = (content: string, newline: string): string => {
  const hasFinalNewline = content.length === 0 || content.endsWith(newline);
  if (hasFinalNewline) return content;
  return `${content}${newline}`;
};

const appendSection = (content: string, overrides: OverridesType, newline: string): string => {
  if (Object.keys(overrides).length === 0) return content;
  const prefix = ensureFinalNewline(content, newline);
  const entries = Object.entries(overrides).map(
    ([key, value]) => `  ${JSON.stringify(key)}: ${formatNewScalar(value)}`,
  );
  return `${prefix}overrides:${newline}${entries.join(newline)}${newline}`;
};

export const updatePnpmWorkspaceOverrides = (content: string, overrides: OverridesType): string => {
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);
  const section = findOverridesSection(lines);
  if (!section) return appendSection(content, overrides, newline);

  const blockLines = replaceFlowSection(lines, section);
  const blockSection = findOverridesSection(blockLines)!;
  const updatedLines = updateExistingEntries(blockLines, blockSection, overrides);
  const appendedLines = appendNewEntries(updatedLines, overrides);
  const finalLines = formatEmptySection(appendedLines, overrides);
  return finalLines.join(newline);
};
