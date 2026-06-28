export const OVERRIDE_PARENT_SEPARATOR_PATTERN = /(?<!@)>/;

export const PACKAGE_NAME_PATTERN = /^(?:@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/i;

export const UNUSED_OVERRIDE_LABEL = "(unused override)";
export const NESTED_OVERRIDE_LABEL = "(nested override)";
export const UNRESOLVED_OVERRIDE_KEY_LABEL = "(kept: unresolved override key)";
export const REQUIRED_BY_LABEL = "required by";
export const TRANSITIVE_DEPENDENCY_LABEL = "(transitive dependency)";
export const REQUIRED_BY_DEPENDENT_LIMIT = 3;

export const SECURITY_LEDGER_SOURCE = "security";
export const SECURITY_CONFIDENCE_CONFIRMATION_THRESHOLD = 2;
export const SECURITY_CONFIDENCE_CONFIRMED = "confirmed";
export const SECURITY_CONFIDENCE_POSSIBLE = "possible";
export const SECURITY_SEVERITY_SCORES: Record<string, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};
