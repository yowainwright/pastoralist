import { OPTION_DEFINITIONS, HELP_TEXT, ARGS_START_INDEX } from "./constants";
import type {
  ParsedArgs,
  OptionDefinition,
  ParsedFlag,
  CollectedValue,
  ParserState,
  ProcessedArgument,
  FlagOption,
} from "./types";
import type { PrintFunc } from "../../observability";

const findOptionDef = (flag: string): OptionDefinition | undefined =>
  OPTION_DEFINITIONS.find((def) => def.flags.includes(flag));

const getOptionKey = (def: OptionDefinition): string => {
  const longFlag = def.flags.find((f) => f.startsWith("--")) || def.flags[0];
  const optionKey = longFlag
    .replace(/^--?/, "")
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
  return optionKey;
};

const parseFlag = (arg: string): ParsedFlag => {
  const equalIndex = arg.indexOf("=");
  const hasEquals = equalIndex > -1;

  if (hasEquals) {
    const flag = arg.slice(0, equalIndex);
    const value = arg.slice(equalIndex + 1);
    const parsed = { flag, value };
    return parsed;
  }
  const parsed = { flag: arg };
  return parsed;
};

const isFlag = (arg: string): boolean => arg.startsWith("-");

const takeUntilFlag = (args: string[], startIndex: number): string[] => {
  const candidateValues = args.slice(startIndex + 1);
  const nextFlagIndex = candidateValues.findIndex(isFlag);
  if (nextFlagIndex === -1) return candidateValues;
  const result = candidateValues.slice(0, nextFlagIndex);
  return result;
};

const collectArrayValue = (args: string[], startIndex: number): CollectedValue => {
  const values = takeUntilFlag(args, startIndex);
  const hasValues = values.length > 0;
  if (hasValues) {
    const { length: consumed } = values;
    const arrayValue: CollectedValue = { value: values, consumed };
    return arrayValue;
  }
  const arrayValue2: CollectedValue = { value: undefined, consumed: 0 };
  return arrayValue2;
};

const collectSingleValue = (args: string[], startIndex: number): CollectedValue => {
  const nextArg = args[startIndex + 1];
  const hasNextValue = nextArg && !isFlag(nextArg);

  if (hasNextValue) {
    const singleValue: CollectedValue = { value: nextArg, consumed: 1 };
    return singleValue;
  }
  const singleValue2: CollectedValue = { value: undefined, consumed: 0 };
  return singleValue2;
};

const collectValue = (args: string[], index: number, def: OptionDefinition): CollectedValue =>
  def.isArray ? collectArrayValue(args, index) : collectSingleValue(args, index);

const resolveEmptyValue = (value: unknown, def: OptionDefinition): unknown => {
  const hasEmptyValue = def.emptyValue !== undefined;
  if (value !== undefined) return value;
  if (hasEmptyValue) {
    const emptyValue2 = def.emptyValue;
    return emptyValue2;
  }
  return undefined;
};

const applyDefaults = (options: Record<string, unknown>): Record<string, unknown> =>
  OPTION_DEFINITIONS.reduce((acc, def) => {
    const key = getOptionKey(def);
    const hasValue = acc[key] !== undefined;
    const shouldApplyDefault = !hasValue && def.defaultValue !== undefined;

    if (shouldApplyDefault) {
      const { defaultValue } = def;
      const result = Object.assign({}, acc, { [key]: defaultValue });
      return result;
    }
    return acc;
  }, options);

const toProcessedArgument = (nextIndex: number, state: ParserState): ProcessedArgument => {
  const { options, command, commandArgs } = state;
  const result = { nextIndex, options, command, commandArgs };
  return result;
};

const withOption = (state: ParserState, key: string, value: unknown): ParserState => {
  const options = Object.assign({}, state.options, { [key]: value });
  const result = Object.assign({}, state, { options });
  return result;
};

const processCommandArgument = (
  arg: string,
  index: number,
  state: ParserState,
): ProcessedArgument => {
  if (!state.command) {
    const nextState = Object.assign({}, state, { command: arg });
    const result = toProcessedArgument(index + 1, nextState);
    return result;
  }

  const commandArgs = state.commandArgs.concat(arg);
  const nextState = Object.assign({}, state, { commandArgs });
  const result = toProcessedArgument(index + 1, nextState);
  return result;
};

const parseInlineValue = (inlineValue: string, option: FlagOption): string | boolean => {
  const { key, def } = option;
  if (def.hasValue) return inlineValue;
  if (inlineValue === "true") return true;
  if (inlineValue === "false") return false;
  throw new Error(`Boolean option ${key} requires true or false`);
};

const processBooleanFlag = (key: string, index: number, state: ParserState): ProcessedArgument =>
  toProcessedArgument(index + 1, withOption(state, key, true));

const processCollectedValue = (
  args: string[],
  index: number,
  state: ParserState,
  option: FlagOption,
): ProcessedArgument => {
  const { key, def } = option;
  const { value, consumed } = collectValue(args, index, def);
  const nextIndex = index + consumed + 1;
  const nextValue = resolveEmptyValue(value, def);
  if (nextValue === undefined) throw new Error(`Option ${key} requires a value`);
  const result = toProcessedArgument(nextIndex, withOption(state, key, nextValue));
  return result;
};

const processFlagArgument = (args: string[], index: number, state: ParserState) => {
  const { flag, value: inlineValue } = parseFlag(args[index]);
  const def = findOptionDef(flag);
  if (!def) throw new Error(`Unknown option: ${flag}`);

  const key = getOptionKey(def);
  const option = { key, def };
  if (inlineValue !== undefined) {
    const value = parseInlineValue(inlineValue, option);
    const result = toProcessedArgument(index + 1, withOption(state, key, value));
    return result;
  }
  if (!def.hasValue) {
    const result = processBooleanFlag(key, index, state);
    return result;
  }
  const result = processCollectedValue(args, index, state, option);
  return result;
};

const processArgument = (args: string[], index: number, state: ParserState): ProcessedArgument => {
  const arg = args[index];
  if (!isFlag(arg)) {
    const result = processCommandArgument(arg, index, state);
    return result;
  }
  const result = processFlagArgument(args, index, state);
  return result;
};

const parseArgumentList = (args: string[], index: number, state: ParserState): ParserState => {
  if (index >= args.length) return state;
  const { nextIndex, options, command, commandArgs } = processArgument(args, index, state);
  const nextState = { options, command, commandArgs };
  const argumentList = parseArgumentList(args, nextIndex, nextState);
  return argumentList;
};

export const parseArgs = (argv: string[]): ParsedArgs => {
  const args = argv.slice(ARGS_START_INDEX);
  const initialOptions = {};
  const initialCommandArgs: string[] = [];
  const initialState = {
    options: initialOptions,
    command: undefined,
    commandArgs: initialCommandArgs,
  };
  const state = parseArgumentList(args, 0, initialState);
  const options = applyDefaults(state.options);
  const { command, commandArgs } = state;
  const parsed = { command, commandArgs, options };
  return parsed;
};

export const showHelp = (print: PrintFunc): void => {
  print(HELP_TEXT);
};
