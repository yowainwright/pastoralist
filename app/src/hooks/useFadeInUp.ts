import { useInView } from "react-intersection-observer";
import { isStaticRender } from "@/lib/utils";

interface UseFadeInUpOptions {
  threshold?: number;
  triggerOnce?: boolean;
  onChange?: (inView: boolean, entry: IntersectionObserverEntry) => void;
}

export function useFadeInUp(options: UseFadeInUpOptions = {}) {
  const { threshold = 0.1, triggerOnce = true, onChange } = options;

  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
    onChange,
    initialInView: isStaticRender(),
  });

  return { ref, isVisible: inView };
}
