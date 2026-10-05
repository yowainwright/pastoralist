import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { DocsLayout } from "./layouts/DocsLayout";
import { HomeLayout } from "./layouts/RootLayout";
import { DocsPage } from "./pages/DocsPage";
import { HomePage } from "./pages/HomePage";
import { getDocHeadings } from "./content";

const rootRoute = createRootRoute({
  component: () => <Outlet />,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <HomeLayout>
      <HomePage />
    </HomeLayout>
  ),
});

const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs/$slug",
  loader: ({ params }) => getDocHeadings(params.slug),
  component: DocsRoute,
});

function DocsRoute() {
  const headings = docsRoute.useLoaderData();
  return (
    <DocsLayout>
      <DocsPage headings={headings} />
    </DocsLayout>
  );
}

export const routeTree = rootRoute.addChildren([indexRoute, docsRoute]);

export const createAppRouter = () =>
  createRouter({
    routeTree,
    basepath: "/pastoralist",
    trailingSlash: "always",
  });

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
