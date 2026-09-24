import type { ReactNode } from "react";
import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { Check, Copy } from "lucide-react";

const COPY_EVENTS = { COPY: "copied" };
const IDLE_STATE = { on: COPY_EVENTS };
const RESET_DELAY = { 2000: "idle" };
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

interface CopyButtonProps {
  code: string;
}

const getIcon = (copied: boolean): ReactNode => {
  if (copied) return <Check className="h-4 w-4 text-green-500" />;
  return <Copy className="h-4 w-4" />;
};

const writeClipboard = async (code: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(code);
    return true;
  } catch {
    return false;
  }
};

function useCopyState(code: string) {
  const [snapshot, send] = useMachine(copyMachine);
  const copied = snapshot.matches("copied");

  const handleCopy = async () => {
    const copiedSuccessfully = await writeClipboard(code);
    if (!copiedSuccessfully) return;
    send({ type: "COPY" });
  };
  const state = { copied, handleCopy };
  return state;
}

export function CopyButton({ code }: CopyButtonProps) {
  const { copied, handleCopy } = useCopyState(code);

  const ariaLabel = copied ? "Copied!" : "Copy code";
  const icon = getIcon(copied);

  return (
    <button
      type="button"
      className="flex items-center justify-center h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
      onClick={handleCopy}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  );
}
