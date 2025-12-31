export interface Heading {
  depth: number;
  slug: string;
  text: string;
}

export interface TocHeading extends Heading {
  subheadings: TocHeading[];
}

export interface TocWithScrollspyProps {
  headings: Heading[];
}
