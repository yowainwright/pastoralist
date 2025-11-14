export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split(".").map(Number);
  const parts2 = v2.split(".").map(Number);
  const maxLength = Math.max(parts1.length, parts2.length);

  return Array.from({ length: maxLength }).reduce<number>((result, _, i) => {
    if (result !== 0) return result;
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    return num1 - num2;
  }, 0);
}
