let pipedInputLines: string[] = [];
let lineIndex = 0;
let pipedInputReady = false;
let pipedInputInitialized = false;

export function initializePipedInput(): void {
  if (pipedInputInitialized || process.stdin.isTTY) {
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
    pipedInputReady = true;
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

  while (!pipedInputReady) {
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

export function getNextPipedInput(): string | null {
  if (!isPipedInput() || !pipedInputReady) {
    return null;
  }

  if (lineIndex < pipedInputLines.length) {
    return pipedInputLines[lineIndex++];
  }

  return "";
}

export async function enhancedQuestion<T = string>(
  rl: {
    question: (prompt: string, callback: (answer: string) => void) => void;
  },
  prompt: string,
  processor: (answer: string) => T = ((answer: string) => answer.trim()) as (
    answer: string,
  ) => T,
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
}
