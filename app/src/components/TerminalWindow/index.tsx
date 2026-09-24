import type { TerminalWindowProps } from "./types";
import { STYLES } from "./constants";
import { cn } from "@/lib/utils";

export type { TerminalTab, TerminalWindowProps } from "./types";
export { STYLES } from "./constants";

function getWindowProps({ isActive = false, height, minHeight, className }: TerminalWindowProps) {
  const activeClass = isActive ? STYLES.windowActive : "";
  const baseClass = className ?? STYLES.window;
  const windowClass = cn(baseClass, "transition-shadow duration-300", activeClass);
  const size = { height, minHeight };
  const hasSize = Boolean(height || minHeight);
  const style = hasSize ? size : undefined;
  const props = { className: windowClass, style };
  return props;
}

export const TerminalWindow: React.FC<TerminalWindowProps> = (props) => {
  const { hideHeader, children, footer, footerClassName } = props;
  const windowProps = getWindowProps(props);
  return (
    <div {...windowProps}>
      {!hideHeader && <TerminalHeader {...props} />}
      {children}
      {footer && <div className={cn(STYLES.footer, footerClassName)}>{footer}</div>}
    </div>
  );
};

function TerminalHeader({ tabs, fileName, activeTab, onTabChange }: TerminalWindowProps) {
  const hasTabs = tabs && tabs.length > 0;
  const headerClass = hasTabs ? STYLES.headerWithTabs : STYLES.header;
  const label = fileName ?? "terminal";

  return (
    <div className={headerClass}>
      <div className={STYLES.dots}>
        <div className={STYLES.dotRed} />
        <div className={STYLES.dotYellow} />
        <div className={STYLES.dotGreen} />
        <span className={STYLES.label}>{label}</span>
      </div>

      {hasTabs && <TerminalTabs tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />}
    </div>
  );
}

type TerminalTabsProps = Pick<TerminalWindowProps, "activeTab" | "onTabChange"> & {
  tabs: NonNullable<TerminalWindowProps["tabs"]>;
};

function TerminalTabs({ tabs, activeTab, onTabChange }: TerminalTabsProps) {
  return (
    <div className={STYLES.tabs}>
      {tabs.map((tab) => {
        const isTabActive = tab.id === activeTab;
        const tabClass = isTabActive ? STYLES.tabActive : STYLES.tab;

        return (
          <button key={tab.id} onClick={() => onTabChange?.(tab.id)} className={tabClass}>
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export const TerminalLoader: React.FC<{ minHeight?: string }> = ({ minHeight }) => (
  <TerminalWindow className={STYLES.loader} minHeight={minHeight}>
    <div className={STYLES.content}>
      <div className={`${STYLES.loaderBar} w-3/4 mb-2`} />
      <div className={`${STYLES.loaderBar} w-1/2 mb-2`} />
      <div className={`${STYLES.loaderBar} w-2/3`} />
    </div>
  </TerminalWindow>
);
