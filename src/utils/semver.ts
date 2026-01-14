const stripPrerelease = (version: string): string => version.split("-")[0];

const parseVersionPart = (part: string): number => {
  const num = parseInt(part, 10);
  return isNaN(num) ? 0 : num;
};

export function compareVersions(v1: string, v2: string): number {
  const clean1 = stripPrerelease(v1);
  const clean2 = stripPrerelease(v2);
  const parts1 = clean1.split(".").map(parseVersionPart);
  const parts2 = clean2.split(".").map(parseVersionPart);
  const maxLength = Math.max(parts1.length, parts2.length);

  return Array.from({ length: maxLength }).reduce<number>((result, _, i) => {
    if (result !== 0) return result;
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    return num1 - num2;
  }, 0);
}
