import { STEPS, STEP_STYLES } from "./constants";
import type { StepIndicatorProps } from "./types";

export const StepIndicator: React.FC<StepIndicatorProps> = ({
  activeStep,
  phase,
  onStepClick,
}) => (
  <ul className="steps w-full">
    {STEPS.map((step, index) => {
      const stepNum = index + 1;
      const isStepComplete =
        activeStep > stepNum || (stepNum === 3 && phase === "complete");
      const isActive = activeStep >= stepNum;
      const stateClass = isActive ? STEP_STYLES.active : STEP_STYLES.inactive;
      const dataContent = isStepComplete ? "\u2713" : stepNum;

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
