export interface TerminalTab {
  id: string;
  label: string;
}

export interface TerminalWindowProps {
  isActive?: boolean;
  minHeight?: string;
  fileName?: string;
  tabs?: TerminalTab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  hideHeader?: boolean;
  footer?: React.ReactNode;
  footerClassName?: string;
  children: React.ReactNode;
  className?: string;
}
