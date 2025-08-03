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
      {
        title: "Interactive Codelab",
        href: resolveDocsUrl("codelab"),
      },
    ],
  },
  {
    title: "Guides",
    items: [
      {
        title: "Workspaces & Monorepos",
        href: resolveDocsUrl("workspaces"),
      },
      {
        title: "Advanced Features",
        href: resolveDocsUrl("advanced-features"),
      },
      {
        title: "Architecture",
        href: resolveDocsUrl("architecture"),
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
        title: "Troubleshooting & FAQ",
        href: resolveDocsUrl("troubleshooting"),
      },
    ],
  },
];

export default SIDEBAR;
