import { useSyncExternalStore } from "react";
import { useInView } from "react-intersection-observer";

const subscribeToHydration = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

interface UseFadeInUpOptions {
  threshold?: number;
  triggerOnce?: boolean;
  initialInView?: boolean;
  onChange?: (inView: boolean, entry: IntersectionObserverEntry) => void;
}

export function useFadeInUp(options: UseFadeInUpOptions = {}) {
  const { threshold = 0.1, triggerOnce = true, initialInView, onChange } = options;
  const hasHydrated = useHasHydrated();
  const initiallyVisible = initialInView ?? !hasHydrated;

  const { ref, inView } = useInView({
    threshold,
    triggerOnce,
    onChange,
    initialInView: initiallyVisible,
  });

  const result = { ref, isVisible: inView };
  return result;
}

export function useHasHydrated() {
  const result = useSyncExternalStore(subscribeToHydration, getClientSnapshot, getServerSnapshot);
  return result;
}
