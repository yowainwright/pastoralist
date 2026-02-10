import { Popover } from "./Popover";
import { BeforeTerminal } from "./BeforeTerminal";
import { CLITerminal } from "./CLITerminal";
import { AfterTerminal } from "./AfterTerminal";
import { STEP_POPOVERS, STEPS, APPENDIX_CONTENT, COMMAND } from "./constants";

export function TransformDemoStatic() {
  return (
    <div className="flex flex-col gap-12">
      <ul className="steps w-full">
        {STEPS.map((step, index) => {
          const baseClass =
            "step cursor-pointer transition-all duration-200 text-base-content";
          const activeClass =
            "step-primary [&::before]:!bg-gradient-to-b [&::before]:!from-blue-400 [&::before]:!to-blue-500 [&::before]:shadow-md [&::before]:shadow-blue-500/25 [&::before]:!text-white [&::before]:!border [&::before]:!border-solid [&::before]:!border-[var(--step-bg)] [&::before]:!border-l-0 [&::before]:!border-r-0 [&::before]:!w-[calc(100%-29px)] [&::before]:!z-[999] [&::after]:!bg-blue-500";
          const dataContent = "✓";

          return (
            <li
              key={index}
              className={`${baseClass} ${activeClass}`}
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
              visible={true}
            />
            <div className="flex items-center gap-2 mb-3">
              <span className="text-base-content/60 text-sm">
                Undocumented overrides
              </span>
              <span className="badge badge-lg text-white bg-gradient-to-b from-red-400 to-red-500 border-2 border-red-600 shadow-md shadow-red-500/25">
                Before
              </span>
            </div>
            <BeforeTerminal isActive={true} />
          </div>

          <div className="relative">
            <Popover
              stepNumber={2}
              title={STEP_POPOVERS[1].title}
              description={STEP_POPOVERS[1].description}
              visible={true}
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
              isActive={true}
              typedCommand={COMMAND}
              phase="complete"
              showSpinner={false}
              showSuccess={true}
            />
          </div>
        </div>

        <div className="relative flex flex-col">
          <Popover
            stepNumber={3}
            title={STEP_POPOVERS[2].title}
            description={STEP_POPOVERS[2].description}
            visible={true}
            showEmoji={true}
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
            isActive={true}
            appendixLines={APPENDIX_CONTENT.length}
          />
        </div>
      </div>
    </div>
  );
}
