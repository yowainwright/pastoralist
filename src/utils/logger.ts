import { LOG_PREFIX } from "../constants";

export type ConsoleMethod = "debug" | "error" | "info";
type ConsoleMethodFunc = (msg: string, caller?: string, ...args: unknown[]) => void;
export type ConsoleObject = { [K in ConsoleMethod]: ConsoleMethodFunc };

export interface LoggerOptions {
  file: string;
  isLogging?: boolean;
}

/**
 * @name logMethod
 * @description Log method
 * @param type - Type of log
 * @param isLogging - Is logging enabled
 * @param file - File name
 * @returns Log function
 */
export const logMethod = (
  type: ConsoleMethod,
  isLogging: boolean,
  file: string,
) => {
  return (msg: string, caller?: string, ...args: unknown[]) => {
    if (!isLogging) return;
    const callerTxt = caller ? `[${caller}]` : "";
    console[type](`${LOG_PREFIX}[${file}]${callerTxt} ${msg}`, ...args);
  };
};

/**
 * @name logger
 * @description Logger
 * @param options - Logger options
 * @returns Logger
 */
export const logger = ({ file, isLogging = false }: LoggerOptions) => ({
  debug: logMethod("debug", isLogging, file),
  error: logMethod("error", isLogging, file),
  info: logMethod("info", isLogging, file),
});
