import { motion, type Transition } from "framer-motion";
import { Check } from "lucide-react";

const ITEMS = [
  "Tracks override dependencies",
  "Documents security fixes with CVE references",
  "Cleans up orphaned overrides",
  "Works with npm, yarn, pnpm, and bun",
] as const;

const INITIAL_X = -8;

const styles = {
  list: "mt-6 divide-y divide-base-content/10 border-y border-base-content/10 text-base-content/80",
  item: "flex items-start gap-3 py-3",
  icon: "check-icon mt-0.5",
} as const;

interface CheckListProps {
  isVisible: boolean;
}

export function CheckList({ isVisible }: CheckListProps) {
  return (
    <ul className={styles.list}>
      {ITEMS.map((text, index) => (
        <CheckItem key={text} text={text} index={index} isVisible={isVisible} />
      ))}
    </ul>
  );
}

interface CheckItemProps extends CheckListProps {
  text: string;
  index: number;
}

function CheckItem({ text, index, isVisible }: CheckItemProps) {
  const delay = index * 0.15;
  const transition: Transition = { duration: 0.3, delay, ease: "easeOut" };
  return (
    <motion.li
      className={styles.item}
      initial={{ opacity: 0, x: INITIAL_X }}
      animate={isVisible ? { opacity: 1, x: 0 } : {}}
      transition={transition}
    >
      <CheckIcon isVisible={isVisible} transition={transition} />
      <span>{text}</span>
    </motion.li>
  );
}

interface CheckIconProps extends CheckListProps {
  transition: Transition;
}

function CheckIcon({ isVisible, transition }: CheckIconProps) {
  return (
    <motion.span
      className={styles.icon}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isVisible ? { opacity: 1, scale: 1 } : {}}
      transition={transition}
    >
      <Check className="w-5 h-5" />
    </motion.span>
  );
}
