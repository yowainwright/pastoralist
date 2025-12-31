import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface CheckListProps {
  isVisible: boolean;
}

export function CheckList({ isVisible }: CheckListProps) {
  return (
    <ul className="mt-6 divide-y divide-base-content/10 border-y border-base-content/10 text-base-content/80">
      <CheckListItem delay={0} visible={isVisible}>
        Tracks override dependencies
      </CheckListItem>
      <CheckListItem delay={150} visible={isVisible}>
        Documents security fixes with CVE references
      </CheckListItem>
      <CheckListItem delay={300} visible={isVisible}>
        Cleans up orphaned overrides
      </CheckListItem>
      <CheckListItem delay={450} visible={isVisible}>
        Works with npm, yarn, pnpm, and bun
      </CheckListItem>
    </ul>
  );
}

interface CheckListItemProps {
  children: React.ReactNode;
  delay: number;
  visible: boolean;
}

function CheckListItem({ children, delay, visible }: CheckListItemProps) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const timer = setTimeout(() => setShow(true), delay);
    return () => clearTimeout(timer);
  }, [visible, delay]);

  return (
    <li className="flex items-start gap-3 py-3">
      <span
        className={`check-icon mt-0.5 transition-all duration-300 ${
          show ? "opacity-100 scale-100" : "opacity-0 scale-50"
        }`}
      >
        <Check className="w-5 h-5" />
      </span>
      <span
        className={`transition-all duration-300 ${
          show ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2"
        }`}
        style={{ transitionDelay: `${50}ms` }}
      >
        {children}
      </span>
    </li>
  );
}
