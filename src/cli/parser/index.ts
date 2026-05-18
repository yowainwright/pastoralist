import { OPTION_DEFINITIONS, HELP_TEXT, ARGS_START_INDEX } from "./constants";
import type {
  ParsedArgs,
  OptionDefinition,
  ParsedFlag,
  CollectedValue,
  ParserState,
  ProcessedArgument,
} from "./types";

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

const processArgument = (args: string[], index: number, state: ParserState): ProcessedArgument => {
  const arg = args[index];
  const isNotFlag = !isFlag(arg);

  if (isNotFlag) {
    return { nextIndex: index + 1, options: state.options, command: arg };
  }

  const { flag, value: inlineValue } = parseFlag(arg);
  const def = findOptionDef(flag);
  const isUnknownFlag = !def;

  if (isUnknownFlag) {
    throw new Error(`Unknown option: ${flag}`);
  }

  const key = getOptionKey(def);
  const hasInlineValue = inlineValue !== undefined;

  if (hasInlineValue) {
    const updatedOptions = Object.assign({}, state.options, {
      [key]: inlineValue,
    });
    return {
      nextIndex: index + 1,
      options: updatedOptions,
      command: state.command,
    };
  }

  const isBooleanFlag = !def.hasValue;

  if (isBooleanFlag) {
    const updatedOptions = Object.assign({}, state.options, { [key]: true });
    return {
      nextIndex: index + 1,
      options: updatedOptions,
      command: state.command,
    };
  }

  const { value, consumed } = collectValue(args, index, def);
  const updatedOptions = Object.assign({}, state.options, { [key]: value });

  return {
    nextIndex: index + consumed + 1,
    options: updatedOptions,
    command: state.command,
  };
};

const parseArgumentList = (args: string[], index: number, state: ParserState): ParserState => {
  if (index >= args.length) return state;
  const result = processArgument(args, index, state);
  const nextState = { options: result.options, command: result.command };
  return parseArgumentList(args, result.nextIndex, nextState);
};

export const parseArgs = (argv: string[]): ParsedArgs => {
  const args = argv.slice(ARGS_START_INDEX);
  const initialState = { options: {}, command: undefined };
  const state = parseArgumentList(args, 0, initialState);

  const optionsWithDefaults = applyDefaults(state.options);

  return { command: state.command, options: optionsWithDefaults };
};

export const showHelp = (): void => {
  console.log(HELP_TEXT);
};
