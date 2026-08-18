export const LOG_INDENT = "   ";

export type DebugLogFunc = (msg: string, caller: string, ...args: unknown[]) => void;

export type PrintFunc = (msg: string) => void;

export type ItemFunc = (n: number, msg: string) => void;

export type ConsoleMethod = "debug" | "error" | "warn";

export interface Logger {
  debug: DebugLogFunc;
  error: DebugLogFunc;
  fail: PrintFunc;
  warn: DebugLogFunc;
  print: PrintFunc;
  line: PrintFunc;
  indent: PrintFunc;
  item: ItemFunc;
}

export interface LoggerOptions {
  file: string;
  isLogging?: boolean;
}
