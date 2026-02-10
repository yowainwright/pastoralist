import { useState, useRef, useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import type { AnimationPhase } from "./types";
import { Popover } from "./Popover";
import { BeforeTerminal } from "./BeforeTerminal";
import { CLITerminal } from "./CLITerminal";
import { AfterTerminal } from "./AfterTerminal";
import { STEP_POPOVERS, STEPS, APPENDIX_CONTENT, COMMAND } from "./constants";

interface TransformDemoProps {
  shouldAnimate?: boolean;
  onComplete?: () => void;
}

export function TransformDemo({
  shouldAnimate = true,
  onComplete,
}: TransformDemoProps) {
  const [phase, setPhase] = useState<AnimationPhase>("idle");
  const [typedCommand, setTypedCommand] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [appendixLines, setAppendixLines] = useState<number>(0);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [showLightning, setShowLightning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showAllPopovers, setShowAllPopovers] = useState(false);
  const hasStarted = useRef(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const pausedState = useRef<{
    phase: AnimationPhase;
    typedCommand: string;
    appendixLines: number;
  } | null>(null);

  const clearAnimations = useCallback(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const animateAppendixFrom = useCallback(
    (startIndex: number) => {
      let lineIndex = startIndex;
      animationRef.current = setInterval(() => {
        if (lineIndex < APPENDIX_CONTENT.length) {
          setAppendixLines(lineIndex + 1);
          lineIndex++;
        } else {
          clearAnimations();
          setPhase("complete");
          setShowAllPopovers(true);
          onComplete?.();
          setTimeout(() => {
            setShowLightning(true);
          }, 150);
        }
      }, 60);
    },
    [clearAnimations],
  );

  const startTypingCommand = useCallback(() => {
    setPhase("step2");
    setActiveStep(2);
    let charIndex = 0;
    animationRef.current = setInterval(() => {
      if (charIndex < COMMAND.length) {
        setTypedCommand(COMMAND.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearAnimations();
        setTimeout(() => {
          setPhase("checking");
          setShowSpinner(true);
          setTimeout(() => {
            setShowSpinner(false);
            setShowSuccess(true);
            setTimeout(() => {
              setPhase("step3");
              setActiveStep(3);
              animateAppendixFrom(0);
            }, 300);
          }, 500);
        }, 100);
      }
    }, 20);
  }, [clearAnimations, animateAppendixFrom]);

  const resetState = useCallback(() => {
    clearAnimations();
    setTypedCommand("");
    setShowSpinner(false);
    setShowSuccess(false);
    setAppendixLines(0);
    setShowLightning(false);
  }, [clearAnimations]);

  const startAnimation = useCallback(() => {
    resetState();
    setPhase("step1");
    setActiveStep(1);

    setTimeout(() => {
      startTypingCommand();
    }, 800);
  }, [resetState, startTypingCommand]);

  const resumeAnimation = useCallback(() => {
    if (!isPaused || !pausedState.current) return;

    setIsPaused(false);
    const {
      phase: savedPhase,
      typedCommand: savedCommand,
      appendixLines: savedLines,
    } = pausedState.current;
    pausedState.current = null;

    if (savedPhase === "step2" && savedCommand.length < COMMAND.length) {
      let charIndex = savedCommand.length;
      animationRef.current = setInterval(() => {
        if (charIndex < COMMAND.length) {
          setTypedCommand(COMMAND.slice(0, charIndex + 1));
          charIndex++;
        } else {
          clearAnimations();
          setTimeout(() => {
            setPhase("checking");
            setShowSpinner(true);
            setTimeout(() => {
              setShowSpinner(false);
              setShowSuccess(true);
              setTimeout(() => {
                setPhase("step3");
                setActiveStep(3);
                animateAppendixFrom(0);
              }, 300);
            }, 500);
          }, 100);
        }
      }, 20);
    } else if (savedPhase === "step3" && savedLines < APPENDIX_CONTENT.length) {
      animateAppendixFrom(savedLines);
    }
  }, [isPaused, clearAnimations, animateAppendixFrom]);

  const { ref: containerRef } = useInView({
    threshold: 0.3,
    onChange: (inView) => {
      if (inView && shouldAnimate) {
        if (!hasStarted.current) {
          hasStarted.current = true;
          startAnimation();
        } else if (isPaused) {
          resumeAnimation();
        }
      }
    },
  });

  useEffect(() => {
    if (!shouldAnimate && !hasStarted.current) {
      hasStarted.current = true;
      setPhase("complete");
      setTypedCommand(COMMAND);
      setAppendixLines(APPENDIX_CONTENT.length);
      setActiveStep(3);
      setShowAllPopovers(true);
      setShowLightning(true);
      setShowSuccess(true);
    }
  }, [shouldAnimate]);

  const handleStepClick = (step: number) => {
    clearAnimations();

    pausedState.current = {
      phase,
      typedCommand,
      appendixLines,
    };
    setIsPaused(true);
    setShowAllPopovers(false);
    setActiveStep(step);

    if (step === 1) {
      setPhase("step1");
    } else if (step === 2) {
      setPhase("step2");
    } else if (step === 3) {
      setPhase("step3");
    }
  };

  const isStep1Active = isPaused
    ? activeStep === 1
    : activeStep >= 1 || showAllPopovers;
  const isStep2Active = isPaused
    ? activeStep === 2
    : activeStep >= 2 || showAllPopovers;
  const isStep3Active = isPaused
    ? activeStep === 3
    : activeStep >= 3 || showAllPopovers;

  return (
    <div ref={containerRef} className="flex flex-col gap-12">
      <ul className="steps w-full">
        {STEPS.map((step, index) => {
          const stepNum = index + 1;
          const isStepComplete =
            activeStep > stepNum || (stepNum === 3 && phase === "complete");
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
              onClick={() => handleStepClick(stepNum)}
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
