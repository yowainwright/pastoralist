import { Component, createRef, Suspense, use, useEffect, useState } from "react";
import { createActorContext } from "@xstate/react";
import { fromTransition } from "xstate";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { Tooltip, TooltipPopup } from "@/components/ui/tooltip";
import { Selectable, SelectionProvider, useSelectedIndex } from "codehike/utils/selection";
import {
  calculateTransitions,
  getStartingSnapshot,
  type TokenTransition,
  type TokenTransitionsSnapshot,
} from "codehike/utils/token-transitions";
import {
  CALLOUT_MOTION,
  CALLOUT_POSITION,
  CALLOUT_STILL_MOTION,
  CALLOUT_VISIBILITY,
  EMPTY_SNAPSHOT,
  SCROLL_TRIGGER_TOP,
  TOKEN_TRANSITIONS,
} from "./constants";
import { findFrameAnchor, loadFrameHtml, selectActiveCallout, walkthroughs } from "./utils";
import { useCalloutCoordinator, useScrollMargin } from "./hooks";
import type {
  AnimatedCodeProps,
  CalloutContentProps,
  CalloutProps,
  CalloutScopeProps,
  CodeFrameProps,
  FramesProps,
  LinkProps,
  PanelFrameProps,
  ScrollyCodeProps,
  ScrollyCodeProviderProps,
  TokenAnimationOptions,
} from "./types";
import "./styles.css";

class AnimatedCode extends Component<AnimatedCodeProps> {
  codeRef = createRef<HTMLDivElement>();

  render() {
    const { html } = this.props;
    const markup = { __html: html };
    return <div ref={this.codeRef} dangerouslySetInnerHTML={markup} />;
  }

  getSnapshotBeforeUpdate() {
    const element = this.codeRef.current;
    if (!element) return EMPTY_SNAPSHOT;
    const snapshot = getStartingSnapshot(element, TOKEN_TRANSITIONS);
    return snapshot;
  }

  componentDidUpdate(
    _previousProps: unknown,
    _previousState: unknown,
    snapshot: TokenTransitionsSnapshot,
  ) {
    const element = this.codeRef.current;
    if (element) animateCode(element, snapshot, TOKEN_TRANSITIONS);
  }

  componentWillUnmount() {
    this.codeRef.current
      ?.getAnimations({ subtree: true })
      .forEach((animation) => animation.cancel());
  }
}

const calloutLogic = fromTransition(selectActiveCallout, null);
const CalloutActor = createActorContext(calloutLogic);

export function ScrollyCodeProvider({ children, contentRef }: ScrollyCodeProviderProps) {
  return (
    <CalloutActor.Provider>
      <CalloutCoordinator contentRef={contentRef} />
      {children}
    </CalloutActor.Provider>
  );
}

export function ScrollyCode({ example }: ScrollyCodeProps) {
  const frames = walkthroughs[example];
  const rootMargin = useScrollMargin(SCROLL_TRIGGER_TOP);
  useEffect(() => {
    const highlights = frames.map(loadFrameHtml);
    void Promise.allSettled(highlights);
  }, [frames]);
  return (
    <SelectionProvider className="scrolly-code not-prose" rootMargin={rootMargin}>
      <WalkthroughNavigation frames={frames} />
      <WalkthroughViewport frames={frames} />
    </SelectionProvider>
  );
}

function CalloutCoordinator({ contentRef }: CalloutScopeProps) {
  const actor = CalloutActor.useActorRef();
  useCalloutCoordinator(contentRef, actor.send, CALLOUT_VISIBILITY.threshold);
  return null;
}

function WalkthroughNavigation({ frames }: FramesProps) {
  const [selectedIndex, onSelect] = useSelectedIndex();
  const links = frames.map((frame, index) => (
    <WalkthroughLink key={frame.id} {...{ frame, index, selectedIndex, onSelect }} />
  ));
  return (
    <nav className="walkthrough-navigation" aria-label="Scrollycode steps">
      {links}
    </nav>
  );
}

function WalkthroughLink({ frame, index, selectedIndex, onSelect }: LinkProps) {
  const href = `#${frame.id}`;
  const isSelected = index === selectedIndex;
  const current = isSelected ? "step" : undefined;
  const handleClick = () => onSelect(index);
  return (
    <a href={href} aria-current={current} onClick={handleClick}>
      {frame.title}
    </a>
  );
}

function WalkthroughViewport({ frames }: FramesProps) {
  const stages = frames.map((frame, index) => (
    <Selectable
      key={frame.id}
      id={frame.id}
      index={index}
      selectOn={["scroll"]}
      className="walkthrough-stage"
    />
  ));
  return (
    <div className="walkthrough-scroll">
      <WalkthroughSizing frames={frames} />
      <div className="walkthrough-stages" aria-hidden="true">
        {stages}
      </div>
      <WalkthroughPanel frames={frames} />
    </div>
  );
}

