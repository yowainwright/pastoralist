import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { setup, assign, fromCallback } from "xstate";
import { useMachine } from "@xstate/react";
import type { AnimationPhase } from "./types";
import { Popover } from "./Popover";
import { BeforeTerminal } from "./BeforeTerminal";
import { CLITerminal } from "./CLITerminal";
import { AfterTerminal } from "./AfterTerminal";
import {
  STEP_POPOVERS,
  STEPS,
  APPENDIX_CONTENT,
  COMMAND,
  STEP_SNAPSHOTS,
  MACHINE_CONFIG,
} from "./constants";

type TransformContext = {
  typedCommand: string;
  appendixLines: number;
  activeStep: number;
  showAll: boolean;
};

type TransformEvent =
  | { type: "START" }
  | { type: "SKIP" }
  | { type: "STEP_CLICK"; step: 1 | 2 | 3 }
  | { type: "TYPING_TICK"; index: number }
  | { type: "TYPING_DONE" }
  | { type: "APPENDIX_TICK"; index: number }
  | { type: "APPENDIX_DONE" };

const typingActor = fromCallback<
  { type: "TYPING_TICK"; index: number } | { type: "TYPING_DONE" }
>(({ sendBack }) => {
  let index = 0;
  const id = setInterval(() => {
    const isDone = index >= COMMAND.length;
    if (isDone) {
      clearInterval(id);
      sendBack({ type: "TYPING_DONE" });
    } else {
      sendBack({ type: "TYPING_TICK", index });
      index++;
    }
  }, 20);
  return () => clearInterval(id);
});

const appendixActor = fromCallback<
  { type: "APPENDIX_TICK"; index: number } | { type: "APPENDIX_DONE" }
>(({ sendBack }) => {
  let index = 0;
  const id = setInterval(() => {
    const isDone = index >= APPENDIX_CONTENT.length;
    if (isDone) {
      clearInterval(id);
      sendBack({ type: "APPENDIX_DONE" });
    } else {
      sendBack({ type: "APPENDIX_TICK", index });
      index++;
    }
  }, 60);
  return () => clearInterval(id);
});

const transformMachine = setup({
  types: {} as { context: TransformContext; events: TransformEvent },
  actors: { typingActor, appendixActor },
  actions: {
    applyStepSnapshot: assign(({ event }) => {
      const e = event as Extract<TransformEvent, { type: "STEP_CLICK" }>;
      return STEP_SNAPSHOTS[e.step];
    }),
    applySkip: assign(() => STEP_SNAPSHOTS[3]),
    resetStep1: assign({
      activeStep: 1,
      typedCommand: "",
      appendixLines: 0,
      showAll: false,
    }),
    setActiveStep2: assign({ activeStep: 2 }),
    setActiveStep3: assign({ activeStep: 3 }),
    updateTypedCommand: assign({
      typedCommand: ({ event }) => {
        const e = event as Extract<TransformEvent, { type: "TYPING_TICK" }>;
        return COMMAND.slice(0, e.index + 1);
      },
    }),
    updateAppendixLines: assign({
      appendixLines: ({ event }) => {
        const e = event as Extract<TransformEvent, { type: "APPENDIX_TICK" }>;
        return e.index + 1;
      },
    }),
    setCompleteContext: assign({ activeStep: 3, showAll: true }),
    resetContext: assign({
      typedCommand: "",
      appendixLines: 0,
      activeStep: 0,
      showAll: false,
    }),
  },
}).createMachine(MACHINE_CONFIG);

interface TransformDemoProps {
  shouldAnimate?: boolean;
  onComplete?: () => void;
}

