import type { MouseEvent, ReactNode } from "react";
import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { Check, Copy } from "lucide-react";

const COPY_EVENTS = { COPY: "copied" };
const IDLE_STATE = { on: COPY_EVENTS };
const RESET_DELAY = { 800: "idle" };
const COPIED_STATE = { after: RESET_DELAY };
const COPY_STATES = {
  idle: IDLE_STATE,
  copied: COPIED_STATE,
};
const copyMachine = createMachine({
  id: "copy",
  initial: "idle",
  states: COPY_STATES,
});

const buttonClassName =
  "flex items-center justify-center size-9 shrink-0 rounded-xl bg-base-100/70 hover:bg-base-200/80 transition-colors cursor-pointer";
const iconClassName = "h-5 w-5 pointer-events-none";
const successIconClassName = "h-6 w-6 pointer-events-none text-green-500";

const getIcon = (copied: boolean): ReactNode => {
  if (copied) return <Check className={successIconClassName} />;
  return <Copy className={iconClassName} />;
};

const writeClipboard = async (code: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(code);
    return true;
  } catch {
    return false;
  }
};

async function copyFromContainer(event: MouseEvent<HTMLButtonElement>, onCopied: () => void) {
  const container = event.currentTarget.closest("figure, div");
  const codeElement = container?.querySelector("code");
  if (!codeElement) return;

  const code = codeElement.textContent ?? "";
  const copiedSuccessfully = await writeClipboard(code);
  if (!copiedSuccessfully) return;
  onCopied();
}

export function CopyButton() {
  const [snapshot, send] = useMachine(copyMachine);
  const copied = snapshot.matches("copied");
  const handleCopy = (event: MouseEvent<HTMLButtonElement>) =>
    copyFromContainer(event, () => send({ type: "COPY" }));

  const ariaLabel = copied ? "Copied!" : "Copy";
  const icon = getIcon(copied);

  return (
    <button type="button" className={buttonClassName} onClick={handleCopy} aria-label={ariaLabel}>
      {icon}
    </button>
  );
}
