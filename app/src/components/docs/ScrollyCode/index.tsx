import { Component, createRef, Suspense, use, useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip";
import { Tooltip, TooltipPopup } from "@/components/ui/tooltip";
import { Selectable, SelectionProvider, useSelectedIndex } from "codehike/utils/selection";
import {
  getStartingSnapshot,
  type TokenTransitionsSnapshot,
} from "codehike/utils/token-transitions";
import {
  CALLOUT_MOTION,
  CALLOUT_POSITION,
  CALLOUT_STILL_MOTION,
  CALLOUT_VISIBILITY,
  CalloutActor,
  EMPTY_SNAPSHOT,
  SCROLL_TRIGGER_TOP,
  TOKEN_TRANSITIONS,
  walkthroughs,
} from "./constants";
import {
  animateCode,
  findFrameAnchor,
  loadFrameHtml,
  useCalloutCoordinator,
  useScrollMargin,
} from "./utils";
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
  const callout = { frame, panel, visible, descriptionId };
  return (
    <section {...section} data-callout-id={id} className="walkthrough-panel">
      <WalkthroughFrame frame={frame} position={position} />
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

function WalkthroughFrame({ frame, position }: PanelFrameProps) {
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
    </div>
  );
}

function WalkthroughCallout({ frame, panel, visible, descriptionId }: CalloutProps) {
  return (
    <Tooltip open={visible}>
      <TooltipPrimitive.Portal container={panel} className="scrolly-tooltip-portal">
        <Suspense fallback={null}>
          <WalkthroughCalloutSlide frame={frame} panel={panel} descriptionId={descriptionId} />
        </Suspense>
      </TooltipPrimitive.Portal>
    </Tooltip>
  );
}

function WalkthroughCalloutContent({ frame, panel, descriptionId }: CalloutContentProps) {
  use(loadFrameHtml(frame));
  const anchor = () => findFrameAnchor(panel, frame);
  const isCommand = frame.lang === "bash";
  const side = isCommand ? "bottom" : CALLOUT_POSITION.side;
  const position = Object.assign({}, CALLOUT_POSITION, { anchor, side });
  return (
    <TooltipPrimitive.Positioner {...position} className="scrolly-tooltip-positioner">
      <TooltipPopup id={descriptionId} className="scrolly-code-callout">
        <p>{frame.note}</p>
      </TooltipPopup>
    </TooltipPrimitive.Positioner>
  );
}

function WalkthroughCalloutSlide({ frame, panel, descriptionId }: CalloutContentProps) {
  const reducedMotion = useReducedMotion();
  const animation = reducedMotion ? CALLOUT_STILL_MOTION : CALLOUT_MOTION;
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={frame.id} className="scrolly-tooltip-slide" {...animation}>
        <WalkthroughCalloutContent frame={frame} panel={panel} descriptionId={descriptionId} />
      </motion.div>
    </AnimatePresence>
  );
}

function WalkthroughCode({ frame }: CodeFrameProps) {
  const html = use(loadFrameHtml(frame));
  return <AnimatedCode html={html} />;
}
