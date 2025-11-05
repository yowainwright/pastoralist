import { LOG_PREFIX } from "../constants";

export type ConsoleMethod = "debug" | "error" | "info";
type ConsoleMethodFunc = (msg: string, caller?: string, ...args: unknown[]) => void;
export type ConsoleObject = { [K in ConsoleMethod]: ConsoleMethodFunc };

export interface LoggerOptions {
  file: string;
  isLogging?: boolean;
}

export const logMethod = (
  type: ConsoleMethod,
  isLogging: boolean,
  file: string,
) => {
  return (msg: string, caller?: string, ...args: unknown[]) => {
    if (!isLogging) return;
    const callerTxt = caller ? `[${caller}]` : "";
    const message = `${LOG_PREFIX}[${file}]${callerTxt} ${msg}`;
    if (type === "debug") {
      console.debug(message, ...args);
    } else if (type === "error") {
      console.error(message, ...args);
    } else if (type === "info") {
      console.info(message, ...args);
    }
  };
};

export const logger = ({ file, isLogging = false }: LoggerOptions) => ({
  debug: logMethod("debug", isLogging, file),
  error: logMethod("error", isLogging, file),
  info: logMethod("info", isLogging, file),
});
