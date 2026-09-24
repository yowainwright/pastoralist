import { resolveDocsUrl } from "../../../utils/urlResolver";

const sidebarItem = (title: string, slug: string) => {
  const href = resolveDocsUrl(slug);
  const item = { title, href };
  return item;
};

const gettingStarted = [
  sidebarItem("Introduction", "introduction"),
  sidebarItem("Setup", "setup"),
  sidebarItem("Onboarding", "onboarding"),
];
const features = [
  sidebarItem("Security Scanning", "security"),
  sidebarItem("Workspaces & Monorepos", "workspaces"),
  sidebarItem("Advanced Features", "advanced-features"),
];
const codelabs = [sidebarItem("Basic Usage", "codelab")];
const reference = [
  sidebarItem("API Reference", "api-reference"),
  sidebarItem("GitHub Action", "github-action"),
  sidebarItem("Architecture", "architecture"),
  sidebarItem("Troubleshooting & FAQ", "troubleshooting"),
];

export const SIDEBAR = [
  {
    title: "Getting Started",
    items: gettingStarted,
  },
  {
    title: "Features",
    items: features,
  },
  {
    title: "Codelabs",
    items: codelabs,
  },
  {
    title: "Reference",
    items: reference,
  },
];

export default SIDEBAR;
