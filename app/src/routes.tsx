import { createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { DocsLayout } from "./layouts/DocsLayout";
import { HomeLayout } from "./layouts/RootLayout";
import { DocsPage } from "./pages/DocsPage";
import { HomePage } from "./pages/HomePage";

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
  component: () => (
    <DocsLayout>
      <DocsPage />
    </DocsLayout>
  ),
});

export const routeTree = rootRoute.addChildren([indexRoute, docsRoute]);

export const createAppRouter = () =>
  createRouter({
    routeTree,
    basepath: "/pastoralist",
  });

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module "@tanstack/react-router" {
  interface Register {
    router: AppRouter;
  }
}
