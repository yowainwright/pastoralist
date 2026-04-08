import type { TerminalWindowProps } from "./types";
import { STYLES } from "./constants";

export type { TerminalTab, TerminalWindowProps } from "./types";
export { STYLES } from "./constants";

export const TerminalWindow: React.FC<TerminalWindowProps> = ({
  isActive = false,
  minHeight,
  fileName,
  tabs,
  activeTab,
  onTabChange,
  hideHeader = false,
  children,
  className,
}) => {
  const activeClass = isActive ? STYLES.windowActive : "";
  const baseClass = className ?? STYLES.window;
  const windowClass =
    `${baseClass} transition-all duration-300 ${activeClass}`.trim();
  const style = minHeight ? { minHeight } : undefined;
  const hasTabs = tabs && tabs.length > 0;
  const headerClass = hasTabs ? STYLES.headerWithTabs : STYLES.header;
  const label = fileName ?? "terminal";

  return (
    <div className={windowClass} style={style}>
      {!hideHeader && (
        <div className={headerClass}>
          <div className={STYLES.dots}>
            <div className={STYLES.dotRed} />
            <div className={STYLES.dotYellow} />
            <div className={STYLES.dotGreen} />
            <span className={STYLES.label}>{label}</span>
          </div>

          {hasTabs && (
            <div className={STYLES.tabs}>
              {tabs.map((tab) => {
                const isTabActive = tab.id === activeTab;
                const tabClass = isTabActive ? STYLES.tabActive : STYLES.tab;

                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange?.(tab.id)}
                    className={tabClass}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export const TerminalLoader: React.FC<{ minHeight?: string }> = ({
  minHeight,
}) => (
  <TerminalWindow className={STYLES.loader} minHeight={minHeight}>
    <div className={STYLES.content}>
      <div className={`${STYLES.loaderBar} w-3/4 mb-2`} />
      <div className={`${STYLES.loaderBar} w-1/2 mb-2`} />
      <div className={`${STYLES.loaderBar} w-2/3`} />
    </div>
  </TerminalWindow>
);
