import type { ReactNode } from "react";
import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { Check, Copy } from "lucide-react";

const copyMachine = createMachine({
  id: "copy",
  initial: "idle",
  states: {
    idle: { on: { COPY: "copied" } },
    copied: { after: { 2000: "idle" } },
  },
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

export function CopyButton({ code }: CopyButtonProps) {
  const [snapshot, send] = useMachine(copyMachine);
  const copied = snapshot.matches("copied");

  const handleCopy = async () => {
    const copiedSuccessfully = await writeClipboard(code);
    if (!copiedSuccessfully) return;
    send({ type: "COPY" });
  };

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
