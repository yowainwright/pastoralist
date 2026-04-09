import { motion } from "framer-motion";
import { Check } from "lucide-react";

const ITEMS = [
  "Tracks override dependencies",
  "Documents security fixes with CVE references",
  "Cleans up orphaned overrides",
  "Works with npm, yarn, pnpm, and bun",
] as const;

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
      {ITEMS.map((text, i) => (
        <motion.li
          key={text}
          className={styles.item}
          initial={{ opacity: 0, x: -8 }}
          animate={isVisible ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.3, delay: i * 0.15, ease: "easeOut" }}
        >
          <motion.span
            className={styles.icon}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.3, delay: i * 0.15, ease: "easeOut" }}
          >
            <Check className="w-5 h-5" />
          </motion.span>
          <span>{text}</span>
        </motion.li>
      ))}
    </ul>
  );
}
