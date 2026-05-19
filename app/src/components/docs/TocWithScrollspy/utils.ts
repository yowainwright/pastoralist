export interface TextPart {
  text: string;
  isCode: boolean;
}

const INLINE_CODE_REGEX = /`([^`]+)`/g;

export function parseInlineCode(text: string): TextPart[] {
  const matches = Array.from(text.matchAll(INLINE_CODE_REGEX));
  const state = matches.reduce(
    (acc, match) => {
      let lastIndex = acc.lastIndex;
      const textPart =
        match.index > lastIndex
          ? [{ text: text.slice(lastIndex, match.index), isCode: false }]
          : [];

      lastIndex = match.index + match[0].length;
      const parts = acc.parts.concat(textPart, { text: match[1], isCode: true });
      return { parts, lastIndex };
    },
    { parts: [] as TextPart[], lastIndex: 0 },
  );

  const trailingPart =
    state.lastIndex < text.length ? [{ text: text.slice(state.lastIndex), isCode: false }] : [];
  const parts = state.parts.concat(trailingPart);

  if (parts.length === 0) return [{ text, isCode: false }];
  return parts;
}
