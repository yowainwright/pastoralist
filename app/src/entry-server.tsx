import { renderToReadableStream } from "react-dom/server";
import type { ReactNode } from "react";
import { RouterServer, createRequestHandler } from "@tanstack/react-router/ssr/server";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createAppRouter } from "./routes";

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
  return new Response(stream).text();
};

const renderApp = async (router: ReturnType<typeof createAppRouter>): Promise<RenderedRoute> => {
  const serverSsr = router.serverSsr;
  if (!serverSsr) throw new Error("Missing router SSR context");

  const app = (
    <TooltipProvider>
      <RouterServer router={router} />
    </TooltipProvider>
  );
  const appHtml = await renderToHtml(app);
  serverSsr.setRenderFinished();
  const routerHtml = serverSsr.takeBufferedHtml() ?? "";
  return { appHtml, routerHtml };
};

export async function render(pathname: string): Promise<RenderedRoute> {
  const request = new Request(`https://jeffry.in${pathname}`);
  const handleRequest = createRequestHandler({ createRouter: createAppRouter, request });
  let rendered: RenderedRoute | undefined;

  await handleRequest(async ({ router }) => {
    rendered = await renderApp(router);
    return new Response(null, { status: 200 });
  });

  if (!rendered) throw new Error(`Failed to render ${pathname}`);
  return rendered;
}
