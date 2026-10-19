import type { TokenTransitionsSnapshot } from "codehike/utils/token-transitions";

export const TOKEN_TRANSITIONS = {
  selector: ".line > span, .line:not(:has(span))",
  duration: 700,
};
export const EMPTY_SNAPSHOT: TokenTransitionsSnapshot = [];
export const SCROLL_TRIGGER_TOP = 160;
export const CALLOUT_VISIBILITY = { threshold: 0.25 };
const calloutCollisions = { side: "flip", align: "shift", fallbackAxisSide: "end" } as const;
export const CALLOUT_POSITION = {
  side: "right",
  align: "center",
  sideOffset: 12,
  collisionPadding: 16,
  collisionAvoidance: calloutCollisions,
  positionMethod: "absolute",
} as const;

const calloutHidden = { opacity: 0 };
const calloutVisible = { opacity: 1 };
const calloutTransition = { duration: 0.18 };
const calloutStillTransition = { duration: 0 };
export const CALLOUT_MOTION = {
  initial: calloutHidden,
  animate: calloutVisible,
  exit: calloutHidden,
  transition: calloutTransition,
};
export const CALLOUT_STILL_MOTION = {
  initial: false,
  animate: calloutVisible,
  exit: calloutVisible,
  transition: calloutStillTransition,
} as const;
