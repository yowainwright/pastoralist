export interface TextPart {
  text: string;
  isCode: boolean;
}

const INLINE_CODE_REGEX = /`([^`]+)`/g;

export function parseInlineCode(text: string): TextPart[] {
  const parts = text.split(INLINE_CODE_REGEX).flatMap((part, index) => {
    const empty: TextPart[] = [];
    if (!part) return empty;
    const isCode = index % 2 === 1;
    const segment = { text: part, isCode };
    const segments = [segment];
    return segments;
  });
  const fallback = [{ text, isCode: false }];
  if (parts.length === 0) return fallback;
  return parts;
}
