const BASE = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "/pastoralist";

type DocVideoProps = {
  src: string;
  title?: string;
};

export function DocVideo({ src, title }: DocVideoProps) {
  const resolvedSrc = src.startsWith("http") ? src : `${BASE}${src}`;

  return (
    <figure className="not-prose my-6 rounded-xl overflow-hidden border border-base-content/10 shadow-sm">
      <video src={resolvedSrc} controls playsInline className="w-full" aria-label={title} />
      {title && (
        <figcaption className="text-sm text-center py-2 px-4 text-base-content/60 bg-base-200/50">
          {title}
        </figcaption>
      )}
    </figure>
  );
}
