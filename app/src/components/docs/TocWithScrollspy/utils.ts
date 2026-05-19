export interface TextPart {
  text: string;
  isCode: boolean;
}

const INLINE_CODE_REGEX = /`([^`]+)`/g;

export function parseInlineCode(text: string): TextPart[] {
  const matches = Array.from(text.matchAll(INLINE_CODE_REGEX));
  const state = matches.reduce(
    (acc, match) => {
      const parts = [...acc.parts];
      let lastIndex = acc.lastIndex;

      if (match.index > lastIndex) {
        parts.push({ text: text.slice(lastIndex, match.index), isCode: false });
      }
      parts.push({ text: match[1], isCode: true });
      lastIndex = match.index + match[0].length;
      return { parts, lastIndex };
    },
    { parts: [] as TextPart[], lastIndex: 0 },
  );

  const parts = state.parts;
  if (state.lastIndex < text.length) {
    parts.push({ text: text.slice(state.lastIndex), isCode: false });
  }

  if (parts.length === 0) {
    parts.push({ text, isCode: false });
  }

  return parts;
}
