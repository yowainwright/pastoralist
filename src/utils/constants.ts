import type { RetryOptions, RetryTimingOptions } from "./types";

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

export const NPM_REGISTRY_URL = "https://registry.npmjs.org";
export const NPM_REGISTRY_CONCURRENCY = 5;
export const NPM_REGISTRY_CACHE_MAX_ENTRIES = 1000;

export const NPM_FETCH_RETRY_OPTIONS: RetryOptions = {
  retries: 2,
  minTimeout: 500,
  maxTimeout: 3000,
};
