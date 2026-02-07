export const createPackageKey =
  (separator = "@") =>
  (pkg: string) =>
  (version: string) =>
    pkg + separator + version;

export const packageAtVersion = createPackageKey("@");

export const buildKey =
  (separator: string) =>
  (...parts: string[]) =>
    parts.join(separator);

export const atKey = buildKey("@");
export const colonKey = buildKey(":");
