import { useState, useRef, useCallback, useEffect } from "react";
import { useInView } from "react-intersection-observer";
import type { AnimationPhase } from "./types";
import { APPENDIX_CONTENT, COMMAND } from "./constants";

interface PausedState {
  phase: AnimationPhase;
  typedCommand: string;
  appendixLines: number;
}

function useCommandState() {
  const [phase, setPhase] = useState<AnimationPhase>("idle");
  const [typedCommand, setTypedCommand] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const state = { phase, setPhase, typedCommand, setTypedCommand, activeStep, setActiveStep };
  return state;
}

function useAppendixState() {
  const [appendixLines, setAppendixLines] = useState(0);
  const [showLightning, setShowLightning] = useState(false);
  const [showAllPopovers, setShowAllPopovers] = useState(false);
  const state = {
    appendixLines,
    setAppendixLines,
    showLightning,
    setShowLightning,
    showAllPopovers,
    setShowAllPopovers,
  };
  return state;
}

function useStatusState() {
  const [showSpinner, setShowSpinner] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const state = { showSpinner, setShowSpinner, showSuccess, setShowSuccess, isPaused, setIsPaused };
  return state;
}

function useTransformState() {
  const command = useCommandState();
  const appendix = useAppendixState();
  const status = useStatusState();
  const hasStarted = useRef(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);
  const pausedState = useRef<PausedState | null>(null);
  const refs = { hasStarted, animationRef, pausedState };
  const state = Object.assign({}, command, appendix, status, refs);
  return state;
}

type TransformState = ReturnType<typeof useTransformState>;
type StartAppendix = (startIndex: number) => void;

function useClearAnimations({ animationRef }: TransformState) {
  const clear = useCallback(() => {
    if (!animationRef.current) return;
    clearInterval(animationRef.current);
    animationRef.current = null;
  }, []);
  return clear;
}

function completeAppendix(state: TransformState, clear: () => void, onComplete?: () => void) {
  clear();
  state.setPhase("complete");
  state.setShowAllPopovers(true);
  onComplete?.();
  setTimeout(() => state.setShowLightning(true), 100);
}

function useAppendixAnimation(state: TransformState, clear: () => void, onComplete?: () => void) {
  const animate = useCallback(
    (startIndex: number) => {
      let lineIndex = startIndex;
      state.animationRef.current = setInterval(() => {
        if (lineIndex < APPENDIX_CONTENT.length) {
          state.setAppendixLines(lineIndex + 1);
          lineIndex++;
          return;
        }
        completeAppendix(state, clear, onComplete);
      }, 25);
    },
    [clear],
  );
  return animate;
}

function showCheckResult(state: TransformState, animate: StartAppendix) {
  state.setShowSpinner(false);
  state.setShowSuccess(true);
  setTimeout(() => {
    state.setPhase("step3");
    state.setActiveStep(3);
    animate(0);
  }, 200);
}

function startChecking(state: TransformState, clear: () => void, animate: StartAppendix) {
  clear();
  setTimeout(() => {
    state.setPhase("checking");
    state.setShowSpinner(true);
    setTimeout(() => showCheckResult(state, animate), 350);
  }, 60);
}

function typeCommandFrom(
  state: TransformState,
  start: number,
  clear: () => void,
  animate: StartAppendix,
) {
  let charIndex = start;
  state.animationRef.current = setInterval(() => {
    if (charIndex < COMMAND.length) {
      state.setTypedCommand(COMMAND.slice(0, charIndex + 1));
      charIndex++;
      return;
    }
    startChecking(state, clear, animate);
  }, 10);
}

function useTypingCommand(state: TransformState, clear: () => void, animate: StartAppendix) {
  const start = useCallback(() => {
    state.setPhase("step2");
    state.setActiveStep(2);
    typeCommandFrom(state, 0, clear, animate);
  }, [clear, animate]);
  return start;
}

function useResetState(state: TransformState, clear: () => void) {
  const reset = useCallback(() => {
    clear();
    state.setTypedCommand("");
    state.setShowSpinner(false);
    state.setShowSuccess(false);
    state.setAppendixLines(0);
    state.setShowLightning(false);
  }, [clear]);
  return reset;
}

function useStartAnimation(state: TransformState, reset: () => void, startTyping: () => void) {
  const start = useCallback(() => {
    reset();
    state.setPhase("step1");
    state.setActiveStep(1);
    setTimeout(startTyping, 400);
  }, [reset, startTyping]);
  return start;
}

