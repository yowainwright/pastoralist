import { OPTION_DEFINITIONS, HELP_TEXT, ARGS_START_INDEX } from "./constants";
import type {
  ParsedArgs,
  OptionDefinition,
  ParsedFlag,
  CollectedValue,
} from "./types";

const findOptionDef = (flag: string): OptionDefinition | undefined =>
  OPTION_DEFINITIONS.find((def) => def.flags.includes(flag));

const getOptionKey = (def: OptionDefinition): string => {
  const longFlag = def.flags.find((f) => f.startsWith("--")) || def.flags[0];
  return longFlag
    .replace(/^--?/, "")
    .replace(/-([a-z])/g, (_, char) => char.toUpperCase());
};

const parseFlag = (arg: string): ParsedFlag => {
  const equalIndex = arg.indexOf("=");
  const hasEquals = equalIndex > -1;

  return hasEquals
    ? { flag: arg.slice(0, equalIndex), value: arg.slice(equalIndex + 1) }
    : { flag: arg };
};

const isFlag = (arg: string): boolean => arg.startsWith("-");

const collectArrayValue = (
  args: string[],
  startIndex: number,
): CollectedValue => {
  const values: string[] = [];
  let currentIndex = startIndex + 1;

  while (currentIndex < args.length && !isFlag(args[currentIndex])) {
    values.push(args[currentIndex]);
    currentIndex++;
  }

  const hasValues = values.length > 0;
  const consumed = currentIndex - startIndex - 1;

  return { value: hasValues ? values : undefined, consumed };
};

const collectSingleValue = (
  args: string[],
  startIndex: number,
): CollectedValue => {
  const nextArg = args[startIndex + 1];
  const hasNextValue = nextArg && !isFlag(nextArg);

  return hasNextValue
    ? { value: nextArg, consumed: 1 }
    : { value: true, consumed: 0 };
};

const collectValue = (
  args: string[],
  index: number,
  def: OptionDefinition,
): CollectedValue =>
  def.isArray
    ? collectArrayValue(args, index)
    : collectSingleValue(args, index);

const applyDefaults = (
  options: Record<string, unknown>,
): Record<string, unknown> =>
  OPTION_DEFINITIONS.reduce((acc, def) => {
    const key = getOptionKey(def);
    const hasValue = acc[key] !== undefined;
    const shouldApplyDefault = !hasValue && def.defaultValue !== undefined;

    return shouldApplyDefault
      ? Object.assign({}, acc, { [key]: def.defaultValue })
      : acc;
  }, options);

const processArgument = (
  args: string[],
  index: number,
  state: { options: Record<string, unknown>; command?: string },
): {
  nextIndex: number;
  options: Record<string, unknown>;
  command?: string;
} => {
  const arg = args[index];
  const isNotFlag = !isFlag(arg);

  if (isNotFlag) {
    return { nextIndex: index + 1, options: state.options, command: arg };
  }

  const { flag, value: inlineValue } = parseFlag(arg);
  const def = findOptionDef(flag);
  const isUnknownFlag = !def;

  if (isUnknownFlag) {
    return {
      nextIndex: index + 1,
      options: state.options,
      command: state.command,
    };
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

export const parseArgs = (argv: string[]): ParsedArgs => {
  const args = argv.slice(ARGS_START_INDEX);
  let currentIndex = 0;
  let state = { options: {}, command: undefined as string | undefined };

  while (currentIndex < args.length) {
    const result = processArgument(args, currentIndex, state);
    currentIndex = result.nextIndex;
    state = { options: result.options, command: result.command };
  }

  const optionsWithDefaults = applyDefaults(state.options);

  return { command: state.command, options: optionsWithDefaults };
};

export const showHelp = (): void => {
  console.log(HELP_TEXT);
};
