import { useState, useEffect, useRef } from "react";
import type { AnimationPhase } from "./types";
import { Popover } from "./Popover";
import { BeforeTerminal } from "./BeforeTerminal";
import { CLITerminal } from "./CLITerminal";
import { AfterTerminal } from "./AfterTerminal";
import { STEP_POPOVERS, STEPS, APPENDIX_CONTENT, COMMAND } from "./constants";

interface TransformDemoProps {
  onComplete?: () => void;
}

export const TransformDemo: React.FC<TransformDemoProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<AnimationPhase>("idle");
  const [typedCommand, setTypedCommand] = useState("");
  const [showSpinner, setShowSpinner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [appendixLines, setAppendixLines] = useState<number>(0);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [showLightning, setShowLightning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hasStarted = useRef(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasStarted.current) {
          hasStarted.current = true;
          startAnimation();
        }
      },
      { threshold: 0.3 },
    );

    const current = containerRef.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, []);

  const clearAnimations = () => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
      animationRef.current = null;
    }
  };

  const resetState = () => {
    clearAnimations();
    setTypedCommand("");
    setShowSpinner(false);
    setShowSuccess(false);
    setAppendixLines(0);
    setShowLightning(false);
  };

  const startAnimation = () => {
    resetState();
    setPhase("step1");
    setActiveStep(1);

    setTimeout(() => {
      startTypingCommand();
    }, 2000);
  };

  const startTypingCommand = () => {
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
              animateAppendix();
            }, 600);
          }, 1000);
        }, 200);
      }
    }, 30);
  };

  const animateAppendix = () => {
    let lineIndex = 0;
    animationRef.current = setInterval(() => {
      if (lineIndex < APPENDIX_CONTENT.length) {
        setAppendixLines(lineIndex + 1);
        lineIndex++;
      } else {
        clearAnimations();
        setPhase("complete");
        setTimeout(() => {
          setShowLightning(true);
          onComplete?.();
        }, 300);
      }
    }, 120);
  };

  const handleStepClick = (step: number) => {
    resetState();
    if (step === 1) {
      startAnimation();
    } else if (step === 2) {
      setPhase("step2");
      setActiveStep(2);
      startTypingCommand();
    } else if (step === 3) {
      setTypedCommand(COMMAND);
      setShowSuccess(true);
      setPhase("step3");
      setActiveStep(3);
      animateAppendix();
    }
  };

  const isStep1Active = activeStep === 1;
  const isStep2Active = activeStep === 2;
  const isStep3Active = activeStep === 3;

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
            ? "step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:!border-2 [&::before]:!border-blue-600 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::after]:!bg-blue-500"
            : "[&::before]:border-2 [&::before]:border-base-content/20 [&::before]:text-base-content";
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
          {/* Before - Undocumented overrides */}
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

          {/* CLI execution */}
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

        {/* After - Documented overrides */}
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
};
