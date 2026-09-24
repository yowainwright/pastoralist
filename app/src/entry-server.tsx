import { renderToReadableStream } from "react-dom/server";
import type { ReactNode } from "react";
import { RouterContextProvider, Scripts } from "@tanstack/react-router";
import { RouterServer, createRequestHandler } from "@tanstack/react-router/ssr/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createAppRouter, type AppRouter } from "./routes";

export interface RenderedRoute {
  appHtml: string;
  routerHtml: string;
}

const renderToHtml = async (app: ReactNode): Promise<string> => {
  let renderError: unknown;
  const stream = await renderToReadableStream(app, {
    onError: (error) => {
      renderError = error;
    },
  });
  await stream.allReady;
  if (renderError) throw renderError;
  const result = new Response(stream).text();
  return result;
};

const renderRouterScripts = (router: AppRouter): Promise<string> => {
  const scripts = (
    <RouterContextProvider router={router}>
      <Scripts />
    </RouterContextProvider>
  );
  const result = renderToHtml(scripts);
  return result;
};

const renderApp = async (router: AppRouter): Promise<RenderedRoute> => {
  const serverSsr = router.serverSsr;
  if (!serverSsr) throw new Error("Missing router SSR context");

  const app = (
    <TooltipProvider>
      <RouterServer router={router} />
    </TooltipProvider>
  );
  const appHtml = await renderToHtml(app);
  const routerHtml = await renderRouterScripts(router);
  serverSsr.setRenderFinished();
  const result = { appHtml, routerHtml };
  return result;
};

export async function render(pathname: string): Promise<RenderedRoute> {
  const request = new Request(`https://jeffry.in${pathname}`);
  const handleRequest = createRequestHandler({ createRouter: createAppRouter, request });
  let rendered: RenderedRoute | undefined;

  await handleRequest(async ({ router }) => {
    rendered = await renderApp(router);
    const result = new Response(null, { status: 200 });
    return result;
  });

  if (!rendered) throw new Error(`Failed to render ${pathname}`);
  return rendered;
}
