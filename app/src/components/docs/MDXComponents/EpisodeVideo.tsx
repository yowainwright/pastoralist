import type { ReactNode } from "react";
import { resolveUrl } from "@/utils/urlResolver";

interface EpisodeVideoProps {
  children?: ReactNode;
  label: string;
  slug: string;
}

export function EpisodeVideo({ children, label, slug }: EpisodeVideoProps) {
  const src = resolveUrl(`episodes/${slug}/final.mp4`);

  return (
    <figure className="not-prose my-6">
      <video
        aria-label={label}
        className="w-full rounded-lg border border-base-content/10"
        height="560"
        width="786"
        controls
        playsInline
        preload="none"
        src={src}
      />
      {children ? (
        <figcaption className="mt-3 rounded-md border border-base-content/10 bg-base-200/40 px-4 py-3 text-sm leading-6 text-base-content/75">
          <p className="mb-1 font-semibold text-base-content">Clip focus</p>
          <div className="[&_code]:rounded [&_code]:bg-warning/15 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-semibold [&_code]:text-base-content [&_p]:m-0 [&_strong]:font-semibold [&_strong]:text-base-content">
            {children}
          </div>
        </figcaption>
      ) : null}
    </figure>
  );
}
