import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";
import { isStaticRender } from "@/lib/utils";

interface UseFadeInUpOptions {
  threshold?: number;
  triggerOnce?: boolean;
  initialInView?: boolean;
  onChange?: (inView: boolean, entry: IntersectionObserverEntry) => void;
}

export function useFadeInUp(options: UseFadeInUpOptions = {}) {
  const { threshold = 0.1, triggerOnce = true, initialInView, onChange } = options;

  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
    onChange,
    initialInView: initialInView ?? isStaticRender(),
  });

  return { ref, isVisible: inView };
}

export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setHasHydrated(true);
  }, []);

  return hasHydrated;
}
