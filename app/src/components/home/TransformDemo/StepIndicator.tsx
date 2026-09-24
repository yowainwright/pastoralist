import { STEPS, STEP_STYLES } from "./constants";
import type { StepIndicatorProps } from "./types";

const isFinalStepComplete = (stepNum: number, phase: string): boolean => {
  const isFinalStep = stepNum === 3;
  if (!isFinalStep) return false;
  const complete = phase === "complete";
  return complete;
};

const isStepComplete = (activeStep: number, stepNum: number, phase: string): boolean => {
  if (activeStep > stepNum) return true;
  const complete = isFinalStepComplete(stepNum, phase);
  return complete;
};

export const StepIndicator: React.FC<StepIndicatorProps> = ({ activeStep, phase, onStepClick }) => (
  <ul className="steps w-full">
    {STEPS.map((step, index) => (
      <Step
        key={index}
        step={step}
        index={index}
        activeStep={activeStep}
        phase={phase}
        onStepClick={onStepClick}
      />
    ))}
  </ul>
);

interface StepProps extends StepIndicatorProps {
  step: string;
  index: number;
}

function Step({ step, index, activeStep, phase, onStepClick }: StepProps) {
  const stepNum = index + 1;
  const stepComplete = isStepComplete(activeStep, stepNum, phase);
  const isActive = activeStep >= stepNum;
  const stateClass = isActive ? STEP_STYLES.active : STEP_STYLES.inactive;
  const dataContent = stepComplete ? "\u2713" : stepNum;

  return (
    <li
      className={`${STEP_STYLES.base} ${stateClass}`}
      onClick={() => onStepClick(stepNum)}
      data-content={dataContent}
    >
      {step}
    </li>
  );
}
