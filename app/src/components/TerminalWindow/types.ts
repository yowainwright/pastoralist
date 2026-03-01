export interface TerminalTab {
  id: string;
  label: string;
}

export interface TerminalWindowProps {
  isActive?: boolean;
  minHeight?: string;
  height?: string;
  fileName?: string;
  tabs?: TerminalTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  hideHeader?: boolean;
  children: React.ReactNode;
  className?: string;
}
