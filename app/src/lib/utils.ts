import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

interface PrerenderRoot {
  dataset: {
    prerendered?: string;
  };
}

export const capturePrerenderState = (rootElement: PrerenderRoot | null): boolean =>
  rootElement?.dataset.prerendered === "true";

export function cn(...inputs: ClassValue[]) {
  const result = twMerge(clsx(inputs));
  return result;
}

export function isStaticRender(): boolean {
  if (typeof document === "undefined") return true;
  const result = capturePrerenderState(document.getElementById("root"));
  return result;
}

export function clearPrerenderMarker(rootElement: PrerenderRoot): void {
  delete rootElement.dataset.prerendered;
}
