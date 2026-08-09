import type { OverridesType, OverrideValue } from "../../types";

type YamlPair = {
  key: string;
  keySource: string;
  valueSource: string;
  suffix: string;
  indent: string;
};

type YamlSection = {
  start: number;
  end: number;
  pair: YamlPair;
};

type YamlEntry = YamlPair & { line: number };

type ScanState = {
  escaped: boolean;
  quote?: string;
};

const QUOTE_CHARACTERS = new Set(['"', "'"]);
const UNSAFE_SCALAR_CHARACTERS = new Set(":#{}[],&*!|>'\"%@`");

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
    const hasBoundary = /\s|$/.test(line[index + 1] || "");
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

  const createEntry = (line: string, offset: number): YamlEntry[] => {
    const pair = parsePair(line);
    const isEntry = Boolean(pair && pair.indent.length === entryIndent);
    if (!isEntry) return [];
    const entryLine = section.start + offset + 1;
    return [Object.assign({}, pair, { line: entryLine })];
  };

  return lines.slice(section.start + 1, section.end).flatMap(createEntry);
};

const parseFlowMapping = (source: string): OverridesType => {
  const isEmptyMapping = !source || source === "{}";
  if (isEmptyMapping) return {};
  const parsed = JSON.parse(source) as unknown;
  const isNonNullObject = typeof parsed === "object" && parsed !== null;
  const isObject = isNonNullObject && !Array.isArray(parsed);
  if (!isObject) throw new Error("pnpm overrides must be a YAML mapping");
  return parsed as OverridesType;
};

const parseNestedFlowMapping = (source: string): Record<string, string> => {
  const mapping = parseFlowMapping(source);
  const hasOnlyStringValues = Object.values(mapping).every((value) => typeof value === "string");
  if (!hasOnlyStringValues) throw new Error("nested pnpm overrides must contain string values");
  return mapping as Record<string, string>;
};

const parseOverrideValue = (source: string): OverrideValue => {
  const isFlowMapping = source.startsWith("{") && source.endsWith("}");
  if (isFlowMapping) return parseNestedFlowMapping(source);
  return parseQuotedScalar(source);
};

export const parsePnpmWorkspaceOverrides = (content: string): OverridesType => {
  const lines = content.split(/\r?\n/);
  const section = findOverridesSection(lines);
  if (!section) return {};
  if (section.pair.valueSource) return parseFlowMapping(section.pair.valueSource);

  return Object.fromEntries(
    findEntries(lines, section)
      .filter((entry) => entry.valueSource)
      .map((entry) => [entry.key, parseOverrideValue(entry.valueSource)]),
  );
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

const hasSameValue = (entry: YamlEntry, value: OverrideValue): boolean => {
  try {
    return JSON.stringify(parseOverrideValue(entry.valueSource)) === JSON.stringify(value);
  } catch {
    return false;
  }
};

const updateEntry = (line: string, entry: YamlEntry, value: OverrideValue): string => {
  if (hasSameValue(entry, value)) return line;
  const scalar = formatUpdatedScalar(value, entry.valueSource);
  return `${entry.indent}${entry.keySource}: ${scalar}${entry.suffix}`;
};

const updateExistingLine = (
  line: string,
  index: number,
  entriesByLine: Map<number, YamlEntry>,
  overrides: OverridesType,
): string[] => {
  const entry = entriesByLine.get(index);
  if (!entry) return [line];
  const value = overrides[entry.key];
  if (value === undefined) return [];
  return [updateEntry(line, entry, value)];
};

const updateExistingEntries = (
  lines: string[],
  section: YamlSection,
  overrides: OverridesType,
): string[] => {
  const entriesByLine = new Map(findEntries(lines, section).map((entry) => [entry.line, entry]));
  return lines.flatMap((line, index) => updateExistingLine(line, index, entriesByLine, overrides));
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
  const insertionIndex = entries.at(-1)?.line ?? section.start;
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