function WalkthroughPanel({ frames }: FramesProps) {
  const [selectedIndex] = useSelectedIndex();
  const [panel, ref] = useState<HTMLElement | null>(null);
  const id = frames[0].id;
  const visible = CalloutActor.useSelector((snapshot) => snapshot.context === id);
  const frame = frames[selectedIndex];
  const position = `${selectedIndex + 1} / ${frames.length}`;
  const descriptionId = `${frame.id}-callout`;
  const { title } = frame;
  const section = { ref, "aria-label": title, "aria-describedby": descriptionId };
  const callout = { frame, panel, visible };
  return (
    <section {...section} data-callout-id={id} className="walkthrough-panel">
      <WalkthroughFrame frame={frame} position={position} descriptionId={descriptionId} />
      <WalkthroughCallout {...callout} />
    </section>
  );
}

function WalkthroughSizing({ frames }: FramesProps) {
  const sizes = frames.map((frame, index) => {
    const position = `${index + 1} / ${frames.length}`;
    return <WalkthroughFrame key={frame.id} frame={frame} position={position} />;
  });
  return (
    <div className="walkthrough-sizing" aria-hidden="true" inert>
      {sizes}
    </div>
  );
}

function WalkthroughFrame({ frame, position, descriptionId }: PanelFrameProps) {
  return (
    <div className="walkthrough-frame">
      <header className="walkthrough-header">
        <span>{frame.filename}</span>
        <span>{position}</span>
      </header>
      <div className="walkthrough-code shiki-wrapper" data-language={frame.lang}>
        <Suspense fallback={<pre>Loading output…</pre>}>
          <WalkthroughCode frame={frame} />
        </Suspense>
      </div>
      <p id={descriptionId} className="walkthrough-note">
        {frame.note}
      </p>
    </div>
  );
}

function WalkthroughCallout({ frame, panel, visible }: CalloutProps) {
  return (
    <Tooltip open={visible}>
      <TooltipPrimitive.Portal container={panel} className="scrolly-tooltip-portal">
        <Suspense fallback={null}>
          <WalkthroughCalloutSlide frame={frame} panel={panel} />
        </Suspense>
      </TooltipPrimitive.Portal>
    </Tooltip>
  );
}

function WalkthroughCalloutContent({ frame, panel }: CalloutContentProps) {
  use(loadFrameHtml(frame));
  const anchor = () => findFrameAnchor(panel, frame);
  const isCommand = frame.lang === "bash";
  const side = isCommand ? "bottom" : CALLOUT_POSITION.side;
  const position = Object.assign({}, CALLOUT_POSITION, { anchor, side });
  return (
    <TooltipPrimitive.Positioner
      {...position}
      className="scrolly-tooltip-positioner w-[22vw] min-w-44 max-w-72"
    >
      <TooltipPopup className="scrolly-code-callout w-full px-4 py-3 text-sm leading-relaxed data-open:animate-pop-in data-closed:animate-none">
        <p>{frame.note}</p>
      </TooltipPopup>
    </TooltipPrimitive.Positioner>
  );
}

function WalkthroughCalloutSlide({ frame, panel }: CalloutContentProps) {
  const reducedMotion = useReducedMotion();
  const animation = reducedMotion ? CALLOUT_STILL_MOTION : CALLOUT_MOTION;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={frame.id} className="scrolly-tooltip-slide" {...animation}>
        <WalkthroughCalloutContent frame={frame} panel={panel} />
      </motion.div>
    </AnimatePresence>
  );
}

function WalkthroughCode({ frame }: CodeFrameProps) {
  const html = use(loadFrameHtml(frame));
  return <AnimatedCode html={html} />;
}

function animateCode(
  element: HTMLElement,
  snapshot: TokenTransitionsSnapshot,
  options: TokenAnimationOptions,
) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion) return;
  const transitions = calculateTransitions(element, snapshot, options);
  transitions.forEach((transition) => animateToken(transition, options.duration));
}

function animateToken({ element, keyframes, options }: TokenTransition, durationMs: number) {
  const { duration: durationRatio, delay: delayRatio, easing } = options;
  const duration = durationRatio * durationMs;
  const delay = delayRatio * durationMs;
  const settings = { duration, delay, easing, fill: "both" } as const;
  const frames = createKeyframes(keyframes);
  element.animate(frames, settings);
}

function createKeyframes({ translateX, translateY, ...rest }: TokenTransition["keyframes"]) {
  const keyframes: PropertyIndexedKeyframes = rest;
  const hasTranslation = translateX && translateY;
  if (!hasTranslation) return keyframes;
  keyframes.translate = [
    `${translateX[0]}px ${translateY[0]}px`,
    `${translateX[1]}px ${translateY[1]}px`,
  ];
  return keyframes;
}
