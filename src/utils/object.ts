/**
 * Build an object from keys using a builder function.
 * Avoids O(n²) spread in reduce by mutating directly.
 *
 * @param keys - Array of keys to process
 * @param builder - Function that returns value for each key, or undefined to skip
 * @returns Built object
 */
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

/**
 * Merge objects without O(n²) spread in reduce.
 * Mutates target directly for performance.
 *
 * @param target - Object to merge into (mutated)
 * @param source - Object to merge from
 * @returns The mutated target
 */
export const mergeInto = <T>(
  target: Record<string, T>,
  source: Record<string, T>,
): Record<string, T> => {
  for (const key of Object.keys(source)) {
    target[key] = source[key];
  }
  return target;
};
