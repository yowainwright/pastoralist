import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function isStaticRender(): boolean {
  if (typeof document === "undefined") return true;
  return document.getElementById("root")?.dataset.prerendered === "true";
}
