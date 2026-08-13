export interface DocMeta {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly usesMath?: boolean;
}

export interface SearchDocument {
  readonly slug: string;
  readonly title: string;
  readonly description: string;
  readonly content: string;
}
