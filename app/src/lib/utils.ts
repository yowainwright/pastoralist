import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

interface PrerenderRoot {
  dataset: {
    prerendered?: string;
  };
}

export const capturePrerenderState = (rootElement: PrerenderRoot | null): boolean =>
  rootElement?.dataset.prerendered === "true";

const wasPrerendered =
  typeof document === "undefined" || capturePrerenderState(document.getElementById("root"));

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isStaticRender(): boolean {
  return wasPrerendered;
}

export function clearPrerenderMarker(rootElement: PrerenderRoot): void {
  delete rootElement.dataset.prerendered;
}
