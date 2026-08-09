import type { OverridesType, PastoralistJSON, OverrideValue } from "../../types";
import type {
  OverrideField as PackageOverrideField,
  PackageManager as DetectedPackageManager,
} from "../package/types";

export type PackageManager = DetectedPackageManager;
export type OverrideField = PackageOverrideField;
export type OverrideSourceKind = "manifest" | "json" | "yaml";

export type OverrideType = {
  type: string;
  overrides: Record<string, OverrideValue>;
};

export type OverrideSource = {
  kind: OverrideSourceKind;
  path: string;
  field: OverrideField | "overrides";
  packageManager: PackageManager;
  overrides: OverridesType;
};

export type OverrideSourceOptions = {
  config: PastoralistJSON;
  manifestPath: string;
};

export type WriteOverrideSourceOptions = {
  dryRun?: boolean;
};
