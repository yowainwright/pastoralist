export const buildObject = <T>(
  keys: string[],
  builder: (key: string) => T | undefined,
): Record<string, T> => {
  const result: Record<string, T> = {};
  for (const key of keys) {
    const value = builder(key);
    if (value !== undefined) {
      result[key] = value;
    }
  }
  return result;
};

export const mergeInto = <T>(
  target: Record<string, T>,
  source: Record<string, T>,
): Record<string, T> => {
  for (const key of Object.keys(source)) {
    target[key] = source[key];
  }
  return target;
};
