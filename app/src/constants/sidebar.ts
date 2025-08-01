import { resolveDocsUrl } from "../utils/urlResolver";

const SIDEBAR = [
  {
    title: "Documentation",
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
        title: "Architecture",
        href: resolveDocsUrl("architecture"),
      },
    ],
  },
];

export default SIDEBAR;
