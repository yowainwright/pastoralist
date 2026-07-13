import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { RouterClient } from "@tanstack/react-router/ssr/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createAppRouter } from "./routes";
import "./styles/global.css";
import "./styles/terminal.css";

const router = createAppRouter();
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Missing root element");

const isPrerendered = rootElement.dataset.prerendered === "true";
const routerView = isPrerendered ? (
  <RouterClient router={router} />
) : (
  <RouterProvider router={router} />
);
const app = (
  <StrictMode>
    <TooltipProvider>{routerView}</TooltipProvider>
  </StrictMode>
);

if (isPrerendered) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
