export interface DocMeta {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly tags?: readonly string[];
  readonly usesMath?: boolean;
}

export interface SearchDocument {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly headings: readonly string[];
  readonly content: string;
}

export interface SearchTextPart {
  readonly text: string;
  readonly highlighted: boolean;
}

export interface SearchHit {
  readonly slug: string;
  readonly title: readonly SearchTextPart[];
  readonly description: readonly SearchTextPart[];
  readonly excerpt: readonly SearchTextPart[];
}
