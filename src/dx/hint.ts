import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { gold } from "../utils/colors";
import { ICON } from "../utils/icons";
import { resolveCacheDir } from "../utils/cache";
import type { HintCache } from "./types";
import { DEFAULT_HINT_BOX_WIDTH, DEFAULT_HINT_TTL_MS } from "./constants";
import { pad } from "./format";
import type { Output } from "./output";
import { defaultOutput } from "./output";

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
    return;
  }
}

function shouldShowHint(hintId: string, ttlMs = DEFAULT_HINT_TTL_MS): boolean {
  const cache = loadHintCache();
  const lastShown = cache[hintId];
  if (!lastShown) return true;
  const elapsedMs = Date.now() - lastShown;
  const isExpired = elapsedMs > ttlMs;
  return isExpired;
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
    return;
  }
}

function wrapText(text: string, width: number): string[] {
  const appendLine = (lines: string[], line: string): string[] => {
    if (!line) return lines;
    return lines.concat(line);
  };
  const state = text.split(" ").reduce(
    (acc, word) => {
      const { current } = acc;
      const test = current ? current + " " + word : word;
      if (test.length <= width) {
        return Object.assign({}, acc, { current: test });
      }

      return { lines: appendLine(acc.lines, current), current: word };
    },
    { lines: [] as string[], current: "" },
  );
  return appendLine(state.lines, state.current);
}

function renderHintBox(text: string, width = DEFAULT_HINT_BOX_WIDTH): string {
  const innerWidth = width - 4;
  const textWidth = innerWidth - 3;
  const lines = wrapText(text, textWidth);
  const border = gold("+" + "-".repeat(width - 2) + "+");
  const content = lines.map((line, i) => {
    const prefix = i === 0 ? ICON.hint + " " : "   ";
    const padded = pad(prefix + line, innerWidth);
    const contentLine = "| " + padded + " |";
    return gold(contentLine);
  });
  return [border].concat(content, border).join("\n");
}

export function showHint(
  hintId: string,
  text: string,
  ttlMs = DEFAULT_HINT_TTL_MS,
  out: Output = defaultOutput,
): void {
  if (!shouldShowHint(hintId, ttlMs)) return;
  out.writeLine("");
  out.writeLine(renderHintBox(text));
  out.writeLine("");
  markHintShown(hintId);
}