function resumeSavedState(
  state: TransformState,
  saved: PausedState,
  clear: () => void,
  animate: StartAppendix,
) {
  const { phase, typedCommand, appendixLines } = saved;
  const shouldType = phase === "step2" && typedCommand.length < COMMAND.length;
  if (shouldType) {
    typeCommandFrom(state, typedCommand.length, clear, animate);
    return;
  }
  const shouldAppend = phase === "step3" && appendixLines < APPENDIX_CONTENT.length;
  if (shouldAppend) animate(appendixLines);
}

function useResumeAnimation(state: TransformState, clear: () => void, animate: StartAppendix) {
  const { isPaused, pausedState, setIsPaused } = state;
  const resume = useCallback(() => {
    const saved = pausedState.current;
    const canResume = isPaused && saved;
    if (!canResume) return;
    setIsPaused(false);
    pausedState.current = null;
    resumeSavedState(state, saved, clear, animate);
  }, [isPaused, clear, animate]);
  return resume;
}

function useAnimationActions(state: TransformState, onComplete?: () => void) {
  const clear = useClearAnimations(state);
  const animate = useAppendixAnimation(state, clear, onComplete);
  const type = useTypingCommand(state, clear, animate);
  const reset = useResetState(state, clear);
  const start = useStartAnimation(state, reset, type);
  const resume = useResumeAnimation(state, clear, animate);
  const actions = { clear, start, resume };
  return actions;
}

function respondToView(
  state: TransformState,
  inView: boolean,
  shouldAnimate: boolean,
  actions: ReturnType<typeof useAnimationActions>,
) {
  const shouldRespond = inView && shouldAnimate;
  if (!shouldRespond) return;
  if (!state.hasStarted.current) {
    state.hasStarted.current = true;
    actions.start();
    return;
  }
  if (state.isPaused) actions.resume();
}

function useImmediateCompletion(state: TransformState, shouldAnimate: boolean) {
  useEffect(() => {
    const shouldComplete = !shouldAnimate && !state.hasStarted.current;
    if (!shouldComplete) return;
    state.hasStarted.current = true;
    state.setPhase("complete");
    state.setTypedCommand(COMMAND);
    state.setAppendixLines(APPENDIX_CONTENT.length);
    state.setActiveStep(3);
    state.setShowAllPopovers(true);
    state.setShowLightning(true);
    state.setShowSuccess(true);
  }, [shouldAnimate]);
}

const PHASES: Record<number, AnimationPhase> = { 1: "step1", 2: "step2", 3: "step3" };

function selectStep(state: TransformState, step: number, clear: () => void) {
  clear();
  const { phase, typedCommand, appendixLines } = state;
  state.pausedState.current = { phase, typedCommand, appendixLines };
  state.setIsPaused(true);
  state.setShowAllPopovers(false);
  state.setActiveStep(step);
  const targetPhase = PHASES[step];
  if (targetPhase) state.setPhase(targetPhase);
}

function isStepActive(state: TransformState, step: number): boolean {
  const { isPaused, activeStep, showAllPopovers } = state;
  const selected = activeStep === step;
  if (isPaused) return selected;
  if (activeStep >= step) return true;
  return showAllPopovers;
}

function getActiveSteps(state: TransformState) {
  const isStep1Active = isStepActive(state, 1);
  const isStep2Active = isStepActive(state, 2);
  const isStep3Active = isStepActive(state, 3);
  const steps = { isStep1Active, isStep2Active, isStep3Active };
  return steps;
}

function getDisplayState(state: TransformState) {
  const { phase, typedCommand, showSpinner, showSuccess } = state;
  const { appendixLines, activeStep, showLightning, showAllPopovers } = state;
  const display = {
    phase,
    typedCommand,
    showSpinner,
    showSuccess,
    appendixLines,
    activeStep,
    showLightning,
    showAllPopovers,
  };
  return display;
}

export function useTransformAnimation(shouldAnimate: boolean, onComplete?: () => void) {
  const state = useTransformState();
  const actions = useAnimationActions(state, onComplete);
  const { ref: containerRef } = useInView({
    threshold: 0.3,
    onChange: (inView) => respondToView(state, inView, shouldAnimate, actions),
  });
  useImmediateCompletion(state, shouldAnimate);
  const handleStepClick = (step: number) => selectStep(state, step, actions.clear);
  const display = getDisplayState(state);
  const steps = getActiveSteps(state);
  const controls = { containerRef, handleStepClick };
  const animation = Object.assign({}, display, steps, controls);
  return animation;
}
