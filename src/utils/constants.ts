import type { RetryTimingOptions } from "./types";

export const GLOB_SPECIAL_CHARS = /[.+^${}()|[\]\\]/g;
export const GLOB_DOUBLE_STAR = /\*\*/g;
export const GLOB_SINGLE_STAR = /\*/g;
export const GLOB_QUESTION_MARK = /\?/g;
export const GLOBSTAR_PLACEHOLDER = "{{GLOBSTAR}}";
export const GLOBSTAR_PLACEHOLDER_PATTERN = /{{GLOBSTAR}}/g;
export const GLOB_REGEX_CACHE_MAX_SIZE = 200;

export const IGNORED_DIRECTORIES = ["node_modules", ".git"];

export const DEFAULT_RETRY_OPTIONS: RetryTimingOptions = {
  retries: 3,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 30000,
};
