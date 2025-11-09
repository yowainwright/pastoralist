export interface ParsedArgs {
  command?: string;
  options: Record<string, unknown>;
}

export interface OptionDefinition {
  flags: string[];
  hasValue: boolean;
  isArray?: boolean;
  defaultValue?: unknown;
}

export interface ParsedFlag {
  flag: string;
  value?: string;
}

export interface CollectedValue {
  value: unknown;
  consumed: number;
}
