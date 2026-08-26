import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import { useFadeInUp, useHasHydrated } from "@/hooks/useFadeInUp";
import { isStaticRender } from "@/lib/utils";
import type { GetStartedSectionProps } from "./types";
import { SECTION_ID, CONTENT, STYLES } from "./constants";

function GetStartedContent({
  id,
  showComplete,
}: Required<GetStartedSectionProps> & { showComplete: boolean }) {
  const { ref, isVisible } = useFadeInUp({ initialInView: showComplete });

  const articleClassName = `${STYLES.article} ${
    isVisible ? STYLES.articleVisible : STYLES.articleHidden
  }`;

  return (
    <section id={id} className={STYLES.section}>
      <article ref={ref} className={articleClassName}>
        <h3 className={STYLES.heading}>
          {CONTENT.heading} <span className="gradient-text">{CONTENT.headingHighlight}</span>?
        </h3>
        <nav className={STYLES.nav}>
          <figure className={STYLES.codeBlock}>
            <code className={STYLES.code}>{CONTENT.command}</code>
            <CopyButton />
          </figure>
          <Link to="/docs/$slug/" params={{ slug: CONTENT.docsSlug }} preload="intent">
            <button className={STYLES.button}>
              {CONTENT.buttonText}
              <ArrowRight className="size-4" />
            </button>
          </Link>
        </nav>
      </article>
    </section>
  );
}

export function GetStartedSection({ id = SECTION_ID }: GetStartedSectionProps) {
  const hasHydrated = useHasHydrated();
  const showComplete = isStaticRender() && !hasHydrated;
  const key = showComplete ? "static" : "interactive";

  return <GetStartedContent key={key} id={id} showComplete={showComplete} />;
}
