import { useState, useRef, useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import type { AnimationPhase } from "./types";
import { APPENDIX_CONTENT, COMMAND } from "./constants";

export function useTransformAnimation(
  shouldAnimate: boolean,
  onComplete?: () => void,
) {
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

    const phaseMap: Record<number, AnimationPhase> = {
      1: "step1",
      2: "step2",
      3: "step3",
    };
    const targetPhase = phaseMap[step];
    if (targetPhase) setPhase(targetPhase);
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

  return {
    containerRef,
    phase,
    typedCommand,
    showSpinner,
    showSuccess,
    appendixLines,
    activeStep,
    showLightning,
    showAllPopovers,
    isStep1Active,
    isStep2Active,
    isStep3Active,
    handleStepClick,
  };
}
