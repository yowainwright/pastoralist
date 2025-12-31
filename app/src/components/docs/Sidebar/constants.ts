import { resolveDocsUrl } from "../../../utils/urlResolver";

export const TERMINAL_DEMOS = [
  {
    lines: [
      { prefix: "$", text: "pastoralist --checkSecurity", animate: true },
      {
        prefix: "",
        text: "🔒 pastoralist checking for security vulnerabilities...",
        className: "text-cyan-400",
        delay: 80,
        animate: false,
      },
      { prefix: "", text: "", delay: 40, animate: false },
      {
        prefix: "",
        text: "🔒 Security Vulnerabilities Found",
        className: "text-base-content",
        delay: 60,
        animate: false,
      },
      {
        prefix: "",
        text: "══════════════════════════════════════════════════",
        className: "text-base-content/50",
        delay: 20,
        animate: false,
      },
      {
        prefix: "",
        text: "Found 1 vulnerable package(s):",
        className: "text-base-content/70",
        delay: 30,
        animate: false,
      },
      {
        prefix: "",
        text: "  [CRITICAL] 1",
        className: "text-error",
        delay: 20,
        animate: false,
      },
      { prefix: "", text: "", delay: 30, animate: false },
      {
        prefix: "",
        text: "📦 lodash",
        className: "text-base-content",
        delay: 30,
        animate: false,
      },
      {
        prefix: "",
        text: "   Current: 4.17.19",
        className: "text-base-content/70",
        delay: 20,
        animate: false,
      },
      {
        prefix: "",
        text: "   🔴 Prototype Pollution in lodash",
        className: "text-error",
        delay: 20,
        animate: false,
      },
      {
        prefix: "",
        text: "   CVE: CVE-2020-8203",
        className: "text-base-content/70",
        delay: 20,
        animate: false,
      },
      { prefix: "", text: "", delay: 40, animate: false },
      {
        prefix: "",
        text: "✅ Auto-fix applied successfully!",
        className: "text-success",
        delay: 80,
        animate: false,
      },
      {
        prefix: "",
        text: "   lodash: 4.17.19 → 4.17.21",
        className: "text-base-content/70",
        delay: 20,
        animate: false,
      },
      { prefix: "", text: "", delay: 40, animate: false },
      {
        prefix: "",
        text: "👩🏽‍🌾 pastoralist checking herd...",
        className: "text-cyan-400",
        delay: 60,
        animate: false,
      },
      {
        prefix: "",
        text: "👩🏽‍🌾 pastoralist the herd is safe!",
        className: "text-success",
        delay: 80,
        animate: false,
      },
    ],
    pauseAfter: 0,
  },
];

export const SIDEBAR = [
  {
    title: "Getting Started",
    items: [
      {
        title: "Introduction",
        href: resolveDocsUrl("introduction"),
      },
      {
        title: "Setup",
        href: resolveDocsUrl("setup"),
      },
    ],
  },
  {
    title: "Features",
    items: [
      {
        title: "Security Scanning",
        href: resolveDocsUrl("security"),
      },
      {
        title: "Workspaces & Monorepos",
        href: resolveDocsUrl("workspaces"),
      },
      {
        title: "Advanced Features",
        href: resolveDocsUrl("advanced-features"),
      },
    ],
  },
  {
    title: "Codelabs",
    items: [
      {
        title: "Basic Usage",
        href: resolveDocsUrl("codelab"),
      },
    ],
  },
  {
    title: "Reference",
    items: [
      {
        title: "API Reference",
        href: resolveDocsUrl("api-reference"),
      },
      {
        title: "Architecture",
        href: resolveDocsUrl("architecture"),
      },
      {
        title: "Troubleshooting & FAQ",
        href: resolveDocsUrl("troubleshooting"),
      },
    ],
  },
];

export default SIDEBAR;
