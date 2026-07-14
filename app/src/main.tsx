import { StrictMode, useEffect } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { RouterClient } from "@tanstack/react-router/ssr/client";
import { TooltipProvider } from "@/components/ui/tooltip";
import { clearPrerenderMarker } from "@/lib/utils";
import { createAppRouter } from "./routes";
import "./styles/global.css";
import "./styles/terminal.css";

function getRootElement(): HTMLElement {
  const rootElement = document.getElementById("root");
  if (!rootElement) throw new Error("Missing root element");
  return rootElement;
}

const router = createAppRouter();
const rootElement = getRootElement();

const isPrerendered = rootElement.dataset.prerendered === "true";
const routerView = isPrerendered ? (
  <RouterClient router={router} />
) : (
  <RouterProvider router={router} />
);

function App() {
  useEffect(() => clearPrerenderMarker(rootElement), []);

  return (
    <StrictMode>
      <TooltipProvider>{routerView}</TooltipProvider>
    </StrictMode>
  );
}

const app = <App />;

if (isPrerendered) {
  hydrateRoot(rootElement, app);
} else {
  createRoot(rootElement).render(app);
}
