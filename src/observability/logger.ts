import { LOG_PREFIX } from "../constants";
import { LOG_INDENT } from "./types";
import type { ConsoleMethod, DebugLogFunc, Logger, LoggerOptions } from "./types";

const createDebugMethod = (type: ConsoleMethod, isLogging: boolean, file: string): DebugLogFunc => {
  return (msg: string, caller: string, ...args: unknown[]) => {
    if (!isLogging) return;
    const message = `${LOG_PREFIX}[${file}][${caller}] ${msg}`;
    console[type](message, ...args);
  };
};

const createWarnMethod = (file: string): DebugLogFunc => {
  return (msg: string, caller: string, ...args: unknown[]) => {
    const message = `${LOG_PREFIX}[${file}][${caller}] ${msg}`;
    console.warn(message, ...args);
  };
};

export const logger = ({ file, isLogging = false }: LoggerOptions): Logger => ({
  debug: createDebugMethod("debug", isLogging, file),
  error: createDebugMethod("error", isLogging, file),
  fail: (msg: string) => console.error(msg),
  warn: createWarnMethod(file),
  print: (msg: string) => console.log(msg),
  line: (msg: string) => console.log("\n" + msg),
  indent: (msg: string) => console.log(LOG_INDENT + msg),
  item: (index: number, msg: string) => console.log(`${LOG_INDENT}${index}. ${msg}`),
});
