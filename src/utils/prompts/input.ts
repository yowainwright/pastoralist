let pipedInputLines: string[] = [];
let lineIndex = 0;
let pipedInputReady = false;
let pipedInputInitialized = false;
let pipedInputReadyWaiters: Array<() => void> = [];

const resolvePipedInputReady = (): void => {
  pipedInputReady = true;
  const waiters = pipedInputReadyWaiters;
  pipedInputReadyWaiters = [];
  waiters.forEach((resolve) => resolve());
};

const waitForPipedInput = (): Promise<void> => {
  if (pipedInputReady) return Promise.resolve();
  return new Promise((resolve) => {
    pipedInputReadyWaiters = pipedInputReadyWaiters.concat(resolve);
  });
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
  return !process.stdin.isTTY;
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
  rl: {
    question: (prompt: string, callback: (answer: string) => void) => void;
  },
  prompt: string,
  processor: (answer: string) => T = ((answer: string) => answer.trim()) as (answer: string) => T,
): Promise<T> {
  await waitForPipedInputReady();

  return new Promise((resolve) => {
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
}
export function resetPipedInputState(): void {
  pipedInputLines = [];
  lineIndex = 0;
  pipedInputReady = false;
  pipedInputInitialized = false;
  pipedInputReadyWaiters = [];
}
