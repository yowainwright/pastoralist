import { resolveDocsUrl } from "../utils/urlResolver";

const SIDEBAR = [
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
