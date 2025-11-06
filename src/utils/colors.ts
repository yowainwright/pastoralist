export const green = (text: string): string => {
  return `\x1b[32m${text}\x1b[0m`;
};

export const red = (text: string): string => {
  return `\x1b[31m${text}\x1b[0m`;
};

export const yellow = (text: string): string => {
  return `\x1b[33m${text}\x1b[0m`;
};

export const cyan = (text: string): string => {
  return `\x1b[36m${text}\x1b[0m`;
};

export const gray = (text: string): string => {
  return `\x1b[90m${text}\x1b[0m`;
};
