export const STEP_POPOVERS = [
  {
    title: "The Problem",
    description:
      "Overrides exist but nobody knows why. Which packages depend on it?",
  },
  {
    title: "Run Pastoralist",
    description:
      "Pastoralist scans your dependencies and documents your overrides.",
  },
  {
    title: "Automatic Documentation",
    description:
      "Now you know why each override exists, what depends on it, and any associated CVEs.",
  },
];

export const STEPS = [
  "Undocumented overrides",
  "Execute pastoralist",
  "Pastoralist manages the rest",
];

export const APPENDIX_CONTENT = [
  '  "pastoralist": {',
  '    "appendix": {',
  '      "lodash@4.17.21": {',
  '        "dependents": {',
  '          "express": "^4.18.0"',
  "        },",
  '        "ledger": {',
  '          "reason": "security",',
  '          "cve": "CVE-2020-8203"',
  "        }",
  "      }",
  "    }",
  "  }",
];

export const COMMAND = "pastoralist";

// JSON syntax highlighting
const JSON_KEY_PATTERN = /"([^"]+)":/g;
const JSON_VALUE_PATTERN = /: "([^"]+)"/g;

const HIGHLIGHTABLE_KEYS = [
  '"pastoralist"',
  '"appendix"',
  '"lodash@',
  '"dependents"',
  '"express"',
  '"ledger"',
  '"reason"',
  '"cve"',
];

export const shouldHighlightLine = (line: string): boolean => {
  return HIGHLIGHTABLE_KEYS.some((key) => line.includes(key));
};

export const highlightJsonSyntax = (line: string): string => {
  return line
    .replace(JSON_KEY_PATTERN, '<span class="text-primary">"$1"</span>:')
    .replace(JSON_VALUE_PATTERN, ': <span class="text-success">"$1"</span>');
};
