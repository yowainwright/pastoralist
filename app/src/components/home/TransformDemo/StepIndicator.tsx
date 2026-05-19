import { STEPS, STEP_STYLES } from "./constants";
import type { StepIndicatorProps } from "./types";

const isFinalStepComplete = (stepNum: number, phase: string): boolean => {
  const isFinalStep = stepNum === 3;
  if (!isFinalStep) return false;
  return phase === "complete";
};

const isStepComplete = (activeStep: number, stepNum: number, phase: string): boolean => {
  if (activeStep > stepNum) return true;
  return isFinalStepComplete(stepNum, phase);
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({ activeStep, phase, onStepClick }) => (
  <ul className="steps w-full">
    {STEPS.map((step, index) => {
      const stepNum = index + 1;
      const stepComplete = isStepComplete(activeStep, stepNum, phase);
      const isActive = activeStep >= stepNum;
      const stateClass = isActive ? STEP_STYLES.active : STEP_STYLES.inactive;
      const dataContent = stepComplete ? "\u2713" : stepNum;

      return (
        <li
          key={index}
          className={`${STEP_STYLES.base} ${stateClass}`}
          onClick={() => onStepClick(stepNum)}
          data-content={dataContent}
        >
          {step}
        </li>
      );
    })}
  </ul>
);
