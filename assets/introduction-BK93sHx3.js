const e=`---
title: Introduction to Pastoralist
description: "Pastoralist is a dependency management tool that helps keep your package.json overrides, resolutions, and patches up-to-date"
---

<div className="flex flex-wrap gap-2 mb-8">
  <a
    href="https://badge.fury.io/js/pastoralist"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img src="https://badge.fury.io/js/pastoralist.svg" alt="npm version" />
  </a>
  <a
    href="https://github.com/yowainwright/pastoralist"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src="https://img.shields.io/github/stars/yowainwright/pastoralist?style=social"
      alt="GitHub stars"
    />
  </a>
  <a
    href="https://www.typescriptlang.org/"
    target="_blank"
    rel="noopener noreferrer"
  >
    <img
      src="https://img.shields.io/badge/TypeScript-Ready-blue"
      alt="TypeScript Ready"
    />
  </a>
  <a href="https://osaasy.dev" target="_blank" rel="noopener noreferrer">
    <img
      src="https://img.shields.io/badge/License-O'Sassy-blue.svg"
      alt="License: O'Sassy"
    />
  </a>
</div>

## What is Pastoralist?

Pastoralist is the audit trail for your dependency overrides. It documents why each override exists, tracks what depends on it, and cleans up overrides you no longer need. It can also detect security vulnerabilities and generate overrides to fix them.

## Why Pastoralist?

### The Problem

When working with Node.js projects, you often need to override specific package versions due to:

- Security vulnerabilities in transitive dependencies
- Bug fixes that haven't been merged upstream
- Breaking changes you need to avoid
- Custom patches for specific use cases

However, managing these overrides manually is tedious and error-prone:

\`\`\`json
{
  "overrides": {
    "lodash": "4.17.19",
    "minimist": "1.2.5",
    "node-fetch": "2.6.7"
  }
}
\`\`\`

Over time, these overrides become outdated, and you might miss important security updates or bug fixes.

### The Solution

Pastoralist automates this process by:

- Documenting why each override exists and who depends on it
- Removing stale overrides automatically when they're no longer needed
- Tracking patches linked to your overrides
- Optionally scanning for security vulnerabilities and generating overrides to fix them

With one simple command, you can ensure all your overrides are current:

\`\`\`bash
pastoralist
\`\`\`

<a
  href="https://stackblitz.com/github/yowainwright/pastoralist/tree/main/tests/sandboxes/basic-overrides"
  target="_blank"
  rel="noopener noreferrer"
>
  <img
    src="https://img.shields.io/badge/Try_it-CodeSandbox-blue?logo=codesandbox"
    alt="Try it on CodeSandbox"
  />
</a>

## Benefits

- **Transparency**: Clear audit trail for every override — why it exists, what depends on it
- **Clean**: Removes stale overrides automatically
- **Automated Updates**: No more manual version checking
- **Security**: Scan for vulnerabilities and generate overrides to fix them
- **Fast**: Updates all overrides with one command
- **Compatible**: Works with npm, yarn, pnpm, and bun
`;export{e as default};
