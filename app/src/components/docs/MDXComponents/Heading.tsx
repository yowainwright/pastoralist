import { Link as LinkIcon } from "lucide-react";
import type { ComponentProps } from "react";
import type { HeadingLevel, HeadingProps } from "./types";

export function Heading({ level: HeadingTag, id, children, ...props }: HeadingProps) {
  if (!id) return <HeadingTag {...props}>{children}</HeadingTag>;

  const href = `#${id}`;
  return (
    <HeadingTag {...props} id={id}>
      <a href={href} className="group text-inherit no-underline">
        {children}
        <LinkIcon
          aria-hidden="true"
          className="ml-2 inline-block h-[0.8em] w-[0.8em] align-baseline opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60"
        />
      </a>
    </HeadingTag>
  );
}

export const createHeading = (level: HeadingLevel) => {
  return function MdxHeading(props: ComponentProps<"h2">) {
    return <Heading {...props} level={level} />;
  };
};
