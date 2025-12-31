export interface TextPart {
  text: string;
  isCode: boolean;
}

const INLINE_CODE_REGEX = /`([^`]+)`/g;

export function parseInlineCode(text: string): TextPart[] {
  const parts: TextPart[] = [];
  let lastIndex = 0;
  let match;

  while ((match = INLINE_CODE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), isCode: false });
    }
    parts.push({ text: match[1], isCode: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), isCode: false });
  }

  if (parts.length === 0) {
    parts.push({ text, isCode: false });
  }

  return parts;
}
