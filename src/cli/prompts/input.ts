import type { PromptReader } from "./types";

let pipedInputLines: string[] = [];
let lineIndex = 0;
let pipedInputReady = false;
let pipedInputInitialized = false;
let pipedInputReadyWaiters: Array<() => void> = [];

const resolvePipedInputReady = (): void => {
  pipedInputReady = true;
  pipedInputReadyWaiters.forEach((resolve) => resolve());
  pipedInputReadyWaiters = [];
};

const waitForPipedInput = (): Promise<void> => {
  if (pipedInputReady) {
    const result = Promise.resolve();
    return result;
  }
  const ready = new Promise<void>((resolve) => {
    pipedInputReadyWaiters = pipedInputReadyWaiters.concat(resolve);
  });
  return ready;
};

export function initializePipedInput(): void {
  const shouldSkipInitialization = pipedInputInitialized || process.stdin.isTTY;
  if (shouldSkipInitialization) {
    return;
  }

  pipedInputInitialized = true;
  let input = "";
  process.stdin.setEncoding("utf8");

  process.stdin.on("data", (chunk) => {
    input += chunk;
  });

  process.stdin.on("end", () => {
    pipedInputLines = input.trim().split("\n");
    resolvePipedInputReady();
  });
}

export function isPipedInput(): boolean {
  const result = !process.stdin.isTTY;
  return result;
}

export async function waitForPipedInputReady(): Promise<void> {
  if (!isPipedInput()) {
    return;
  }

  initializePipedInput();
  await waitForPipedInput();
}

export function getNextPipedInput(): string | null {
  const cannotReadPipedInput = !isPipedInput() || !pipedInputReady;
  if (cannotReadPipedInput) {
    return null;
  }

  if (lineIndex < pipedInputLines.length) {
    const line = pipedInputLines[lineIndex];
    lineIndex += 1;
    return line;
  }

  return "";
}

export async function enhancedQuestion<T = string>(
  rl: PromptReader,
  prompt: string,
  processor: (answer: string) => T = ((answer: string) => answer.trim()) as (answer: string) => T,
): Promise<T> {
  await waitForPipedInputReady();

  const result = new Promise<T>((resolve) => {
    const pipedAnswer = getNextPipedInput();

    if (pipedAnswer !== null) {
      console.log(`${prompt}${pipedAnswer}`);
      resolve(processor(pipedAnswer));
    } else {
      rl.question(prompt, (answer: string) => {
        resolve(processor(answer));
      });
    }
  });
  return result;
}
export function resetPipedInputState(): void {
  pipedInputLines = [];
  lineIndex = 0;
  pipedInputReady = false;
  pipedInputInitialized = false;
  pipedInputReadyWaiters = [];
}
