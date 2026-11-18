import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "smol-toml";
import { getStringField, isRecord } from "../../utils";
import type { DependencyManifest } from "../../core/dep-tracker";

export const readUvToml = (path: string): Record<string, unknown> => {
  const content = readFileSync(path, "utf8");
  const document = parse(content);
  return document;
};

export const uvTable = (value: unknown): Record<string, unknown> => {
  const empty: Record<string, unknown> = {};
  if (value === undefined) return empty;
  if (isRecord(value)) return value;
  throw new Error("Expected a TOML table in the uv project");
};

export const uvStrings = (value: unknown): string[] => {
  const empty: string[] = [];
  if (value === undefined) return empty;
  const valid = Array.isArray(value) && value.every((item) => typeof item === "string");
  if (!valid)
    throw new Error(
      "Expected a list of global requirement strings in the uv project; scoped overrides are not supported yet",
    );
  return value;
};

export const normalizeUvName = (name: string): string => name.toLowerCase().replace(/[-_.]+/g, "-");

export const uvRequirement = (requirement: string): [string, string] => {
  const match = /^([a-z0-9](?:[a-z0-9._-]*[a-z0-9])?)(?=[\s[<>=!~@;(]|$)([\s\S]*)$/i.exec(
    requirement.trim(),
  );
  if (!match) throw new Error(`Unsupported uv requirement: ${requirement}`);
  const name = normalizeUvName(match[1]);
  const specifier = match[2].trim() || "*";
  const entry: [string, string] = [name, specifier];
  return entry;
};

const dependencyGroupStrings = (group: unknown): string[] => {
  if (!Array.isArray(group)) throw new Error("Expected a uv dependency group list");
  const strings = group.filter((entry) => typeof entry === "string");
  return strings;
};

const groupRequirements = (value: unknown): string[] => {
  const groups = uvTable(value);
  const requirements = Object.values(groups).flatMap(dependencyGroupStrings);
  return requirements;
};

export const uvSettings = (document: Record<string, unknown>): Record<string, unknown> => {
  const tool = uvTable(document.tool);
  const settings = uvTable(tool.uv);
  return settings;
};

export const readUvManifest = (
  path: string,
  document: Record<string, unknown>,
): DependencyManifest & { version: string } => {
  const project = uvTable(document.project);
  const settings = uvSettings(document);
  if (settings.workspace !== undefined)
    throw new Error("uv workspace tracking is not supported yet; select a standalone project");
  const requirements = uvStrings(project.dependencies).concat(
    groupRequirements(project["optional-dependencies"]),
    groupRequirements(document["dependency-groups"]),
    uvStrings(settings["dev-dependencies"]),
  );
  const dependencies = Object.fromEntries(requirements.map(uvRequirement));
  const name = normalizeUvName(getStringField(project, "name") ?? "root");
  const version = getStringField(project, "version") ?? "";
  const manifestPath = resolve(path);
  const manifest = { path: manifestPath, name, version, dependencies };
  return manifest;
};

export const readUvOverrides = (document: Record<string, unknown>): Record<string, string> => {
  const value = uvSettings(document)["override-dependencies"];
  const requirements = uvStrings(value);
  const entries = requirements.map(uvRequirement);
  const overrides = Object.fromEntries(entries);
  const hasDuplicates = entries.length !== Object.keys(overrides).length;
  if (hasDuplicates) throw new Error("Multiple uv overrides for one package are not supported yet");
  return overrides;
};
