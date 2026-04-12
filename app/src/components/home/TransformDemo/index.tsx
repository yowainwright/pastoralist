import type { TransformDemoProps } from "./types";
import { STEP_POPOVERS, BADGE_STYLES } from "./constants";
import { Popover } from "./Popover";
import { BeforeTerminal } from "./BeforeTerminal";
import { CLITerminal } from "./CLITerminal";
import { AfterTerminal } from "./AfterTerminal";
import { StepIndicator } from "./StepIndicator";
import { useTransformAnimation } from "./useTransformAnimation";

export function TransformDemo({
  shouldAnimate = true,
  onComplete,
}: TransformDemoProps) {
  const {
    containerRef,
    phase,
    typedCommand,
    showSpinner,
    showSuccess,
    appendixLines,
    activeStep,
    showLightning,
    isStep1Active,
    isStep2Active,
    isStep3Active,
    handleStepClick,
  } = useTransformAnimation(shouldAnimate, onComplete);

  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      <StepIndicator
        activeStep={activeStep}
        phase={phase}
        onStepClick={handleStepClick}
      />

      <div className="h-6 w-px bg-primary/20 mx-auto" />

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
              <span className={BADGE_STYLES.before}>Before</span>
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
              <span className={BADGE_STYLES.cli}>CLI</span>
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
            <span className={BADGE_STYLES.after}>After</span>
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
