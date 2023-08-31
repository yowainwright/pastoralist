import { LoggerOptions } from "./interfaces";

export const logger = ({ file, isLogging = false }: LoggerOptions) => ({
  debug: (msg: string, ...args: unknown[]) => {
    if (!isLogging) return;
    if (args) console.debug(`🐑 👩🏽‍🌾 Pastoralist:[${file}]: ${msg}`, ...args);
    else console.debug(`🐑 👩🏽‍🌾 Pastoralist:[${file}]: ${msg}`);
  },
  error: (msg: string, ...args: unknown[]) => {
    if (args) console.error(`🐑 👩🏽‍🌾 Pastoralist:[${file}]: ${msg}`, ...args);
    else console.error(`🐑 👩🏽‍🌾 Pastoralist:[${file}]: ${msg}`);
  },
});
