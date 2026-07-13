export interface ParsedArgs {
  command?: string;
  commandArgs: string[];
  options: Record<string, unknown>;
}

export interface OptionDefinition {
  flags: string[];
  hasValue: boolean;
  isArray?: boolean;
  defaultValue?: unknown;
  emptyValue?: unknown;
}

export interface ParsedFlag {
  flag: string;
  value?: string;
}

export interface CollectedValue {
  value: unknown;
  consumed: number;
}

export interface ParserState {
  options: Record<string, unknown>;
  command?: string;
  commandArgs: string[];
}

export interface ProcessedArgument extends ParserState {
  nextIndex: number;
}
