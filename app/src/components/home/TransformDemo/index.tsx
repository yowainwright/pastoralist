import type { TransformDemoProps } from "./types";
import { STEP_POPOVERS, BADGE_STYLES } from "./constants";
import { Popover } from "./Popover";
import { BeforeTerminal } from "./BeforeTerminal";
import { CLITerminal } from "./CLITerminal";
import { AfterTerminal } from "./AfterTerminal";
import { StepIndicator } from "./StepIndicator";
import { useTransformAnimation } from "./useTransformAnimation";

export function TransformDemo({ shouldAnimate = true, onComplete }: TransformDemoProps) {
  const state = useTransformAnimation(shouldAnimate, onComplete);
  const { containerRef, phase, activeStep, handleStepClick } = state;
  return (
    <div ref={containerRef} className="flex flex-col gap-6">
      <StepIndicator activeStep={activeStep} phase={phase} onStepClick={handleStepClick} />
      <div className="h-6 w-px bg-primary/20 mx-auto" />
      <TransformPanels state={state} />
    </div>
  );
}

type TransformPanelsProps = { state: ReturnType<typeof useTransformAnimation> };

function TransformPanels({ state }: TransformPanelsProps) {
  const { isStep1Active, isStep3Active, showLightning, appendixLines } = state;
  const afterProps = { isStep3Active, showLightning, appendixLines };
  return (
    <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
      <div className="flex flex-col gap-4">
        <BeforePanel isStep1Active={isStep1Active} />

        <CliPanel state={state} />
      </div>

      <AfterPanel {...afterProps} />
    </div>
  );
}

interface BeforePanelProps {
  isStep1Active: boolean;
}
function BeforePanel({ isStep1Active }: BeforePanelProps) {
  return (
    <div className="relative flex flex-col">
      <Popover stepNumber={1} {...STEP_POPOVERS[0]} visible={isStep1Active} />
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base-content/60 text-sm">Undocumented overrides</span>
        <span className={BADGE_STYLES.before}>Before</span>
      </div>
      <BeforeTerminal isActive={isStep1Active} />
    </div>
  );
}

interface CliPanelProps {
  state: ReturnType<typeof useTransformAnimation>;
}
function CliPanel({ state }: CliPanelProps) {
  const { isStep2Active, typedCommand, phase, showSpinner, showSuccess } = state;
  const cliProps = { isActive: isStep2Active, typedCommand, phase, showSpinner, showSuccess };
  return (
    <div className="relative">
      <Popover stepNumber={2} {...STEP_POPOVERS[1]} visible={isStep2Active} />
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base-content/60 text-sm">Execute the pastoralist cli</span>
        <span className={BADGE_STYLES.cli}>CLI</span>
      </div>
      <CLITerminal {...cliProps} />
    </div>
  );
}

interface AfterPanelProps {
  isStep3Active: boolean;
  showLightning: boolean;
  appendixLines: number;
}
function AfterPanel({ isStep3Active, showLightning, appendixLines }: AfterPanelProps) {
  return (
    <div className="relative flex flex-col">
      <Popover
        stepNumber={3}
        {...STEP_POPOVERS[2]}
        visible={isStep3Active}
        showEmoji={showLightning}
        verticalCenter
      />
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base-content/60 text-sm">Documented overrides</span>
        <span className={BADGE_STYLES.after}>After</span>
      </div>
      <AfterTerminal isActive={isStep3Active} appendixLines={appendixLines} />
    </div>
  );
}
