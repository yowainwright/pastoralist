import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { gold } from "../utils/colors";
import { ICON } from "../utils/icons";
import type { Output } from "./output";
import { defaultOutput } from "./output";

const HINT_CACHE_DIR = join(homedir(), ".pastoralist");
const HINT_CACHE_FILE = join(HINT_CACHE_DIR, "hints.json");
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_BOX_WIDTH = 50;

type HintCache = Record<string, number>;

function loadHintCache(): HintCache {
  if (!existsSync(HINT_CACHE_FILE)) return {};
  try {
    return JSON.parse(readFileSync(HINT_CACHE_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveHintCache(cache: HintCache): void {
  if (!existsSync(HINT_CACHE_DIR)) {
    mkdirSync(HINT_CACHE_DIR, { recursive: true });
  }
  writeFileSync(HINT_CACHE_FILE, JSON.stringify(cache));
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
  if (existsSync(HINT_CACHE_FILE)) {
    writeFileSync(HINT_CACHE_FILE, "{}");
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
    return gold("| " + (prefix + line).padEnd(innerWidth) + " |");
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
