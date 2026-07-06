import { OPTION_DEFINITIONS, HELP_TEXT, ARGS_START_INDEX } from "./constants";
import type {
  ParsedArgs,
  OptionDefinition,
  ParsedFlag,
  CollectedValue,
  ParserState,
  ProcessedArgument,
} from "./types";
import type { PrintFunc } from "../../utils";

const findOptionDef = (flag: string): OptionDefinition | undefined =>
  OPTION_DEFINITIONS.find((def) => def.flags.includes(flag));

const getOptionKey = (def: OptionDefinition): string => {
  const longFlag = def.flags.find((f) => f.startsWith("--")) || def.flags[0];
  return longFlag.replace(/^--?/, "").replace(/-([a-z])/g, (_, char) => char.toUpperCase());
};

const parseFlag = (arg: string): ParsedFlag => {
  const equalIndex = arg.indexOf("=");
  const hasEquals = equalIndex > -1;

  if (hasEquals) {
    return { flag: arg.slice(0, equalIndex), value: arg.slice(equalIndex + 1) };
  }
  return { flag: arg };
};

const isFlag = (arg: string): boolean => arg.startsWith("-");

const takeUntilFlag = (args: string[], startIndex: number): string[] => {
  const candidateValues = args.slice(startIndex + 1);
  const nextFlagIndex = candidateValues.findIndex(isFlag);
  if (nextFlagIndex === -1) return candidateValues;
  return candidateValues.slice(0, nextFlagIndex);
};

const collectArrayValue = (args: string[], startIndex: number): CollectedValue => {
  const values = takeUntilFlag(args, startIndex);
  const hasValues = values.length > 0;
  if (hasValues) return { value: values, consumed: values.length };
  return { value: undefined, consumed: 0 };
};

const collectSingleValue = (args: string[], startIndex: number): CollectedValue => {
  const nextArg = args[startIndex + 1];
  const hasNextValue = nextArg && !isFlag(nextArg);

  if (hasNextValue) return { value: nextArg, consumed: 1 };
  return { value: true, consumed: 0 };
};

const collectValue = (args: string[], index: number, def: OptionDefinition): CollectedValue =>
  def.isArray ? collectArrayValue(args, index) : collectSingleValue(args, index);

const resolveEmptyValue = (value: unknown, def: OptionDefinition): unknown => {
  const hasEmptyValue = def.emptyValue !== undefined;
  if (value !== undefined) return value;
  if (hasEmptyValue) return def.emptyValue;
  return value;
};

const applyDefaults = (options: Record<string, unknown>): Record<string, unknown> =>
  OPTION_DEFINITIONS.reduce((acc, def) => {
    const key = getOptionKey(def);
    const hasValue = acc[key] !== undefined;
    const shouldApplyDefault = !hasValue && def.defaultValue !== undefined;

    if (shouldApplyDefault) {
      return Object.assign({}, acc, { [key]: def.defaultValue });
    }
    return acc;
  }, options);

const toProcessedArgument = (
  nextIndex: number,
  state: ParserState,
  options: Record<string, unknown> = state.options,
  command: string | undefined = state.command,
  commandArgs: string[] = state.commandArgs,
): ProcessedArgument => ({
  nextIndex,
  options,
  command,
  commandArgs,
});

const withOption = (state: ParserState, key: string, value: unknown): Record<string, unknown> =>
  Object.assign({}, state.options, { [key]: value });

const processCommandArgument = (
  arg: string,
  index: number,
  state: ParserState,
): ProcessedArgument => {
  if (!state.command) {
    return toProcessedArgument(index + 1, state, state.options, arg, state.commandArgs);
  }

  const commandArgs = state.commandArgs.concat(arg);
  return toProcessedArgument(index + 1, state, state.options, state.command, commandArgs);
};

const processInlineValue = (
  key: string,
  inlineValue: string,
  index: number,
  state: ParserState,
): ProcessedArgument => toProcessedArgument(index + 1, state, withOption(state, key, inlineValue));

const processBooleanFlag = (key: string, index: number, state: ParserState): ProcessedArgument =>
  toProcessedArgument(index + 1, state, withOption(state, key, true));

const processCollectedValue = (
  args: string[],
  index: number,
  state: ParserState,
  key: string,
  def: OptionDefinition,
): ProcessedArgument => {
  const { value, consumed } = collectValue(args, index, def);
  const nextIndex = index + consumed + 1;
  const nextValue = resolveEmptyValue(value, def);
  return toProcessedArgument(nextIndex, state, withOption(state, key, nextValue));
};

const processArgument = (args: string[], index: number, state: ParserState): ProcessedArgument => {
  const arg = args[index];
  if (!isFlag(arg)) return processCommandArgument(arg, index, state);

  const { flag, value: inlineValue } = parseFlag(arg);
  const def = findOptionDef(flag);
  if (!def) throw new Error(`Unknown option: ${flag}`);

  const key = getOptionKey(def);
  if (inlineValue !== undefined) return processInlineValue(key, inlineValue, index, state);
  if (!def.hasValue) return processBooleanFlag(key, index, state);
  return processCollectedValue(args, index, state, key, def);
};

const parseArgumentList = (args: string[], index: number, state: ParserState): ParserState => {
  if (index >= args.length) return state;
  const result = processArgument(args, index, state);
  const nextState = {
    options: result.options,
    command: result.command,
    commandArgs: result.commandArgs,
  };
  return parseArgumentList(args, result.nextIndex, nextState);
};

export const parseArgs = (argv: string[]): ParsedArgs => {
  const args = argv.slice(ARGS_START_INDEX);
  const initialState = { options: {}, command: undefined, commandArgs: [] };
  const state = parseArgumentList(args, 0, initialState);

  const optionsWithDefaults = applyDefaults(state.options);

  return {
    command: state.command,
    commandArgs: state.commandArgs,
    options: optionsWithDefaults,
  };
};

export const showHelp = (print: PrintFunc): void => {
  print(HELP_TEXT);
};
