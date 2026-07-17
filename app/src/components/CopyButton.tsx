import type { MouseEvent, ReactNode } from "react";
import { createMachine } from "xstate";
import { useMachine } from "@xstate/react";
import { Check, Copy } from "lucide-react";

const copyMachine = createMachine({
  id: "copy",
  initial: "idle",
  states: {
    idle: { on: { COPY: "copied" } },
    copied: { after: { 800: "idle" } },
  },
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

export function CopyButton() {
  const [snapshot, send] = useMachine(copyMachine);
  const copied = snapshot.matches("copied");

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    const container = event.currentTarget.closest("figure, div");
    const codeElement = container?.querySelector("code");
    if (!codeElement) return;

    const code = codeElement.textContent ?? "";
    const copiedSuccessfully = await writeClipboard(code);
    if (!copiedSuccessfully) return;
    send({ type: "COPY" });
  };

  const ariaLabel = copied ? "Copied!" : "Copy";
  const icon = getIcon(copied);

  return (
    <button type="button" className={buttonClassName} onClick={handleCopy} aria-label={ariaLabel}>
      {icon}
    </button>
  );
}