export function TransformDemo({
  shouldAnimate = true,
  onComplete,
}: TransformDemoProps) {
  const [snapshot, send] = useMachine(transformMachine);
  const { typedCommand, appendixLines, activeStep, showAll } = snapshot.context;

  const isPreviewing = snapshot.matches("previewing");
  const isInStep1 = snapshot.matches({ animating: "step1" });
  const isTyping = snapshot.matches({ animating: "typing" });
  const isChecking = snapshot.matches({ animating: "checking" });
  const isSuccessPhase = snapshot.matches({ animating: "success" });
  const isInStep3 = snapshot.matches({ animating: "step3" });
  const isAnimatingComplete = snapshot.matches({ animating: "complete" });
  const isLightningVisible = snapshot.matches({
    animating: { complete: "done" },
  });

  const isStep2Phase = isTyping || isChecking || isSuccessPhase;
  const showSpinner = isChecking;
  const showSuccess =
    isSuccessPhase ||
    isInStep3 ||
    isAnimatingComplete ||
    (isPreviewing && activeStep >= 2);
  const showLightning = isLightningVisible || (isPreviewing && showAll);
  const showAllPopovers = isAnimatingComplete || showAll;

  const isStep1Active = isPreviewing
    ? showAll || activeStep === 1
    : activeStep >= 1 || showAllPopovers;
  const isStep2Active = isPreviewing
    ? showAll || activeStep === 2
    : activeStep >= 2 || showAllPopovers;
  const isStep3Active = isPreviewing
    ? showAll || activeStep === 3
    : activeStep >= 3 || showAllPopovers;

  const phase: AnimationPhase = isStep2Phase
    ? "step2"
    : isInStep3
      ? "step3"
      : isAnimatingComplete
        ? "complete"
        : isInStep1 || activeStep === 1
          ? "step1"
          : activeStep === 2
            ? "step2"
            : activeStep === 3
              ? "step3"
              : "idle";

  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (isAnimatingComplete) onCompleteRef.current?.();
  }, [isAnimatingComplete]);

  useEffect(() => {
    const shouldSkip = !shouldAnimate;
    if (shouldSkip) send({ type: "SKIP" });
  }, [shouldAnimate, send]);

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const { ref: containerRef } = useInView({
    threshold: 0.3,
    onChange: (inView: boolean) => {
      const current = snapshotRef.current;
      const canStart = current.matches("idle") || current.matches("previewing");
      const shouldStart = inView && shouldAnimate && canStart;
      if (shouldStart) send({ type: "START" });
    },
  });

  return (
    <div ref={containerRef} className="flex flex-col gap-12">
      <ul className="steps w-full">
        {STEPS.map((step, index) => {
          const stepNum = (index + 1) as 1 | 2 | 3;
          const isStepComplete =
            activeStep > stepNum || (stepNum === 3 && isAnimatingComplete);
          const isActive = activeStep >= stepNum;
          const baseClass =
            "step cursor-pointer transition-all duration-200 text-base-content";
          const activeClass = isActive
            ? "step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500"
            : "[&::before]:text-base-content [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-32px)] [&::before]:!z-[999]";
          const dataContent = isStepComplete ? "✓" : stepNum;

          return (
            <li
              key={index}
              className={`${baseClass} ${activeClass}`}
              onClick={() => send({ type: "STEP_CLICK", step: stepNum })}
              data-content={dataContent}
            >
              {step}
            </li>
          );
        })}
      </ul>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
        <div className="flex flex-col gap-4">
          <div className="relative flex flex-col">
            <Popover
              stepNumber={1}
              title={STEP_POPOVERS[0].title}
              description={STEP_POPOVERS[0].description}
              visible={isStep1Active}
            />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base-content/60 text-sm">
                Undocumented overrides
              </span>
              <span className="badge badge-lg text-white bg-gradient-to-b from-red-400 to-red-500 border-2 border-red-600 shadow-md shadow-red-500/25">
                Before
              </span>
            </div>
            <BeforeTerminal isActive={isStep1Active} />
          </div>

          <div className="relative">
            <Popover
              stepNumber={2}
              title={STEP_POPOVERS[1].title}
              description={STEP_POPOVERS[1].description}
              visible={isStep2Active}
            />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base-content/60 text-sm">
                Execute the pastoralist cli
              </span>
              <span className="badge badge-lg text-white bg-gradient-to-b from-blue-400 to-blue-500 border-2 border-blue-600 shadow-md shadow-blue-500/25">
                CLI
              </span>
            </div>
            <CLITerminal
              isActive={isStep2Active}
              typedCommand={typedCommand}
              phase={phase}
              showSpinner={showSpinner}
              showSuccess={showSuccess}
            />
          </div>
        </div>

        <div className="relative flex flex-col">
          <Popover
            stepNumber={3}
            title={STEP_POPOVERS[2].title}
            description={STEP_POPOVERS[2].description}
            visible={isStep3Active}
            showEmoji={showLightning}
            verticalCenter
          />
          <div className="flex items-center gap-2 mb-3">
            <span className="text-base-content/60 text-sm">
              Documented overrides
            </span>
            <span className="badge badge-lg text-white bg-gradient-to-b from-green-400 to-green-500 border-2 border-green-600 shadow-md shadow-green-500/25">
              After
            </span>
          </div>
          <AfterTerminal
            isActive={isStep3Active}
            appendixLines={appendixLines}
          />
        </div>
      </div>
    </div>
  );
}
