import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { gold } from "../utils/colors";
import { ICON } from "../utils/icons";
import { resolveCacheDir } from "../utils/cache";
import { pad } from "./format";
import type { Output } from "./output";
import { defaultOutput } from "./output";

const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_BOX_WIDTH = 50;

type HintCache = Record<string, number>;

const getHintCacheDir = (): string => resolveCacheDir();

const getHintCacheFile = (): string => join(getHintCacheDir(), "hints.json");

function loadHintCache(): HintCache {
  const hintCacheFile = getHintCacheFile();
  if (!existsSync(hintCacheFile)) return {};
  try {
    return JSON.parse(readFileSync(hintCacheFile, "utf8"));
  } catch {
    return {};
  }
}

function saveHintCache(cache: HintCache): void {
  const hintCacheDir = getHintCacheDir();
  const hintCacheFile = getHintCacheFile();
  try {
    if (!existsSync(hintCacheDir)) {
      mkdirSync(hintCacheDir, { recursive: true });
    }
    writeFileSync(hintCacheFile, JSON.stringify(cache));
  } catch {
    // Hints are best-effort and must not fail the CLI.
  }
}

function shouldShowHint(hintId: string, ttlMs = DEFAULT_TTL_MS): boolean {
  const cache = loadHintCache();
  const lastShown = cache[hintId];
  if (!lastShown) return true;
  return Date.now() - lastShown > ttlMs;
}

function markHintShown(hintId: string): void {
  const cache = loadHintCache();
  cache[hintId] = Date.now();
  saveHintCache(cache);
}

export function clearHintCache(): void {
  const hintCacheFile = getHintCacheFile();
  try {
    if (existsSync(hintCacheFile)) {
      writeFileSync(hintCacheFile, "{}");
    }
  } catch {
    // Hints are best-effort and must not fail the CLI.
  }
}

function wrapText(text: string, width: number): string[] {
  const lines: string[] = [];
  let current = "";
  text.split(" ").forEach((word) => {
    const test = current ? current + " " + word : word;
    if (test.length <= width) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  });
  if (current) lines.push(current);
  return lines;
}

function renderHintBox(text: string, width = DEFAULT_BOX_WIDTH): string {
  const innerWidth = width - 4;
  const textWidth = innerWidth - 3;
  const lines = wrapText(text, textWidth);
  const border = gold("+" + "-".repeat(width - 2) + "+");
  const content = lines.map((line, i) => {
    const prefix = i === 0 ? ICON.hint + " " : "   ";
    const padded = pad(prefix + line, innerWidth);
    return gold("| " + padded + " |");
  });
  return [border, ...content, border].join("\n");
}

export function showHint(
  hintId: string,
  text: string,
  ttlMs = DEFAULT_TTL_MS,
  out: Output = defaultOutput,
): void {
  if (!shouldShowHint(hintId, ttlMs)) return;
  out.writeLine("");
  out.writeLine(renderHintBox(text));
  out.writeLine("");
  markHintShown(hintId);
}
