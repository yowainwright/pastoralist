interface Step {
  label: string;
  isActive: boolean;
  isComplete: boolean;
  onClick: () => void;
}

interface StepperProps {
  steps: Step[];
}

export function Stepper({ steps }: StepperProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="relative flex items-center justify-between">
        {/* Background line that connects all circles */}
        <div className="absolute inset-0 flex items-center z-0">
          <div className="w-full h-1 bg-base-content/20"></div>
        </div>

        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isStepComplete = step.isComplete;
          const isActive = step.isActive;

          return (
            <div
              key={index}
              className="relative flex flex-col items-center z-10"
            >
              {/* Circle */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 border-2 cursor-pointer relative
                  ${
                    isActive
                      ? "bg-gradient-to-b from-blue-400 to-blue-500 border-blue-600 text-white shadow-md shadow-blue-500/25"
                      : "border-base-content/20 text-base-content bg-base-100 hover:border-base-content/40"
                  }
                `}
                onClick={step.onClick}
              >
                {/* Progress line overlay that goes through the circle */}
                {isActive && index < steps.length - 1 && (
                  <div className="absolute left-4 top-1/2 w-screen h-1 bg-blue-500 -translate-y-1/2 z-0"></div>
                )}

                <span className="relative z-10">
                  {isStepComplete ? (
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    stepNum
                  )}
                </span>
              </div>

              {/* Label */}
              <span
                className={`
                  mt-3 text-sm transition-all duration-200 text-center max-w-24 leading-tight cursor-pointer
                  ${
                    isActive
                      ? "text-base-content font-medium"
                      : "text-base-content/70"
                  }
                `}
                onClick={step.onClick}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
