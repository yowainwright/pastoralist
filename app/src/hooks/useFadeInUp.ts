import { useInView } from "react-intersection-observer";

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
  });

  return { ref, isVisible: inView };
}
